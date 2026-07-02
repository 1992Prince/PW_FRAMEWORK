// src/config/config.js

/**
 * Central config for the framework.
 *
 * Default values are defined here. Any value can be overridden from CI
 * (GitHub Actions / Jenkins) by setting the corresponding environment variable.
 *
 * Singleton: a single frozen object is exported — no class, no `new`.
 * Import and use directly in any file:
 *
 *   import { config } from '../config/config.js';
 *
 *   config.env            // e.g. 'staging'
 *   config.appUrl         // e.g. 'https://staging.myapp.com'
 *   config.adminUser      // e.g. 'admin@myapp.com'
 *   config.adminPassword  // e.g. 'Admin@123'
 *   config.buildNo        // e.g. '42' (from CI) or 'local'
 */

export const config = Object.freeze({
  // Target environment — override with ENV in CI
  env:           process.env.ENV           ?? 'staging',

  // Application URL — override with APP_URL in CI
  appUrl:        process.env.APP_URL        ?? 'https://eventhub.rahulshettyacademy.com/login',
  appSTGUrl:     process.env.APP_URL        ?? 'https://eventhub.rahulshettyacademy.com/login',
  appE2E2Url:    process.env.APP_URL        ?? 'https://eventhub.rahulshettyacademy.com/login',

  // API / service base URL — override with API_URL in CI
  apiUrl:        process.env.API_URL        ?? 'https://api.staging.myapp.com',

  // Service credentials — override with SERVICE_USER / SERVICE_PASSWORD in CI
  serviceUser:   process.env.SERVICE_USER   ?? 'eventhubtestuser1@gmail.com',
  servicePassword: process.env.SERVICE_PASSWORD ?? 'Eventhub@2026',

  // Build number injected by CI pipeline — override with BUILD_NO in CI
  buildNo:       process.env.BUILD_NO       ?? 'local',
});
