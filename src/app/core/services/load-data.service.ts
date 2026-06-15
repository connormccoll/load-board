import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { Load } from '../models/load.model';
import { LoggerService } from './logger.service';

interface MockLoadsFile {
  loads: Load[];
}

/**
 * Loads the canonical mock data and, for demonstrating large-dataset
 * performance, can synthesise a much larger set from it. The provided file has
 * only 50 rows; virtual scrolling is only meaningful against thousands, so we
 * multiply the seed data with re-keyed ids. This stays out of the components —
 * they neither know nor care whether they're showing 50 or 50,000 rows.
 */
@Injectable({ providedIn: 'root' })
export class LoadDataService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);

  /** Asset path configured in angular.json (src/data -> /data). */
  private readonly dataUrl = 'data/mockLoads.json';

  /**
   * @param multiplier how many copies of the seed data to generate. 1 = the
   *        original 50 rows; the UI defaults higher to exercise virtualization.
   */
  loadLoads(multiplier = 1): Observable<Load[]> {
    return this.http.get<MockLoadsFile>(this.dataUrl).pipe(
      map((file) => this.expand(file.loads ?? [], multiplier)),
      catchError((err) => {
        this.logger.error('Failed to load mock loads', err);
        return of<Load[]>([]); // fail soft: empty result routes to the error state.
      }),
    );
  }

  /** Tile the seed rows `multiplier` times, giving each copy a unique id and a
   *  slightly perturbed price/date so the set looks realistic when sorted. */
  private expand(seed: readonly Load[], multiplier: number): Load[] {
    if (multiplier <= 1) {
      return seed.slice();
    }
    const out: Load[] = [];
    for (let copy = 0; copy < multiplier; copy++) {
      for (const load of seed) {
        out.push(
          copy === 0
            ? { ...load }
            : {
                ...load,
                id: `${load.id}-${copy}`,
                price: load.price + ((copy * 37) % 500),
              },
        );
      }
    }
    this.logger.event('data.expanded', { seed: seed.length, total: out.length });
    return out;
  }
}
