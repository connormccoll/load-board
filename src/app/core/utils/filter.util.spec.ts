import { describe, expect, it } from 'vitest';
import { EMPTY_FILTERS, FilterCriteria, Load } from '../models/load.model';
import { filterLoads } from './filter.util';

function make(partial: Partial<Load>): Load {
  return {
    id: 'LD-x',
    companyName: 'ACME',
    origin: 'A',
    destination: 'B',
    weight: 1000,
    equipmentType: 'Van',
    date: '2024-01-01',
    price: 1000,
    distance: 100,
    status: 'Available',
    ...partial,
  };
}

const loads: Load[] = [
  make({ id: '1', equipmentType: 'Van', status: 'Available', price: 500 }),
  make({ id: '2', equipmentType: 'Reefer', status: 'In Transit', price: 1500 }),
  make({ id: '3', equipmentType: 'Flatbed', status: 'Delivered', price: 2500 }),
];

describe('filterLoads', () => {
  it('returns all loads when no constraints are set', () => {
    expect(filterLoads(loads, EMPTY_FILTERS).length).toBe(3);
  });

  it('ORs within the equipment category', () => {
    const criteria: FilterCriteria = {
      ...EMPTY_FILTERS,
      equipmentTypes: ['Van', 'Reefer'],
    };
    expect(filterLoads(loads, criteria).map((l) => l.id)).toEqual(['1', '2']);
  });

  it('ANDs across categories', () => {
    const criteria: FilterCriteria = {
      ...EMPTY_FILTERS,
      equipmentTypes: ['Van', 'Reefer'],
      statuses: ['In Transit'],
    };
    expect(filterLoads(loads, criteria).map((l) => l.id)).toEqual(['2']);
  });

  it('applies inclusive price bounds', () => {
    expect(filterLoads(loads, { ...EMPTY_FILTERS, minPrice: 1500 }).map((l) => l.id)).toEqual([
      '2',
      '3',
    ]);
    expect(filterLoads(loads, { ...EMPTY_FILTERS, maxPrice: 1500 }).map((l) => l.id)).toEqual([
      '1',
      '2',
    ]);
    expect(
      filterLoads(loads, { ...EMPTY_FILTERS, minPrice: 1000, maxPrice: 2000 }).map((l) => l.id),
    ).toEqual(['2']);
  });
});
