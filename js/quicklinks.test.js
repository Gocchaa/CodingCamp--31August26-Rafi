/**
 * quicklinks.test.js — Unit and property-based tests for validateLink()
 *
 * Tests: Requirements 10.1, 10.3, 10.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateLink } from './quicklinks.js';

// ---------------------------------------------------------------------------
// Unit tests — validateLink()
// ---------------------------------------------------------------------------

describe('validateLink() — name validation', () => {
  it('returns invalid for an empty name', () => {
    const result = validateLink('', 'https://example.com');
    expect(result.valid).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it('returns invalid for a whitespace-only name', () => {
    const result = validateLink('   ', 'https://example.com');
    expect(result.valid).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it('returns invalid for a 51-character name', () => {
    const name51 = 'a'.repeat(51);
    const result = validateLink(name51, 'https://example.com');
    expect(result.valid).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it('returns valid for a name of exactly 1 character', () => {
    const result = validateLink('G', 'https://example.com');
    expect(result.valid).toBe(true);
  });

  it('returns valid for a name of exactly 50 characters', () => {
    const name50 = 'a'.repeat(50);
    const result = validateLink(name50, 'https://example.com');
    expect(result.valid).toBe(true);
  });

  it('returns valid for a name that trims to exactly 1 character', () => {
    const result = validateLink('  G  ', 'https://example.com');
    expect(result.valid).toBe(true);
  });
});

describe('validateLink() — URL protocol validation', () => {
  it('returns invalid for an ftp:// URL', () => {
    const result = validateLink('FTP', 'ftp://example.com');
    expect(result.valid).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it('returns invalid for a URL with no protocol', () => {
    const result = validateLink('Site', 'example.com');
    expect(result.valid).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it('returns invalid for a URL starting with www (no protocol)', () => {
    const result = validateLink('Site', 'www.example.com');
    expect(result.valid).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it('returns invalid for an empty URL', () => {
    const result = validateLink('Site', '');
    expect(result.valid).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it('returns valid for an http:// URL', () => {
    const result = validateLink('Site', 'http://example.com');
    expect(result.valid).toBe(true);
  });

  it('returns valid for an https:// URL', () => {
    const result = validateLink('GitHub', 'https://github.com');
    expect(result.valid).toBe(true);
  });
});

describe('validateLink() — URL length validation', () => {
  it('returns invalid for a URL longer than 2048 characters', () => {
    const longUrl = 'https://' + 'a'.repeat(2048);
    const result = validateLink('Long', longUrl);
    expect(result.valid).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it('returns valid for a URL of exactly 2048 characters starting with https://', () => {
    const url2048 = 'https://' + 'a'.repeat(2048 - 8);
    expect(url2048.length).toBe(2048);
    const result = validateLink('Site', url2048);
    expect(result.valid).toBe(true);
  });
});

describe('validateLink() — valid combinations', () => {
  it('returns valid for a typical name + https URL', () => {
    const result = validateLink('GitHub', 'https://github.com');
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('returns valid for a typical name + http URL', () => {
    const result = validateLink('My Site', 'http://mysite.example.com/path?q=1');
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Property-based tests — Property 6
// ---------------------------------------------------------------------------

// Feature: to-do-life-dashboard, Property 6: Quick Link field validation is correct at all boundaries

describe('Property 6 — Quick Link field validation is correct at all boundaries', () => {
  it('6a: any URL not starting with http:// or https:// is always invalid', () => {
    // Generate strings that do NOT start with http:// or https://
    const nonHttpUrl = fc.string({ minLength: 1 }).filter(
      (s) => !s.startsWith('http://') && !s.startsWith('https://')
    );

    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length >= 1 && s.trim().length <= 50), nonHttpUrl, (name, url) => {
        const result = validateLink(name, url);
        expect(result.valid).toBe(false);
        expect(result.message).toBeTruthy();
      }),
      { numRuns: 100 }
    );
  });

  it('6b: any name whose trimmed length is 0 or > 50 is always invalid', () => {
    // Case b1: whitespace-only names (trimmed length === 0)
    const whitespaceOnlyName = fc.string({ minLength: 1 }).map((s) => s.replace(/\S/g, ' ')).filter((s) => s.trim().length === 0);
    const validUrl = fc.constantFrom('http://example.com', 'https://example.com', 'https://a.org/path');

    fc.assert(
      fc.property(whitespaceOnlyName, validUrl, (name, url) => {
        const result = validateLink(name, url);
        expect(result.valid).toBe(false);
        expect(result.message).toBeTruthy();
      }),
      { numRuns: 100 }
    );

    // Case b2: names whose trimmed length > 50
    const longName = fc.string({ minLength: 51 }).filter((s) => s.trim().length > 50);

    fc.assert(
      fc.property(longName, validUrl, (name, url) => {
        const result = validateLink(name, url);
        expect(result.valid).toBe(false);
        expect(result.message).toBeTruthy();
      }),
      { numRuns: 100 }
    );
  });

  it('6c: valid name (trimmed [1,50]) + valid URL (http(s), length ≤ 2048) is always valid', () => {
    // Generate a valid trimmed name: non-empty, trimmed length in [1, 50]
    const validName = fc.string({ minLength: 1, maxLength: 50 }).filter(
      (s) => s.trim().length >= 1 && s.trim().length <= 50
    );

    // Generate a valid URL: starts with http:// or https://, total length ≤ 2048
    const httpPrefix = fc.constantFrom('http://', 'https://');
    const validUrl = fc.tuple(httpPrefix, fc.string({ minLength: 1, maxLength: 2040 })).map(
      ([prefix, rest]) => prefix + rest
    ).filter((url) => url.length <= 2048);

    fc.assert(
      fc.property(validName, validUrl, (name, url) => {
        const result = validateLink(name, url);
        expect(result.valid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
