/**
 * storage.js — localStorage utility for To-Do Life Dashboard
 *
 * Provides a thin, error-safe wrapper over localStorage with:
 *  - JSON serialisation / deserialisation
 *  - Namespaced keys to avoid collisions
 *  - Graceful error handling for QuotaExceededError and parse failures
 */

/** Namespaced localStorage keys */
export const KEYS = {
  TASKS: 'todo_dashboard_tasks',
  LINKS: 'todo_dashboard_links',
};

/**
 * Load and deserialise a value from localStorage.
 *
 * @template T
 * @param {string} key - The localStorage key to read.
 * @param {T} fallback - Returned when the key is absent or the stored value
 *   is not valid JSON.
 * @returns {T} The parsed value, or `fallback` on any error.
 */
export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    // JSON.parse failure (corrupted data) → return fallback
    return fallback;
  }
}

/**
 * Serialise and save a value to localStorage.
 *
 * @param {string} key - The localStorage key to write.
 * @param {unknown} value - Any JSON-serialisable value.
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (err) {
    // Handles QuotaExceededError and other DOMExceptions
    const message =
      err instanceof Error ? err.message : 'Unknown storage error';
    return { ok: false, error: message };
  }
}
