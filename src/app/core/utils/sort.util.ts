import { Load, SortState, SortableField } from '../models/load.model';

/** Numeric columns get numeric comparison; everything else compares as text
 *  (locale-aware). Dates are ISO strings, so lexical order == chronological. */
const NUMERIC_FIELDS: ReadonlySet<SortableField> = new Set<SortableField>([
  'weight',
  'price',
  'distance',
]);

/**
 * Stable, type-aware sort. Returns a new array; the input is never mutated.
 * A null `field` means "no sort" and the original order is preserved.
 */
export function sortLoads(loads: readonly Load[], sort: SortState): Load[] {
  if (!sort.field) {
    return loads.slice();
  }
  const field = sort.field;
  const dir = sort.direction === 'asc' ? 1 : -1;
  const numeric = NUMERIC_FIELDS.has(field);

  // Array.prototype.sort is stable in modern engines (ES2019+), which keeps
  // equal rows in their prior order — important for predictable multi-pass UX.
  return loads.slice().sort((a, b) => dir * compare(a, b, field, numeric));
}

function compare(a: Load, b: Load, field: SortableField, numeric: boolean): number {
  if (numeric) {
    return (a[field] as number) - (b[field] as number);
  }
  return String(a[field]).localeCompare(String(b[field]), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

/**
 * Tri-state header toggle used by the grid: a column cycles
 * asc -> desc -> none, and switching to a new column starts at asc.
 */
export function nextSortState(current: SortState, field: SortableField): SortState {
  if (current.field !== field) {
    return { field, direction: 'asc' };
  }
  if (current.direction === 'asc') {
    return { field, direction: 'desc' };
  }
  return { field: null, direction: 'asc' };
}
