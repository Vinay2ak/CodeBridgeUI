# Implementation Progress - Freelancer Developer Workspace

## Part B Plan
1. Code state & services: useFiles, highlight.js core, gate.ts & gate.test.ts, commands.ts & commands.test.ts, mock runner.
2. Code pane UI: FileExplorer, CodeTabs, CodeView, CodeEditor, code.css syntax tokens, AI context "Open" button.
3. Dock: Terminal (boot logs, history, commands) & Tests runner (streaming progress, stale banner, Brief criteria sync).
4. Submission & Dev drawer: SubmissionPanel (gate checklist, notes, escrow sync), DevDrawer (503 toggles, scenarios).
5. Layout, accessibility & docs: 3-column / mobile tabs, keyboard shortcuts modal, contract & README update, verification.

## Part B Phases
- [x] **Phase 1: Code state and services**
  - `features/code/useFiles.ts` (tree, tabs max 6, drafts, dirty/saved tracking)
  - `features/code/highlight.ts` (highlight.js/lib/core with 9 languages)
  - `features/submission/gate.ts` & `features/submission/gate.test.ts` (>=8 tests)
  - `features/dock/commands.ts` & `features/dock/commands.test.ts` (>=6 tests)
  - Enhanced mock handlers & simulator (mock.workspace.files.v1 persistence, test streaming, gate validation)
- [x] **Phase 2: Explorer, tabs, viewer, editor**
  - `FileExplorer` (tree, collapsible, changed badges, Changes list modal)
  - `CodeTabs` (dirty dot, close, tablist navigation)
  - `CodeView` & `CodeEditor` (synced gutter, Tab 2 spaces, Esc, Ctrl+S)
  - `src/styles/code.css` token-based syntax styles without color literals
  - AI Context tab "Open" button integration
- [x] **Phase 3: Dock: terminal and tests**
  - Collapsible `Dock` (Terminal & Tests tabs, Ctrl+` focus)
  - `Terminal` (boot logs, dev@workspace prompt, command history)
  - `Tests` panel (Run tests, Ctrl+Enter, progressbar, live CbEvents, stale indicator)
  - `BriefTab` criteria status chips updated from latest run
- [x] **Phase 4: Submission panel and dev drawer**
  - `SubmissionPanel` (checklist reasons, notes counter, In review state, reviewer feedback alert)
  - `DevDrawer` (Ctrl+Shift+D, session claims, API call ring log, 503 toggles, scenarios)
- [x] **Phase 5: Layout, accessibility, docs**
  - 3-column desktop & responsive mobile Run tab auto-switching
  - Shortcuts modal dialog (Ctrl+S, Ctrl+Enter, Ctrl+`, Ctrl+Shift+D)
  - Update `README.md`, `CROSS_APP_CONTRACT.md`, `.env.example`, verify build & tests

---
## Completed in Part A
- [x] Phase 1: Scaffold, theme, guards for the theme
- [x] Phase 2: Core: http, session, guards, realtime
- [x] Phase 3: Services and mocks
- [x] Phase 4: Page shell, escrow bar, task panel, workspace status
- [x] Phase 5: Packaging and docs

---
## Feature: modern Select
1. Audit all native <select> elements across src and record list in PROGRESS.md.
2. Implement pure selection and placement logic in src/components/ui/Select/logic.ts.
3. Write comprehensive unit test suite in src/components/ui/Select/logic.test.ts (>=14 cases).
4. Implement custom Select component with WAI-ARIA combobox, frosted glass popover, and select.css.
5. Import select.css into src/main.tsx and verify design tokens without color literals.
6. Replace all non-exempt native selects across features (portfolio availability, runner image, task switchers).
7. Document API and keyboard shortcuts in README.md and update PROGRESS.md.
8. Verify production build (npm run build) and vitest suite (npx vitest run).

### Native Select Audit
- `src/features/portfolio/VerifiedPortfolioView.tsx:380`: Freelancer availability status selection, 3 options, controlled value/onChange.
- `src/features/portfolio/VerifiedPortfolioView.tsx:519`: Default workspace runner container image selection, 3 options, controlled value/onChange.
- `src/features/task/TaskSwitcher.tsx:52`: Active workspace task switcher, dynamic options, controlled value/onChange.
- `src/features/workspace/ControlledWorkspaceView.tsx:143`: Switch workspace task, dynamic options, controlled value/onChange.
- Exception (retained native): `src/components/dev/DevDrawer.tsx:250`: Developer diagnostics test scenario picker (dev drawer internal diagnostic utility).

### Replaced Files
- `src/features/portfolio/VerifiedPortfolioView.tsx`:
  - Replaced availability select with `<Select>` (tones: success, primary, muted).
  - Replaced default runner image select with `<Select>`.
- `src/features/task/TaskSwitcher.tsx`:
  - Replaced task switcher select with `<Select size="sm">`.
- `src/features/workspace/ControlledWorkspaceView.tsx`:
  - Replaced task switch select with `<Select size="sm">`.

### Phases
- [x] Phase 1: Audit and pure logic (tested)
- [x] Phase 2: The component (Select.tsx, useSelect.ts, select.css, index.ts)
- [x] Phase 3: Replace every native select
- [x] Phase 4: Docs and checks

