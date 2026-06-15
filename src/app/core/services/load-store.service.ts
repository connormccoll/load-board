import { Injectable, computed, inject, signal } from '@angular/core';
import {
  EMPTY_FILTERS,
  FilterCriteria,
  Load,
  SortState,
  SortableField,
} from '../models/load.model';
import { filterLoads } from '../utils/filter.util';
import { searchLoads } from '../utils/search.util';
import { nextSortState, sortLoads } from '../utils/sort.util';
import { LoadDataService } from './load-data.service';
import { LoggerService } from './logger.service';

type Status = 'loading' | 'ready' | 'error';

/**
 * Single source of truth for the board. Signal-based rather than NgRx: the
 * state here is small and local, so a store service with writable signals and
 * one derived pipeline is simpler, fully typed, and trivially testable —
 * without the action/reducer/effect boilerplate.
 *
 * The derived `visibleLoads` recomputes only when an input signal it reads
 * actually changes, and the order (filter -> search -> sort) shrinks the
 * working set before each more expensive stage.
 */
@Injectable({ providedIn: 'root' })
export class LoadStore {
  private readonly data = inject(LoadDataService);
  private readonly logger = inject(LoggerService);

  // ---- Writable state ------------------------------------------------------
  private readonly _raw = signal<Load[]>([]);
  private readonly _status = signal<Status>('loading');
  private readonly _query = signal<string>('');
  private readonly _filters = signal<FilterCriteria>(EMPTY_FILTERS);
  private readonly _sort = signal<SortState>({ field: null, direction: 'asc' });

  // ---- Public read-only views ---------------------------------------------
  readonly status = this._status.asReadonly();
  readonly sort = this._sort.asReadonly();
  readonly totalCount = computed(() => this._raw().length);

  /** The filter -> search -> sort pipeline. Memoised by Angular's signal graph. */
  readonly visibleLoads = computed<Load[]>(() => {
    const filtered = filterLoads(this._raw(), this._filters());
    const searched = searchLoads(filtered, this._query());
    return sortLoads(searched, this._sort());
  });

  readonly visibleCount = computed(() => this.visibleLoads().length);
  readonly isEmpty = computed(() => this._status() === 'ready' && this.visibleCount() === 0);

  // ---- Commands ------------------------------------------------------------
  /** Fetch (and optionally synthesise) the dataset. */
  load(multiplier = 1): void {
    this._status.set('loading');
    this.data.loadLoads(multiplier).subscribe((loads) => {
      this._raw.set(loads);
      this._status.set(loads.length ? 'ready' : 'error');
      this.logger.event('store.loaded', { count: loads.length });
    });
  }

  setQuery(query: string): void {
    this._query.set(query);
  }

  setFilters(filters: FilterCriteria): void {
    this._filters.set(filters);
    this.logger.event('store.filtered', { filters, visible: this.visibleCount() });
  }

  /** Toggle a column's sort (asc -> desc -> none) via the pure helper. */
  toggleSort(field: SortableField): void {
    this._sort.set(nextSortState(this._sort(), field));
  }
}
