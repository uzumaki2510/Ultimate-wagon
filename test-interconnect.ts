import { useAppStore } from './src/store/useAppStore';

const store = useAppStore.getState();

// Clear the store
store.wagons = [];
store.memos = [];
store.workflows = [];

// 1. Add a wagon
const wagon = store.addWagon({
  wagonNo: "TEST-WAGON-001",
  type: "BOXN",
  owner: "TEST",
  builtYear: 2020,
  status: "In Service"
});

console.log("Initial Wagon Status:", useAppStore.getState().wagons[0].status);

// 2. Create a Sick Memo
store.addMemo({
  memoNo: "MEMO-SICK-001",
  type: "sick",
  entries: [{ wagonId: wagon.id, defect: "Testing Sick", repairTypes: [], isSteamed: false, isDegassed: false, comments: "" }],
  approvals: []
});

console.log("Wagon Status after Sick Memo:", useAppStore.getState().wagons[0].status);
console.log("Workflow Created for Sick Memo:", useAppStore.getState().workflows.length > 0);

// 3. Create a Fit Memo
store.addMemo({
  memoNo: "MEMO-FIT-001",
  type: "fit",
  entries: [{ wagonId: wagon.id, defect: "Testing Fit", repairTypes: [], isSteamed: false, isDegassed: false, comments: "" }],
  approvals: []
});

console.log("Wagon Status after Fit Memo:", useAppStore.getState().wagons[0].status);
