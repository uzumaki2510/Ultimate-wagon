import { nanoid } from "nanoid";
import { Employee, Rake, UnitMemo, Wagon, WorkflowItem, WorkflowStageRecord } from "@/types";
import { getWorkflowTemplate } from "./workflowConfig";

export function buildDemoData() {
  const w1: Wagon = {
    id: nanoid(), wagonNo: "3017831557", type: "BTPNHS", owner: "NWR", builtYear: 2004,
    pohStation: "KWWW", pohDate: "2022-05-12", rohStation: "NJPRH", rohDate: "2026-03-22",
    returnDate: "2028-06-20", status: "Sick Line",
  };
  const w2: Wagon = {
    id: nanoid(), wagonNo: "30018660013", type: "BCNMI", owner: "CR", builtYear: 1988,
    pohStation: "KGPW", pohDate: "2025-01-20", rohStation: "ETFD", rohDate: "2023-08-31",
    returnDate: "2027-12-31", status: "Sick Line",
  };
  const rake: Rake = {
    id: nanoid(), rakeId: "TJ 030625155521", rakeName: "SPL PREM 06/13",
    yard: "CYM HAPA", createdAt: new Date().toISOString(),
    wagonIds: [w1.id, w2.id],
  };
  w1.rakeId = rake.id; w2.rakeId = rake.id;

  const memo: UnitMemo = {
    id: nanoid(),
    memoNo: "2000076435",
    date: "2026-06-13",
    time: "11:00",
    rakeId: rake.rakeId,
    rakeName: rake.rakeName,
    yard: rake.yard,
    lineNo: "11",
    createdBy: "SSE/C&W HAPA",
    remarks: "Wagons cut off due to wheel defect. Sent to sick line for inspection.",
    entries: [
      { id: nanoid(), sno: 1, position: "26", wagonId: w1.id, reason: "Wheel Alert", bookedTo: "HAPA SL", defects: "Wheel Defective", status: "Cut Off" },
      { id: nanoid(), sno: 2, position: "35", wagonId: w2.id, reason: "Wheel Alert", bookedTo: "HAPA SL", defects: "Wheel Defective", status: "Cut Off" },
    ],
    approvals: [
      { role: "SSE / JE", name: "R. Kumar", designation: "SSE/C&W", signature: "RK", status: "Approved", approvedAt: new Date().toISOString() },
      { role: "TXR Staff", name: "", designation: "TXR", signature: "", status: "Pending" },
      { role: "Yard Master", name: "", designation: "YM HAPA", signature: "", status: "Pending" },
      { role: "Operating Department", name: "", designation: "Operating", signature: "", status: "Pending" },
    ],
    createdAt: new Date().toISOString(),
  };

  const wf1Template = getWorkflowTemplate(w1.type as string);
  const wf1Stages: WorkflowStageRecord[] = wf1Template.stages.map((st, i) => ({
    stageName: st.name,
    targetDurationHours: st.targetDurationHours,
    status: i === 0 ? "Pending" : "Pending"
  }));
  const wf1: WorkflowItem = {
    id: nanoid(), wagonId: w1.id, memoId: memo.id, wagonNo: w1.wagonNo, wagonType: w1.type as string,
    currentStage: wf1Stages[0].stageName, stages: wf1Stages,
    updatedAt: new Date().toISOString(),
  };

  const wf2Template = getWorkflowTemplate(w2.type as string);
  const wf2Stages: WorkflowStageRecord[] = wf2Template.stages.map((st, i) => ({
    stageName: st.name,
    targetDurationHours: st.targetDurationHours,
    status: i === 0 ? "Pending" : "Pending"
  }));
  const wf2: WorkflowItem = {
    id: nanoid(), wagonId: w2.id, memoId: memo.id, wagonNo: w2.wagonNo, wagonType: w2.type as string,
    currentStage: wf2Stages[0].stageName, stages: wf2Stages,
    updatedAt: new Date().toISOString(),
  };

  const employees: Employee[] = [
    { id: nanoid(), name: "R. Kumar", designation: "SSE/C&W", role: "SSE / JE", empCode: "E001" },
    { id: nanoid(), name: "S. Patel", designation: "TXR", role: "TXR Staff", empCode: "E002" },
    { id: nanoid(), name: "A. Singh", designation: "YM HAPA", role: "Yard Master", empCode: "E003" },
    { id: nanoid(), name: "M. Verma", designation: "Operating Officer", role: "Operating Department", empCode: "E004" },
  ];

  return { wagons: [w1, w2], rakes: [rake], memos: [memo], workflows: [wf1, wf2], employees };
}
