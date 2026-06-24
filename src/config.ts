const globalEnv = (globalThis as any).process?.env;
export const API_BASE_URL =
  globalEnv?.API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '/api/v1';
