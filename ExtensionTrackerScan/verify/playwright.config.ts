import { defineConfig } from '@playwright/test';

const port = 4321;

export default defineConfig({
  testDir: '.',
  testMatch: '*.pin.ts',
  outputDir: './.results',
  snapshotPathTemplate: '{testDir}/baseline/{arg}{ext}',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  updateSnapshots: 'none',
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 750, height: 600 },
    deviceScaleFactor: 1,
    locale: 'en-US',
    timezoneId: 'Europe/Paris',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    launchOptions: {
      executablePath: process.env['PW_CHROMIUM_PATH'] || undefined,
    },
  },
  webServer: {
    command: `npx ng build --configuration development --output-path verify/.app && node verify/serve.mjs verify/.app/browser ${port}`,
    cwd: '..',
    url: `http://127.0.0.1:${port}`,
    timeout: 180000,
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
