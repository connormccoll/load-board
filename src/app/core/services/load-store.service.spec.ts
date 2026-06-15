import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of } from 'rxjs';
import { Load } from '../models/load.model';
import { LoadDataService } from './load-data.service';
import { LoadStore } from './load-store.service';

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

const seed: Load[] = [
  make({ id: '1', companyName: 'Swift', equipmentType: 'Van', status: 'Available', price: 500 }),
  make({ id: '2', companyName: 'Knight', equipmentType: 'Reefer', status: 'In Transit', price: 1500 }),
  make({ id: '3', companyName: 'Schneider', equipmentType: 'Flatbed', status: 'Delivered', price: 2500 }),
];

class FakeDataService {
  loadLoads(): Observable<Load[]> {
    return of(seed);
  }
}

describe('LoadStore', () => {
  let store: LoadStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoadStore, { provide: LoadDataService, useClass: FakeDataService }],
    });
    store = TestBed.inject(LoadStore);
    store.load();
  });

  it('loads data and reports ready', () => {
    expect(store.status()).toBe('ready');
    expect(store.totalCount()).toBe(3);
    expect(store.visibleCount()).toBe(3);
  });

  it('applies the filter -> search -> sort pipeline together', () => {
    store.setFilters({
      equipmentTypes: ['Van', 'Reefer'],
      statuses: [],
      minPrice: null,
      maxPrice: null,
    });
    expect(store.visibleCount()).toBe(2);

    store.setQuery('knight');
    expect(store.visibleLoads().map((l) => l.id)).toEqual(['2']);

    store.setQuery('');
    store.toggleSort('price');
    expect(store.visibleLoads().map((l) => l.id)).toEqual(['1', '2']); // asc
    store.toggleSort('price');
    expect(store.visibleLoads().map((l) => l.id)).toEqual(['2', '1']); // desc
  });

  it('reports empty when filters exclude everything', () => {
    store.setFilters({
      equipmentTypes: [],
      statuses: ['Delivered'],
      minPrice: 9999,
      maxPrice: null,
    });
    expect(store.visibleCount()).toBe(0);
    expect(store.isEmpty()).toBe(true);
  });

  it('setFilters with empty criteria restores the full set', () => {
    store.setFilters({ equipmentTypes: ['Van'], statuses: [], minPrice: null, maxPrice: null });
    expect(store.visibleCount()).toBe(1);
    store.setFilters({ equipmentTypes: [], statuses: [], minPrice: null, maxPrice: null });
    expect(store.visibleCount()).toBe(3);
  });
});

/** A data source we resolve manually, to assert the async loading lifecycle. */
class ControlledDataService {
  readonly subject = new Subject<Load[]>();
  loadLoads(): Observable<Load[]> {
    return this.subject;
  }
}

describe('LoadStore — async loading lifecycle', () => {
  let store: LoadStore;
  let data: ControlledDataService;

  beforeEach(() => {
    data = new ControlledDataService();
    TestBed.configureTestingModule({
      providers: [LoadStore, { provide: LoadDataService, useValue: data }],
    });
    store = TestBed.inject(LoadStore);
  });

  it('stays loading until data arrives, then reports ready', () => {
    store.load();
    expect(store.status()).toBe('loading');

    data.subject.next(seed);
    data.subject.complete();
    expect(store.status()).toBe('ready');
    expect(store.totalCount()).toBe(3);
  });
});
