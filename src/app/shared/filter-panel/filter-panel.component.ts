import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import {
  EQUIPMENT_TYPES,
  EquipmentType,
  FilterCriteria,
  LOAD_STATUSES,
  LoadStatus,
} from '../../core/models/load.model';

/**
 * Multi-criteria filter controls. Grouped with fieldset/legend so screen
 * readers announce the group purpose. Emits a complete FilterCriteria object
 * on every change; it holds the working selection but the store is the source
 * of truth for what's applied.
 */
@Component({
  selector: 'app-filter-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filters" role="group" aria-label="Filter loads">
      <fieldset>
        <legend>Equipment type</legend>
        @for (type of equipmentTypes; track type) {
          <label class="check">
            <input
              type="checkbox"
              [checked]="equipment().has(type)"
              (change)="toggleEquipment(type)"
            />
            {{ type }}
          </label>
        }
      </fieldset>

      <fieldset>
        <legend>Status</legend>
        @for (status of statuses; track status) {
          <label class="check">
            <input
              type="checkbox"
              [checked]="status_().has(status)"
              (change)="toggleStatus(status)"
            />
            {{ status }}
          </label>
        }
      </fieldset>

      <fieldset>
        <legend>Price (USD)</legend>
        <div class="range">
          <label>
            Min
            <input
              type="number"
              inputmode="numeric"
              min="0"
              [value]="minPrice() ?? ''"
              [attr.aria-invalid]="rangeError() ? 'true' : null"
              [attr.aria-describedby]="rangeError() ? 'price-error' : null"
              (input)="setMin($event)"
            />
          </label>
          <label>
            Max
            <input
              type="number"
              inputmode="numeric"
              min="0"
              [value]="maxPrice() ?? ''"
              [attr.aria-invalid]="rangeError() ? 'true' : null"
              [attr.aria-describedby]="rangeError() ? 'price-error' : null"
              (input)="setMax($event)"
            />
          </label>
        </div>
        @if (rangeError()) {
          <p id="price-error" class="error" role="alert">
            Minimum price is higher than maximum; the price filter is ignored until corrected.
          </p>
        }
      </fieldset>

      <button type="button" class="clear" (click)="clear()">Clear filters</button>
    </div>
  `,
  styleUrl: './filter-panel.component.css',
})
export class FilterPanelComponent {
  readonly filtersChange = output<FilterCriteria>();

  readonly equipmentTypes = EQUIPMENT_TYPES;
  readonly statuses = LOAD_STATUSES;

  // Local working state (signals). Sets give O(1) membership for the checkboxes.
  readonly equipment = signal<Set<EquipmentType>>(new Set());
  readonly status_ = signal<Set<LoadStatus>>(new Set());
  readonly minPrice = signal<number | null>(null);
  readonly maxPrice = signal<number | null>(null);

  /** True when both bounds are set and the range is inverted (min > max). */
  readonly rangeError = computed(() => {
    const min = this.minPrice();
    const max = this.maxPrice();
    return min != null && max != null && min > max;
  });

  toggleEquipment(type: EquipmentType): void {
    this.equipment.update((set) => toggle(set, type));
    this.emit();
  }

  toggleStatus(status: LoadStatus): void {
    this.status_.update((set) => toggle(set, status));
    this.emit();
  }

  setMin(event: Event): void {
    this.minPrice.set(parseNumber(event));
    this.emit();
  }

  setMax(event: Event): void {
    this.maxPrice.set(parseNumber(event));
    this.emit();
  }

  clear(): void {
    this.equipment.set(new Set());
    this.status_.set(new Set());
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.emit();
  }

  private emit(): void {
    // While the range is inverted, don't apply the price constraint — emitting
    // it would silently empty the grid. The inline error tells the user why.
    const invalid = this.rangeError();
    this.filtersChange.emit({
      equipmentTypes: [...this.equipment()],
      statuses: [...this.status_()],
      minPrice: invalid ? null : this.minPrice(),
      maxPrice: invalid ? null : this.maxPrice(),
    });
  }
}

function toggle<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set);
  next.has(value) ? next.delete(value) : next.add(value);
  return next;
}

function parseNumber(event: Event): number | null {
  const raw = (event.target as HTMLInputElement).value.trim();
  if (raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
