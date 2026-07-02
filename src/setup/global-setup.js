// src/setup/global-setup.js

/**
 * Playwright Global Setup — runs ONCE before the entire test suite starts.
 *
 * Purpose:
 *   Generates a unique RUN_ID and stores it in process.env so every log line
 *   across all tests and workers is stamped with the same run identifier.
 *   This makes it easy to filter and correlate logs for a specific run in CI.
 *
 * How it is wired up:
 *   In playwright.config.js set:  globalSetup: './src/setup/global-setup.js'
 *   The logger reads process.env.RUN_ID automatically — no changes needed in tests.
 *
 * Example log output:
 *   [2026-07-02T10:00:00.000Z] [RUN_ID=RUN-4f3a...] INFO: GlobalSetup complete
 */

import { randomUUID }    from 'crypto';
import { consoleLogger } from '../utils/loggerUtil.js';

async function globalSetup() {
  // Assign a unique ID for this run — visible in every log line via the logger
  process.env.RUN_ID = `RUN-${randomUUID()}`;
  consoleLogger.info(`GlobalSetup: RUN_ID=${process.env.RUN_ID}`);
}

export default globalSetup;
