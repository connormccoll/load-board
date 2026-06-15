import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Load, SortState } from '../../core/models/load.model';
import { DEFAULT_COLUMNS, LoadGridComponent } from './load-grid.component';

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

describe('LoadGridComponent (a11y contract)', () => {
  let fixture: ComponentFixture<LoadGridComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LoadGridComponent] }).compileComponents();
    fixture = TestBed.createComponent(LoadGridComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('loads', [make({ id: '1' }), make({ id: '2' })]);
    fixture.componentRef.setInput('sort', { field: 'price', direction: 'desc' } as SortState);
    fixture.detectChanges();
  });

  it('exposes the grid role with row and column counts', () => {
    const grid = el.querySelector('[role="grid"]')!;
    expect(grid.getAttribute('aria-colcount')).toBe(String(DEFAULT_COLUMNS.length));
    // 2 data rows + 1 header row.
    expect(grid.getAttribute('aria-rowcount')).toBe('3');
  });

  it('reflects the active sort via aria-sort on the correct columnheader', () => {
    const headers = Array.from(el.querySelectorAll('[role="columnheader"]'));
    const priceIdx = DEFAULT_COLUMNS.findIndex((c) => c.field === 'price');
    expect(headers[priceIdx].getAttribute('aria-sort')).toBe('descending');
    // Non-sorted columns report "none".
    const companyIdx = DEFAULT_COLUMNS.findIndex((c) => c.field === 'companyName');
    expect(headers[companyIdx].getAttribute('aria-sort')).toBe('none');
  });

  it('emits sortToggle with the field when a header button is activated', () => {
    const emitted: string[] = [];
    fixture.componentInstance.sortToggle.subscribe((f) => emitted.push(f));
    const companyIdx = DEFAULT_COLUMNS.findIndex((c) => c.field === 'companyName');
    const btn = el.querySelectorAll<HTMLButtonElement>('.sort-btn')[companyIdx];
    btn.click();
    expect(emitted).toEqual(['companyName']);
  });

  it('uses a roving tabindex: exactly one cell is focusable at a time', () => {
    // Asserted at the logic level (tabindexFor) rather than against rendered DOM,
    // since the virtualized rows render asynchronously. The active cell defaults
    // to the first data cell (row 0, col 0), so exactly one coordinate yields 0.
    const grid = fixture.componentInstance;
    const cols = DEFAULT_COLUMNS.length;
    let focusable = 0;
    for (let row = -1; row < 2; row++) {
      for (let col = 0; col < cols; col++) {
        if (grid.tabindexFor(row, col) === 0) focusable++;
      }
    }
    expect(focusable).toBe(1);
  });
});
