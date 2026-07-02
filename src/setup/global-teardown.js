// src/setup/global-teardown.js

/**
 * Playwright Global Teardown — runs ONCE after the entire test suite finishes.
 *
 * Purpose:
 *   Logs the end of the run with the same RUN_ID that was set in globalSetup.
 *   This gives a clear start/end boundary in logs, making it easy to measure
 *   run duration and confirm the run completed (vs crashed mid-way).
 *
 * How it is wired up:
 *   In playwright.config.js set: globalTeardown: './src/setup/global-teardown.js'
 */

import { consoleLogger } from '../utils/loggerUtil.js';

async function globalTeardown() {
  consoleLogger.info(`GlobalTeardown: Test run finished. RUN_ID=${process.env.RUN_ID ?? 'NA'}`);
}

export default globalTeardown;
