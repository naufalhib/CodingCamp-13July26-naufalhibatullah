# Implementation Plan: To-Do List Life Dashboard

## Overview

Build a zero-dependency, single-page web application using plain HTML, CSS, and Vanilla JavaScript. The app runs directly from disk with no build step or server. All persistent state lives in `localStorage`. Implementation proceeds module-by-module, wiring everything together at the end.

## Tasks

- [x] 1. Scaffold project structure and base HTML
  - [x] 1.1 Create the folder structure and empty files
    - Create `index.html`, `css/styles.css`, and `js/app.js` at the project root
    - Add HTML5 boilerplate to `index.html`: `<!DOCTYPE html>`, `<html lang="en">`, `<head>`, `<body>`
    - Link `css/styles.css` via `<link>` in `<head>` and `js/app.js` via `<script defer>` at end of `<body>`
    - _Requirements: 9.1, 9.4_

  - [x] 1.2 Add semantic HTML structure for all four modules
    - Add `<header>` with theme toggle `<button id="theme-toggle">` and `<span id="theme-icon">`
    - Add `<main class="dashboard-grid">` containing four `<section>` elements: `#greeting-module`, `#timer-module`, `#todo-module`, `#links-module`
    - Add `<div id="toast-container" aria-live="polite">` at bottom of `<body>`
    - Populate each section with the exact HTML structures defined in the design document (greeting, timer controls, duration controls, todo form + sort bar + task list, links form + links grid)
    - _Requirements: 1.1, 2.1, 4.1, 6.1_

- [x] 2. Implement the Theme system
  - [x] 2.1 Add the inline flash-prevention script and CSS custom properties
    - Add the inline `<script>` block in `<head>` (before any stylesheet) that reads `localStorage.getItem("theme")` and sets `data-theme` on `<html>` synchronously
    - In `css/styles.css`, define CSS custom properties for both `:root[data-theme="light"]` and `:root[data-theme="dark"]` as specified in the design (7 properties each: `--bg-primary`, `--bg-secondary`, `--text-primary`, `--text-secondary`, `--accent`, `--border`, `--shadow`)
    - Apply the custom properties to `body`, module sections, inputs, and buttons via CSS rules
    - _Requirements: 7.3, 7.4, 7.6, 7.7, 7.8_

  - [x] 2.2 Implement `initTheme()` and `toggleTheme()` in `js/app.js`
    - Define `appState` object with all fields from the design's in-memory shape
    - Implement `initTheme()`: reads the `data-theme` attribute already set by the inline script, syncs `appState.theme`, and sets the correct icon (🌙 for light, ☀️ for dark)
    - Implement `toggleTheme()`: flips `appState.theme`, updates `data-theme` on `document.documentElement`, updates `#theme-icon` text, calls `StorageLayer.write("theme", appState.theme)`
    - Attach `click` listener to `#theme-toggle` calling `toggleTheme()`
    - _Requirements: 7.1, 7.2, 7.5_

- [x] 3. Implement the Storage Layer and Toast system
  - [x] 3.1 Implement `StorageLayer` and `showToast()` in `js/app.js`
    - Implement `StorageLayer.read(key, defaultValue)` with try/catch: returns parsed JSON or `defaultValue` on null/error; calls `showToast` on read error
    - Implement `StorageLayer.write(key, value)` with try/catch: serializes to JSON; calls `showToast` on write error
    - Implement `showToast(message, durationMs = 5000)`: creates `<div class="toast">`, appends to `#toast-container`, removes it after `durationMs` via `setTimeout`
    - Style `.toast` in `css/styles.css`: fixed bottom-right, z-index above all content, readable contrast
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 3.2 Write property test for storage round-trip (Property 14)
    - **Property 14: Storage Round-Trip Preserves All Data**
    - For any valid combination of tasks array, quickLinks array, pomodoroDuration integer (1–90), and theme string, `StorageLayer.write` then `StorageLayer.read` must return deeply equal values
    - **Validates: Requirements 8.1, 3.7, 4.9, 6.5**

- [x] 4. Implement the Greeting Module
  - [x] 4.1 Implement pure helper functions: `getGreeting()`, `formatTime()`, `formatDate()`
    - `getGreeting(hour)`: returns "Good Morning" for hours 5–11, "Good Afternoon" for 12–17, "Good Evening" for 18–23 and 0–4
    - `formatTime(date)`: returns zero-padded "HH:MM:SS" string from a `Date` object
    - `formatDate(date)`: returns "Weekday, Month Day, Year" string (e.g., "Friday, July 18, 2025") using `date.toLocaleDateString` or manual lookup arrays
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 4.2 Write property tests for greeting helpers (Properties 1, 2, 3)
    - **Property 1: Date Formatting Contains All Required Components** — `formatDate(date)` contains full weekday, month, day, year matching the input date. **Validates: Requirements 1.1**
    - **Property 2: Time Formatting Produces Zero-Padded HH:MM:SS** — `formatTime(date)` matches pattern `HH:MM:SS` with correct zero-padding. **Validates: Requirements 1.2**
    - **Property 3: Greeting Correctness Across All Hours** — `getGreeting(hour)` returns exactly the correct string for all integers 0–23. **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

  - [x] 4.3 Implement `initGreeting()` and `updateClock()`
    - `updateClock()`: calls `new Date()` inside try/catch; on success updates `#greeting-text`, `#current-date`, `#current-time` via `textContent`; on failure sets `#current-time` to `"--:--:--"` and clears `#greeting-text`
    - `initGreeting()`: calls `updateClock()` once, then sets `setInterval(updateClock, 1000)` and stores the handle
    - _Requirements: 1.2, 1.7_

- [x] 5. Implement the Pomodoro Timer Module
  - [x] 5.1 Implement pure helper `formatTimerDisplay()` and timer state functions
    - `formatTimerDisplay(seconds)`: returns zero-padded `"MM:SS"` for any integer 0–5400
    - `startTimer()`: sets `appState.timer.running = true`, sets `appState.timer.intervalId = setInterval(tickTimer, 1000)`, hides the complete indicator
    - `stopTimer()`: clears the interval, sets `appState.timer.running = false`, retains `appState.timer.remaining`
    - `resetTimer()`: calls `stopTimer()`, sets `appState.timer.remaining = appState.pomodoroDuration`, updates `#timer-display`
    - `tickTimer()`: decrements `appState.timer.remaining`; updates `#timer-display`; calls `onTimerComplete()` when remaining reaches 0
    - `onTimerComplete()`: calls `stopTimer()`, shows `#timer-complete-indicator`, calls `playAlertSound()`
    - `playAlertSound()`: creates a short beep using Web Audio API (`AudioContext`, `OscillatorNode`), ≤3 seconds duration
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 5.2 Write property test for timer display formatting (Property 4)
    - **Property 4: Timer Display Formatting Produces Zero-Padded MM:SS**
    - For any integer seconds in [0, 5400], `formatTimerDisplay(seconds)` matches `MM:SS` and `(MM * 60) + SS === seconds`
    - **Validates: Requirements 2.1**

  - [x] 5.3 Implement `setDuration()` and timer button wiring in `initTimer()`
    - `setDuration(minutes)`: clamps to [1, 90], converts to seconds, stores in `appState.pomodoroDuration`; if timer is running calls `stopTimer()` then `resetTimer()`; updates `#duration-input` value; calls `StorageLayer.write("pomodoro_duration", minutes)`
    - `initTimer()`: reads `StorageLayer.read("pomodoro_duration", 25)`, validates range (discard if invalid, use 25), calls `setDuration`, renders display
    - Attach `click` listeners to `#timer-start`, `#timer-stop`, `#timer-reset`, `#duration-increment`, `#duration-decrement`; attach `change`/`input` listener to `#duration-input`
    - Start button handler: if `appState.timer.remaining === 0` call `resetTimer()` first, then `startTimer()`
    - _Requirements: 2.6, 2.7, 2.8, 2.9, 3.1, 3.2, 3.3, 3.6, 3.7_

  - [ ]* 5.4 Write property test for duration clamping (Property 5)
    - **Property 5: Duration Clamping Invariant**
    - For any numeric input `m`, the result of `setDuration(m)` must satisfy `1 ≤ appState.pomodoroDuration/60 ≤ 90`
    - **Validates: Requirements 3.4, 3.5**

- [x] 6. Checkpoint — Ensure all tests pass and core modules render
  - Ensure the page loads without JS errors in the browser console
  - Verify greeting, timer display, and theme toggle are functional
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement the To-Do List Module
  - [x] 7.1 Implement pure helpers: `validateTaskTitle()` and `sortTasks()`
    - `validateTaskTitle(title)`: returns `{ valid: true }` if `title.trim().length` is in [1, 200]; otherwise `{ valid: false, error: "..." }`
    - `sortTasks(tasks, option)`: pure function returning a new sorted array (does not mutate input); implements all 6 sort options using the index-based tie-breaking strategy described in the design
    - _Requirements: 4.1, 4.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [ ]* 7.2 Write property tests for task validation and sort (Properties 6, 9, 10, 11)
    - **Property 6: Task Title Validation Correctness** — `validateTaskTitle(s)` returns valid iff trimmed length in [1, 200]. **Validates: Requirements 4.1, 4.2**
    - **Property 9: Sort by Timestamp Orders Tasks Correctly** — "Newest First" and "Oldest First" produce monotone createdAt ordering; does not mutate input array. **Validates: Requirements 5.3, 5.4**
    - **Property 10: Alphabetical Sort is Case-Insensitive and Total** — "A–Z" and "Z–A" produce monotone case-insensitive ordering; does not mutate input. **Validates: Requirements 5.5, 5.6**
    - **Property 11: Status-Based Sort Groups Tasks Correctly** — "Pending First" and "Completed First" correctly group tasks while preserving intra-group insertion order. **Validates: Requirements 5.7, 5.8**

  - [x] 7.3 Implement `renderTaskList()` and `initTodo()`
    - `renderTaskList()`: reads `sortTasks(appState.tasks, appState.sortOption)`, clears `#task-list`, and rebuilds it by creating `<li>` elements matching the design's task row HTML structure; applies `.completed` class and checked checkbox state for completed tasks
    - `initTodo()`: calls `StorageLayer.read("tasks", [])`, validates it is an array (show toast + default to `[]` if not), sets `appState.tasks`, sets `appState.sortOption` to `"Newest First"`, calls `renderTaskList()`
    - _Requirements: 4.10, 4.11, 5.1, 5.2_

  - [x] 7.4 Implement task CRUD: `addTask()`, `editTask()`, `toggleTask()`, `deleteTask()`
    - `addTask(title)`: calls `validateTaskTitle`; on failure shows inline error in `#todo-input-error` without clearing the input; on success creates a Task object with `crypto.randomUUID()` (fallback `Date.now().toString()`), `Date.now()`, `"pending"` status; pushes to `appState.tasks`; calls `StorageLayer.write("tasks", appState.tasks)`; calls `renderTaskList()`
    - `toggleTask(id)`: finds task by id, flips status, calls `StorageLayer.write`, calls `renderTaskList()`
    - `deleteTask(id)`: filters task from array, calls `StorageLayer.write`, calls `renderTaskList()`
    - `editTask(id, newTitle)`: calls `validateTaskTitle`; on failure shows inline error and retains original title; on success mutates title, calls `StorageLayer.write`, calls `renderTaskList()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [ ]* 7.5 Write property tests for task toggle and deletion (Properties 7, 8)
    - **Property 7: Task Status Toggle Round-Trip** — toggling status twice returns the original status; single toggle produces the opposite. **Validates: Requirements 4.6, 4.7**
    - **Property 8: Task Deletion Removes Task Permanently** — after `deleteTask(id)`, no task with that id exists and list length decreases by exactly one. **Validates: Requirements 4.8**

  - [x] 7.6 Wire task list event listeners (add, sort, edit, complete, delete)
    - Attach `click` listener to `#todo-add-btn` (and `keydown Enter` on `#todo-input`) calling `addTask(#todo-input.value)`; clear input and error on success
    - Attach `change` listener to `#sort-dropdown`: updates `appState.sortOption`, calls `renderTaskList()`
    - Attach delegated `click` listener on `#task-list` for `.task-complete-toggle`, `.task-edit-btn`, `.task-delete-btn`, `.task-edit-confirm`, `.task-edit-cancel`
    - Edit mode: swap `.task-title` span for `.task-edit-input` + Save/Cancel buttons; cancel restores original span
    - _Requirements: 4.3, 4.4, 4.5, 5.2, 5.10_

- [x] 8. Implement the Quick Links Module
  - [x] 8.1 Implement pure helpers: `validateLink()` and `isValidUrl()`
    - `isValidUrl(url)`: returns `true` if `url.startsWith("http://")` or `url.startsWith("https://")`
    - `validateLink(label, url)`: returns `{ valid: true }` if trimmed label length is in [1, 50] AND `isValidUrl(url)` is true; otherwise `{ valid: false, errors: [...] }`
    - _Requirements: 6.1, 6.2_

  - [ ]* 8.2 Write property test for link validation (Property 12)
    - **Property 12: Link Validation Correctness**
    - For any (label, url) pair, `validateLink` returns valid iff trimmed label length in [1, 50] AND url starts with http:// or https://
    - **Validates: Requirements 6.1, 6.2**

  - [x] 8.3 Implement `renderLinksGrid()`, `addLink()`, `deleteLink()`, and `initLinks()`
    - `renderLinksGrid()`: clears `#links-grid`, rebuilds link items from `appState.quickLinks` using the design's link-button HTML (with `target="_blank"` and `rel="noopener noreferrer"`); if count ≥ 50, shows `#links-limit-msg` and disables `#link-add-btn`; otherwise hides limit message and enables button
    - `addLink(label, url)`: calls `validateLink`; on failure shows inline error in `#link-input-error` and retains field values; on success creates QuickLink with UUID, pushes to `appState.quickLinks`, calls `StorageLayer.write("quick_links", ...)`, calls `renderLinksGrid()`
    - `deleteLink(id)`: filters from array, calls `StorageLayer.write`, calls `renderLinksGrid()`
    - `initLinks()`: calls `StorageLayer.read("quick_links", [])`, validates array (toast + default on corrupt), sets `appState.quickLinks`, calls `renderLinksGrid()`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 8.4 Write property test for link deletion (Property 13)
    - **Property 13: Link Deletion Removes Link Permanently**
    - After `deleteLink(id)`, no link with that id exists and list length decreases by exactly one
    - **Validates: Requirements 6.4**

  - [x] 8.5 Wire quick links event listeners
    - Attach `click` listener to `#link-add-btn` calling `addLink(labelInput.value, urlInput.value)`; clear inputs and error on success
    - Attach delegated `click` listener on `#links-grid` for `.link-delete-btn`
    - _Requirements: 6.1, 6.4_

- [x] 9. Checkpoint — Ensure all tests pass and full feature set is functional
  - Verify all four modules are interactive and persist data across page reloads
  - Verify theme toggle and flash prevention work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement responsive layout and cross-cutting styles
  - [x] 10.1 Implement CSS Grid layout and mobile-first breakpoints in `css/styles.css`
    - Set `box-sizing: border-box` globally
    - Set `overflow-x: hidden` on `body`
    - Implement `.dashboard-grid` with `grid-template-columns: 1fr` at baseline (320px+)
    - Add `@media (min-width: 768px)` breakpoint: 2-column grid
    - Add `@media (min-width: 1200px)` breakpoint: 3-column grid with `max-width: 1400px; margin: 0 auto`
    - Add `@media (min-width: 1600px)` breakpoint: 4-column grid
    - _Requirements: 9.3_

  - [x] 10.2 Apply accessibility and touch-target styles
    - Add `min-width: 44px; min-height: 44px` (or equivalent padding) to all interactive controls (buttons, checkboxes, select)
    - Add `aria-label` attributes to icon-only buttons (`#theme-toggle`, `.task-edit-btn`, `.task-delete-btn`, `.link-delete-btn`, `#duration-increment`, `#duration-decrement`)
    - Add `aria-hidden="true"` to decorative icon spans
    - Add `word-break: break-word` to `.task-title` and `.link-item a` to handle long text
    - Ensure visible focus indicators (`:focus-visible` outline) on all interactive elements
    - _Requirements: 9.3_

- [x] 11. Wire `init()` and final integration
  - [x] 11.1 Implement `init()` and call all module init functions
    - Define `function init()` that calls `initTheme()`, `initGreeting()`, `initTimer()`, `initTodo()`, `initLinks()` in order
    - Attach `document.addEventListener("DOMContentLoaded", init)` at the bottom of `js/app.js`
    - Verify no global variable leaks by wrapping the entire `app.js` contents in an IIFE or by using `const`/`let` exclusively
    - _Requirements: 9.1, 9.2_

  - [x] 11.2 Perform final cross-browser and responsive sanity checks
    - Open `index.html` directly from disk in Chrome and Firefox; verify no console errors
    - Resize browser window to 320px, 768px, 1200px, and 1600px; verify no horizontal overflow and all controls are reachable
    - Verify that a page reload after adding tasks, links, and changing duration restores all state correctly
    - _Requirements: 9.3, 9.4_

- [x] 12. Final checkpoint — Ensure all tests pass
  - Run any automated tests if set up; verify zero failures
  - Confirm localStorage round-trips for all four keys
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP (especially since no test framework setup is required per project constraints)
- All property test sub-tasks assume **fast-check** as the PBT library — if tests are run, install it as a dev dependency: `npm install --save-dev fast-check`
- Each task references specific requirements for traceability
- The inline `<script>` in `<head>` for theme detection is the key to preventing flash-of-wrong-theme — it must appear before the `<link>` to `css/styles.css`
- `crypto.randomUUID()` is available in all modern browsers; the `Date.now().toString()` fallback is for edge cases

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "3.1"] },
    { "id": 3, "tasks": ["2.2", "3.2", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "5.1", "7.1", "8.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "7.2", "7.3", "8.2", "8.3"] },
    { "id": 6, "tasks": ["5.4", "7.4", "7.5", "8.4", "8.5"] },
    { "id": 7, "tasks": ["7.6", "10.1", "10.2"] },
    { "id": 8, "tasks": ["11.1"] },
    { "id": 9, "tasks": ["11.2"] }
  ]
}
```
