import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function PasswordChangeRequired() {
  const { changePassword, logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return <form className="max-w-md mx-auto p-8 space-y-4" onSubmit={async e => {
    e.preventDefault(); setBusy(true); setError('');
    try { await changePassword(current, password); }
    catch (err: any) { setError(err.response?.data?.message || 'Unable to change password'); }
    finally { setBusy(false); }
  }}>
    <h1 className="text-xl font-semibold">Change your temporary password</h1>
    <label className="block">Current password<Input type="password" autoComplete="current-password" required value={current} onChange={e => setCurrent(e.target.value)} /></label>
    <label className="block">New password (at least 12 characters)<Input type="password" autoComplete="new-password" required minLength={12} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} /></label>
    {error && <p role="alert">{error}</p>}
    <Button disabled={busy}>Change password</Button>
    <Button type="button" variant="outline" onClick={logout}>Sign out</Button>
  </form>;
}
