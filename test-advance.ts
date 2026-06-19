import { create } from 'zustand';

const mockStore = {
  workflows: [
    {
      id: "wf1",
      wagonId: "wagon1",
      wagonNo: "TEST",
      wagonType: "BTPN",
      currentStage: "Rectification",
      stages: [
        { stageName: "Issue Marked", status: "Done" },
        { stageName: "Steaming", status: "Done" },
        { stageName: "Steam Point 24h", status: "Done" },
        { stageName: "Rectification", status: "Done" },
        { stageName: "Placement Decision", status: "Pending" },
      ],
      actionHistory: []
    }
  ],
  wagons: [
    {
      id: "wagon1",
      wagonNo: "TEST",
      type: "BTPN",
      status: "Under Repair"
    }
  ]
};

try {
  let s = mockStore;
  const id = "wf1";
  const toStage = "Placement Decision";
  
  // First set
  const snapshot = { action: "TEST" };
  s = {
    ...s,
    workflows: s.workflows.map(w => w.id === id ? { ...w, actionHistory: [...(w.actionHistory || []), snapshot] } : w),
  } as any;

  // Second set
  const wf = s.workflows.find(w => w.id === id);
  const updatedWorkflows = s.workflows.map((w) => {
    if (w.id !== id) return w;
    const updatedStages = w.stages.map(st => 
      st.stageName === toStage ? { ...st, status: "In Progress", startedAt: new Date().toISOString() } : st
    );
    return { ...w, currentStage: toStage, stages: updatedStages, updatedAt: new Date().toISOString() };
  });

  const updatedWagons = s.wagons.map(wagon => {
    if (wagon.id === wf.wagonId) {
      let newStatus = wagon.status;
      if (toStage === "Initial Inspection") newStatus = "Under Inspection";
      else if (toStage === "Repair / Rectification" || wagon.status === "Cut Off") newStatus = "Under Repair";
      
      return { ...wagon, status: newStatus };
    }
    return wagon;
  });

  s = { ...s, workflows: updatedWorkflows as any, wagons: updatedWagons as any };
  console.log("Success", s.workflows[0].currentStage);
} catch (e) {
  console.error("Error:", e);
}
