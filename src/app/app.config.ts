import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';

/**
 * Minimal application providers. No router is needed for a single-view board.
 *
 * Zoneless change detection: the app is fully signal- and OnPush-driven, so it
 * needs no zone.js. Dropping it removes the monkey-patching overhead and the
 * polyfill from the bundle, and CD now runs only when a signal actually
 * changes — the v20+ default for new apps.
 *
 * provideBrowserGlobalErrorListeners() routes uncaught window errors and
 * unhandled promise rejections through Angular's ErrorHandler — a single seam
 * for observability (pairs with LoggerService) instead of errors escaping
 * silently.
 *
 * HttpClient uses the fetch backend to load the mock data.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
  ],
};
