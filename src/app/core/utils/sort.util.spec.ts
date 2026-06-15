import { describe, expect, it } from 'vitest';
import { Load, SortState } from '../models/load.model';
import { nextSortState, sortLoads } from './sort.util';

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
  make({ id: '1', companyName: 'Bravo', price: 2000, date: '2024-03-01' }),
  make({ id: '2', companyName: 'alpha', price: 1000, date: '2024-01-01' }),
  make({ id: '3', companyName: 'Charlie', price: 3000, date: '2024-02-01' }),
];

describe('sortLoads', () => {
  it('returns a copy in original order when no field is set', () => {
    const result = sortLoads(loads, { field: null, direction: 'asc' });
    expect(result.map((l) => l.id)).toEqual(['1', '2', '3']);
    expect(result).not.toBe(loads);
  });

  it('sorts numeric fields numerically', () => {
    const asc: SortState = { field: 'price', direction: 'asc' };
    expect(sortLoads(loads, asc).map((l) => l.id)).toEqual(['2', '1', '3']);
    const desc: SortState = { field: 'price', direction: 'desc' };
    expect(sortLoads(loads, desc).map((l) => l.id)).toEqual(['3', '1', '2']);
  });

  it('sorts text case-insensitively', () => {
    const asc: SortState = { field: 'companyName', direction: 'asc' };
    expect(sortLoads(loads, asc).map((l) => l.companyName)).toEqual([
      'alpha',
      'Bravo',
      'Charlie',
    ]);
  });

  it('sorts ISO dates chronologically', () => {
    const asc: SortState = { field: 'date', direction: 'asc' };
    expect(sortLoads(loads, asc).map((l) => l.id)).toEqual(['2', '3', '1']);
  });

  it('does not mutate the input', () => {
    const snapshot = loads.map((l) => l.id);
    sortLoads(loads, { field: 'price', direction: 'desc' });
    expect(loads.map((l) => l.id)).toEqual(snapshot);
  });
});

describe('nextSortState', () => {
  it('cycles asc -> desc -> none for the same field', () => {
    let state: SortState = { field: null, direction: 'asc' };
    state = nextSortState(state, 'price');
    expect(state).toEqual({ field: 'price', direction: 'asc' });
    state = nextSortState(state, 'price');
    expect(state).toEqual({ field: 'price', direction: 'desc' });
    state = nextSortState(state, 'price');
    expect(state).toEqual({ field: null, direction: 'asc' });
  });

  it('starts a new column at ascending', () => {
    const state = nextSortState({ field: 'price', direction: 'desc' }, 'weight');
    expect(state).toEqual({ field: 'weight', direction: 'asc' });
  });
});
