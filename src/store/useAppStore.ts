import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import {
  AuditEvent, Employee, Rake, UnitMemo, Wagon, WorkflowItem, WorkflowStageRecord
} from "@/types";
import { getWorkflowTemplate } from "@/lib/workflowConfig";
import { buildDemoData } from "@/lib/demoData";

interface AppState {
  wagons: Wagon[];
  rakes: Rake[];
  memos: UnitMemo[];
  workflows: WorkflowItem[];
  employees: Employee[];
  audit: AuditEvent[];
  seeded: boolean;

  isAdmin: boolean;
  toggleAdmin: (v?: boolean) => void;

  seedDemo: () => void;
  resetAll: () => void;

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
  markWagonFit: (wagonId: string) => void;

  // employees
  addEmployee: (e: Omit<Employee, "id">) => Employee;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;

  // audit
  log: (e: Omit<AuditEvent, "id" | "at">) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      wagons: [], rakes: [], memos: [], workflows: [], employees: [], audit: [], seeded: false,
      isAdmin: true,
      toggleAdmin: (v) => set((s) => ({ isAdmin: v ?? !s.isAdmin })),

      seedDemo: () => {
        if (get().seeded) return;
        const d = buildDemoData();
        set({ ...d, seeded: true, audit: [{ id: nanoid(), at: new Date().toISOString(), actor: "system", action: "Demo data seeded" }] });
      },
      resetAll: () => {
        const d = buildDemoData();
        set({ ...d, seeded: true, audit: [{ id: nanoid(), at: new Date().toISOString(), actor: "system", action: "System reset to demo" }] });
      },

      addWagon: (w) => {
        const wagon: Wagon = { ...w, id: nanoid() };
        set((s) => ({ wagons: [...s.wagons, wagon] }));
        get().log({ actor: "user", action: "Wagon added", wagonId: wagon.id, details: wagon.wagonNo });
        return wagon;
      },
      updateWagon: (id, patch, actorName) => {
        set((s) => ({ wagons: s.wagons.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
        const actionDetails = patch.repairTypes ? `Repair types: ${patch.repairTypes.join(", ")}` : JSON.stringify(patch);
        get().log({ actor: actorName || "user", action: patch.repairTypes ? "Repair Types Updated" : "Wagon updated", wagonId: id, details: actionDetails });
      },
      removeWagon: (id) => set((s) => ({ wagons: s.wagons.filter((w) => w.id !== id) })),

      addRake: (r) => {
        const rake: Rake = { ...r, id: nanoid(), createdAt: new Date().toISOString(), wagonIds: r.wagonIds ?? [] };
        set((s) => ({ rakes: [...s.rakes, rake] }));
        get().log({ actor: "user", action: "Rake created", details: rake.rakeId });
        return rake;
      },
      updateRake: (id, patch) => set((s) => ({ rakes: s.rakes.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
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
        memo.entries.forEach((e) => get().upsertWorkflowForWagon(e.wagonId, memo.id));
        get().log({ actor: "user", action: "Memo created", memoId: memo.id, details: memo.memoNo });
        return memo;
      },
      updateMemo: (id, patch) => {
        set((s) => ({ memos: s.memos.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
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
        const stageRecords: WorkflowStageRecord[] = template.stages.map((st, i) => ({
          stageName: st.name,
          targetDurationHours: st.targetDurationHours,
          status: i === 0 ? "Pending" : "Pending"
        }));

        const item: WorkflowItem = {
          id: nanoid(), wagonId, memoId, wagonNo: wagon.wagonNo, wagonType: wagon.type as string,
          currentStage: stageRecords[0].stageName, stages: stageRecords, updatedAt: new Date().toISOString(),
        };
        
        set((s) => ({ workflows: [...s.workflows, item], wagons: s.wagons.map((w) => w.id === wagonId ? { ...w, status: "Sick Line" } : w) }));
      },

      startStage: (id, stageName, staffName = "User") => {
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
            if (wagon.id === wf.wagonId && !isFirstStage) {
              return { ...wagon, status: "Under Repair" as const };
            }
            return wagon;
          });

          return { workflows: updatedWorkflows, wagons: updatedWagons };
        });
        
        const wf = get().workflows.find((w) => w.id === id);
        if (wf) get().log({ actor: staffName, action: "Stage Started", details: `Started ${stageName} for wagon ${wf.wagonNo}`, wagonId: wf.wagonId });
      },

      markStageDone: (id, stageName, staffName, inspectorName, remarks) => {
        set((s) => ({
          workflows: s.workflows.map(wf => {
            if (wf.id !== id) return wf;
            const updatedStages = wf.stages.map(st => {
              if (st.stageName === stageName) {
                const now = new Date();
                const started = st.startedAt ? new Date(st.startedAt) : now;
                const diffMs = now.getTime() - started.getTime();
                const durationHours = diffMs / (1000 * 60 * 60);
                return { ...st, status: "Done" as const, completedAt: now.toISOString(), durationHours, staffName, inspectorName, remarks };
              }
              return st;
            });
            return { ...wf, stages: updatedStages, updatedAt: new Date().toISOString() };
          })
        }));
        const wf = get().workflows.find((w) => w.id === id);
        if (wf) get().log({ actor: inspectorName, action: "Stage Marked Done", details: `Stage ${stageName} completed for wagon ${wf.wagonNo}. Remarks: ${remarks}`, wagonId: wf.wagonId });
      },

      advanceWorkflow: (id, toStage) => {
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
              return { ...wagon, status: "Under Repair" as const };
            }
            return wagon;
          });

          return { workflows: updatedWorkflows, wagons: updatedWagons };
        });
        const wf = get().workflows.find((w) => w.id === id);
        if (wf) get().log({ actor: "user", action: "Moved to Next Stage", details: `Advanced to ${toStage} for wagon ${wf.wagonNo}`, wagonId: wf.wagonId });
      },

      markWagonFit: (wagonId) => {
        get().updateWagon(wagonId, { status: "Fit For Loading" });
        const wf = get().workflows.find((w) => w.wagonId === wagonId);
        if (wf) get().log({ actor: "user", action: "Wagon Marked Fit", details: `Wagon ${wf.wagonNo} marked Fit For Loading`, wagonId });
      },

      addEmployee: (e) => {
        const emp: Employee = { ...e, id: nanoid() };
        set((s) => ({ employees: [...s.employees, emp] }));
        return emp;
      },
      updateEmployee: (id, patch) => set((s) => ({ employees: s.employees.map((e) => e.id === id ? { ...e, ...patch } : e) })),
      removeEmployee: (id) => set((s) => ({ employees: s.employees.filter((e) => e.id !== id) })),

      log: (e) => {
        // Enrich with current user identity from localStorage
        let userId: string | undefined;
        let userEmail: string | undefined;
        let userName: string | undefined;
        let userRole: string | undefined;
        try {
          const raw = localStorage.getItem("wagon_app_current_user");
          if (raw) {
            const u = JSON.parse(raw);
            userId = u.id;
            userEmail = u.email;
            userName = u.name;
            userRole = u.role;
          }
        } catch { /* ignore */ }
        set((s) => ({
          audit: [
            { ...e, id: nanoid(), at: new Date().toISOString(), userId, userEmail, userName, userRole },
            ...s.audit,
          ].slice(0, 1000),
        }));
      },
    }),
    {
      name: "wagon-whisperer-store",
      version: 1,
    },
  ),
);
