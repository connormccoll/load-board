import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ColumnDef, Load, SortState, SortableField } from '../../core/models/load.model';

/** Default column set. Exposed so a consumer could reorder/subset columns,
 *  but sensible out of the box — the grid stays declarative and data-driven. */
export const DEFAULT_COLUMNS: ColumnDef[] = [
  { field: 'companyName', label: 'Company', align: 'start' },
  { field: 'origin', label: 'Origin', align: 'start' },
  { field: 'destination', label: 'Destination', align: 'start' },
  { field: 'weight', label: 'Weight', align: 'end' },
  { field: 'equipmentType', label: 'Equipment', align: 'start' },
  { field: 'date', label: 'Date', align: 'start' },
  { field: 'price', label: 'Price', align: 'end' },
  { field: 'distance', label: 'Distance', align: 'end' },
  { field: 'status', label: 'Status', align: 'start' },
];

const ROW_HEIGHT = 44; // px; fixed-size rows let CDK virtual scroll be O(1).

/**
 * Accessible, virtualized data grid implementing the WAI-ARIA grid pattern.
 *
 * Why a div-based `role="grid"` rather than a native <table>? Virtual scrolling
 * (CDK) transforms/recycles row elements, which breaks native table layout and
 * semantics. The ARIA grid pattern is the standards-sanctioned way to keep a
 * virtualized list both semantic and keyboard-operable: it carries
 * `aria-rowcount`/`aria-rowindex` so assistive tech announces the true position
 * within the full dataset even though only a window is in the DOM.
 *
 * Keyboard model (roving tabindex — one focusable cell at a time):
 *   Arrow keys  move between cells; Up from the first data row enters the header
 *   Home / End  first / last cell in the row
 *   Ctrl+Home / Ctrl+End  first cell of first row / last cell of last row
 *   PageUp / PageDown  move by a viewport page
 *   Enter / Space  on a header cell, toggle the column sort
 */
@Component({
  selector: 'app-load-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrollingModule],
  template: `
    <div
      id="load-grid"
      class="grid"
      role="grid"
      aria-label="Freight loads"
      [attr.aria-rowcount]="rowCount()"
      [attr.aria-colcount]="columns().length"
      (keydown)="onKeydown($event)"
    >
      <!-- Header row: part of the grid, kept outside the scroll viewport so it
          stays sticky and is never recycled. aria-rowindex 1. -->
      <div role="row" class="row header-row" [attr.aria-rowindex]="1">
        @for (col of columns(); track col.field; let c = $index) {
          <div
            role="columnheader"
            class="cell header-cell"
            [class.align-end]="col.align === 'end'"
            [attr.aria-colindex]="c + 1"
            [attr.aria-sort]="ariaSort(col.field)"
          >
            <button
              type="button"
              class="sort-btn"
              [attr.data-row]="-1"
              [attr.data-col]="c"
              [attr.tabindex]="tabindexFor(-1, c)"
              (click)="activateHeader(col.field, c)"
              (focus)="setActive(-1, c)"
            >
              <span>{{ col.label }}</span>
              <span class="sort-indicator" aria-hidden="true">{{ sortGlyph(col.field) }}</span>
            </button>
          </div>
        }
      </div>

      <!-- Virtualized body: only the visible window of rows is in the DOM. -->
      <cdk-virtual-scroll-viewport
        #viewport
        role="rowgroup"
        class="viewport"
        [itemSize]="rowHeight"
      >
        <div
          *cdkVirtualFor="let load of loads(); let i = index; trackBy: trackById"
          role="row"
          class="row"
          [style.height.px]="rowHeight"
          [attr.aria-rowindex]="i + 2"
        >
          @for (col of columns(); track col.field; let c = $index) {
            <div
              role="gridcell"
              class="cell"
              [class.align-end]="col.align === 'end'"
              [attr.aria-colindex]="c + 1"
              [attr.data-row]="i"
              [attr.data-col]="c"
              [attr.tabindex]="tabindexFor(i, c)"
              (focus)="setActive(i, c)"
            >
              @if (col.field === 'status') {
                <span class="status" [attr.data-status]="load.status">{{ load.status }}</span>
              } @else {
                {{ displayValue(load, col) }}
              }
            </div>
          }
        </div>
      </cdk-virtual-scroll-viewport>
    </div>
  `,
  styleUrl: './load-grid.component.css',
})
export class LoadGridComponent {
  /** Inputs (signal-based). The grid is presentational: data in, intent out. */
  readonly loads = input.required<Load[]>();
  readonly sort = input.required<SortState>();
  readonly columns = input<ColumnDef[]>(DEFAULT_COLUMNS);

  /** Emitted when the user toggles a column's sort. */
  readonly sortToggle = output<SortableField>();

  readonly rowHeight = ROW_HEIGHT;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly viewport = viewChild.required(CdkVirtualScrollViewport);

  /** Active cell for the roving-tabindex model. row -1 = header row. */
  private readonly _activeRow = signal(0);
  private readonly _activeCol = signal(0);

  /** Header row + data rows; drives aria-rowcount. */
  readonly rowCount = computed(() => this.loads().length + 1);

  trackById = (_: number, load: Load): string => load.id;

  // ---- Roving tabindex -----------------------------------------------------
  /** Exactly one cell is focusable (tabindex 0); the rest are -1. */
  tabindexFor(row: number, col: number): number {
    return row === this._activeRow() && col === this._activeCol() ? 0 : -1;
  }

  setActive(row: number, col: number): void {
    this._activeRow.set(row);
    this._activeCol.set(col);
  }

  // ---- Sort presentation ---------------------------------------------------
  ariaSort(field: SortableField): 'ascending' | 'descending' | 'none' {
    const s = this.sort();
    if (s.field !== field) return 'none';
    return s.direction === 'asc' ? 'ascending' : 'descending';
  }

  sortGlyph(field: SortableField): string {
    const s = this.sort();
    if (s.field !== field) return '↕'; // up-down arrow (sortable)
    return s.direction === 'asc' ? '↑' : '↓';
  }

  activateHeader(field: SortableField, col: number): void {
    this.setActive(-1, col);
    this.sortToggle.emit(field);
  }

  // ---- Cell formatting -----------------------------------------------------
  displayValue(load: Load, col: ColumnDef): string {
    const value = load[col.field];
    switch (col.field) {
      case 'price':
        return currency.format(value as number);
      case 'weight':
        return `${number.format(value as number)} lbs`;
      case 'distance':
        return `${number.format(value as number)} mi`;
      case 'date':
        return date.format(new Date(value as string));
      default:
        return String(value);
    }
  }

  // ---- Keyboard navigation -------------------------------------------------
  onKeydown(event: KeyboardEvent): void {
    const maxRow = this.loads().length - 1;
    const maxCol = this.columns().length - 1;
    let row = this._activeRow();
    let col = this._activeCol();
    let handled = true;

    switch (event.key) {
      case 'ArrowDown':
        row = Math.min(maxRow, row + 1);
        break;
      case 'ArrowUp':
        row = Math.max(-1, row - 1);
        break;
      case 'ArrowRight':
        col = Math.min(maxCol, col + 1);
        break;
      case 'ArrowLeft':
        col = Math.max(0, col - 1);
        break;
      case 'Home':
        col = 0;
        if (event.ctrlKey) row = -1;
        break;
      case 'End':
        col = maxCol;
        if (event.ctrlKey) row = maxRow;
        break;
      case 'PageDown':
        row = Math.min(maxRow, row + this.pageSize());
        break;
      case 'PageUp':
        row = Math.max(0, row - this.pageSize());
        break;
      case 'Enter':
      case ' ':
        if (this._activeRow() === -1) {
          event.preventDefault();
          this.sortToggle.emit(this.columns()[this._activeCol()].field);
        }
        return;
      default:
        handled = false;
    }

    if (!handled) return;
    event.preventDefault();
    this.setActive(row, col);
    this.focusActiveCell();
  }

  /** Rows per PageUp/PageDown, derived from the live viewport height so it
   *  stays correct after the grid is resized with the window. */
  private pageSize(): number {
    const visible = this.viewport().getViewportSize();
    return Math.max(1, Math.floor(visible / this.rowHeight) - 1);
  }

  /** Ensure the target row is rendered & visible, then move DOM focus to it.
   *  Because rows are virtualized, the element may not exist on the same frame
   *  we scroll, so we retry over a few animation frames. */
  private focusActiveCell(): void {
    const row = this._activeRow();
    const col = this._activeCol();
    if (row >= 0) this.ensureRowVisible(row);

    let tries = 6;
    const attempt = () => {
      const el = this.host.nativeElement.querySelector<HTMLElement>(
        `[data-row="${row}"][data-col="${col}"]`,
      );
      if (el) {
        el.focus();
      } else if (tries-- > 0) {
        requestAnimationFrame(attempt);
      }
    };
    requestAnimationFrame(attempt);
  }

  /** Minimal scroll: only move the viewport if the row is outside the window. */
  private ensureRowVisible(row: number): void {
    const vp = this.viewport();
    const offset = vp.measureScrollOffset();
    const size = vp.getViewportSize();
    const top = row * this.rowHeight;
    const bottom = top + this.rowHeight;
    if (top < offset) {
      vp.scrollToOffset(top);
    } else if (bottom > offset + size) {
      vp.scrollToOffset(bottom - size);
    }
  }
}

// Module-scope Intl formatters: created once, reused for every cell.
const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat('en-US');
const date = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});
