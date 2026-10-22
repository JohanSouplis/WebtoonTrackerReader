---
name: control-ui
description: Drive and inspect a local web, IDE, or Electron UI with browser or CDP tooling. Use for UI verification, screenshots, accessibility snapshots, performance profiles, visual diffs, or reproducing UI bugs.
disable-model-invocation: true
---

# Control UI

Verify the running UI with evidence. Reuse the project's `verify-<app>` skill or checked-in Playwright, Cypress, browser, or Electron harness first. Otherwise use browser tools already available in the session. This skill supplies the workflow; it does not install a browser driver.

## Setup

1. Discover the app's documented dev command, local URL, required environment, and existing tests. Start an isolated instance and wait for a concrete readiness condition.
2. On Claude Code, use available browser MCP tools or the repo's browser harness through `Bash`. On Codex, use the session's browser tools or an installed browser harness through the shell. Read the selected tool's instructions before driving it; availability differs by environment.
3. For a web app, connect to its local URL. For Electron/Chromium, use the existing Electron harness or a loopback remote debugging port when supported.
4. Select the correct page by URL and a stable app marker, not tab order alone. If none matches, list available page titles and URLs rather than guessing.
5. Prefer accessibility roles, labels, and stable `data-*` selectors over coordinates. If no suitable tool exists, report the missing capability and what remains unverified. Do not silently add a project dependency.

## Interaction loop

1. Capture a snapshot or screenshot before acting.
2. Choose a target from the latest page structure.
3. Perform one structural action: click, type, keypress, drag, scroll, navigate, or resize.
4. Wait for the expected state with a bounded assertion, then capture fresh evidence. Do not reuse stale element references after navigation or structural changes.
5. Verify the visible result and the relevant side effect, such as a saved file, persisted record, or response. A screenshot alone does not prove a workflow succeeded.
6. Save before/after artifacts for bug fixes or comparisons. Keep evidence outside disposable app state.
7. Clean up dev servers, test profiles, and browser instances this run created, including failed attempts. Confirm the evidence still exists. Leave pre-existing user sessions running.

Use coordinates only when semantic targeting is unavailable and a fresh screenshot identifies the target. For visual parity, compare against the reference at the same viewport, scale, theme, and font state.

## Playwright recipe

If the repo already has Playwright, adapt the URL, action, and assertion to the actual user flow. Run the probe where the existing package resolves. This example creates its own browser and evidence directory:

```javascript
import { chromium } from "playwright";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const evidence = await mkdtemp(join(tmpdir(), "ui-harness-"));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto("http://127.0.0.1:<port>");
  await page.screenshot({ path: join(evidence, "before.png"), fullPage: true });
  await page.getByRole("button", { name: /submit/i }).click();
  await page.getByRole("status").filter({ hasText: /saved/i }).waitFor();
  await page.screenshot({ path: join(evidence, "after.png"), fullPage: true });
  console.log(evidence);
} finally {
  await browser.close();
}
```

Do not add Playwright solely for this probe when existing external browser tools can drive the app. Adapt selectors, ports, and paths from the current repo.

## Electron and CDP

Use the project's Electron automation when available. For a Chromium debug port, Playwright's `chromium.connectOverCDP("http://127.0.0.1:<debug-port>")` can expose pages through `browser.contexts().flatMap(context => context.pages())`. Select the page with a positive app-root marker; use a negative marker to exclude another surface if needed. Inventory titles and URLs when no page matches.

Track ownership when attaching. Disconnect the automation connection using the driver's supported mechanism; close the app or browser only if this run launched it. Follow the environment's browser-control restrictions when deciding whether direct CDP is available.

Use raw CDP only when higher-level APIs are insufficient:

- Performance: CPU profiles, traces, paint flashing, FPS, and layout shift inspection.
- Memory: heap snapshots and forced GC for leak investigations.
- Network: request blocking, throttling, cache controls, and request/response logs.
- Rendering: viewport, color scheme, reduced motion, and accessibility checks.
- Debugging: console streaming, exceptions, and DOM snapshots.

Keep test data disposable and credentials out of artifacts. Report the route, actions, observed result, evidence paths, and any unverified behavior.
