const fs = require('fs');
// Mocking the definitions to see path lengths
const defs = {
  BTPN: {
    initialStage: "YARD_INSPECTION",
    stages: {
      "YARD_INSPECTION": { nextStages: ["STEAMING"] },
      "STEAMING": { nextStages: ["STEAM_CLEANING"] },
      "STEAM_CLEANING": { nextStages: ["STEAM_POINT_PLACEMENT"] },
      "STEAM_POINT_PLACEMENT": { nextStages: ["RECTIFICATION_DECISION"] },
      "RECTIFICATION_DECISION": { nextStages: ["MAINTENANCE_REPAIR", "SIDING_PLACEMENT"] },
      "MAINTENANCE_REPAIR": { nextStages: ["HYDRO_TESTING"] },
      "SIDING_PLACEMENT": { nextStages: ["HYDRO_TESTING"] },
      "HYDRO_TESTING": { nextStages: ["FIT_FOR_USE"] },
      "FIT_FOR_USE": { nextStages: [] }
    }
  },
  BTPGLN: {
    initialStage: "RRT_SIDING",
    stages: {
      "RRT_SIDING": { nextStages: ["DE_GASSING"] },
      "DE_GASSING": { nextStages: ["DG_COMPLETION"] },
      "DG_COMPLETION": { nextStages: ["HAPA_DEPOT"] },
      "HAPA_DEPOT": { nextStages: ["UNDER_GEAR_RECTIFICATION", "UPPER_GEAR_RECTIFICATION", "ROH_POH_RECTIFICATION"] },
      "UNDER_GEAR_RECTIFICATION": { nextStages: ["MARKED_FIT_HAPA"] },
      "UPPER_GEAR_RECTIFICATION": { nextStages: ["MARKED_FIT_HAPA"] },
      "ROH_POH_RECTIFICATION": { nextStages: ["MARKED_FIT_HAPA"] },
      "MARKED_FIT_HAPA": { nextStages: ["RRT_MOVE"] },
      "RRT_MOVE": { nextStages: ["PURGING"] },
      "PURGING": { nextStages: ["HAPA_DEPOT", "HAPA_YARD_EXAM"] },
      "HAPA_YARD_EXAM": { nextStages: ["YARD_EXAM_COMPLETED"] },
      "YARD_EXAM_COMPLETED": { nextStages: ["FIT_FOR_LOADING"] },
      "FIT_FOR_LOADING": { nextStages: [] }
    }
  }
};

function getMaxPath(def) {
  let max = 0;
  function dfs(curr, visited, count) {
    max = Math.max(max, count);
    if (!def.stages[curr]) return;
    for (let next of def.stages[curr].nextStages) {
      if (!visited.has(next)) {
        visited.add(next);
        dfs(next, visited, count + 1);
        visited.delete(next);
      }
    }
  }
  dfs(def.initialStage, new Set([def.initialStage]), 1);
  return max;
}

console.log("BTPN:", getMaxPath(defs.BTPN));
console.log("BTPGLN:", getMaxPath(defs.BTPGLN));
