import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  timeout: 60000,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl'] }
  },
  projects: [{name:'chromium-desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900}}}],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    cwd: fileURLToPath(new URL('../../apps/web/', import.meta.url)),
    url: 'http://127.0.0.1:5173',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
});
