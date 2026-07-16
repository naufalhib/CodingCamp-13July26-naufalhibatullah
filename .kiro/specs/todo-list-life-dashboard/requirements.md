# Requirements Document

## Introduction

The To-Do List Life Dashboard is a single-page web application built with HTML, CSS, and Vanilla JavaScript. It helps users organize their daily activities through four core modules: a time-based greeting, a Pomodoro focus timer, a sortable to-do list, and a quick-links panel to favourite websites. All data is persisted client-side using the browser's LocalStorage API. The application supports light/dark mode toggling and custom Pomodoro durations.

## Glossary

- **Dashboard**: The single-page web application that contains all four feature modules.
- **Greeting_Widget**: The UI section that displays the current time, date, and a time-sensitive greeting message.
- **Focus_Timer**: The Pomodoro focus timer section with start, stop, reset controls and custom duration settings.
- **Todo_Module**: The to-do list section where tasks can be added, edited, marked complete, and deleted.
- **Quick_Link**: The quick-links section where shortcut buttons to favorite websites are managed.
- **Storage**: The browser's LocalStorage API used to persist all user data client-side.
- **Theme**: The visual color palette of the Dashboard, either light or dark.
- **Task**: A to-do item with a title, creation timestamp, and completion status.
- **Pomodoro_Duration**: The configurable countdown duration for the Timer_Module, defaulting to 25 minutes.
- **Sort_Option**: A user-selected ordering rule applied to the task list display.
- **Quick_Link**: A saved entry containing a label and URL that renders as a clickable button.
- **Modern Browser**: Chrome, Firefox, Edge, or Safari at Currently supported release version.

---

## Requirements

### Requirement 1: Greeting Module

**User Story:** As a user, I want to see the current time, date, and a contextual greeting, so that I have an immediate sense of the current moment when I open the dashboard.

#### Acceptance Criteria

1. THE Greeting_Module SHALL display the current date using the full weekday name, full month name, numeric day, and four-digit year (e.g., "Friday, July 18, 2025").
2. THE Greeting_Module SHALL display the current time in 24-hour HH:MM:SS format sourced from the local system clock, updating every second.
3. WHEN the local hour is between 05:00 and 11:59, THE Greeting_Module SHALL display the greeting "Good Morning".
4. WHEN the local hour is between 12:00 and 17:59, THE Greeting_Module SHALL display the greeting "Good Afternoon".
5. WHEN the local hour is between 18:00 and 23:59, THE Greeting_Module SHALL display the greeting "Good Evening".
6. WHEN the local hour is between 00:00 and 04:59, THE Greeting_Module SHALL display the greeting "Good Evening".
7. IF the system clock is unavailable or returns an invalid value, THEN THE Greeting_Module SHALL display a placeholder string (e.g., "--:--:--") for the time and omit the greeting message.

---

### Requirement 2: Pomodoro Focus Timer

**User Story:** As a user, I want a Pomodoro countdown timer, so that I can manage focused work sessions effectively.

#### Acceptance Criteria

1. THE Timer_Module SHALL display the remaining time in MM:SS format, where MM is zero-padded minutes and SS is zero-padded seconds.
2. WHEN the user activates the Start button and the timer is not running, THE Timer_Module SHALL begin counting down from the current Pomodoro_Duration at a rate of one second per second.
3. WHEN the user activates the Stop button and the timer is running, THE Timer_Module SHALL pause the countdown and retain the remaining time at the moment of pausing.
4. WHEN the user activates the Reset button, THE Timer_Module SHALL stop any active countdown and reset the displayed time to the current Pomodoro_Duration.
5. WHEN the countdown reaches 00:00, THE Timer_Module SHALL stop automatically, display a visual completion indicator, and emit an audible alert of at most 3 seconds duration.
6. THE Timer_Module SHALL default to a Pomodoro_Duration of 25 minutes (1500 seconds) on first load when no saved value exists in Storage.
7. WHEN Storage contains a saved Pomodoro_Duration within the valid range of 1 to 90 minutes, THE Timer_Module SHALL initialize with that saved duration.
8. WHEN the user activates the Start button and the displayed time is 00:00, THE Timer_Module SHALL reset to the current Pomodoro_Duration before starting the countdown.
9. IF Storage contains a saved Pomodoro_Duration that is outside the valid range or is not a number, THEN THE Timer_Module SHALL discard the stored value and initialize with the 25-minute default.

---

### Requirement 3: Custom Pomodoro Duration

**User Story:** As a user, I want to customize the Pomodoro timer duration, so that I can adapt work sessions to my personal focus style.

#### Acceptance Criteria

1. THE Timer_Module SHALL provide controls (increment/decrement buttons or a numeric input) to change the Pomodoro_Duration to any whole number of minutes.
2. WHEN the user changes the Pomodoro_Duration and the timer is not running, THE Timer_Module SHALL update the displayed countdown to reflect the new duration within 100 milliseconds.
3. WHEN the user changes the Pomodoro_Duration while the timer is running, THE Timer_Module SHALL stop the countdown, reset elapsed time to zero, apply the new duration, and not auto-start.
4. THE Timer_Module SHALL enforce a minimum Pomodoro_Duration of 1 minute and a maximum of 90 minutes; whole-number values only.
5. IF the user enters a Pomodoro_Duration outside the valid range, THEN THE Timer_Module SHALL clamp the value to the nearest boundary (1 or 90) and display the clamped value.
6. WHEN the user confirms a new Pomodoro_Duration, THE Storage SHALL persist the new value within 500 milliseconds.
7. WHEN the page loads, THE Timer_Module SHALL restore the last persisted Pomodoro_Duration from Storage and display it as the initial countdown value.

---

### Requirement 4: To-Do List — Task Management

**User Story:** As a user, I want to add, edit, complete, and delete tasks, so that I can track and manage my daily activities.

#### Acceptance Criteria

1. WHEN the user submits a non-empty task title between 1 and 200 characters, THE Todo_Module SHALL add a new Task to the list with the current timestamp as the creation date and a default status of pending.
2. IF the user submits an empty task title or a title exceeding 200 characters, THEN THE Todo_Module SHALL reject the submission and display an inline validation message without clearing the input field.
3. WHEN the user activates the edit control on a Task, THE Todo_Module SHALL switch the Task row into an inline edit mode, pre-populating the input with the current title.
4. WHEN the user confirms an inline edit with a valid title (1–200 characters, non-empty), THE Todo_Module SHALL save the updated title and exit inline edit mode.
5. IF the user confirms an inline edit with an empty or invalid title, THEN THE Todo_Module SHALL display an inline validation message and retain the original title.
6. WHEN the user activates the complete control on a pending Task, THE Todo_Module SHALL update the Task status to completed and apply a strikethrough style to the title.
7. WHEN the user activates the complete control on a completed Task, THE Todo_Module SHALL update the Task status back to pending and remove the strikethrough style.
8. WHEN the user activates the delete control on a Task, THE Todo_Module SHALL remove the Task from the list permanently.
9. WHEN any Task is added, edited, completed, or deleted, THE Storage SHALL persist the updated task list within 500 milliseconds.
10. WHEN the page loads and Storage contains a saved task list, THE Todo_Module SHALL restore and display all saved Tasks within 1 second.
11. IF Storage is unavailable on page load, THEN THE Todo_Module SHALL initialize with an empty task list and display a non-blocking warning notification to the user.

---

### Requirement 5: To-Do List — Sorting

**User Story:** As a user, I want to sort my task list by different criteria, so that I can view tasks in the order most useful to me.

#### Acceptance Criteria

1. THE Todo_Module SHALL provide a sort dropdown containing exactly these options: "Newest First", "Oldest First", "A–Z", "Z–A", "Pending First", "Completed First".
2. WHEN the user selects a Sort_Option from the dropdown, THE Todo_Module SHALL re-render the task list in the selected order within 300 milliseconds without a page refresh, and the dropdown SHALL reflect the active selection.
3. WHEN Sort_Option is "Newest First", THE Todo_Module SHALL order Tasks so that the Task with the most recent creation timestamp appears first.
4. WHEN Sort_Option is "Oldest First", THE Todo_Module SHALL order Tasks so that the Task with the earliest creation timestamp appears first.
5. WHEN Sort_Option is "A–Z", THE Todo_Module SHALL order Tasks alphabetically by title in ascending order, treating uppercase and lowercase letters as equivalent.
6. WHEN Sort_Option is "Z–A", THE Todo_Module SHALL order Tasks alphabetically by title in descending order, treating uppercase and lowercase letters as equivalent.
7. WHEN Sort_Option is "Pending First", THE Todo_Module SHALL place all pending Tasks before completed Tasks, preserving relative insertion order within each group.
8. WHEN Sort_Option is "Completed First", THE Todo_Module SHALL place all completed Tasks before pending Tasks, preserving relative insertion order within each group.
9. WHEN two Tasks share an identical creation timestamp, THE Todo_Module SHALL break the tie by preserving their original insertion order.
10. WHEN the task list is empty and the user selects any Sort_Option, THE Todo_Module SHALL update the dropdown selection and render an empty list without throwing an error.

---

### Requirement 6: Quick Links

**User Story:** As a user, I want to save and access favorite website links from the dashboard, so that I can navigate to frequently used sites with a single click.

#### Acceptance Criteria

1. WHEN the user submits a label between 1 and 50 characters and a URL beginning with `http://` or `https://`, THE Links_Module SHALL add a new Quick_Link and render it as a clickable button within 300 milliseconds.
2. IF the user submits an empty label, a label exceeding 50 characters, or a URL that does not begin with `http://` or `https://`, THEN THE Links_Module SHALL reject the submission, display an inline validation message, and retain the entered values in the input fields.
3. WHEN the user activates a Quick_Link button, THE Dashboard SHALL open the associated URL in a new browser tab without navigating away from the current page.
4. WHEN the user activates the delete control on a Quick_Link, THE Links_Module SHALL remove that Quick_Link from the display permanently, and it SHALL NOT reappear on the next page load.
5. WHEN any Quick_Link is added or deleted, THE Storage SHALL persist the updated links list within 500 milliseconds.
6. WHEN the page loads and Storage contains a saved links list, THE Links_Module SHALL restore and display all saved Quick_Links within 1 second.
7. IF the total number of saved Quick_Links reaches 50, THEN THE Links_Module SHALL disable the add control and display an inline message indicating the limit has been reached.

---

### Requirement 7: Light/Dark Mode

**User Story:** As a user, I want to toggle between light and dark color themes, so that I can use the dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL display a toggle button in the header showing a moon icon when the active Theme is light and a sun icon when the active Theme is dark.
2. WHEN the user activates the theme toggle button, THE Dashboard SHALL switch the entire UI color palette to the opposite Theme within 100 milliseconds.
3. WHILE Theme is dark, THE Dashboard SHALL apply a dark background color and a light foreground color palette across all modules.
4. WHILE Theme is light, THE Dashboard SHALL apply a light background color and a dark foreground color palette across all modules.
5. WHEN the user activates the theme toggle button, THE Storage SHALL persist the selected Theme within 500 milliseconds.
6. WHEN the page loads and Storage contains a saved Theme value of "dark" or "light", THE Dashboard SHALL apply that Theme synchronously before rendering any visible content, preventing a flash of the wrong theme.
7. THE Dashboard SHALL default to light mode on first load when no saved Theme exists in Storage.
8. IF Storage returns an unrecognized or corrupt Theme value on page load, THEN THE Dashboard SHALL default to light mode.

---

### Requirement 8: Data Persistence and Storage

**User Story:** As a user, I want all my data to be saved automatically, so that my tasks, links, timer settings, and theme preference are still present when I reopen the dashboard.

#### Acceptance Criteria

1. THE Storage SHALL persist the task list, the links list, the Pomodoro_Duration, and the Theme as separate, named keys in LocalStorage.
2. WHEN a LocalStorage write operation throws an exception, THE Dashboard SHALL display a non-blocking toast notification that auto-dismisses within 5 seconds and does not prevent the user from continuing to interact with the Dashboard.
3. WHEN a LocalStorage read operation throws an exception, THE Dashboard SHALL fall back to the in-memory default for that data key and display a non-blocking toast notification that auto-dismisses within 5 seconds.
4. THE Dashboard SHALL load entirely from local files without requiring a network connection or server.

---

### Requirement 9: Performance and Responsiveness

**User Story:** As a user, I want the dashboard to feel fast and work on any modern browser, so that I can rely on it as a daily productivity tool.

#### Acceptance Criteria

1. THE Dashboard SHALL render the initial view within 2 seconds on a device with a mid-range CPU (equivalent to an Intel Core i5 or Apple M1) opening the HTML file directly from disk.
2. WHEN the user interacts with any control (add task, toggle theme, select sort option, activate timer buttons), THE Dashboard SHALL reflect the updated UI state within 100 milliseconds.
3. THE Dashboard SHALL be usable on screen widths from 320px to 2560px with no horizontal overflow and all interactive controls remaining accessible and operable.
4. THE Dashboard SHALL function correctly — without JavaScript errors or rendering failures — on the current stable releases of Chrome, Firefox, Edge, and Safari.
