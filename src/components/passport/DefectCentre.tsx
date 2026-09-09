import { Wagon } from '@/types';
import { RepairTaskList } from '@/components/RepairTaskList';
export function DefectCentre({ wagon }: { wagon: Wagon }) {
  return <RepairTaskList wagon={wagon} />;
}
