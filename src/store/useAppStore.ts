const pendingTransitions = new Map<string, string>();
import { create } from "zustand";
import { toast } from "sonner";
import { getSessionGeneration } from "@/api/session";
import { nanoid } from "nanoid";
import {
  AuditEvent, Employee, Rake, UnitMemo, Wagon, WorkflowItem, WorkflowStageRecord,
  FitConfirmation, InspectionChecklist, WagonDocument, RepairTask
} from "@/types";
import { wagonApi } from "@/api/wagons";
import { memoApi } from "@/api/memos";
import { workflowApi } from "@/api/workflows";
import { rakeApi } from "@/api/rakes";
import apiClient from "@/api/client";
import { notificationApi } from "@/api/notifications";
import { masterDataApi, MasterDataRecord } from "@/api/masterData";

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface AppState {
  isLoading: boolean;
  loadError: string | null;
  resetStore: () => void;
  loadWagon: (id: string) => Promise<void>;
  initializeStore: () => Promise<void>;
  wagons: Wagon[];
  rakes: Rake[];
  memos: UnitMemo[];
  workflows: WorkflowItem[];
  employees: Employee[];
  audit: AuditEvent[];
  seeded: boolean;
  documents: WagonDocument[];
  masterData: MasterDataRecord[];
  
  notifications: AppNotification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  isAdmin: boolean;
  toggleAdmin: (v?: boolean) => void;

  log: (e: any) => void;

  // wagons
  addWagon: (wagon: Omit<Wagon, "id">) => Promise<Wagon>;
  updateWagon: (id: string, patch: Partial<Wagon>, actorName?: string) => Promise<void>;
  correctWagonNumber: (id: string, newWagonNo: string, actorName: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  updateRepairTask: (wagonId: string, taskId: string, patch: Partial<RepairTask>, actorName: string) => Promise<void>;
  removeWagon: (id: string) => Promise<void>;

  // rakes
  addRake: (r: Omit<Rake, "id" | "createdAt" | "wagonIds"> & { wagonIds?: string[] }) => Promise<Rake>;
  updateRake: (id: string, patch: Partial<Rake>) => Promise<void>;
  removeRake: (id: string) => Promise<void>;
  addWagonToRake: (rakeId: string, wagonId: string) => Promise<void>;
  markDefective: (wagonId: string) => Promise<void>;

  // memos
  addMemo: (m: Omit<UnitMemo, "id" | "createdAt">) => Promise<UnitMemo>;
  updateMemo: (id: string, patch: Partial<UnitMemo>) => Promise<void>;
  removeMemo: (id: string) => Promise<void>;
  archiveMemo: (id: string) => Promise<void>;
  approveMemo: (id: string, role: string, name: string, designation: string, signature: string, status: "Approved" | "Rejected") => Promise<void>;

  // workflows
  upsertWorkflowForWagon: (wagonId: string, memoId?: string) => Promise<WorkflowItem>;
  transitionWorkflow: (id: string, action: 'start' | 'pause' | 'resume' | 'complete', stageName: string, nextStage?: string, remarks?: string) => Promise<void>;
  advanceWorkflow: (id: string, toStage: string) => Promise<void>;
  startStage: (id: string, stageName: string, staffName?: string) => Promise<void>;
  pauseStage: (id: string, stageName: string, staffName: string, reason?: string) => Promise<void>;
  resumeStage: (id: string, stageName: string, staffName: string) => Promise<void>;
  markStageDone: (id: string, stageName: string, staffName: string, inspectorName: string, remarks: string) => Promise<void>;
  correctWorkflowStage: (id: string, stageName: string, patch: Partial<WorkflowStageRecord>, actorName: string, reason: string) => Promise<void>;
  correctWorkflowBranch: (id: string, branchingStageName: string, oldBranchStageName: string, newBranchStageName: string, actorName: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  markWagonFit: (wagonId: string, fitConfirmation?: FitConfirmation) => Promise<{ success: boolean; error?: string }>;
  updateInspectionChecklist: (wagonId: string, patch: Partial<InspectionChecklist>) => Promise<void>;
  undoLastWorkflowAction: (wagonId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  debugWorkflow: (wagonId: string) => void;

  // documents
  addDocumentMeta: (doc: WagonDocument) => void;
  removeDocumentMeta: (id: string) => void;
  getWagonDocuments: (wagonId: string) => WagonDocument[];

  // master data
  fetchMasterData: () => Promise<void>;
  addMasterData: (data: Omit<MasterDataRecord, "_id" | "isActive">) => Promise<void>;
  updateMasterData: (id: string, patch: Partial<MasterDataRecord>) => Promise<void>;
  deleteMasterData: (id: string) => Promise<void>;
}


const emptyState = () => ({
  wagons: [], rakes: [], memos: [], workflows: [], employees: [], audit: [], seeded: false,
  documents: [], masterData: [], notifications: [], unreadCount: 0, isAdmin: false, isLoading: false, loadError: null,
});
const normalize = <T,>(record: any): T => ({ ...record, id: record._id || record.id,
  ...(record.entries ? { entries: record.entries.map((e: any) => ({ ...e, id: e._id || e.id })) } : {}),
});
let writeQueue: Promise<unknown> = Promise.resolve();
const enqueue = <T,>(operation: () => Promise<T>): Promise<T> => {
  const generation = getSessionGeneration();
  const task = writeQueue.then(() => {
    if (generation !== getSessionGeneration()) throw new Error("Session ended");
    return operation();
  });
  writeQueue = task.catch(error => {
    toast.error(error.response?.data?.message || error.message || "Unable to save");
  });
  return task;
};

export const useAppStore = create<AppState>()((set, get) => {
  const putWagon = async (id: string, patch: Partial<Wagon>) => {
    const previous = get().wagons.find(w => w.id === id);
    if (!previous) throw new Error("Wagon not found");
    const generation = getSessionGeneration();
    const res = await wagonApi.updateWagon(id, { ...patch, expectedUpdatedAt: previous.updatedAt });
    if (generation === getSessionGeneration()) set(s => ({ wagons: s.wagons.map(w => w.id === id ? normalize<Wagon>(res.data) : w).filter(w => !w.archived) }));
  };
  const changeWorkflow = (id: string, change: (workflow: WorkflowItem) => void, reason?: string) => enqueue(async () => {
    const previous = get().workflows.find(w => w.id === id);
    if (!previous) throw new Error("Workflow not found");
    const next = structuredClone(previous);
    change(next);
    const generation = getSessionGeneration();
    const res = await workflowApi.updateWorkflow(id, { stages: next.stages, currentStage: next.currentStage, expectedUpdatedAt: previous.updatedAt, reason });
    if (generation !== getSessionGeneration()) return;
    set(s => ({ workflows: s.workflows.map(w => w.id === id ? normalize<WorkflowItem>(res.data) : w) }));
    const wagon = await wagonApi.getWagon(previous.wagonId);
    if (generation === getSessionGeneration()) set(s => ({ wagons: s.wagons.map(w => w.id === previous.wagonId ? normalize<Wagon>(wagon.data) : w) }));
  });
  const stageChange = (id: string, name: string, status: WorkflowStageRecord["status"], fields: Partial<WorkflowStageRecord> = {}) =>
    changeWorkflow(id, wf => {
      const stage = wf.stages.find(s => s.stageName === name);
      if (!stage) throw new Error("Stage not found");
      Object.assign(stage, fields, { status });
      wf.currentStage = name;
    });
  const resultOf = async (operation: () => Promise<void>) => {
    try { await operation(); return { success: true }; }
    catch (error: any) { return { success: false, error: error.response?.data?.message || error.message }; }
  };
  return {
    ...emptyState(),
    resetStore: () => { pendingTransitions.clear(); set(emptyState()); },
    toggleAdmin: () => { /* Roles are derived from the authenticated user, never a local toggle. */ },
    initializeStore: async () => {
      const generation = getSessionGeneration();
      set({ isLoading: true, loadError: null });
      try {
        const [wagons, memos, workflows, rakes] = await Promise.all([wagonApi.getWagons(), memoApi.getMemos(), workflowApi.getWorkflows(), rakeApi.getRakes()]);
        if (generation !== getSessionGeneration()) return;
        set({ wagons: wagons.data.map(normalize<Wagon>), memos: memos.data.map(normalize<UnitMemo>), workflows: workflows.data.map(normalize<WorkflowItem>), rakes: rakes.data.map(normalize<Rake>), seeded: true });
        await Promise.allSettled([get().fetchNotifications(), get().fetchMasterData(),
          (async () => {
            const res = await apiClient.get('/dashboard/team-activity');
            if (generation === getSessionGeneration()) set({ employees: res.data.data.employees.map(normalize<Employee>), audit: res.data.data.activity.map((a: any) => ({ id: a._id, at: a.createdAt, actor: a.performedBy?.name || 'System', action: a.action, details: a.metadata?.resource || '', wagonId: a.metadata?.wagonId })) });
          })()
        ]);
      } catch (error: any) {
        if (generation === getSessionGeneration()) set({ loadError: error.response?.data?.message || "Unable to load records. Please retry." });
      } finally { if (generation === getSessionGeneration()) set({ isLoading: false }); }
    },
    loadWagon: async id => {
      const generation = getSessionGeneration();
      const res = await wagonApi.getWagon(id);
      if (generation !== getSessionGeneration()) return;
      const wagon = normalize<Wagon>(res.data);
      set(s => ({ wagons: [...s.wagons.filter(w => w.id !== wagon.id), wagon] }));
    },
    fetchNotifications: async () => {
      const generation = getSessionGeneration();
      const res = await notificationApi.getNotifications();
      if (generation === getSessionGeneration()) set({ notifications: res.data.data.notifications, unreadCount: res.data.data.unreadCount });
    },
    markNotificationRead: async id => {
      await notificationApi.markAsRead(id);
      await get().fetchNotifications();
    },
    markAllNotificationsRead: async () => {
      await notificationApi.markAllAsRead();
      await get().fetchNotifications();
    },
    addWagon: w => enqueue(async () => {
      const generation = getSessionGeneration();
      const status = w.defect || w.repairTasks?.length || w.status === 'SICK_LINE' ? 'SICK_LINE' : 'ARRIVED';
      const res = await wagonApi.createWagon({ ...w, status });
      const wagon = normalize<Wagon>(res.data);
      if (generation === getSessionGeneration()) set(s => ({ wagons: [...s.wagons, wagon] }));
      // Workflow creation is retriable independently and always uses the server ID.
      return wagon;
    }),
    updateWagon: (id, patch) => enqueue(() => putWagon(id, patch)),
    correctWagonNumber: (id, wagonNo, actor, reason) => resultOf(() => {
      if (!reason.trim()) return Promise.reject(new Error("Correction reason required"));
      return get().updateWagon(id, { wagonNo });
    }),
    updateRepairTask: (id, taskId, patch) => enqueue(async () => {
      const wagon = get().wagons.find(w => w.id === id);
      if (!wagon) throw new Error("Wagon not found");
      await putWagon(id, { repairTasks: (wagon.repairTasks || []).map(t => t.id === taskId || (!t.id && t.subRepair === taskId) ? { ...t, ...patch, id: t.id || nanoid() } : t) });
    }),
    removeWagon: id => enqueue(async () => { await wagonApi.deleteWagon(id); set(s => ({ wagons: s.wagons.filter(w => w.id !== id), workflows: s.workflows.filter(w => w.wagonId !== id) })); }),
    addRake: r => enqueue(async () => { const res = await rakeApi.createRake(r); const rake = normalize<Rake>(res.data); set(s => ({ rakes: [...s.rakes, rake] })); return rake; }),
    updateRake: (id, patch) => enqueue(async () => {
      const previous = get().rakes.find(r => r.id === id);
      const res = await rakeApi.updateRake(id, { ...patch, expectedUpdatedAt: previous?.updatedAt });
      set(s => ({ rakes: s.rakes.map(r => r.id === id ? normalize<Rake>(res.data) : r) }));
    }),
    removeRake: id => enqueue(async () => { await rakeApi.deleteRake(id); set(s => ({ rakes: s.rakes.filter(r => r.id !== id) })); }),
    addWagonToRake: async (rakeId, wagonId) => {
      const rake = get().rakes.find(r => r.id === rakeId);
      if (!rake) throw new Error("Rake not found");
      await get().updateRake(rakeId, { wagonIds: Array.from(new Set([...rake.wagonIds, wagonId])) });
    },
    markDefective: id => get().updateWagon(id, { status: "SICK_LINE" }),
    addMemo: m => enqueue(async () => { const res = await memoApi.createMemo(m); const memo = normalize<UnitMemo>(res.data); set(s => ({ memos: [...s.memos, memo] })); return memo; }),
    updateMemo: (id, patch) => enqueue(async () => {
      const previous = get().memos.find(m => m.id === id);
      const res = await memoApi.updateMemo(id, { ...patch, expectedUpdatedAt: previous?.updatedAt });
      set(s => ({ memos: s.memos.map(m => m.id === id ? normalize<UnitMemo>(res.data) : m) }));
    }),
    removeMemo: id => enqueue(async () => { await memoApi.deleteMemo(id); set(s => ({ memos: s.memos.filter(m => m.id !== id) })); }),
    archiveMemo: id => get().updateMemo(id, { archived: true }),
    approveMemo: async (id, role, name, designation, signature, status) => {
      const memo = get().memos.find(m => m.id === id);
      if (!memo) throw new Error("Memo not found");
      await get().updateMemo(id, { approvals: memo.approvals.map(a => a.role === role ? { ...a, name, designation, signature, status, approvedAt: new Date().toISOString() } : a) });
    },
    upsertWorkflowForWagon: (wagonId, memoId) => enqueue(async () => {
      const existing = get().workflows.find(w => w.wagonId === wagonId);
      if (existing) return existing;
      const res = await workflowApi.createWorkflow({ wagonId, memoId });
      const workflow = normalize<WorkflowItem>(res.data);
      set(s => ({ workflows: [...s.workflows.filter(w => w.wagonId !== wagonId), workflow] }));
      const wagon = await wagonApi.getWagon(wagonId);
      set(s => ({ wagons: s.wagons.map(w => w.id === wagonId ? normalize<Wagon>(wagon.data) : w) }));
      return workflow;
    }),
    transitionWorkflow: (id, action, stageName, nextStage, remarks = '') => enqueue(async () => {
      const previous = get().workflows.find(item => item.id === id);
      if (!previous) throw new Error("Workflow not found");
      const generation = getSessionGeneration();
      const request = { expectedUpdatedAt: previous.updatedAt, action, stageName, nextStage, remarks };
      const fingerprint = JSON.stringify([generation, id, request]);
      const operationId = pendingTransitions.get(fingerprint) || crypto.randomUUID();
      pendingTransitions.set(fingerprint, operationId);
      const result = await workflowApi.transition(id, { ...request, operationId });
      if (generation !== getSessionGeneration()) return;
      pendingTransitions.delete(fingerprint);
      set(s => ({ workflows: s.workflows.map(item => item.id === id ? normalize<WorkflowItem>(result.data.workflow) : item), wagons: s.wagons.map(item => item.id === previous.wagonId ? normalize<Wagon>(result.data.wagon) : item) }));
    }),
    startStage: (id, name, staffName) => stageChange(id, name, "In Progress", { staffName, startedAt: new Date().toISOString() }),
    pauseStage: (id, name, staffName, reason) => stageChange(id, name, "Paused", { staffName, remarks: reason }),
    resumeStage: (id, name, staffName) => stageChange(id, name, "In Progress", { staffName }),
    markStageDone: async (id, name, staffName, inspectorName, remarks) => {
      const wf = get().workflows.find(w => w.id === id);
      if (wf?.stages.find(s => s.stageName === name)?.status === "Pending") await get().startStage(id, name, staffName);
      await stageChange(id, name, "Done", { staffName, inspectorName, remarks, completedAt: new Date().toISOString() });
    },
    advanceWorkflow: (id, name) => stageChange(id, name, "In Progress", { startedAt: new Date().toISOString() }),
    correctWorkflowStage: (id, name, patch, actor, reason) => changeWorkflow(id, wf => {
      if (!reason.trim()) throw new Error("Correction reason required");
      const stage = wf.stages.find(s => s.stageName === name);
      if (!stage) throw new Error("Stage not found");
      Object.assign(stage, patch);
    }, reason),
    correctWorkflowBranch: (id, branchingStage, oldBranch, newBranch, actor, reason) => resultOf(() => enqueue(async () => {
      const wf = get().workflows.find(w => w.id === id);
      if (!wf) throw new Error("Workflow not found");
      const res = await workflowApi.correctWorkflow(id, { action: 'branch', reason, branchingStage, oldBranch, newBranch, expectedUpdatedAt: wf.updatedAt });
      set(s => ({ workflows: s.workflows.map(w => w.id === id ? normalize<WorkflowItem>(res.data) : w) }));
      await get().loadWagon(wf.wagonId);
    })),
    markWagonFit: (id, confirmation) => resultOf(() => get().updateWagon(id, { status: "FIT_READY", fitConfirmation: confirmation })),
    updateInspectionChecklist: (id, patch) => enqueue(async () => {
      const wagon = get().wagons.find(w => w.id === id);
      if (!wagon) throw new Error("Wagon not found");
      const checklist = { ...wagon.inspectionChecklist, ...patch };
      for (const key of Object.keys(checklist)) if (checklist[key] === undefined) checklist[key] = { checked: false };
      await putWagon(id, { inspectionChecklist: checklist });
    }),
    undoLastWorkflowAction: (wagonId, reason) => resultOf(() => enqueue(async () => {
      const wf = get().workflows.find(w => w.wagonId === wagonId);
      if (!wf) throw new Error("Workflow not found");
      const res = await workflowApi.correctWorkflow(wf.id, { action: 'undo', reason: reason || 'Undo last workflow action', expectedUpdatedAt: wf.updatedAt });
      set(s => ({ workflows: s.workflows.map(w => w.id === wf.id ? normalize<WorkflowItem>(res.data) : w) }));
      await get().loadWagon(wagonId);
    })),
    debugWorkflow: id => console.debug(get().workflows.find(w => w.wagonId === id)),
    log: e => set(s => ({ audit: [{ ...e, id: nanoid(), at: new Date().toISOString() }, ...s.audit].slice(0, 1000) })),
    addDocumentMeta: doc => set(s => ({ documents: [...s.documents, doc] })),
    removeDocumentMeta: id => set(s => ({ documents: s.documents.filter(d => d.id !== id) })),
    getWagonDocuments: id => get().documents.filter(d => d.wagonId === id),
    fetchMasterData: async () => { const records = await masterDataApi.getAll(); set({ masterData: records }); },
    addMasterData: async data => { const record = await masterDataApi.create(data); set(s => ({ masterData: [...s.masterData, record] })); },
    updateMasterData: async (id, patch) => { const record = await masterDataApi.update(id, patch); set(s => ({ masterData: s.masterData.map(m => m._id === id ? record : m) })); },
    deleteMasterData: async id => { await masterDataApi.delete(id); set(s => ({ masterData: s.masterData.filter(m => m._id !== id) })); },
  };
});
