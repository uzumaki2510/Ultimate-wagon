import { getWorkflowDefinitionForWagon } from "./src/lib/wagonWorkflows";

const bcna = getWorkflowDefinitionForWagon("BCNA");
const bvcm = getWorkflowDefinitionForWagon("BVCM");
const boxn = getWorkflowDefinitionForWagon("BOXN");
const btpn = getWorkflowDefinitionForWagon("BTPN");
const invalid = getWorkflowDefinitionForWagon("XYZ123");

console.log("BCNA:", bcna?.name);
console.log("BVCM:", bvcm?.name);
console.log("BOXN:", boxn?.name);
console.log("BTPN:", btpn?.name);
console.log("Invalid:", invalid ? invalid.name : "null");
