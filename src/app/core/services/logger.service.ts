import { Injectable, isDevMode } from '@angular/core';

/**
 * Thin observability seam. In production this would forward to a real sink
 * (e.g. OpenTelemetry, Sentry, Datadog RUM). Centralising it here means the
 * rest of the app depends on an interface, not a vendor, and we get a single
 * place to add sampling, redaction, or correlation IDs later.
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  /** Structured event — the kind of thing you'd want as a metric/log. */
  event(name: string, data: Record<string, unknown> = {}): void {
    if (isDevMode()) {
      // eslint-disable-next-line no-console
      console.debug(`[event] ${name}`, data);
    }
    // prod: forward to telemetry pipeline.
  }

  error(message: string, error: unknown): void {
    // eslint-disable-next-line no-console
    console.error(`[error] ${message}`, error);
    // prod: forward to error tracker.
  }
}
