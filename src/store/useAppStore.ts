import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import {
  AuditEvent, Employee, Rake, UnitMemo, Wagon, WorkflowItem, WORKFLOW_TEMPLATES,
} from "@/types";
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
  addWagon: (w: Omit<Wagon, "id">) => Wagon;
  updateWagon: (id: string, patch: Partial<Wagon>) => void;
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
  upsertWorkflowForWagon: (wagonId: string, memoId: string) => void;
  advanceWorkflow: (id: string, toStage: string) => void;

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
      updateWagon: (id, patch) => {
        set((s) => ({ wagons: s.wagons.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
        get().log({ actor: "user", action: "Wagon updated", wagonId: id, details: JSON.stringify(patch) });
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
        const tpl = WORKFLOW_TEMPLATES[wagon.type as string] ?? WORKFLOW_TEMPLATES.DEFAULT;
        const item: WorkflowItem = {
          id: nanoid(), wagonId, memoId, wagonNo: wagon.wagonNo, wagonType: wagon.type as string,
          currentStage: tpl[0], stages: tpl, completedStages: [], updatedAt: new Date().toISOString(),
        };
        set((s) => ({ workflows: [...s.workflows, item], wagons: s.wagons.map((w) => w.id === wagonId ? { ...w, status: "Sick Line" } : w) }));
      },
      advanceWorkflow: (id, toStage) => {
        set((s) => ({
          workflows: s.workflows.map((wf) => {
            if (wf.id !== id) return wf;
            const idx = wf.stages.indexOf(toStage as any);
            if (idx < 0) return wf;
            const completed = wf.stages.slice(0, idx);
            return { ...wf, currentStage: toStage as any, completedStages: completed, updatedAt: new Date().toISOString() };
          }),
        }));
        const wf = get().workflows.find((w) => w.id === id);
        if (wf) {
          const isFit = toStage === "Fit For Loading" || toStage === "Fit For Use";
          get().updateWagon(wf.wagonId, { status: isFit ? "Fit For Loading" : "Under Repair" });
        }
        get().log({ actor: "user", action: "Workflow stage updated", details: toStage });
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
