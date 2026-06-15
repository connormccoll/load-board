/**
 * Domain model for the load board. Kept framework-agnostic so the same types
 * back the data service, the pure utility functions, and the components.
 */

/** A single freight load row. Mirrors the shape of src/data/mockLoads.json. */
export interface Load {
  id: string;
  companyName: string;
  origin: string;
  destination: string;
  /** Pounds. */
  weight: number;
  equipmentType: EquipmentType;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  /** USD. */
  price: number;
  /** Miles. */
  distance: number;
  status: LoadStatus;
}

export type EquipmentType = 'Van' | 'Flatbed' | 'Reefer';
export type LoadStatus = 'Available' | 'In Transit' | 'Delivered';

/** Keys of Load that the user can sort by. `id` is intentionally excluded
 *  from sortable columns but kept here would be trivial to add. */
export type SortableField = keyof Pick<
  Load,
  | 'companyName'
  | 'origin'
  | 'destination'
  | 'weight'
  | 'equipmentType'
  | 'date'
  | 'price'
  | 'distance'
  | 'status'
>;

export type SortDirection = 'asc' | 'desc';

/** Active sort. `null` field means "no sort" (natural data order). */
export interface SortState {
  field: SortableField | null;
  direction: SortDirection;
}

/**
 * Filter criteria applied with AND semantics across categories, OR within a
 * multi-select category. Empty arrays / null bounds mean "no constraint".
 */
export interface FilterCriteria {
  equipmentTypes: EquipmentType[];
  statuses: LoadStatus[];
  minPrice: number | null;
  maxPrice: number | null;
}

export const EQUIPMENT_TYPES: readonly EquipmentType[] = ['Van', 'Flatbed', 'Reefer'];
export const LOAD_STATUSES: readonly LoadStatus[] = ['Available', 'In Transit', 'Delivered'];

export const EMPTY_FILTERS: FilterCriteria = {
  equipmentTypes: [],
  statuses: [],
  minPrice: null,
  maxPrice: null,
};

/** Column definition drives both the header row and the cell rendering, so the
 *  grid stays declarative and adding a column is a one-line change. */
export interface ColumnDef {
  field: SortableField;
  label: string;
  /** Cell alignment; numeric columns are right-aligned for scannability. */
  align: 'start' | 'end';
}
