import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

/**
 * Debounced free-text search input. Emits the query as the user types, but
 * coalesces keystrokes so the (potentially large) filter pipeline runs at most
 * once per idle window — keeping typing responsive on big datasets.
 *
 * Presentational: it owns its own input control and emits a string; it knows
 * nothing about loads or the store.
 */
@Component({
  selector: 'app-search-box',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="search">
      <label for="load-search">Search loads</label>
      <input
        id="load-search"
        type="search"
        [formControl]="control"
        placeholder="Company, route, equipment, status…"
        autocomplete="off"
        aria-describedby="search-hint"
      />
      <span id="search-hint" class="sr-only">
        Results update automatically as you type.
      </span>
    </div>
  `,
  styles: [
    `
      .search {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        min-width: 260px;
      }
      label {
        font-weight: 600;
      }
      input {
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius);
        font: inherit;
      }
    `,
  ],
})
export class SearchBoxComponent {
  readonly queryChange = output<string>();
  readonly control = new FormControl('', { nonNullable: true });

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.control.valueChanges
      .pipe(debounceTime(150), distinctUntilChanged(), takeUntilDestroyed(destroyRef))
      .subscribe((value) => this.queryChange.emit(value));
  }
}
