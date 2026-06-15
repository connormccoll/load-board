import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { LoadStore } from '../../core/services/load-store.service';
import { SortableField } from '../../core/models/load.model';
import { FilterPanelComponent } from '../../shared/filter-panel/filter-panel.component';
import { LoadGridComponent } from '../../shared/load-grid/load-grid.component';
import { SearchBoxComponent } from '../../shared/search-box/search-box.component';

/** How many times to tile the 50-row seed data, so virtual scrolling has a
 *  realistic dataset to work against (~10k rows). One knob, easy to change. */
const DATASET_MULTIPLIER = 200;

/**
 * Smart container: the only component that talks to the store. It binds store
 * signals into the presentational children and routes their events back to
 * store commands. Keeping orchestration here keeps every other component dumb
 * and reusable.
 */
@Component({
  selector: 'app-load-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SearchBoxComponent, FilterPanelComponent, LoadGridComponent],
  template: `
    <div class="controls">
      <app-search-box (queryChange)="store.setQuery($event)" />
      <app-filter-panel (filtersChange)="store.setFilters($event)" />
    </div>

    @if (store.status() === 'error') {
      <p class="empty" role="alert">Could not load freight data. Please try again.</p>
    } @else if (store.status() !== 'loading') {
      <!-- Live region: announces result counts without stealing focus. -->
      <p class="result-count" role="status" aria-live="polite">
        Showing {{ store.visibleCount() }} of {{ store.totalCount() }} loads
      </p>

      @if (store.isEmpty()) {
        <p class="empty" role="status">No loads match your search and filters.</p>
      } @else {
        <app-load-grid
          [loads]="store.visibleLoads()"
          [sort]="store.sort()"
          (sortToggle)="onSortToggle($event)"
        />
      }
    }
  `,
  styles: [
    `
      /* Column layout: controls + count stay their natural size, the grid grows
        to fill the remaining height. The grid carries its own min-height floor
        (see load-grid), so we don't collapse it to 0 here. */
      :host {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
      }
      .controls {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-4);
        align-items: flex-start;
        margin-bottom: var(--space-3);
        flex: 0 0 auto;
      }
      .result-count {
        margin: var(--space-2) 0;
        color: var(--color-text-muted);
        font-weight: 600;
        flex: 0 0 auto;
      }
      app-load-grid {
        flex: 1 1 auto;
      }
      .empty {
        padding: var(--space-4);
        border: 1px dashed var(--color-border);
        border-radius: var(--radius);
        color: var(--color-text-muted);
      }
    `,
  ],
})
export class LoadBoardComponent implements OnInit {
  protected readonly store = inject(LoadStore);

  ngOnInit(): void {
    this.store.load(DATASET_MULTIPLIER);
  }

  onSortToggle(field: SortableField): void {
    this.store.toggleSort(field);
  }
}
