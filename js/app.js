// js/app.js
(function () {
  'use strict';

  // ─── In-Memory State ─────────────────────────────────────────────────────────
  const appState = {
    tasks: [],
    quickLinks: [],
    pomodoroDuration: 1500, // seconds (25 minutes default)
    theme: 'light',
    timer: {
      remaining: 1500,
      running: false,
      intervalId: null,
      clockIntervalId: null
    },
    sortOption: 'Newest First'
  };

  // ─── Toast Notification ───────────────────────────────────────────────────────
  function showToast(message, durationMs = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, durationMs);
  }

  // ─── Storage Layer ────────────────────────────────────────────────────────────
  const StorageLayer = {
    read(key, defaultValue) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return defaultValue;
        return JSON.parse(raw);
      } catch (e) {
        showToast('Could not read saved data. Using defaults.');
        return defaultValue;
      }
    },
    write(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        showToast('Could not save data. Changes may not persist.');
      }
    }
  };

  // ─── Theme Module ─────────────────────────────────────────────────────────────
  function initTheme() {
    const savedTheme = document.documentElement.getAttribute('data-theme') || 'light';
    appState.theme = savedTheme;
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = savedTheme === 'light' ? '🌙' : '☀️';
  }

  function toggleTheme() {
    appState.theme = appState.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', appState.theme);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = appState.theme === 'light' ? '🌙' : '☀️';
    StorageLayer.write('theme', appState.theme);
  }

  // ─── Greeting Module Helpers ──────────────────────────────────────────────────
  function getGreeting(hour) {
    if (hour >= 5 && hour <= 11) return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    return 'Good Evening'; // covers 18-23 and 0-4
  }

  function formatTime(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  function formatDate(date) {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const weekday = weekdays[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${weekday}, ${month} ${day}, ${year}`;
  }

  // ─── Timer Module ─────────────────────────────────────────────────────────────
  function formatTimerDisplay(seconds) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function playAlertSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 2);
    } catch (e) {
      // Web Audio API unavailable — silent failure
    }
  }

  function onTimerComplete() {
    stopTimer();
    const indicator = document.getElementById('timer-complete-indicator');
    if (indicator) indicator.hidden = false;
    playAlertSound();
  }

  function tickTimer() {
    appState.timer.remaining -= 1;
    const display = document.getElementById('timer-display');
    if (display) display.textContent = formatTimerDisplay(appState.timer.remaining);
    if (appState.timer.remaining <= 0) {
      onTimerComplete();
    }
  }

  function startTimer() {
    appState.timer.running = true;
    const indicator = document.getElementById('timer-complete-indicator');
    if (indicator) indicator.hidden = true;
    appState.timer.intervalId = setInterval(tickTimer, 1000);
  }

  function stopTimer() {
    if (appState.timer.intervalId) {
      clearInterval(appState.timer.intervalId);
      appState.timer.intervalId = null;
    }
    appState.timer.running = false;
  }

  function resetTimer() {
    stopTimer();
    appState.timer.remaining = appState.pomodoroDuration;
    const display = document.getElementById('timer-display');
    if (display) display.textContent = formatTimerDisplay(appState.timer.remaining);
  }

  function setDuration(minutes) {
    // Clamp to valid range [1, 90]
    const clamped = Math.min(90, Math.max(1, Math.round(minutes)));

    // If timer is running, stop and reset before applying new duration
    if (appState.timer.running) {
      stopTimer();
    }

    // Store duration in seconds
    appState.pomodoroDuration = clamped * 60;

    // Reset remaining to new duration
    appState.timer.remaining = appState.pomodoroDuration;

    // Update the duration input field
    const durationInput = document.getElementById('duration-input');
    if (durationInput) durationInput.value = clamped;

    // Update timer display
    const display = document.getElementById('timer-display');
    if (display) display.textContent = formatTimerDisplay(appState.timer.remaining);

    // Persist minutes (not seconds) to storage
    StorageLayer.write('pomodoro_duration', clamped);
  }

  function initTimer() {
    // Read saved duration from storage (stored in minutes, default 25)
    const savedMinutes = StorageLayer.read('pomodoro_duration', 25);

    // Validate: must be a number in range [1, 90]; discard and use 25 if invalid
    let validMinutes = 25;
    if (typeof savedMinutes === 'number' && savedMinutes >= 1 && savedMinutes <= 90) {
      validMinutes = savedMinutes;
    }

    // Apply duration — this sets appState.pomodoroDuration and updates the display
    setDuration(validMinutes);

    // Button event listeners
    const startBtn = document.getElementById('timer-start');
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        // If countdown has hit 00:00, reset before starting
        if (appState.timer.remaining === 0) {
          resetTimer();
        }
        startTimer();
      });
    }

    const stopBtn = document.getElementById('timer-stop');
    if (stopBtn) {
      stopBtn.addEventListener('click', stopTimer);
    }

    const resetBtn = document.getElementById('timer-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetTimer);
    }

    const incrementBtn = document.getElementById('duration-increment');
    if (incrementBtn) {
      incrementBtn.addEventListener('click', function () {
        const currentMinutes = Math.round(appState.pomodoroDuration / 60);
        setDuration(currentMinutes + 1);
      });
    }

    const decrementBtn = document.getElementById('duration-decrement');
    if (decrementBtn) {
      decrementBtn.addEventListener('click', function () {
        const currentMinutes = Math.round(appState.pomodoroDuration / 60);
        setDuration(currentMinutes - 1);
      });
    }

    const durationInput = document.getElementById('duration-input');
    if (durationInput) {
      const handleDurationInput = function () {
        const value = parseInt(durationInput.value, 10);
        if (!isNaN(value)) {
          setDuration(value);
        }
      };
      durationInput.addEventListener('change', handleDurationInput);
      durationInput.addEventListener('input', handleDurationInput);
    }
  }

  // ─── Greeting Module ──────────────────────────────────────────────────────────
  function updateClock() {
    try {
      const now = new Date();
      if (isNaN(now.getTime())) throw new Error('Invalid date');
      const greetingEl = document.getElementById('greeting-text');
      const dateEl = document.getElementById('current-date');
      const timeEl = document.getElementById('current-time');
      if (greetingEl) greetingEl.textContent = getGreeting(now.getHours());
      if (dateEl) dateEl.textContent = formatDate(now);
      if (timeEl) timeEl.textContent = formatTime(now);
    } catch (e) {
      const timeEl = document.getElementById('current-time');
      const greetingEl = document.getElementById('greeting-text');
      if (timeEl) timeEl.textContent = '--:--:--';
      if (greetingEl) greetingEl.textContent = '';
    }
  }

  function initGreeting() {
    updateClock();
    appState.timer.clockIntervalId = setInterval(updateClock, 1000);
  }

  // ─── Todo Module Helpers ──────────────────────────────────────────────────────
  function validateTaskTitle(title) {
    const trimmed = (title || '').trim();
    if (trimmed.length < 1) {
      return { valid: false, error: 'Task title cannot be empty.' };
    }
    if (trimmed.length > 200) {
      return { valid: false, error: 'Task title cannot exceed 200 characters.' };
    }
    return { valid: true };
  }

  function sortTasks(tasks, option) {
    // Return a sorted copy; never mutate the input
    const indexed = tasks.map((task, idx) => ({ task, idx }));
    indexed.sort((a, b) => {
      switch (option) {
        case 'Newest First':
          return b.task.createdAt - a.task.createdAt || a.idx - b.idx;
        case 'Oldest First':
          return a.task.createdAt - b.task.createdAt || a.idx - b.idx;
        case 'A\u2013Z':
          return a.task.title.toLowerCase().localeCompare(b.task.title.toLowerCase()) || a.idx - b.idx;
        case 'Z\u2013A':
          return b.task.title.toLowerCase().localeCompare(a.task.title.toLowerCase()) || a.idx - b.idx;
        case 'Pending First': {
          const aVal = a.task.status === 'pending' ? 0 : 1;
          const bVal = b.task.status === 'pending' ? 0 : 1;
          return aVal - bVal || a.idx - b.idx;
        }
        case 'Completed First': {
          const aVal = a.task.status === 'completed' ? 0 : 1;
          const bVal = b.task.status === 'completed' ? 0 : 1;
          return aVal - bVal || a.idx - b.idx;
        }
        default:
          return a.idx - b.idx;
      }
    });
    return indexed.map(item => item.task);
  }

  // ─── Todo Module ──────────────────────────────────────────────────────────────
  function renderTaskList() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    // Clear existing list
    taskList.innerHTML = '';

    // Get sorted tasks
    const sorted = sortTasks(appState.tasks, appState.sortOption);

    // Rebuild list from sorted tasks
    sorted.forEach(task => {
      const li = document.createElement('li');
      li.setAttribute('data-task-id', task.id);
      li.className = 'task-item' + (task.status === 'completed' ? ' completed' : '');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-complete-toggle';
      checkbox.checked = task.status === 'completed';
      checkbox.setAttribute('aria-label', 'Mark task complete');

      const titleSpan = document.createElement('span');
      titleSpan.className = 'task-title';
      titleSpan.textContent = task.title;

      const editBtn = document.createElement('button');
      editBtn.className = 'task-edit-btn';
      editBtn.setAttribute('aria-label', 'Edit task');
      editBtn.textContent = 'Edit';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'task-delete-btn';
      deleteBtn.setAttribute('aria-label', 'Delete task');
      deleteBtn.textContent = 'Delete';

      li.appendChild(checkbox);
      li.appendChild(titleSpan);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);

      taskList.appendChild(li);
    });
  }

  // ─── Task CRUD ────────────────────────────────────────────────────────────────
  function addTask(title) {
    const validation = validateTaskTitle(title);
    const errorEl = document.getElementById('todo-input-error');

    if (!validation.valid) {
      // Show inline error without clearing the input
      if (errorEl) {
        errorEl.textContent = validation.error;
        errorEl.hidden = false;
      }
      return;
    }

    // Clear any previous error on success
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
    }

    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString();

    const newTask = {
      id: id,
      title: title.trim(),
      createdAt: Date.now(),
      status: 'pending'
    };

    appState.tasks.push(newTask);
    StorageLayer.write('tasks', appState.tasks);
    renderTaskList();

    // Clear input after successful add
    const input = document.getElementById('todo-input');
    if (input) input.value = '';
  }

  function toggleTask(id) {
    const task = appState.tasks.find(function (t) { return t.id === id; });
    if (!task) return;
    task.status = task.status === 'pending' ? 'completed' : 'pending';
    StorageLayer.write('tasks', appState.tasks);
    renderTaskList();
  }

  function deleteTask(id) {
    appState.tasks = appState.tasks.filter(function (t) { return t.id !== id; });
    StorageLayer.write('tasks', appState.tasks);
    renderTaskList();
  }

  function editTask(id, newTitle) {
    const task = appState.tasks.find(function (t) { return t.id === id; });
    if (!task) return;

    const validation = validateTaskTitle(newTitle);

    if (!validation.valid) {
      // Show inline error on the task row; retain original title (do not mutate)
      const li = document.querySelector('[data-task-id="' + id + '"]');
      if (li) {
        let rowError = li.querySelector('.task-edit-error');
        if (!rowError) {
          rowError = document.createElement('span');
          rowError.className = 'task-edit-error error-msg';
          li.appendChild(rowError);
        }
        rowError.textContent = validation.error;
        rowError.hidden = false;
      }
      return;
    }

    // Valid — mutate title and persist
    task.title = newTitle.trim();
    StorageLayer.write('tasks', appState.tasks);
    renderTaskList();
  }

  function initTodo() {
    const raw = StorageLayer.read('tasks', []);
    const tasks = Array.isArray(raw) ? raw : (() => {
      showToast('Could not read saved data. Using defaults.');
      return [];
    })();

    appState.tasks = tasks;
    appState.sortOption = 'Newest First';
    renderTaskList();

    // ── Add button ──
    const addBtn = document.getElementById('todo-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        const input = document.getElementById('todo-input');
        addTask(input ? input.value : '');
      });
    }

    // Submit on Enter key in the input field
    const todoInput = document.getElementById('todo-input');
    if (todoInput) {
      todoInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          addTask(todoInput.value);
        }
      });
      // Clear inline error when user starts typing
      todoInput.addEventListener('input', function () {
        const errorEl = document.getElementById('todo-input-error');
        if (errorEl) {
          errorEl.hidden = true;
          errorEl.textContent = '';
        }
      });
    }

    // ── Sort dropdown ──
    const sortDropdown = document.getElementById('sort-dropdown');
    if (sortDropdown) {
      sortDropdown.addEventListener('change', function () {
        appState.sortOption = sortDropdown.value;
        renderTaskList();
      });
    }

    // ── Task list event delegation (toggle, edit, delete, confirm, cancel) ──
    const taskList = document.getElementById('task-list');
    if (taskList) {
      // Delegated change: checkbox toggle
      taskList.addEventListener('change', function (e) {
        if (e.target.classList.contains('task-complete-toggle')) {
          const li = e.target.closest('[data-task-id]');
          if (li) toggleTask(li.getAttribute('data-task-id'));
        }
      });

      // Delegated click: edit, delete, save (confirm), cancel
      taskList.addEventListener('click', function (e) {
        const li = e.target.closest('[data-task-id]');
        if (!li) return;
        const taskId = li.getAttribute('data-task-id');

        // Delete button
        if (e.target.classList.contains('task-delete-btn')) {
          deleteTask(taskId);
          return;
        }

        // Edit button — switch row to inline edit mode
        if (e.target.classList.contains('task-edit-btn')) {
          const titleSpan = li.querySelector('.task-title');
          const currentTitle = titleSpan ? titleSpan.textContent : '';

          // Hide normal view controls
          li.querySelectorAll('.task-title, .task-edit-btn, .task-delete-btn').forEach(function (el) {
            el.hidden = true;
          });

          // Create inline edit input
          const editInput = document.createElement('input');
          editInput.type = 'text';
          editInput.className = 'task-edit-input';
          editInput.value = currentTitle;
          editInput.maxLength = 200;
          editInput.setAttribute('aria-label', 'Edit task title');

          // Save button (handled by delegated listener below via .task-edit-confirm)
          const saveBtn = document.createElement('button');
          saveBtn.className = 'task-edit-confirm';
          saveBtn.textContent = 'Save';

          // Cancel button (handled by delegated listener below via .task-edit-cancel)
          const cancelBtn = document.createElement('button');
          cancelBtn.className = 'task-edit-cancel';
          cancelBtn.textContent = 'Cancel';

          li.appendChild(editInput);
          li.appendChild(saveBtn);
          li.appendChild(cancelBtn);
          editInput.focus();

          // Keyboard shortcuts inside the edit input
          editInput.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter') {
              editTask(taskId, editInput.value);
            }
            if (ev.key === 'Escape') {
              renderTaskList();
            }
          });
          return;
        }

        // Save (confirm) button — delegated handler
        if (e.target.classList.contains('task-edit-confirm')) {
          const editInput = li.querySelector('.task-edit-input');
          editTask(taskId, editInput ? editInput.value : '');
          return;
        }

        // Cancel button — delegated handler: restore original view without saving
        if (e.target.classList.contains('task-edit-cancel')) {
          renderTaskList();
          return;
        }
      });
    }
  }

  // ─── Quick Links Module ───────────────────────────────────────────────────────
  function isValidUrl(url) {
    return typeof url === 'string' &&
      (url.startsWith('http://') || url.startsWith('https://'));
  }

  function validateLink(label, url) {
    const trimmedLabel = (label || '').trim();
    if (trimmedLabel.length < 1 || trimmedLabel.length > 50) {
      return { valid: false, error: 'Label must be between 1 and 50 characters.' };
    }
    if (!isValidUrl(url)) {
      return { valid: false, error: 'URL must begin with http:// or https://.' };
    }
    return { valid: true };
  }

  function renderLinksGrid() {
    const grid = document.getElementById('links-grid');
    const limitMsg = document.getElementById('links-limit-msg');
    const addBtn = document.getElementById('link-add-btn');
    if (!grid) return;

    // Clear and rebuild grid
    grid.innerHTML = '';
    appState.quickLinks.forEach(function (link) {
      const item = document.createElement('div');
      item.className = 'link-item';
      item.setAttribute('data-link-id', link.id);

      const anchor = document.createElement('a');
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = link.label;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'link-delete-btn';
      deleteBtn.setAttribute('aria-label', 'Delete link');
      deleteBtn.setAttribute('data-link-id', link.id);
      deleteBtn.textContent = '\u00d7';

      item.appendChild(anchor);
      item.appendChild(deleteBtn);
      grid.appendChild(item);
    });

    // Manage limit UI state
    if (appState.quickLinks.length >= 50) {
      if (limitMsg) limitMsg.hidden = false;
      if (addBtn) addBtn.disabled = true;
    } else {
      if (limitMsg) limitMsg.hidden = true;
      if (addBtn) addBtn.disabled = false;
    }
  }

  function addLink(label, url) {
    const validation = validateLink(label, url);
    const errorEl = document.getElementById('link-input-error');

    if (!validation.valid) {
      if (errorEl) {
        errorEl.textContent = validation.error;
        errorEl.hidden = false;
      }
      return;
    }

    // Clear error on success
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
    }

    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString();

    const newLink = {
      id: id,
      label: label.trim(),
      url: url
    };

    appState.quickLinks.push(newLink);
    StorageLayer.write('quick_links', appState.quickLinks);
    renderLinksGrid();

    // Clear input fields after successful add
    const labelInput = document.getElementById('link-label-input');
    const urlInput = document.getElementById('link-url-input');
    if (labelInput) labelInput.value = '';
    if (urlInput) urlInput.value = '';
  }

  function deleteLink(id) {
    appState.quickLinks = appState.quickLinks.filter(function (link) {
      return link.id !== id;
    });
    StorageLayer.write('quick_links', appState.quickLinks);
    renderLinksGrid();
  }

  function initLinks() {
    const stored = StorageLayer.read('quick_links', []);

    // Validate that stored value is an array; toast + default on corrupt data
    if (!Array.isArray(stored)) {
      showToast('Quick links data was corrupt. Starting with an empty list.');
      appState.quickLinks = [];
    } else {
      appState.quickLinks = stored;
    }

    renderLinksGrid();

    // Attach add button event listener
    const addBtn = document.getElementById('link-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        const labelInput = document.getElementById('link-label-input');
        const urlInput = document.getElementById('link-url-input');
        const label = labelInput ? labelInput.value : '';
        const url = urlInput ? urlInput.value : '';
        addLink(label, url);
      });
    }

    // Clear inline error when user starts typing
    const labelInput = document.getElementById('link-label-input');
    const urlInput = document.getElementById('link-url-input');
    const errorEl = document.getElementById('link-input-error');
    [labelInput, urlInput].forEach(function (input) {
      if (input && errorEl) {
        input.addEventListener('input', function () {
          errorEl.hidden = true;
          errorEl.textContent = '';
        });
      }
    });

    // Delegated click listener for delete buttons inside the links grid
    const linksGrid = document.getElementById('links-grid');
    if (linksGrid) {
      linksGrid.addEventListener('click', function (e) {
        if (e.target.classList.contains('link-delete-btn')) {
          const linkId = e.target.getAttribute('data-link-id');
          if (linkId) deleteLink(linkId);
        }
      });
    }
  }

  // ─── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    initTheme();
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    initGreeting();
    initTimer();
    initTodo();
    initLinks();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
