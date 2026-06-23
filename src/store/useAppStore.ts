import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import {
  AuditEvent, Employee, Rake, UnitMemo, Wagon, WorkflowItem, WorkflowStageRecord, WorkflowActionHistory,
  FitConfirmation, InspectionChecklist
} from "@/types";
import { getWorkflowTemplate } from "@/lib/workflowConfig";
import { wagonApi } from "@/api/wagons";
import { memoApi } from "@/api/memos";
import { workflowApi } from "@/api/workflows";
import { rakeApi } from "@/api/rakes";

interface AppState {
  initializeStore: () => Promise<void>;
  wagons: Wagon[];
  rakes: Rake[];
  memos: UnitMemo[];
  workflows: WorkflowItem[];
  employees: Employee[];
  audit: AuditEvent[];
  seeded: boolean;

  isAdmin: boolean;
  toggleAdmin: (v?: boolean) => void;


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
  upsertWorkflowForWagon: (wagonId: string, memoId?: string) => void;
  advanceWorkflow: (id: string, toStage: string) => void;
  startStage: (id: string, stageName: string, staffName?: string) => void;
  markStageDone: (id: string, stageName: string, staffName: string, inspectorName: string, remarks: string) => void;
  markWagonFit: (wagonId: string, fitConfirmation?: FitConfirmation) => { success: boolean; error?: string };
  updateInspectionChecklist: (wagonId: string, patch: Partial<InspectionChecklist>) => void;
  undoLastWorkflowAction: (wagonId: string, reason?: string) => { success: boolean; error?: string };
  fixWorkflowConsistency: () => void;

  // employees
  addEmployee: (e: Omit<Employee, "id">) => Employee;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;

  // audit
  log: (e: Omit<AuditEvent, "id" | "at">) => void;
}

export const useAppStore = create<AppState>()(
  (set, get) => ({
      wagons: [], rakes: [], memos: [], workflows: [], employees: [], audit: [], seeded: false,
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
        } catch (err) {
          console.error("Failed to initialize store", err);
        }
      },

      addWagon: (w) => {
        const wagon: Wagon = { ...w, id: nanoid() };
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
        if (patch.status === "Fit For Loading" || patch.status === "Fit") {
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
        if (patch.status === "Issue Marked" || patch.status === "Under Repair") {
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
        get().updateWagon(wagonId, { status: "Cut Off" });
        get().log({ actor: "user", action: "Wagon marked defective", wagonId });
      },

      addMemo: (m) => {
        const memo: UnitMemo = { ...m, id: nanoid(), createdAt: new Date().toISOString() };
        set((s) => ({ memos: [...s.memos, memo] }));
        memoApi.createMemo(memo).catch(console.error);
        memo.entries.forEach((e) => {
          if (memo.memoType === "sick") {
            get().upsertWorkflowForWagon(e.wagonId, memo.id);
            get().updateWagon(e.wagonId, { status: "Sick Line" }, "system");
          } else if (memo.memoType === "fit") {
            get().updateWagon(e.wagonId, { status: "Fit For Loading" }, "system");
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

      upsertWorkflowForWagon: (wagonId, memoId) => {
        const wagon = get().wagons.find((w) => w.id === wagonId);
        if (!wagon) return;
        const existing = get().workflows.find((wf) => wf.wagonId === wagonId);
        if (existing) return;
        
        const template = getWorkflowTemplate(wagon.type as string);
        const stageRecords: WorkflowStageRecord[] = template.stages.map((st) => ({
          stageName: st.name,
          targetDurationHours: st.targetDurationHours,
          status: "Pending"
        }));

        const item: WorkflowItem = {
          id: nanoid(), wagonId, memoId, wagonNo: wagon.wagonNo, wagonType: wagon.type as string,
          currentStage: stageRecords[0].stageName, stages: stageRecords, updatedAt: new Date().toISOString(),
        };
        
        set((s) => ({ workflows: [...s.workflows, item] }));
        workflowApi.createWorkflow(item).catch(console.error);
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
              if (stageName === "Initial Inspection") newStatus = "Under Inspection";
              else if (stageName === "Repair / Rectification" || (!isFirstStage && wagon.status === "Cut Off")) newStatus = "Under Repair";
              else if (stageName === "Checklist / Testing") newStatus = "Awaiting Testing";
              else if (stageName === "Final Inspection") newStatus = "Awaiting Final Inspection";
              else if (stageName === "Issue Marked") newStatus = "Issue Marked";
              else if (stageName === "Sick Reason") newStatus = "Issue Marked";
              
              return { ...wagon, status: newStatus as any };
            }
            return wagon;
          });

          return { workflows: updatedWorkflows, wagons: updatedWagons };
        });
        
        const wf = get().workflows.find((w) => w.id === id);
        if (wf) get().log({ actor: staffName, action: "Stage Started", details: `Started ${stageName} for wagon ${wf.wagonNo}`, wagonId: wf.wagonId });
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
            get().updateWagon(wf.wagonId, { status: "Fit For Loading" }, inspectorName);
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
              if (toStage === "Initial Inspection") newStatus = "Under Inspection";
              else if (toStage === "Repair / Rectification" || wagon.status === "Cut Off") newStatus = "Under Repair";
              else if (toStage === "Checklist / Testing") newStatus = "Awaiting Testing";
              else if (toStage === "Final Inspection") newStatus = "Awaiting Final Inspection";
              else if (toStage === "Issue Marked") newStatus = "Issue Marked";
              else if (toStage === "Sick Reason") newStatus = "Issue Marked";
              
              return { ...wagon, status: newStatus as any };
            }
            return wagon;
          });

          return { workflows: updatedWorkflows, wagons: updatedWagons };
        });
        const wf = get().workflows.find((w) => w.id === id);
        if (wf) get().log({ actor: "user", action: "Moved to Next Stage", details: `Advanced to ${toStage} for wagon ${wf.wagonNo}`, wagonId: wf.wagonId });
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
        get().updateWagon(wagonId, { status: "Fit For Loading", fitConfirmation });
        if (wf) get().log({ actor: fitConfirmation?.inspectorName || "user", action: "Wagon Marked Fit", details: `Wagon ${wf.wagonNo} marked Fit For Loading`, wagonId });
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
          get().updateWagon(wagonId, { status: "Under Repair" });
        }
        // If undo START_STAGE on first stage, restore to Sick Line
        if (lastAction.action === "START_STAGE") {
          const isFirstStage = previousWf.stages.length > 0 && previousWf.currentStage === previousWf.stages[0].stageName;
          if (isFirstStage) {
            get().updateWagon(wagonId, { status: "Sick Line" });
          }
        }

        const undoReason = reason || "Workflow action undone by user.";
        get().log({ actor: "user", action: `Undo ${lastAction.action}`, wagonId, details: `Undone stage: ${lastAction.stageName}. Reason: ${undoReason}` });
        return { success: true };
      },

      fixWorkflowConsistency: () => {
        const { wagons, workflows } = get();
        const patches: { id: string; status: Wagon["status"] }[] = [];
        
        wagons.forEach(w => {
          const isTankWagon = ["BTPN", "BTPFLN", "BTPNHS", "BTPGLN"].includes((w.type || "").toUpperCase());
          if (!isTankWagon) return;
          
          const wf = workflows.find(wfItem => wfItem.wagonId === w.id);
          if (!wf) return;
          
          const allDone = wf.stages.every(st => st.status === "Done");
          const wagonIsFit = w.status === "Fit For Loading";
          
          if (wagonIsFit && !allDone) {
            // Status conflict: workflow incomplete but marked fit
            const isFirstStage = wf.currentStage === wf.stages[0].stageName;
            const isFirstStagePending = isFirstStage && wf.stages[0].status === "Pending";
            patches.push({ id: w.id, status: isFirstStagePending ? "Sick Line" : "Under Repair" });
          }
        });
        
        if (patches.length > 0) {
          set((s) => ({
            wagons: s.wagons.map(w => {
              const patch = patches.find(p => p.id === w.id);
              return patch ? { ...w, status: patch.status } : w;
            }),
          }));
          get().log({ actor: "system", action: "Workflow Consistency Fix", details: `Fixed ${patches.length} wagon(s) with status conflicts` });
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
        // Enrich with current user identity from AuthContext/API later if needed
        let userId: string | undefined;
        let userEmail: string | undefined;
        let userName: string | undefined;
        let userRole: string | undefined;
        set((s) => ({
          audit: [
            { ...e, id: nanoid(), at: new Date().toISOString(), userId, userEmail, userName, userRole },
            ...s.audit,
          ].slice(0, 1000),
        }));
      },
  })
);
