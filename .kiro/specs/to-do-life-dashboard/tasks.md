# Implementation Plan: To-Do Life Dashboard

## Overview

Build a single-page, client-side productivity dashboard using vanilla HTML, CSS, and ES Modules. Implementation proceeds layer-by-layer: shared infrastructure first, then each component, then wiring them together. All state that needs to persist uses the shared `storage.js` utility. Property-based tests (fast-check via Vitest) validate correctness properties defined in the design.

## Tasks

- [-] 1. Project scaffold and shared infrastructure
  - Create the directory structure: `index.html`, `styles.css`, and `js/` folder containing `main.js`, `greeting.js`, `timer.js`, `tasks.js`, `quicklinks.js`, `storage.js`
  - Add `package.json` with `vitest` and `fast-check` as dev dependencies and a `test` script (`vitest --run`)
  - Add `vitest.config.js` configured for jsdom environment (needed for localStorage and DOM tests)
  - Create `js/storage.js` implementing `load(key, fallback)` and `save(key, value)` with the `KEYS` constants (`todo_dashboard_tasks`, `todo_dashboard_links`), JSON serialisation, and error handling as specified in the design
  - _Requirements: 9.1, 9.4, 12.1, 12.4_

  

- [ ] 2. Greeting component
  - [-] 2.1 Implement pure helper functions in `js/greeting.js`
    - Write `getGreeting(hour)` returning "Good Morning" / "Good Afternoon" / "Good Evening" / "Good Night" per the hour ranges in the design
    - Write `formatTime(date)` returning `"hh:mm:ss AM/PM"` in 12-hour format
    - Write `formatDate(date)` returning `"Weekday, Month DD, YYYY"`
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4_


  - [~] 2.4 Implement `initGreeting(containerEl)` in `js/greeting.js`
    - Call `render()` immediately on init (no 1-second blank)
    - Set up `setInterval` at 1000 ms to call `render()`
    - `render()` reads current time, writes time, date, and greeting strings to the DOM
    - _Requirements: 1.1, 1.2, 1.3, 2.5_

- [ ] 3. Focus Timer component
  - [-] 3.1 Implement pure helper functions in `js/timer.js`
    - Write `formatCountdown(seconds)` returning `"MM:SS"` with zero-padded two-digit fields
    - Write `getControlState(status)` returning the button enable/disable map for all four statuses (`idle`, `running`, `paused`, `finished`) as specified in the design state machine
    - _Requirements: 3.2, 4.1, 4.5, 4.6_


  - [~] 3.4 Implement `initTimer(containerEl)` in `js/timer.js`
    - Initialise internal state: `{ totalSeconds: 1500, status: 'idle', intervalId: null }`
    - Render the timer display and wire up start/stop/reset button click handlers
    - Implement state machine transitions as defined in the design (Idle → Running → Paused/Finished → Idle)
    - On reset, clear `intervalId` before resetting state to prevent ghost ticks
    - Timer state is NOT persisted to localStorage
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [~] 4. Checkpoint — storage and timer
  - Ensure all tests written so far pass (`npm test`). Ask the user if questions arise before continuing.

- [ ] 5. Task List component — data layer
  - [-] 5.1 Implement `validateDescription(text)` in `js/tasks.js`
    - Invalid if trimmed length === 0 (whitespace-only) or length > 500
    - Valid if trimmed length is in [1, 500]
    - Returns `{ valid: boolean, message?: string }`
    - _Requirements: 5.1, 5.2, 6.2, 6.3_



  - [~] 5.3 Implement task CRUD operations in `js/tasks.js`
    - `createTask(description)` — validates, generates `id` via `crypto.randomUUID()` (fallback: `Date.now().toString()`), sets `completed: false`, sets `createdAt`
    - `editTask(id, description)` — validates, updates description in the in-memory array
    - `toggleTask(id)` — flips `completed` boolean
    - `deleteTask(id)` — removes task from the in-memory array
    - `loadTasks()` — calls `storage.load(KEYS.TASKS, [])` and returns the array
    - `saveTasks(tasks)` — calls `storage.save(KEYS.TASKS, tasks)` and handles `{ ok: false }` by surfacing a warning
    - Each mutation calls `saveTasks` and re-renders
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 6.1, 6.2, 6.5, 7.1, 7.3, 8.1, 8.2_


- [ ] 6. Task List component — UI layer
  - [~] 6.1 Implement `initTasks(containerEl)` in `js/tasks.js`
    - Load tasks from localStorage on init; show empty-state message if list is empty ("No tasks yet. Add one to get started!")
    - Render task list: each item shows checkbox, description text, edit button, delete button
    - Wire up add-task form: validate on submit, show inline error for invalid input, clear input and return focus on success
    - Wire up edit flow: show inline editable input with save/cancel; validate on save; restore original on cancel
    - Wire up delete: remove immediately, show 2-second success indicator, show empty state if last task deleted
    - Wire up checkbox: toggle completion status, apply strikethrough styling for completed tasks
    - Error messages rendered in `aria-live="polite"` regions; errors clear on next keystroke
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.4, 9.5_

- [ ] 7. Quick Links component — data layer
  - [-] 7.1 Implement `validateLink(name, url)` in `js/quicklinks.js`
    - name: trimmed length in [1, 50]
    - url: starts with `http://` or `https://`, length ≤ 2048
    - Returns `{ valid: boolean, message?: string }`
    - _Requirements: 10.1, 10.3, 10.4_

  - [~] 7.3 Implement Quick Link CRUD operations in `js/quicklinks.js`
    - `createLink(name, url)` — validates, enforces max 20 links, generates id, sets `createdAt`
    - `deleteLink(id)` — removes from in-memory array
    - `loadLinks()` — calls `storage.load(KEYS.LINKS, [])`
    - `saveLinks(links)` — calls `storage.save(KEYS.LINKS, links)`
    - Each mutation calls `saveLinks` and re-renders
    - _Requirements: 10.1, 10.2, 10.5, 12.1, 12.3_


- [ ] 8. Quick Links component — UI layer
  - [~] 8.1 Implement `initQuickLinks(containerEl)` in `js/quicklinks.js`
    - Load links from localStorage on init; show empty-state message if list is empty ("No quick links yet. Add your favorites!")
    - Render each link as a clickable button; clicking calls `window.open(url, '_blank')`
    - If a saved link has an empty/invalid URL at click time, show an error message instead of opening a tab
    - Wire up add-link form: validate on submit, show inline errors, clear inputs and return focus on success
    - Wire up delete button per link
    - Error messages in `aria-live="polite"` regions
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 12.1, 12.2, 12.3, 12.4_

- [~] 9. Checkpoint — all components
  - Ensure all tests pass (`npm test`). Ask the user if questions arise before continuing.

- [ ] 10. HTML structure and CSS styling
  - [~] 10.1 Build `index.html`
    - Four section containers for Greeting, Focus Timer, Task List, Quick Links
    - Import `js/main.js` as `type="module"`
    - Include `aria-live="polite"` error regions inside each component container
    - Add browser compatibility warning element (hidden by default, shown by JS when needed)
    - _Requirements: 13.1, 13.2, 15.1, 15.2, 15.3_

  - [~] 10.2 Write `styles.css`
    - Section headings at least 4 px larger than body text (≥ 20 px if body is 16 px)
    - Minimum 16 px font size for body text
    - Minimum 8 px spacing between interactive elements
    - Strikethrough + muted colour styling for completed tasks
    - Responsive single-column layout that works across target browsers
    - _Requirements: 15.1, 15.2, 15.3_

- [ ] 11. Wiring — `main.js` entry point
  - [~] 11.1 Implement `js/main.js`
    - Listen for `DOMContentLoaded`
    - Query the four container elements from the DOM
    - Call `initGreeting`, `initTimer`, `initTasks`, `initQuickLinks` passing the respective containers
    - Detect browser version and display compatibility warning if below minimum (Req 13.4)
    - _Requirements: 13.1, 13.4_

- [~] 12. Integration tests

- [~] 13. Final checkpoint
  - Ensure all tests pass (`npm test`). Review console for any runtime errors. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for full traceability
- Checkpoints ensure incremental validation after each major layer
- Property tests use fast-check with a minimum of 100 iterations and carry a tag comment referencing the property number and feature name
- Unit tests complement property tests by covering specific examples and edge cases
- The timer state is intentionally never persisted — a page reload always shows a fresh 25:00

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "5.1", "7.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "3.3", "5.2", "7.2"] },
    { "id": 3, "tasks": ["2.4", "3.4", "5.3", "7.3"] },
    { "id": 4, "tasks": ["5.4", "5.5", "5.6", "7.4", "7.5"] },
    { "id": 5, "tasks": ["6.1", "7.3", "8.1"] },
    { "id": 6, "tasks": ["10.1", "10.2"] },
    { "id": 7, "tasks": ["11.1"] },
    { "id": 8, "tasks": ["12.1"] }
  ]
}
```
