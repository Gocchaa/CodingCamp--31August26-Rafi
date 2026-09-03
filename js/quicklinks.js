/**
 * quicklinks.js — Quick Links Component
 *
 * Create, display, and delete Quick Link buttons.
 * Opens URLs in new tabs.
 */

import { load, save, KEYS } from './storage.js';

const MAX_LINKS = 20;

// ---------------------------------------------------------------------------
// Pure validation
// ---------------------------------------------------------------------------

/**
 * @typedef {{ valid: true } | { valid: false, message: string }} ValidationResult
 * @typedef {{ id: string, name: string, url: string, createdAt: number }} QuickLink
 */

/**
 * Validates a Quick Link name and URL.
 *
 * Note: the count cap (max 20 links) is enforced in createLink, not here.
 *
 * @param {string} name - 1–50 characters (trimmed)
 * @param {string} url  - 1–2048 characters, must start with http:// or https://
 * @returns {ValidationResult}
 */
export function validateLink(name, url) {
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (trimmedName.length === 0) {
    return { valid: false, message: 'Link name cannot be empty.' };
  }
  if (trimmedName.length > 50) {
    return { valid: false, message: 'Link name must be 50 characters or fewer.' };
  }
  if (!url || url.length === 0) {
    return { valid: false, message: 'URL cannot be empty.' };
  }
  if (url.length > 2048) {
    return { valid: false, message: 'URL must be 2048 characters or fewer.' };
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { valid: false, message: 'URL must start with http:// or https://.' };
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// Link operations
// ---------------------------------------------------------------------------

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return String(Date.now()) + Math.random().toString(36).slice(2);
}

/**
 * Creates a new Quick Link and appends it to the list.
 *
 * @param {QuickLink[]} links
 * @param {string} name
 * @param {string} url
 * @returns {{ ok: true, link: QuickLink, links: QuickLink[] } | { ok: false, error: string }}
 */
export function createLink(links, name, url) {
  const validation = validateLink(name, url);
  if (!validation.valid) return { ok: false, error: validation.message };

  if (links.length >= MAX_LINKS) {
    return { ok: false, error: `You can only have ${MAX_LINKS} quick links.` };
  }

  const link = {
    id: generateId(),
    name: name.trim(),
    url,
    createdAt: Date.now(),
  };
  return { ok: true, link, links: [...links, link] };
}

/**
 * Deletes a Quick Link by id.
 *
 * @param {QuickLink[]} links
 * @param {string} id
 * @returns {{ ok: true, links: QuickLink[] } | { ok: false, error: string }}
 */
export function deleteLink(links, id) {
  const exists = links.some((l) => l.id === id);
  if (!exists) return { ok: false, error: 'Quick link not found.' };
  return { ok: true, links: links.filter((l) => l.id !== id) };
}

/**
 * Loads Quick Links from localStorage (up to 50).
 *
 * @returns {QuickLink[]}
 */
export function loadLinks() {
  const all = load(KEYS.LINKS, []);
  return Array.isArray(all) ? all.slice(0, 50) : [];
}

/**
 * Saves Quick Links to localStorage.
 *
 * @param {QuickLink[]} links
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function saveLinks(links) {
  return save(KEYS.LINKS, links);
}

/**
 * Opens a URL in a new browser tab.
 *
 * @param {string} url
 */
export function openLink(url) {
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return { ok: false, error: 'Invalid URL.' };
  }
  window.open(url, '_blank', 'noopener,noreferrer');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// DOM component
// ---------------------------------------------------------------------------

/**
 * Mounts the Quick Links component into the given container element.
 *
 * @param {HTMLElement} containerEl
 */
export function initQuickLinks(containerEl) {
  let links = loadLinks();

  containerEl.innerHTML = `
    <h2>Quick Links</h2>
    <form class="link-form" id="link-form" novalidate>
      <input type="text" id="link-name" placeholder="Link name" maxlength="50" aria-label="Quick link name" />
      <input type="url" id="link-url" placeholder="URL" maxlength="2048" aria-label="Quick link URL" />
      <button type="submit">Add Link</button>
    </form>
    <p class="error-message" id="link-error" aria-live="polite" role="alert"></p>
    <div class="quick-links-grid" id="links-grid" aria-label="Quick links"></div>
  `;

  const form = containerEl.querySelector('#link-form');
  const nameInput = containerEl.querySelector('#link-name');
  const urlInput = containerEl.querySelector('#link-url');
  const errorEl = containerEl.querySelector('#link-error');
  const gridEl = containerEl.querySelector('#links-grid');

  function showError(msg) {
    errorEl.textContent = msg;
  }

  function clearError() {
    errorEl.textContent = '';
  }

  function persistAndWarn() {
    const result = saveLinks(links);
    if (!result.ok) {
      showError(`Warning: could not save links — ${result.error}`);
    }
  }

  function renderGrid() {
    if (links.length === 0) {
      gridEl.innerHTML = '<p class="empty-state">No quick links yet. Add your favorites!</p>';
      return;
    }

    gridEl.innerHTML = links.map((link) => `
      <div class="quick-link-item" data-id="${link.id}">
        <button class="quick-link-btn" aria-label="Open ${escapeHtml(link.name)}">${escapeHtml(link.name)}</button>
        <button class="btn-delete btn-delete-link" aria-label="Delete ${escapeHtml(link.name)} link">✕</button>
      </div>
    `).join('');

    gridEl.querySelectorAll('.quick-link-item').forEach((item) => {
      const id = item.dataset.id;
      const link = links.find((l) => l.id === id);
      if (!link) return;

      item.querySelector('.quick-link-btn').addEventListener('click', () => {
        const result = openLink(link.url);
        if (!result.ok) {
          showError(`Cannot open link: ${result.error}`);
        }
      });

      item.querySelector('.btn-delete-link').addEventListener('click', () => {
        const result = deleteLink(links, id);
        if (result.ok) {
          links = result.links;
          persistAndWarn();
          renderGrid();
        }
      });
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError();
    const result = createLink(links, nameInput.value, urlInput.value);
    if (result.ok) {
      links = result.links;
      persistAndWarn();
      nameInput.value = '';
      urlInput.value = '';
      nameInput.focus();
      renderGrid();
    } else {
      showError(result.error);
    }
  });

  nameInput.addEventListener('input', clearError);
  urlInput.addEventListener('input', clearError);

  renderGrid();
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

