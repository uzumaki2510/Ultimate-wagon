import { useAppStore } from '@/store/useAppStore';
import { RepairTaskList } from '@/components/RepairTaskList';
import { MaintenanceChecklist } from '@/components/maintenance/MaintenanceChecklist';
import { FitnessConfirmation } from '@/components/maintenance/FitnessConfirmation';

export function WagonDefectsRepairs({ wagonId }: { wagonId: string }) {
  const wagon = useAppStore(state => state.wagons.find(item => item.id === wagonId));
  if (!wagon) return <p>Wagon not found.</p>;
  return <div className="space-y-6 pt-4"><RepairTaskList wagon={wagon} /><details className="rounded-xl border p-4"><summary className="cursor-pointer font-semibold">Maintenance checklist</summary><div className="pt-4"><MaintenanceChecklist wagon={wagon} /></div></details><FitnessConfirmation wagon={wagon} /></div>;
}
