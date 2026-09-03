/**
 * storage.test.js — Unit tests for storage.js
 *
 * Tests: Requirements 9.1, 9.4, 9.5, 12.1, 12.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { load, save, KEYS } from './storage.js';

// jsdom provides localStorage — clear it before each test for isolation
beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// KEYS constants
// ---------------------------------------------------------------------------
describe('KEYS constants', () => {
  it('exports the correct tasks key', () => {
    expect(KEYS.TASKS).toBe('todo_dashboard_tasks');
  });

  it('exports the correct links key', () => {
    expect(KEYS.LINKS).toBe('todo_dashboard_links');
  });
});

// ---------------------------------------------------------------------------
// load()
// ---------------------------------------------------------------------------
describe('load()', () => {
  it('returns the fallback when the key does not exist in localStorage', () => {
    const result = load('nonexistent_key', []);
    expect(result).toEqual([]);
  });

  it('returns a non-array fallback when the key does not exist', () => {
    const result = load('nonexistent_key', null);
    expect(result).toBeNull();
  });

  it('returns the parsed value when valid JSON is stored', () => {
    const data = [{ id: '1', description: 'Test task', completed: false }];
    localStorage.setItem('my_key', JSON.stringify(data));

    const result = load('my_key', []);
    expect(result).toEqual(data);
  });

  it('returns the fallback when the stored value is malformed JSON', () => {
    localStorage.setItem('bad_json_key', '{ not valid json }');

    const result = load('bad_json_key', []);
    expect(result).toEqual([]);
  });

  it('returns the fallback when the stored value is a truncated JSON string', () => {
    localStorage.setItem('truncated_key', '[{"id":"1","desc');

    const result = load('truncated_key', null);
    expect(result).toBeNull();
  });

  it('returns a string fallback when key is absent and fallback is a string', () => {
    const result = load('missing_string_key', 'default');
    expect(result).toBe('default');
  });

  it('correctly loads a stored object (not just arrays)', () => {
    const obj = { setting: true, count: 5 };
    localStorage.setItem('obj_key', JSON.stringify(obj));

    const result = load('obj_key', {});
    expect(result).toEqual(obj);
  });
});

// ---------------------------------------------------------------------------
// save()
// ---------------------------------------------------------------------------
describe('save()', () => {
  it('returns { ok: true } when saving succeeds', () => {
    const result = save('test_key', [1, 2, 3]);
    expect(result).toEqual({ ok: true });
  });

  it('actually writes the value to localStorage', () => {
    const data = { id: 'abc', name: 'GitHub', url: 'https://github.com' };
    save('test_write_key', data);

    const raw = localStorage.getItem('test_write_key');
    expect(JSON.parse(raw)).toEqual(data);
  });

  it('saves and retrieves a task array through the KEYS.TASKS key', () => {
    const tasks = [
      { id: '1', description: 'Buy milk', completed: false, createdAt: 1000 },
    ];
    save(KEYS.TASKS, tasks);

    const loaded = load(KEYS.TASKS, []);
    expect(loaded).toEqual(tasks);
  });

  it('saves and retrieves a links array through the KEYS.LINKS key', () => {
    const links = [
      { id: '2', name: 'Google', url: 'https://google.com', createdAt: 2000 },
    ];
    save(KEYS.LINKS, links);

    const loaded = load(KEYS.LINKS, []);
    expect(loaded).toEqual(links);
  });

  it('returns { ok: false, error: string } when localStorage.setItem throws QuotaExceededError', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const err = new DOMException('QuotaExceededError', 'QuotaExceededError');
      throw err;
    });

    const result = save('quota_key', { large: 'data' });
    expect(result.ok).toBe(false);
    expect(typeof result.error).toBe('string');
    expect(result.error.length).toBeGreaterThan(0);
  });

  it('returns { ok: false, error: string } when localStorage.setItem throws a generic DOMException', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is not available', 'SecurityError');
    });

    const result = save('dom_exception_key', []);
    expect(result.ok).toBe(false);
    expect(typeof result.error).toBe('string');
  });

  it('returns { ok: false, error: string } when localStorage.setItem throws a generic Error', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Unexpected storage failure');
    });

    const result = save('generic_error_key', 42);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Unexpected storage failure');
  });
});

// ---------------------------------------------------------------------------
// Round-trip: save then load
// ---------------------------------------------------------------------------
describe('save + load round-trip', () => {
  it('restores an empty array', () => {
    save(KEYS.TASKS, []);
    expect(load(KEYS.TASKS, null)).toEqual([]);
  });

  it('restores nested objects with full fidelity', () => {
    const data = [
      {
        id: 'abc-123',
        description: 'Write tests',
        completed: true,
        createdAt: 1700000000000,
      },
    ];
    save(KEYS.TASKS, data);
    expect(load(KEYS.TASKS, [])).toEqual(data);
  });
});
