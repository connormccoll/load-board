import { describe, expect, it } from 'vitest';
import { Load } from '../models/load.model';
import { searchLoads } from './search.util';

const loads: Load[] = [
  {
    id: 'LD-001',
    companyName: 'Swift Transport',
    origin: 'Chicago, IL',
    destination: 'Dallas, TX',
    weight: 42000,
    equipmentType: 'Van',
    date: '2024-06-15',
    price: 2850,
    distance: 925,
    status: 'Available',
  },
  {
    id: 'LD-002',
    companyName: 'Knight Transportation',
    origin: 'Los Angeles, CA',
    destination: 'Phoenix, AZ',
    weight: 28500,
    equipmentType: 'Flatbed',
    date: '2024-06-16',
    price: 1650,
    distance: 372,
    status: 'In Transit',
  },
];

describe('searchLoads', () => {
  it('returns a copy of all loads for an empty query', () => {
    const result = searchLoads(loads, '');
    expect(result.length).toBe(2);
    expect(result).not.toBe(loads as unknown as Load[]);
  });

  it('matches case-insensitively across text fields', () => {
    expect(searchLoads(loads, 'swift').length).toBe(1);
    expect(searchLoads(loads, 'CHICAGO').length).toBe(1);
    expect(searchLoads(loads, 'flatbed').length).toBe(1);
  });

  it('matches on id and status', () => {
    expect(searchLoads(loads, 'ld-002').length).toBe(1);
    expect(searchLoads(loads, 'transit').length).toBe(1);
  });

  it('trims whitespace and returns empty when nothing matches', () => {
    expect(searchLoads(loads, '  swift  ').length).toBe(1);
    expect(searchLoads(loads, 'nonexistent').length).toBe(0);
  });

  it('does not mutate the input', () => {
    const snapshot = JSON.stringify(loads);
    searchLoads(loads, 'swift');
    expect(JSON.stringify(loads)).toBe(snapshot);
  });
});
