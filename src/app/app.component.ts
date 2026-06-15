import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LoadBoardComponent } from './features/load-board/load-board.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LoadBoardComponent],
  template: `
    <a class="skip-link" href="#load-grid">Skip to load grid</a>
    <header class="app-header">
      <h1>Freight Load Board</h1>
    </header>
    <main>
      <app-load-board />
    </main>
  `,
  styles: [
    `
      /* Full-height flex column so the grid fills the viewport and resizes with
         the window. min-height (not height) lets the page grow and scroll when
         the window is shorter than the grid's minimum height. */
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100dvh;
      }
      .app-header {
        padding: var(--space-3) var(--space-4);
        border-bottom: 1px solid var(--color-border);
        flex: 0 0 auto;
      }
      h1 {
        margin: 0;
        font-size: 18px;
      }
      main {
        padding: var(--space-4);
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class AppComponent {}
