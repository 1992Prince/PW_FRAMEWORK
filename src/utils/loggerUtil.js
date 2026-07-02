// src/utils/loggerUtil.js

/**
 * Standard framework logger for capturing important events.
 * Every line is prefixed with a timestamp and RUN_ID for easy debugging and RCA.
 *
 * 4 log levels:
 *   info()  — key milestones: test start/end, login, navigation
 *   debug() — variable values, URLs, config details
 *   warn()  — unexpected but non-fatal: element not found, retry happening
 *   error() — use in catch blocks just before re-throwing
 *
 * Singleton pattern: the class is NOT exported — only the ready-to-use instance is.
 * This ensures one shared logger across the entire framework.
 *
 * Usage (no need to create an object, just import and call):
 *   import { consoleLogger } from '../utils/loggerUtil.js';
 *
 *   consoleLogger.info('Login successful');
 *   consoleLogger.debug('URL', page.url());
 *   consoleLogger.warn('Element not visible, retrying...');
 *   consoleLogger.error('Login failed', error.message);
 */

class ConsoleLogger {

  #prefix(level, message) {
    const timestamp = new Date().toISOString();
    const runId     = process.env.RUN_ID ?? 'NA';
    return `[${timestamp}] [RUN_ID=${runId}] ${level}: ${message}`;
  }

  info(message, ...args)  { console.log(this.#prefix('INFO',  message), ...args); }
  debug(message, ...args) { console.log(this.#prefix('DEBUG', message), ...args); }
  warn(message, ...args)  { console.log(this.#prefix('WARN',  message), ...args); }
  error(message, ...args) { console.log(this.#prefix('ERROR', message), ...args); }
}

export const consoleLogger = new ConsoleLogger();