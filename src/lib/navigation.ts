import { House, TrainFront, Wrench, FileText, ChartNoAxesCombined, Settings2, MoreHorizontal } from 'lucide-react';

export const primaryNavigation = [
  { label: 'Home', to: '/', icon: House, section: 'home' },
  { label: 'Wagons', to: '/register', icon: TrainFront, section: 'wagons' },
  { label: 'Workshop', to: '/workshop', icon: Wrench, section: 'workshop' },
  { label: 'Memos', to: '/memos', icon: FileText, section: 'memos' },
  { label: 'Reports', to: '/reports', icon: ChartNoAxesCombined, section: 'reports' },
  { label: 'Administration', to: '/administration', icon: Settings2, section: 'administration', admin: true },
];
export const mobileNavigation = [...primaryNavigation.slice(0, 4), { label: 'More', to: '/more', icon: MoreHorizontal, section: 'more' }];
export function sectionFor(path: string) {
  if (path === '/') return 'home';
  if (/^\/(register|wagon|quick-board)/.test(path)) return 'wagons';
  if (/^\/(workshop|live-sick-line|sickline)/.test(path)) return 'workshop';
  if (path.startsWith('/memos')) return 'memos';
  if (path.startsWith('/reports')) return 'reports';
  if (/^\/(administration|employees|super-admin|workflow-integrity)/.test(path)) return 'administration';
  return 'more';
}
export const workshopLines = [
  { id: 'steam', label: 'Steam' }, { id: 'degassing', label: 'Degassing' },
  { id: 'inspection', label: 'Inspection' }, { id: 'repair', label: 'Repair' },
  { id: 'testing', label: 'Testing' }, { id: 'fit', label: 'Fitness' },
];
export function readableStage(value = '') {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
export function lineForStage(value = '') {
  const stage = value.toLowerCase().replace(/[_\s-]/g, '');
  if (/steam/.test(stage)) return 'steam';
  if (/degas|purg|gasfree/.test(stage)) return 'degassing';
  if (/fit|releas/.test(stage)) return 'fit';
  if (/test/.test(stage)) return 'testing';
  if (/exam|inspect/.test(stage)) return 'inspection';
  if (/repair|rectif/.test(stage)) return 'repair';
  return 'inspection';
}
