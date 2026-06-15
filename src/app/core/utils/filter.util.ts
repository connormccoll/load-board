import { FilterCriteria, Load } from '../models/load.model';

/**
 * Apply multi-criteria filtering. Semantics:
 *   - Across categories: AND (must satisfy equipment AND status AND price).
 *   - Within a multi-select category: OR (Van OR Reefer).
 *   - Empty array / null bound = no constraint for that category.
 *
 * Pure; returns a new array and never mutates the input.
 */
export function filterLoads(loads: readonly Load[], criteria: FilterCriteria): Load[] {
  const { equipmentTypes, statuses, minPrice, maxPrice } = criteria;

  return loads.filter((load) => {
    if (equipmentTypes.length > 0 && !equipmentTypes.includes(load.equipmentType)) {
      return false;
    }
    if (statuses.length > 0 && !statuses.includes(load.status)) {
      return false;
    }
    if (minPrice != null && load.price < minPrice) {
      return false;
    }
    if (maxPrice != null && load.price > maxPrice) {
      return false;
    }
    return true;
  });
}
