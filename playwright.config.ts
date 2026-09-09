import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/regression',
  fullyParallel: true,
  retries: 0,
  workers: 4,
  use: { baseURL: 'http://127.0.0.1:5201', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  webServer: { command: process.env.YARDPILOT_TEST_BUILD === '1' ? 'npm run preview -- --host 127.0.0.1 --port 5201 --strictPort' : 'VITE_API_URL=/api/v1 npm run dev -- --host 127.0.0.1 --port 5201 --strictPort', url: 'http://127.0.0.1:5201', reuseExistingServer: false },
});
