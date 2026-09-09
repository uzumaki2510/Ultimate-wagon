import { it, expect, vi } from 'vitest';
import client from './client';
import { authApi } from './auth';
import { clearSession, setAccessToken } from './session';
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
it('rejects successful responses from an ended session', async () => {
  vi.stubGlobal('localStorage', { removeItem: vi.fn() });
  vi.stubGlobal('window', { dispatchEvent: vi.fn() });
  let release: () => void;
  let started: () => void;
  const ready = new Promise<void>(resolve => { started = resolve; });
  const pending = client.get('/wagons', { adapter: config => new Promise(resolve => {
    release = () => resolve({ data: { secret: 'old session' }, status: 200, statusText: 'OK', headers: {}, config });
    started();
  }) });
  await ready;
  clearSession();
  release!();
  await expect(pending).rejects.toThrow('Session ended');
  vi.unstubAllGlobals();
});

it('logout sends the token even when local state is cleared immediately', async () => {
  vi.stubGlobal('localStorage', { removeItem: vi.fn() });
  vi.stubGlobal('window', { dispatchEvent: vi.fn() });
  const previousAdapter = client.defaults.adapter;
  let authorization: unknown;
  client.defaults.adapter = async config => {
    authorization = config.headers.get('Authorization');
    return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
  };
  try {
    setAccessToken('test-token');
    const logout = authApi.logout();
    clearSession();
    await logout;
    expect(authorization).toBe('Bearer test-token');
  } finally { client.defaults.adapter = previousAdapter; vi.unstubAllGlobals(); }
});
