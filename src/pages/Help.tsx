import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
const sections = [
  ['Wagons', '/register', 'Find a wagon, review its history or add an arrival. Use Directory for fleet details and Archives to recover archived wagons.'],
  ['Workshop', '/workshop', 'Choose a line to see its queue. Open a wagon to update repairs, workflow stages and inspection checklists.'],
  ['Memos', '/memos', 'Create a sick or fit memo using the four-step form. Fit memos require wagons with saved fitness approval.'],
  ['Reports', '/reports', 'Review workshop activity. Administrators can filter and export a report.'],
  ['Profile', '/profile', 'Update your details and choose a light, dark or system theme.'],
];
export default function Help() {
  return <div className="max-w-3xl space-y-6"><PageHeader title="Using YardPilot" description="A clear next step for every wagon." />{sections.map(([name, path, text]) => <section key={name} className="rounded-xl border bg-card p-5"><h2 className="font-semibold"><Link className="text-primary underline-offset-4 hover:underline" to={path}>{name} →</Link></h2><p className="mt-2 text-sm text-muted-foreground leading-relaxed">{text}</p></section>)}<p className="text-sm text-muted-foreground">Access depends on your role. If a save fails, your changes are not confirmed—retry or contact your administrator. Fitness approval requires completed work and administrator verification.</p></div>;
}
