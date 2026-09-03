/**
 * tasks.js — Task List Component
 *
 * CRUD operations on tasks with localStorage persistence.
 */

import { load, save, KEYS } from './storage.js';

// ---------------------------------------------------------------------------
// Pure helpers / validation
// ---------------------------------------------------------------------------

/**
 * @typedef {{ ok: true } | { ok: false, error: string }} ValidationResult
 */

/**
 * Validates a task description string.
 * Invalid if: trimmed length === 0, or length > 500.
 * @param {string} text
 * @returns {ValidationResult}
 */
export function validateDescription(text) {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return { ok: false, error: 'Task description cannot be empty.' };
  }
  if (text.length > 500) {
    return { ok: false, error: 'Task description must be 500 characters or fewer.' };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Task operations
// ---------------------------------------------------------------------------

/**
 * @typedef {{ id: string, description: string, completed: boolean, createdAt: number }} Task
 */

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return String(Date.now()) + Math.random().toString(36).slice(2);
}

export function createTask(tasks, description) {
  const validation = validateDescription(description);
  if (!validation.ok) return validation;
  const task = {
    id: generateId(),
    description: description.trim(),
    completed: false,
    createdAt: Date.now(),
  };
  return { ok: true, task, tasks: [...tasks, task] };
}

export function editTask(tasks, id, description) {
  const validation = validateDescription(description);
  if (!validation.ok) return validation;
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return { ok: false, error: 'Task not found.' };
  const updated = { ...tasks[idx], description: description.trim() };
  const newTasks = [...tasks.slice(0, idx), updated, ...tasks.slice(idx + 1)];
  return { ok: true, task: updated, tasks: newTasks };
}

export function toggleTask(tasks, id) {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return { ok: false, error: 'Task not found.' };
  const updated = { ...tasks[idx], completed: !tasks[idx].completed };
  const newTasks = [...tasks.slice(0, idx), updated, ...tasks.slice(idx + 1)];
  return { ok: true, task: updated, tasks: newTasks };
}

export function deleteTask(tasks, id) {
  const exists = tasks.some((t) => t.id === id);
  if (!exists) return { ok: false, error: 'Task not found.' };
  return { ok: true, tasks: tasks.filter((t) => t.id !== id) };
}

export function loadTasks() {
  return load(KEYS.TASKS, []);
}

export function saveTasks(tasks) {
  return save(KEYS.TASKS, tasks);
}

// ---------------------------------------------------------------------------
// DOM component
// ---------------------------------------------------------------------------

/**
 * Mounts the Task List component into the given container element.
 * @param {HTMLElement} containerEl
 */
export function initTasks(containerEl) {
  let tasks = loadTasks();
  let storageWarning = false;

  const testResult = save(KEYS.TASKS, tasks);
  if (!testResult.ok) storageWarning = true;

  containerEl.innerHTML = `
    <h2>Tasks</h2>
    ${storageWarning ? '<div class="warning-banner" role="alert">localStorage is unavailable. Tasks will not persist after closing this tab.</div>' : ''}
    <form class="task-form" id="task-form" novalidate>
      <input type="text" id="task-input" placeholder="Add a new task..." maxlength="500" aria-label="New task description" />
      <button type="submit">Add</button>
    </form>
    <p class="error-message" id="task-error" aria-live="polite" role="alert"></p>
    <ul class="task-list" id="task-list" aria-label="Task list"></ul>
  `;

  const form = containerEl.querySelector('#task-form');
  const input = containerEl.querySelector('#task-input');
  const errorEl = containerEl.querySelector('#task-error');
  const listEl = containerEl.querySelector('#task-list');

  function showError(msg) { errorEl.textContent = msg; }
  function clearError() { errorEl.textContent = ''; }

  function persistAndWarn() {
    const result = saveTasks(tasks);
    if (!result.ok) showError(`Warning: could not save tasks — ${result.error}`);
  }

  function renderList() {
    if (tasks.length === 0) {
      listEl.innerHTML = '<li class="empty-state">No tasks yet. Add one to get started!</li>';
      return;
    }

    listEl.innerHTML = tasks.map((task) => `
      <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
        <input type="checkbox" aria-label="Mark task complete" ${task.completed ? 'checked' : ''} />
        <span class="task-text">${escapeHtml(task.description)}</span>
        <div class="task-actions">
          <button class="btn-delete" aria-label="Delete task">Delete</button>
        </div>
      </li>
    `).join('');

    listEl.querySelectorAll('.task-item').forEach((li) => {
      const id = li.dataset.id;

      li.querySelector('input[type="checkbox"]').addEventListener('change', () => {
        const result = toggleTask(tasks, id);
        if (result.ok) {
          tasks = result.tasks;
          persistAndWarn();
          renderList();
        }
      });

      li.querySelector('.btn-delete').addEventListener('click', () => {
        const result = deleteTask(tasks, id);
        if (result.ok) {
          tasks = result.tasks;
          persistAndWarn();
          renderList();
          showSuccessToast('Task deleted');
        }
      });
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError();
    const result = createTask(tasks, input.value);
    if (result.ok) {
      tasks = result.tasks;
      persistAndWarn();
      input.value = '';
      input.focus();
      renderList();
    } else {
      showError(result.error);
    }
  });

  input.addEventListener('input', clearError);
  renderList();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showSuccessToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2000);
}
