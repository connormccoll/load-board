import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterCriteria } from '../../core/models/load.model';
import { FilterPanelComponent } from './filter-panel.component';

describe('FilterPanelComponent (price range validation)', () => {
  let fixture: ComponentFixture<FilterPanelComponent>;
  let component: FilterPanelComponent;
  let el: HTMLElement;
  let emitted: FilterCriteria[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FilterPanelComponent] }).compileComponents();
    fixture = TestBed.createComponent(FilterPanelComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
    emitted = [];
    component.filtersChange.subscribe((c) => emitted.push(c));
    fixture.detectChanges();
  });

  it('flags an inverted range and exposes an accessible alert', () => {
    component.minPrice.set(2000);
    component.maxPrice.set(1000);
    fixture.detectChanges();

    expect(component.rangeError()).toBe(true);
    expect(el.querySelector('#price-error[role="alert"]')).toBeTruthy();
    expect(el.querySelector('input[aria-invalid="true"]')).toBeTruthy();
  });

  it('does not apply an invalid range — emits null price bounds', () => {
    component.minPrice.set(2000);
    component.maxPrice.set(1000);
    component.toggleStatus('Available'); // any change runs emit()

    const last = emitted.at(-1)!;
    expect(component.rangeError()).toBe(true);
    expect(last.minPrice).toBeNull();
    expect(last.maxPrice).toBeNull();
    expect(last.statuses).toEqual(['Available']); // other criteria still applied
  });

  it('applies a valid range normally', () => {
    component.minPrice.set(1000);
    component.maxPrice.set(2000);
    component.toggleStatus('Available');

    const last = emitted.at(-1)!;
    expect(component.rangeError()).toBe(false);
    expect(last.minPrice).toBe(1000);
    expect(last.maxPrice).toBe(2000);
  });

  it('clears the error once the range is corrected', () => {
    component.minPrice.set(2000);
    component.maxPrice.set(1000);
    fixture.detectChanges();
    expect(component.rangeError()).toBe(true);

    component.maxPrice.set(3000);
    fixture.detectChanges();
    expect(component.rangeError()).toBe(false);
    expect(el.querySelector('#price-error')).toBeNull();
  });
});
