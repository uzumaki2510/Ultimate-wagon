import re

with open('src/store/useAppStore.ts', 'r') as f:
    content = f.read()

# 1. Import APIs
api_imports = """import { wagonApi } from "@/api/wagons";
import { memoApi } from "@/api/memos";
import { workflowApi } from "@/api/workflows";
import { rakeApi } from "@/api/rakes";
"""
content = content.replace('import { getWorkflowTemplate } from "@/lib/workflowConfig";', 'import { getWorkflowTemplate } from "@/lib/workflowConfig";\n' + api_imports)

# 2. Add initializeStore to AppState
content = content.replace('  toggleAdmin: (v?: boolean) => void;', '  toggleAdmin: (v?: boolean) => void;\n\n  initializeStore: () => Promise<void>;')

# 3. Remove persist wrapper
content = re.sub(r'export const useAppStore = create<AppState>\(\)\(\s*persist\(\s*\(set, get\) => \({', 'export const useAppStore = create<AppState>()(\n  (set, get) => ({', content)

# Remove the bottom part of persist
content = re.sub(r'    \}\),\s*\{\s*name: "wagon-whisperer-store",\s*version: 1,\s*\},\s*\),\s*\);', '  })\n);', content)

# 4. Implement initializeStore
init_store_impl = """
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
"""
content = content.replace('toggleAdmin: (v) => set((s) => ({ isAdmin: v ?? !s.isAdmin })),', 'toggleAdmin: (v) => set((s) => ({ isAdmin: v ?? !s.isAdmin })),' + init_store_impl)

# 5. Patch addWagon
content = content.replace('set((s) => ({ wagons: [...s.wagons, wagon] }));', 'set((s) => ({ wagons: [...s.wagons, wagon] }));\n        wagonApi.createWagon(wagon).catch(console.error);')

# 6. Patch updateWagon
content = content.replace('set((s) => ({ wagons: s.wagons.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));', 'set((s) => ({ wagons: s.wagons.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));\n        wagonApi.updateWagon(id, patch).catch(console.error);')

# 7. Patch removeWagon
content = content.replace('workflows: s.workflows.filter((w) => w.wagonId !== id)\n      })),', 'workflows: s.workflows.filter((w) => w.wagonId !== id)\n      }));\n      wagonApi.deleteWagon(id).catch(console.error);\n      },')

# 8. Patch addRake
content = content.replace('set((s) => ({ rakes: [...s.rakes, rake] }));', 'set((s) => ({ rakes: [...s.rakes, rake] }));\n        rakeApi.createRake(rake).catch(console.error);')

# 9. Patch updateRake
content = content.replace('set((s) => ({ rakes: s.rakes.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),', '{\n        set((s) => ({ rakes: s.rakes.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));\n        rakeApi.updateRake(id, patch).catch(console.error);\n      },')

# 10. Patch addMemo
content = content.replace('set((s) => ({ memos: [...s.memos, memo] }));', 'set((s) => ({ memos: [...s.memos, memo] }));\n        memoApi.createMemo(memo).catch(console.error);')

# 11. Patch updateMemo
content = content.replace('set((s) => ({ memos: s.memos.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));', 'set((s) => ({ memos: s.memos.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));\n        memoApi.updateMemo(id, patch).catch(console.error);')

# 12. Patch upsertWorkflowForWagon
content = content.replace('set((s) => ({ workflows: [...s.workflows, item] }));', 'set((s) => ({ workflows: [...s.workflows, item] }));\n        workflowApi.createWorkflow(item).catch(console.error);')

with open('src/store/useAppStore.ts', 'w') as f:
    f.write(content)
