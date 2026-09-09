import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Wagon } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { workspaceApi, StaffOption } from '@/api/workspace';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { workflowLocked } from '@/lib/condition';

export function WorkAssignment({ wagon }: { wagon: Wagon }) {
  const { user, isAdmin } = useAuth();
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [editing, setEditing] = useState(false);
  const [assignee, setAssignee] = useState(''); const [due, setDue] = useState('');
  const [blocker, setBlocker] = useState(''); const [note, setNote] = useState('');
  const [version, setVersion] = useState(wagon.updatedAt);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { let active = true; workspaceApi.staff().then(result => { if (active) setStaff(Array.isArray(result) ? result : []); }).catch(() => { if (active) setError('Staff list unavailable. Reopen this section to retry.'); }); return () => { active = false; }; }, []);
  const own = wagon.assignment?.assigneeId === user?.id;
  const canEdit = !workflowLocked(wagon.status) && (isAdmin || own || !wagon.assignment?.assigneeId);
  const begin = () => {
    setVersion(wagon.updatedAt); setAssignee(wagon.assignment?.assigneeId || '');
    const date = wagon.assignment?.dueAt ? new Date(wagon.assignment.dueAt) : null;
    setDue(date ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
    setBlocker(wagon.assignment?.blockedReason || ''); setNote(''); setError(''); setEditing(true);
  };
  const save = async () => {
    setBusy(true); setError('');
    try {
      await workspaceApi.assign(wagon.id, { expectedUpdatedAt: version, ...(isAdmin ? { assigneeId: assignee || null, dueAt: due ? new Date(due).toISOString() : null } : !own ? { assigneeId: user?.id } : {}), blockedReason: blocker, handoffNote: note });
      await useAppStore.getState().loadWagon(wagon.id); setEditing(false);
    } catch (cause) { setError(isAxiosError(cause) ? cause.response?.data?.message || cause.message : 'Unable to save assignment'); }
    finally { setBusy(false); }
  };
  return <section className="rounded-xl border bg-card p-4 space-y-3" aria-label="Assignment and handoff"><div className="flex justify-between gap-3"><div><h3 className="font-semibold">Assignment & handoff</h3><p className="text-sm text-muted-foreground mt-1">{wagon.assignment?.assigneeName || 'Unassigned'}{wagon.assignment?.dueAt && ` · Due ${new Date(wagon.assignment.dueAt).toLocaleString()}`}</p></div>{canEdit && !editing && <Button variant="outline" onClick={begin}>{!isAdmin && !own ? 'Claim work' : 'Update assignment'}</Button>}</div>
    {wagon.assignment?.blockedReason && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">Blocked: {wagon.assignment.blockedReason}</p>}
    {wagon.assignment?.handoffNote && <p className="text-sm">Latest handoff: {wagon.assignment.handoffNote}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {editing && <div className="space-y-3">{isAdmin && <div className="grid sm:grid-cols-2 gap-3"><label className="space-y-2 text-sm"><span>Responsible person</span><select aria-label="Responsible person" value={assignee} onChange={e => setAssignee(e.target.value)} className="w-full rounded-md border bg-background p-3"><option value="">Unassigned</option>{staff.map(person => <option key={person._id} value={person._id}>{person.name}</option>)}</select></label><div className="space-y-2"><Label htmlFor={`due-${wagon.id}`}>Due date & time</Label><Input id={`due-${wagon.id}`} type="datetime-local" value={due} onChange={e => setDue(e.target.value)} /></div></div>}<div className="space-y-2"><Label htmlFor={`blocker-${wagon.id}`}>Blocker (clear when resolved)</Label><Textarea id={`blocker-${wagon.id}`} value={blocker} onChange={e => setBlocker(e.target.value)} /></div><div className="space-y-2"><Label htmlFor={`handoff-${wagon.id}`}>Handoff note</Label><Textarea id={`handoff-${wagon.id}`} value={note} onChange={e => setNote(e.target.value)} placeholder="What has been done and what the next person needs to know" /></div><div className="flex gap-2"><Button disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save assignment'}</Button><Button variant="outline" disabled={busy} onClick={() => setEditing(false)}>Cancel</Button></div></div>}
    {!!wagon.assignmentHistory?.length && <details><summary className="cursor-pointer text-sm py-2">Handoff history</summary><ol className="space-y-2 text-sm">{[...wagon.assignmentHistory].reverse().map((event, index) => <li key={index} className="border-l-2 pl-3">{event.actorName} · {new Date(event.at).toLocaleString()}<p className="text-muted-foreground">{event.after.assigneeName || 'Unassigned'} · {event.after.handoffNote || event.after.blockedReason || 'Assignment updated'}</p></li>)}</ol></details>}
  </section>;
}
