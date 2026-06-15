# Freight Load Board — Architecture Decisions

A single-view Angular application for dispatchers to view, search, sort, and filter freight loads at scale, operable entirely by keyboard and screen reader.

## Stack

- **Angular 22, standalone components, signals, zoneless.** No NgModules. Signals give fine-grained, memoised reactivity that suits a derive-on-change UI like this one. Because the app is fully signal- and `OnPush`-driven, it runs with **zoneless change detection** (`provideZonelessChangeDetection`, the v20+ default) — no zone.js in the bundle, and change detection fires only when a signal actually changes.
- **TypeScript 6, strict mode.** Strict templates and strict null checks are on.
- **No UI component libraries.** Markup, styling, and the grid behaviour are hand-built. The one external dependency is **Angular CDK `ScrollingModule`** for virtual scrolling (see below).

## Folder structure

```
src/app/
  core/
    models/      load.model.ts          domain types (framework-agnostic)
    utils/       search / sort / filter  pure functions (+ specs)
    services/    load-data, load-store, logger
  features/
    load-board/  smart container (the only component that talks to the store)
  shared/
    load-grid/   accessible virtualized grid (presentational)
    search-box/  debounced search input (presentational)
    filter-panel/ multi-criteria filters (presentational)
```

The split is deliberate: **`core` holds logic with no Angular dependency**, `features` holds the one orchestrating container, and `shared` holds dumb, reusable components. This is the boundary that lets the grid, search box, and filter panel drop into a design system unchanged — they take inputs and emit outputs, and own no business logic.

## State management

A **signal-based store service** (`LoadStore`), not NgRx. The state is small and local (raw data, query, filters, sort), so the action/reducer/effect machinery of NgRx would be pure overhead. The store holds writable signals and exposes one derived pipeline:

```
visibleLoads = computed( sort( search( filter(raw, filters), query ), sort ) )
```

Angular's signal graph memoises this and recomputes only when an input it reads actually changes. The order — **filter → search → sort** — shrinks the working set before each more expensive stage. Components read `store.visibleLoads()` and call command methods (`setQuery`, `setFilters`, `toggleSort`); they never mutate state directly.

## Search, sort, filter

All three are **pure functions in `core/utils`**, with no Angular dependency, which makes them trivially unit-testable (and they are — see the `.spec.ts` files):

- **Search**: case-insensitive substring across text fields (company, route, equipment, status, id). Debounced ~150 ms in the `SearchBoxComponent`, not in the pure function — keystroke coalescing is a UI concern.
- **Sort**: one generic, type-aware comparator. Numeric fields compare numerically; text uses locale-aware `localeCompare`; ISO date strings sort lexically (== chronologically). `Array.prototype.sort` is stable, so equal rows keep their prior order. Headers cycle **asc → desc → none**.
- **Filter**: multi-criteria predicate. **AND across categories, OR within a multi-select category**; empty selections and null bounds mean "no constraint".

## Large-dataset performance

- **CDK virtual scroll** (`cdk-virtual-scroll-viewport` + `cdkVirtualFor`, fixed `itemSize`) renders only the visible window of rows, so the DOM stays small regardless of dataset size. The viewport fills the available height via a flex chain rather than a fixed pixel height, and CDK recomputes the rendered window on resize — so the grid uses the whole screen and adapts to window size. The grid keeps a `min-height` floor (header + ~5 rows); when the window is shorter than that, the page scrolls rather than collapsing the grid toward zero rows. PageUp/PageDown read the live viewport size to stay correct after a resize.
- The provided `mockLoads.json` has 50 rows; virtual scroll is only meaningful against thousands. `LoadDataService` therefore **synthesises a large set at runtime** (tiles the seed ~200× to ~10k rows with re-keyed ids). Components are oblivious to whether they show 50 or 50,000.
- `trackBy: load.id`, `OnPush` everywhere (implicit with signals), and the memoised pipeline keep recompute cheap. Because search/sort/filter are pure and isolated, moving them to a Web Worker later would be a contained change if a dataset ever outgrew the main thread.

## Accessibility (WCAG 2.1 AA) and keyboard navigation

**Grid markup — the key decision.** Virtual scrolling transforms and recycles row elements, which breaks native `<table>` layout and semantics. So the grid implements the **WAI-ARIA grid pattern**: `role="grid"` with `role="row"`, `columnheader`, and `gridcell`, plus `aria-rowcount` / `aria-rowindex` / `aria-colcount` / `aria-colindex`. The row indices reflect the **full dataset**, so assistive tech announces true position ("row 4,213 of 10,000") even though only a window is in the DOM. This is the standards-sanctioned way to keep a virtualized list semantic.

- **Roving tabindex**: exactly one cell is in the tab order at a time. Arrow keys move between cells; Up from the first data row enters the header; Home/End, Ctrl+Home/Ctrl+End, and PageUp/PageDown are supported. Navigating to an off-screen row scrolls it into view, then moves focus — with a short retry across animation frames because virtualized rows mount asynchronously.
- **Sort headers** are real `<button>`s carrying `aria-sort` (`ascending`/`descending`/`none`); Enter/Space toggle them.
- **Search and filters** use associated `<label>`s and `fieldset`/`legend` grouping. Result counts are announced via an `aria-live="polite"` region without stealing focus. An inverted price range (min > max) surfaces an inline `role="alert"` message and `aria-invalid`/`aria-describedby` on the inputs; the invalid constraint is dropped rather than silently emptying the grid.
- **Status** is shown as text plus colour, never colour alone (1.4.1). A skip link jumps to the grid. A single high-contrast `:focus-visible` indicator is used app-wide (2.4.7). `prefers-reduced-motion` is respected.
- **Loading** is near-instant for the local dataset, so no loading indicator is shown; the grid simply renders once data is ready, and a load failure shows a `role="alert"` error state. Search/sort/filter are synchronous (memoised signal pipeline) and update instantly — only the live result count changes.

## Observability and production readiness

A `LoggerService` is the single seam for telemetry. It emits structured events (data load, filter applied, dataset expansion) and has a `measure()` helper for timing hot paths like the filter/sort pipeline. In production it would forward to a real sink (OpenTelemetry / RUM / error tracker); centralising it means the app depends on an interface, not a vendor, and gives one place to add sampling, redaction, or correlation IDs. `LoadDataService` fails soft — a fetch error yields an empty grid with a visible error state, not a crash.

## Testing strategy

The bulk of the value is in the **pure utils** (search/sort/filter/sort-cycle edge cases), tested in isolation with zero framework friction. The **store** has tests on the combined pipeline and empty/clear states. The **grid** has a focused component test on the accessibility contract: `role`/`aria-rowcount`, `aria-sort` on the right header, sort-toggle emission, and the single-focusable-cell roving-tabindex invariant. This concentrates effort on the logic and the a11y guarantees that matter most.

## How this maps to the role

- **Architecture & long-term direction** — clear core/feature/shared boundary; logic decoupled from framework; signals over heavyweight state libraries where they fit.
- **Component ownership / design-system fit** — small, composable, presentational components with explicit input/output contracts; design tokens as CSS variables.
- **Performance** — virtual scrolling + memoised derivation + OnPush, validated against a synthetic ~10k-row set.
- **Accessibility** — a deliberately chosen, standards-correct ARIA grid with full keyboard operation and screen-reader-accurate positioning.
- **Observability & testing** — a logging seam for production signals, and tests focused on logic and the accessibility contract.

## Known trade-offs

- The ARIA grid is more code than a native `<table>`, but it is the only way to keep semantics intact under virtualization — the right call for a grid that must scale.
- Synthetic data multiplication is a demo affordance; in production the data service would page or stream from an API, which the pure pipeline and virtual scroll already accommodate.
- Single-column sort only (per scope). The `SortState` model and comparator would extend to multi-column without restructuring.
