import { Load } from '../models/load.model';

/** Text fields that free-text search scans. Numeric fields are handled by
 *  filters, not search, to keep "search" predictable for dispatchers. */
const SEARCHABLE_FIELDS: ReadonlyArray<keyof Load> = [
  'id',
  'companyName',
  'origin',
  'destination',
  'equipmentType',
  'status',
];

/**
 * Case-insensitive substring search across the searchable text fields.
 * Pure and synchronous: debouncing belongs in the UI layer, not here.
 *
 * @returns a new array; the input is never mutated.
 */
export function searchLoads(loads: readonly Load[], rawQuery: string): Load[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return loads.slice();
  }
  return loads.filter((load) =>
    SEARCHABLE_FIELDS.some((field) => String(load[field]).toLowerCase().includes(query)),
  );
}
