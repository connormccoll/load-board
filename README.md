# Freight Load Board Application

## Getting Started

**Prerequisites:** Node.js `^22.22.3 || ^24.15.0 || ^26.0.0` (Angular 22
requirement) and npm.

```bash
npm install                    # install dependencies (requires npm registry access)
npx playwright install chromium # one-time: browser used by the Vitest test runner
npm start                      # dev server at http://localhost:4200
npm run build                  # production build to dist/
npm test                       # unit tests (Vitest, headless Chromium)
```

The app loads `src/data/mockLoads.json` (50 rows) and tiles it to ~10,000 rows
at runtime to exercise virtual scrolling. The multiplier lives in
`src/app/features/load-board/load-board.component.ts` (`DATASET_MULTIPLIER`);
set it to `1` to use the seed data unchanged.

**Built with:** Angular 22 — standalone components, signals, and **zoneless**
change detection. TypeScript 6 strict mode. Angular CDK virtual
scroll for the grid body. Unit tests run on **Vitest** via the
`@angular/build:unit-test` builder. No UI component libraries.

### Using the grid

- **Search:** type in the search box; results update as you type.
- **Sort:** click a column header, or focus it and press Enter/Space. Cycles
  ascending → descending → unsorted.
- **Filter:** equipment type, status (multi-select), and a price range —
  combinable simultaneously.
- **Keyboard:** Tab to the grid, then Arrow keys to move between cells; Up from
  the first row enters the header; Home/End, Ctrl+Home/Ctrl+End, and
  PageUp/PageDown navigate; Enter/Space on a header toggles sort.

Architecture decisions are documented in
[`src/spec/ARCHITECTURE.md`](src/spec/ARCHITECTURE.md).

---

## Business Context

Build a web application for logistics coordinators to manage freight shipments. Dispatchers need to quickly find and assign available loads to drivers throughout their day.

## Acceptance Criteria

### As a dispatcher, I need to:

1. **View all available freight loads** with complete information including company, locations, weight, equipment type, date, price, distance, and current status

2. **Search across loads** to quickly find shipments matching specific criteria, with results updating as I type

3. **Sort the load list** by any field in ascending or descending order to prioritize based on business needs

4. **Filter loads** using multiple criteria simultaneously to narrow down to exactly what I need

5. **Navigate through large datasets** efficiently without performance degradation

6. **Use keyboard-only navigation** to work efficiently without switching between keyboard and mouse

7. **Access all functionality with assistive technologies** as some of our dispatchers rely on screen readers

## Constraints

- Must be a web application
- Must handle large datasets efficiently
- Must meet WCAG 2.1 Level AA accessibility standards
- Mock Data is provided (`src/data/mockLoads.json`)

## Deliverables

1. Working application
2. Setup instructions
3. Brief document explaining your architecture decisions (add to `src/spec` folder)

>  AI assistance is allowed and expected - we want to see how you work with modern tools.

---

We're interested in seeing how you approach this problem and the technical decisions you make.