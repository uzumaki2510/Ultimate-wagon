import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import {
  AuditEvent, Employee, Rake, UnitMemo, Wagon, WorkflowItem, WorkflowStageRecord, WorkflowActionHistory,
  FitConfirmation, InspectionChecklist, WagonDocument
} from "@/types";
import { getWorkflowTemplate } from "@/lib/workflowConfig";
import { wagonApi } from "@/api/wagons";
import { memoApi } from "@/api/memos";
import { workflowApi } from "@/api/workflows";
import { rakeApi } from "@/api/rakes";
import { auditApi } from "@/api/audit";
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
  addWagon: (wagon: Omit<Wagon, "id">) => Wagon;
  updateWagon: (id: string, patch: Partial<Wagon>, actorName?: string) => void;
  removeWagon: (id: string) => void;

  // rakes
  addRake: (r: Omit<Rake, "id" | "createdAt" | "wagonIds"> & { wagonIds?: string[] }) => Rake;
  updateRake: (id: string, patch: Partial<Rake>) => void;
  removeRake: (id: string) => void;
  addWagonToRake: (rakeId: string, wagonId: string) => void;
  markDefective: (wagonId: string) => void;

  // memos
  addMemo: (m: Omit<UnitMemo, "id" | "createdAt">) => UnitMemo;
  updateMemo: (id: string, patch: Partial<UnitMemo>) => void;
  removeMemo: (id: string) => void;
  archiveMemo: (id: string) => void;
  approveMemo: (id: string, role: string, name: string, designation: string, signature: string, status: "Approved" | "Rejected") => void;

  // workflows
  upsertWorkflowForWagon: (wagonId: string, memoId?: string) => Promise<WorkflowItem>;
  advanceWorkflow: (id: string, toStage: string) => void;
  startStage: (id: string, stageName: string, staffName?: string) => void;
  pauseStage: (id: string, stageName: string, staffName: string, reason?: string) => void;
  resumeStage: (id: string, stageName: string, staffName: string) => void;
  markStageDone: (id: string, stageName: string, staffName: string, inspectorName: string, remarks: string) => void;
  markWagonFit: (wagonId: string, fitConfirmation?: FitConfirmation) => { success: boolean; error?: string };
  updateInspectionChecklist: (wagonId: string, patch: Partial<InspectionChecklist>) => void;
  undoLastWorkflowAction: (wagonId: string, reason?: string) => { success: boolean; error?: string };
  debugWorkflow: (wagonId: string) => void;

  // employees
  addEmployee: (e: Omit<Employee, "id">) => Employee;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;

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

// In-flight guard for workflow initialization
const initPromises: Record<string, Promise<WorkflowItem>> = {};

export const useAppStore = create<AppState>()(
  (set, get) => ({
      wagons: [], rakes: [], memos: [], workflows: [], employees: [], audit: [], seeded: false,
      documents: [],
      masterData: [],
      notifications: [], unreadCount: 0,
      isAdmin: true,
      toggleAdmin: (v) => set((s) => ({ isAdmin: v ?? !s.isAdmin })),

      initializeStore: async () => {
        try {
          const [wagonsRes, memosRes, workflowsRes, rakesRes] = await Promise.all([
            wagonApi.getWagons().catch(() => ({ data: { data: [] } })),
            memoApi.getMemos().catch(() => ({ data: { data: [] } })),
            workflowApi.getWorkflows().catch(() => ({ data: { data: [] } })),
            rakeApi.getRakes().catch(() => ({ data: { data: [] } }))
          ]);
          set({
            wagons: (wagonsRes?.data?.data || wagonsRes?.data || []).map((w: any) => ({...w, id: w._id || w.id})),
            memos: (memosRes?.data?.data || memosRes?.data || []).map((m: any) => ({...m, id: m._id || m.id})),
            workflows: (workflowsRes?.data?.data || workflowsRes?.data || []).map((wf: any) => ({...wf, id: wf._id || wf.id})),
            rakes: (rakesRes?.data?.data || rakesRes?.data || []).map((r: any) => ({...r, id: r._id || r.id}))
          });
          get().fetchNotifications();
          get().fetchMasterData();
        } catch (err) {
          console.error("Failed to initialize store", err);
        }
      },

      fetchNotifications: async () => {
        try {
          const res = await notificationApi.getNotifications();
          set({ 
            notifications: res.data?.data?.notifications || [],
            unreadCount: res.data?.data?.unreadCount || 0
          });
        } catch (error) {
          console.error("Failed to fetch notifications", error);
        }
      },

      markNotificationRead: async (id) => {
        try {
          await notificationApi.markAsRead(id);
          set(s => ({
            notifications: s.notifications.map(n => n._id === id ? { ...n, isRead: true } : n),
            unreadCount: Math.max(0, s.unreadCount - 1)
          }));
        } catch (error) {
          console.error("Failed to mark notification read", error);
        }
      },

      markAllNotificationsRead: async () => {
        try {
          await notificationApi.markAllAsRead();
          set(s => ({
            notifications: s.notifications.map(n => ({ ...n, isRead: true })),
            unreadCount: 0
          }));
        } catch (error) {
          console.error("Failed to mark all notifications read", error);
        }
      },

      addWagon: (w) => {
        let initialStatus = w.status;
        const hasDefect = w.defect || (w.repairTasks && w.repairTasks.length > 0);
        if (hasDefect || ["Issue Marked", "Sick Line", "Cut Off", "Sick"].includes(w.status)) {
          initialStatus = "SICK_LINE" as any;
        } else if (!["ARRIVED", "INSPECTION_PENDING", "INSPECTION_COMPLETE", "SICK_LINE", "REPAIR_IN_PROGRESS", "REPAIR_COMPLETE", "FIT_CERTIFICATE_PENDING", "FIT_READY", "RELEASED"].includes(w.status)) {
          initialStatus = "ARRIVED" as any;
        }

        const wagon: Wagon = { ...w, id: nanoid(), status: initialStatus };
        set((s) => ({ wagons: [...s.wagons, wagon] }));
        wagonApi.createWagon(wagon).catch(console.error);
        get().log({ actor: "user", action: "Wagon added", wagonId: wagon.id, details: wagon.wagonNo });
        // Auto-create workflow for all wagons
        get().upsertWorkflowForWagon(wagon.id);
        
        // Auto-start first stage
        const wf = get().workflows.find(wfItem => wfItem.wagonId === wagon.id);
        if (wf && wf.stages.length > 0) {
          get().startStage(wf.id, wf.stages[0].stageName, "System");
        }
        
        return wagon;
      },
      updateWagon: (id, patch, actorName) => {
        set((s) => ({ wagons: s.wagons.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
        wagonApi.updateWagon(id, patch).catch(console.error);
        const actionDetails = patch.repairTypes ? `Repair types: ${patch.repairTypes.join(", ")}` : JSON.stringify(patch);
        get().log({ actor: actorName || "user", action: patch.repairTypes ? "Repair Types Updated" : "Wagon updated", wagonId: id, details: actionDetails });

        // INTERCONNECT: If marked Fit from Register, complete workflow
        if (patch.status === "FIT_READY") {
          const wf = get().workflows.find(w => w.wagonId === id);
          if (wf) {
            set((s) => ({
              workflows: s.workflows.map(w => w.id === wf.id ? {
                ...w,
                stages: w.stages.map(st => st.status !== "Done" ? { ...st, status: "Done", completedAt: new Date().toISOString() } : st),
                updatedAt: new Date().toISOString()
              } : w)
            }));
          }
        }

        // INTERCONNECT: If undone Fit, revert the last workflow stage
        if (patch.status === "SICK_LINE" || patch.status === "REPAIR_IN_PROGRESS") {
          const wf = get().workflows.find(w => w.wagonId === id);
          if (wf) {
            const allDone = wf.stages.every(st => st.status === "Done");
            if (allDone && wf.stages.length > 0) {
              set((s) => ({
                workflows: s.workflows.map(w => w.id === wf.id ? {
                  ...w,
                  stages: w.stages.map((st, i) => i === w.stages.length - 1 ? { ...st, status: "In Progress", completedAt: undefined } : st),
                  updatedAt: new Date().toISOString()
                } : w)
              }));
            }
          }
        }
      },
      removeWagon: (id) => {
        set((s) => ({ 
          wagons: s.wagons.filter((w) => w.id !== id),
          workflows: s.workflows.filter((w) => w.wagonId !== id)
        }));
        wagonApi.deleteWagon(id).catch(console.error);
      },

      addRake: (r) => {
        const rake: Rake = { ...r, id: nanoid(), createdAt: new Date().toISOString(), wagonIds: r.wagonIds ?? [] };
        set((s) => ({ rakes: [...s.rakes, rake] }));
        get().log({ actor: "user", action: "Rake created", details: rake.rakeId });
        return rake;
      },
      updateRake: (id, patch) => {
        set((s) => ({ rakes: s.rakes.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
        rakeApi.updateRake(id, patch).catch(console.error);
      },
      removeRake: (id) => set((s) => ({ rakes: s.rakes.filter((r) => r.id !== id) })),
      addWagonToRake: (rakeId, wagonId) => {
        set((s) => ({
          rakes: s.rakes.map((r) => r.id === rakeId ? { ...r, wagonIds: Array.from(new Set([...r.wagonIds, wagonId])) } : r),
          wagons: s.wagons.map((w) => w.id === wagonId ? { ...w, rakeId } : w),
        }));
      },
      markDefective: (wagonId) => {
        get().updateWagon(wagonId, { status: "REPAIR_IN_PROGRESS" });
        get().log({ actor: "user", action: "Wagon marked defective", wagonId });
      },

      addMemo: (m) => {
        const memo: UnitMemo = { ...m, id: nanoid(), createdAt: new Date().toISOString() };
        set((s) => ({ memos: [...s.memos, memo] }));
        memoApi.createMemo(memo).catch(console.error);
        memo.entries.forEach((e) => {
          if (memo.memoType === "sick") {
            get().upsertWorkflowForWagon(e.wagonId, memo.id);
            get().updateWagon(e.wagonId, { status: "SICK_LINE" }, "system");
          } else if (memo.memoType === "fit") {
            get().updateWagon(e.wagonId, { status: "FIT_READY" }, "system");
          }
        });
        get().log({ actor: "user", action: "Memo created", memoId: memo.id, details: memo.memoNo });
        return memo;
      },
      updateMemo: (id, patch) => {
        set((s) => ({ memos: s.memos.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
        memoApi.updateMemo(id, patch).catch(console.error);
        get().log({ actor: "user", action: "Memo updated", memoId: id });
      },
      removeMemo: (id) => set((s) => ({ memos: s.memos.filter((m) => m.id !== id) })),
      archiveMemo: (id) => {
        set((s) => ({ memos: s.memos.map((m) => (m.id === id ? { ...m, archived: true } : m)) }));
        get().log({ actor: "user", action: "Memo archived", memoId: id });
      },
      approveMemo: (id, role, name, designation, signature, status) => {
        set((s) => ({
          memos: s.memos.map((m) => m.id === id ? {
            ...m,
            approvals: m.approvals.map((a) => a.role === role ? { ...a, name, designation, signature, status, approvedAt: new Date().toISOString() } : a),
          } : m),
        }));
        get().log({ actor: name || "user", action: `Approval ${status}`, memoId: id, details: role });
      },

      upsertWorkflowForWagon: async (wagonId, memoId) => {
        // In-flight guard
        if (initPromises[wagonId]) {
          return initPromises[wagonId];
        }

        const promise = (async () => {
          const wagon = get().wagons.find((w) => w.id === wagonId);
          if (!wagon) throw new Error("Wagon not found");
          
          const existing = get().workflows.find((wf) => wf.wagonId === wagonId);
          if (existing) return existing;
          
          const def = getWorkflowDefinitionForWagon(wagon.details?.typeName || wagon.type);
          if (!def) throw new Error("Workflow not configured for this wagon type");

          const stageRecords = Object.values(def.stages).map((st) => ({
            stageName: st.key,
            targetDurationHours: st.targetDurationHours || 0,
            status: "Pending" as const
          }));

          const provisionalItem: WorkflowItem = {
            id: `temp_${nanoid()}`, 
            wagonId, 
            memoId, 
            wagonNo: wagon.wagonNo, 
            wagonType: wagon.details?.typeName || wagon.type,
            currentStage: def.initialStage, 
            stages: stageRecords, 
            updatedAt: new Date().toISOString(),
          };
          
          // Optimistic update
          set((s) => ({ workflows: [...s.workflows, provisionalItem] }));
          
          try {
            const result = await workflowApi.createWorkflow(provisionalItem);
            const serverItem = result?.data || provisionalItem;
            
            // Replace provisional with server authoritative object
            set((s) => ({
              workflows: s.workflows.map(w => w.id === provisionalItem.id ? serverItem : w)
            }));
            
            return serverItem;
          } catch (error) {
            // Rollback optimistic state
            set((s) => ({ workflows: s.workflows.filter(w => w.id !== provisionalItem.id) }));
            throw new Error("Unable to initialize workflow. Please try again.");
          } finally {
            delete initPromises[wagonId];
          }
        })();

        initPromises[wagonId] = promise;
        return promise;
      },

      startStage: (id, stageName, staffName = "User") => {
        // Save snapshot before action
        const wfBefore = get().workflows.find(w => w.id === id);
        if (wfBefore) {
          const { actionHistory, ...wfWithoutHistory } = wfBefore;
          const snapshot: WorkflowActionHistory = {
            action: "START_STAGE", stageName,
            previousWorkflowSnapshot: JSON.stringify(wfWithoutHistory),
            createdAt: new Date().toISOString(), userName: staffName
          };
          set((s) => ({
            workflows: s.workflows.map(w => w.id === id ? { ...w, actionHistory: [...(w.actionHistory || []), snapshot] } : w),
          }));
        }

        set((s) => {
          const wf = s.workflows.find(w => w.id === id);
          if (!wf) return s;
          
          const isFirstStage = wf.stages.length > 0 && wf.stages[0].stageName === stageName;
          
          const updatedWorkflows = s.workflows.map(w => {
            if (w.id !== id) return w;
            const updatedStages = w.stages.map(st => 
              st.stageName === stageName ? { ...st, status: "In Progress" as const, startedAt: new Date().toISOString(), staffName } : st
            );
            return { ...w, stages: updatedStages, updatedAt: new Date().toISOString() };
          });

          const updatedWagons = s.wagons.map(wagon => {
            if (wagon.id === wf.wagonId) {
              let newStatus = wagon.status;
              if (stageName === "Initial Inspection") newStatus = "INSPECTION_PENDING";
              else if (stageName === "Repair / Rectification" || (!isFirstStage && wagon.status === "REPAIR_IN_PROGRESS")) newStatus = "REPAIR_IN_PROGRESS";
              else if (stageName === "Checklist / Testing") newStatus = "FIT_CERTIFICATE_PENDING";
              else if (stageName === "Final Inspection") newStatus = "FIT_CERTIFICATE_PENDING";
              else if (stageName === "SICK_LINE") newStatus = "SICK_LINE";
              else if (stageName === "Sick Reason") newStatus = "SICK_LINE";
              
              return { ...wagon, status: newStatus as any };
            }
            return wagon;
          });

          return { workflows: updatedWorkflows, wagons: updatedWagons };
        });
        
        const wf = get().workflows.find((w) => w.id === id);
        if (wf) get().log({ actor: staffName, action: "Stage Started", details: `Started ${stageName} for wagon ${wf.wagonNo}`, wagonId: wf.wagonId });
      },

      pauseStage: (id, stageName, staffName, reason) => {
        const wfBefore = get().workflows.find(w => w.id === id);
        if (wfBefore) {
          const { actionHistory, ...wfWithoutHistory } = wfBefore;
          const snapshot: WorkflowActionHistory = {
            action: "PAUSE_STAGE", stageName,
            previousWorkflowSnapshot: JSON.stringify(wfWithoutHistory),
            createdAt: new Date().toISOString(), userName: staffName, reason
          };
          set((s) => ({
            workflows: s.workflows.map(w => w.id === id ? { ...w, actionHistory: [...(w.actionHistory || []), snapshot] } : w),
          }));
        }

        set((s) => {
          const updatedWorkflows = s.workflows.map(w => {
            if (w.id !== id) return w;
            const updatedStages = w.stages.map(st => 
              st.stageName === stageName ? { ...st, status: "Paused" as const, remarks: reason ? `${st.remarks ? st.remarks + ' | ' : ''}Paused: ${reason}` : st.remarks } : st
            );
            return { ...w, stages: updatedStages, updatedAt: new Date().toISOString() };
          });
          return { workflows: updatedWorkflows };
        });

        const wf = get().workflows.find((w) => w.id === id);
        if (wf) get().log({ actor: staffName, action: "Stage Paused", details: `Paused ${stageName} for wagon ${wf.wagonNo}. Reason: ${reason || 'None'}`, wagonId: wf.wagonId });
      },

      resumeStage: (id, stageName, staffName) => {
        const wfBefore = get().workflows.find(w => w.id === id);
        if (wfBefore) {
          const { actionHistory, ...wfWithoutHistory } = wfBefore;
          const snapshot: WorkflowActionHistory = {
            action: "RESUME_STAGE", stageName,
            previousWorkflowSnapshot: JSON.stringify(wfWithoutHistory),
            createdAt: new Date().toISOString(), userName: staffName
          };
          set((s) => ({
            workflows: s.workflows.map(w => w.id === id ? { ...w, actionHistory: [...(w.actionHistory || []), snapshot] } : w),
          }));
        }

        set((s) => {
          const updatedWorkflows = s.workflows.map(w => {
            if (w.id !== id) return w;
            const updatedStages = w.stages.map(st => 
              st.stageName === stageName ? { ...st, status: "In Progress" as const } : st
            );
            return { ...w, stages: updatedStages, updatedAt: new Date().toISOString() };
          });
          return { workflows: updatedWorkflows };
        });

        const wf = get().workflows.find((w) => w.id === id);
        if (wf) get().log({ actor: staffName, action: "Stage Resumed", details: `Resumed ${stageName} for wagon ${wf.wagonNo}`, wagonId: wf.wagonId });
      },

      markStageDone: (id, stageName, staffName, inspectorName, remarks) => {
        // Save snapshot before action
        const wfBefore = get().workflows.find(w => w.id === id);
        if (wfBefore) {
          const { actionHistory, ...wfWithoutHistory } = wfBefore;
          const snapshot: WorkflowActionHistory = {
            action: "MARK_STAGE_DONE", stageName,
            previousWorkflowSnapshot: JSON.stringify(wfWithoutHistory),
            createdAt: new Date().toISOString(), userName: inspectorName, reason: remarks
          };
          set((s) => ({
            workflows: s.workflows.map(w => w.id === id ? { ...w, actionHistory: [...(w.actionHistory || []), snapshot] } : w),
          }));
        }

        set((s) => ({
          workflows: s.workflows.map(wf => {
            if (wf.id !== id) return wf;
            const updatedStages = wf.stages.map(st => {
              if (st.stageName === stageName) {
                const now = new Date();
                const started = st.startedAt ? new Date(st.startedAt) : now;
                const diffMs = now.getTime() - started.getTime();
                const durationHours = diffMs / (1000 * 60 * 60);
                return { ...st, status: "Done" as const, completedAt: now.toISOString(), durationHours, staffName, inspectorName, sscJeName: inspectorName, remarks };
              }
              return st;
            });
            return { ...wf, stages: updatedStages, updatedAt: new Date().toISOString() };
          })
        }));
        const wf = get().workflows.find((w) => w.id === id);
        if (wf) {
          get().log({ actor: inspectorName, action: "Stage Marked Done", details: `Stage ${stageName} completed for wagon ${wf.wagonNo}. Remarks: ${remarks}`, wagonId: wf.wagonId });
          
          // INTERCONNECT: If all workflow stages are done, automatically mark wagon as Fit For Loading
          const allDone = wf.stages.every(st => st.status === "Done");
          if (allDone) {
            get().updateWagon(wf.wagonId, { status: "FIT_READY" }, inspectorName);
          }

          // Generate Notifications
          if (stageName.includes("Steam")) {
            notificationApi.createNotification({
              type: "SYSTEM_ALERT", title: "Steam Completed", message: `Steam cleaning completed for wagon ${wf.wagonNo}`,
              refModel: "Wagon", refId: wf.wagonId, targetRoles: ["admin", "employee"]
            }).catch(console.error);
          } else if (stageName.includes("Repair")) {
            notificationApi.createNotification({
              type: "STATUS_UPDATE", title: "Repair Completed", message: `Repairs completed for wagon ${wf.wagonNo}`,
              refModel: "Wagon", refId: wf.wagonId, targetRoles: ["admin", "employee"]
            }).catch(console.error);
          }
        }
      },

      advanceWorkflow: (id, toStage) => {
        // Save snapshot before action
        const wfBefore = get().workflows.find(w => w.id === id);
        if (wfBefore) {
          const { actionHistory, ...wfWithoutHistory } = wfBefore;
          const snapshot: WorkflowActionHistory = {
            action: "ADVANCE_WORKFLOW", stageName: toStage,
            previousWorkflowSnapshot: JSON.stringify(wfWithoutHistory),
            createdAt: new Date().toISOString(), userName: "user",
          };
          set((s) => ({
            workflows: s.workflows.map(w => w.id === id ? { ...w, actionHistory: [...(w.actionHistory || []), snapshot] } : w),
          }));
        }

        set((s) => {
          const wf = s.workflows.find(w => w.id === id);
          if (!wf) return s;

          const updatedWorkflows = s.workflows.map((w) => {
            if (w.id !== id) return w;
            const updatedStages = w.stages.map(st => 
              st.stageName === toStage ? { ...st, status: "In Progress" as const, startedAt: new Date().toISOString() } : st
            );
            return { ...w, currentStage: toStage, stages: updatedStages, updatedAt: new Date().toISOString() };
          });

          const updatedWagons = s.wagons.map(wagon => {
            if (wagon.id === wf.wagonId) {
              let newStatus = wagon.status;
              if (toStage === "Initial Inspection") newStatus = "INSPECTION_PENDING";
              else if (toStage === "Repair / Rectification" || wagon.status === "REPAIR_IN_PROGRESS") newStatus = "REPAIR_IN_PROGRESS";
              else if (toStage === "Checklist / Testing") newStatus = "FIT_CERTIFICATE_PENDING";
              else if (toStage === "Final Inspection") newStatus = "FIT_CERTIFICATE_PENDING";
              else if (toStage === "SICK_LINE") newStatus = "SICK_LINE";
              else if (toStage === "Sick Reason") newStatus = "SICK_LINE";
              
              return { ...wagon, status: newStatus as any };
            }
            return wagon;
          });

          return { workflows: updatedWorkflows, wagons: updatedWagons };
        });
        const wf = get().workflows.find((w) => w.id === id);
        if (wf) {
          get().log({ actor: "user", action: "Moved to Next Stage", details: `Advanced to ${toStage} for wagon ${wf.wagonNo}`, wagonId: wf.wagonId });
          
          if (toStage.includes("Inspection")) {
            notificationApi.createNotification({
              type: "ACTION_REQUIRED", title: "Inspection Pending", message: `Wagon ${wf.wagonNo} is waiting for ${toStage}`,
              refModel: "Wagon", refId: wf.wagonId, targetRoles: ["admin", "employee"]
            }).catch(console.error);
          }
        }
      },

      markWagonFit: (wagonId, fitConfirmation) => {
        const wf = get().workflows.find((w) => w.wagonId === wagonId);
        const wagon = get().wagons.find(w => w.id === wagonId);
        const isTankWagon = wagon && ["BTPN", "BTPFLN", "BTPNHS", "BTPGLN"].includes((wagon.type || "").toUpperCase());
        
        // Validate: tank wagons must have all workflow stages Done
        if (isTankWagon && wf) {
          const allDone = wf.stages.every(st => st.status === "Done");
          if (!allDone) {
            return { success: false, error: "Workflow is not completed. Complete all stages before marking wagon Fit." };
          }
          // Save snapshot for undo
          const { actionHistory, ...wfWithoutHistory } = wf;
          const snapshot: WorkflowActionHistory = {
            action: "MARK_FIT", stageName: wf.currentStage,
            previousWorkflowSnapshot: JSON.stringify(wfWithoutHistory),
            createdAt: new Date().toISOString(), userName: "user",
          };
          set((s) => ({
            workflows: s.workflows.map(w => w.id === wf.id ? { ...w, actionHistory: [...(w.actionHistory || []), snapshot] } : w),
          }));
        }
        
        // Ensure regular wagons can pass without fitConfirmation
        get().updateWagon(wagonId, { status: "FIT_READY", fitConfirmation });
        if (wf) {
          get().log({ actor: fitConfirmation?.inspectorName || "user", action: "Wagon Marked Fit", details: `Wagon ${wf.wagonNo} marked Fit For Loading`, wagonId });
          notificationApi.createNotification({
            type: "SYSTEM_ALERT", title: "Certificate Issued", message: `Fit Certificate issued for wagon ${wf.wagonNo}`,
            refModel: "Wagon", refId: wagonId, targetRoles: ["admin", "employee"]
          }).catch(console.error);
        }
        return { success: true };
      },

      updateInspectionChecklist: (wagonId, patch) => {
        set((s) => ({
          wagons: s.wagons.map((w) => {
            if (w.id === wagonId) {
              return {
                ...w,
                inspectionChecklist: {
                  ...(w.inspectionChecklist || {}),
                  ...patch,
                }
              };
            }
            return w;
          })
        }));
      },

      undoLastWorkflowAction: (wagonId, reason) => {
        const wf = get().workflows.find(w => w.wagonId === wagonId);
        if (!wf || !wf.actionHistory || wf.actionHistory.length === 0) {
          return { success: false, error: "No action to undo." };
        }

        const lastAction = wf.actionHistory[wf.actionHistory.length - 1];
        const previousWf: WorkflowItem = JSON.parse(lastAction.previousWorkflowSnapshot);
        const newHistory = wf.actionHistory.slice(0, -1);

        // Restore workflow to previous state
        set((s) => ({
          workflows: s.workflows.map(w => w.id === wf.id ? {
            ...previousWf,
            actionHistory: newHistory,
          } : w),
        }));

        // If the undone action was MARK_FIT, restore wagon status
        if (lastAction.action === "MARK_FIT") {
          get().updateWagon(wagonId, { status: "REPAIR_IN_PROGRESS" as any });
        }
        // If undo START_STAGE on first stage, restore to Sick Line
        if (lastAction.action === "START_STAGE") {
          const isFirstStage = previousWf.stages.length > 0 && previousWf.currentStage === previousWf.stages[0].stageName;
          if (isFirstStage) {
            get().updateWagon(wagonId, { status: "SICK_LINE" as any });
          }
        }

        const undoReason = reason || "Workflow action undone by user.";
        get().log({ actor: "user", action: `Undo ${lastAction.action}`, wagonId, details: `Undone stage: ${lastAction.stageName}. Reason: ${undoReason}` });
        return { success: true };
      },

      debugWorkflow: (wagonId) => {
        const wagon = get().wagons.find(w => w.id === wagonId);
        const wf = get().workflows.find(w => w.wagonId === wagonId);
        if (wagon) {
          console.group(`🚂 Workflow Debug: Wagon ${wagon.wagonNo}`);
          console.log(`Current Status: ${wagon.status}`);
          console.log(`Current Workflow Stage: ${wf ? wf.currentStage : 'None'}`);
          console.log(`Repair Count: ${wagon.repairTasks?.length || 0}`);
          console.log(`Fit Certificate State: ${wagon.fitConfirmation ? 'Issued' : 'Pending'}`);
          console.groupEnd();
        }
      },

      addEmployee: (e) => {
        const emp: Employee = { ...e, id: nanoid() };
        set((s) => ({ employees: [...s.employees, emp] }));
        return emp;
      },
      updateEmployee: (id, patch) => set((s) => ({ employees: s.employees.map((e) => e.id === id ? { ...e, ...patch } : e) })),
      removeEmployee: (id) => set((s) => ({ employees: s.employees.filter((e) => e.id !== id) })),

      log: (e) => {
        let userId: string | undefined;
        let userEmail: string | undefined;
        let userName: string | undefined;
        let userRole: string | undefined;

        // Try to infer department based on action/details
        let department = "Operations";
        const text = `${e.action} ${e.details || ""}`.toLowerCase();
        if (text.includes("steam")) department = "Steam Department";
        else if (text.includes("degass") || text.includes("purge")) department = "Degassing Department";
        else if (text.includes("inspect")) department = "Inspection Department";
        else if (text.includes("repair")) department = "Repair Department";

        const logEntry = { 
          ...e, id: nanoid(), at: new Date().toISOString(), userId, userEmail, userName, userRole 
        };

        set((s) => ({
          audit: [logEntry, ...s.audit].slice(0, 1000),
        }));

        // Fire to backend async
        auditApi.createAuditLog({
          action: e.action,
          metadata: {
            actor: e.actor,
            department,
            details: e.details,
            wagonId: e.wagonId,
            memoId: e.memoId
          }
        }).catch(err => console.error("Failed to push audit log", err));
      },

      addDocumentMeta: (doc) => {
        set((s) => {
          // Increment version if a document of the same type already exists for this wagon
          const existingDocs = s.documents.filter(d => d.wagonId === doc.wagonId && d.type === doc.type);
          let newVersion = 1;
          if (existingDocs.length > 0) {
            newVersion = Math.max(...existingDocs.map(d => d.version)) + 1;
          }
          return { documents: [...s.documents, { ...doc, version: newVersion }] };
        });
        get().log({ actor: doc.uploadedBy, action: "Document Uploaded", details: `Uploaded ${doc.type}: ${doc.name}`, wagonId: doc.wagonId });
      },

      removeDocumentMeta: (id) => {
        const doc = get().documents.find(d => d.id === id);
        set((s) => ({ documents: s.documents.filter(d => d.id !== id) }));
        if (doc) {
          get().log({ actor: "System", action: "Document Deleted", details: `Deleted ${doc.type}: ${doc.name}`, wagonId: doc.wagonId });
        }
      },

      getWagonDocuments: (wagonId) => {
        return get().documents.filter(d => d.wagonId === wagonId).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      },

      fetchMasterData: async () => {
        try {
          const data = await masterDataApi.getAll();
          set({ masterData: data });
        } catch (error) {
          console.error("Failed to fetch master data", error);
        }
      },
      addMasterData: async (data) => {
        try {
          const record = await masterDataApi.create(data);
          set(s => ({ masterData: [...s.masterData, record] }));
        } catch (error) {
          console.error("Failed to create master data", error);
          throw error;
        }
      },
      updateMasterData: async (id, patch) => {
        try {
          const record = await masterDataApi.update(id, patch);
          set(s => ({ masterData: s.masterData.map(md => md._id === id ? record : md) }));
        } catch (error) {
          console.error("Failed to update master data", error);
          throw error;
        }
      },
      deleteMasterData: async (id) => {
        try {
          await masterDataApi.delete(id);
          set(s => ({ masterData: s.masterData.filter(md => md._id !== id) }));
        } catch (error) {
          console.error("Failed to delete master data", error);
          throw error;
        }
      }
  })
);
