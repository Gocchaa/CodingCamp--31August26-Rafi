/**
 * greeting.test.js — Unit and property-based tests for greeting.js
 *
 * Tests: Requirements 1.1, 1.2, 2.1, 2.2, 2.3, 2.4
 */

// Feature: to-do-life-dashboard, Property 1: Greeting is exhaustive and deterministic

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getGreeting, formatTime, formatDate } from './greeting.js';

// ---------------------------------------------------------------------------
// getGreeting — unit tests
// ---------------------------------------------------------------------------
describe('getGreeting()', () => {
  // Boundary hours and their neighbours

  // Good Morning: 5–11
  it('returns "Good Morning" at 5 (lower boundary)', () => {
    expect(getGreeting(5)).toBe('Good Morning');
  });

  it('returns "Good Night" at 4 (just below Good Morning boundary)', () => {
    expect(getGreeting(4)).toBe('Good Night');
  });

  it('returns "Good Morning" at 11 (upper boundary)', () => {
    expect(getGreeting(11)).toBe('Good Morning');
  });

  // Good Afternoon: 12–16
  it('returns "Good Afternoon" at 12 (lower boundary)', () => {
    expect(getGreeting(12)).toBe('Good Afternoon');
  });

  it('returns "Good Afternoon" at 16 (upper boundary)', () => {
    expect(getGreeting(16)).toBe('Good Afternoon');
  });

  it('returns "Good Evening" at 17 (just above Good Afternoon boundary)', () => {
    expect(getGreeting(17)).toBe('Good Evening');
  });

  // Good Evening: 17–20
  it('returns "Good Evening" at 20 (upper boundary)', () => {
    expect(getGreeting(20)).toBe('Good Evening');
  });

  it('returns "Good Night" at 21 (just above Good Evening boundary)', () => {
    expect(getGreeting(21)).toBe('Good Night');
  });

  // Good Night: 21–23 and 0–4
  it('returns "Good Night" at 0 (midnight)', () => {
    expect(getGreeting(0)).toBe('Good Night');
  });

  it('returns "Good Night" at 23', () => {
    expect(getGreeting(23)).toBe('Good Night');
  });
});

// ---------------------------------------------------------------------------
// getGreeting — Property 1: exhaustive and deterministic
// ---------------------------------------------------------------------------
describe('getGreeting() — Property 1', () => {
  const VALID_GREETINGS = new Set([
    'Good Morning',
    'Good Afternoon',
    'Good Evening',
    'Good Night',
  ]);

  it('always returns one of the four known greeting strings for any hour in [0, 23]', () => {
    // Feature: to-do-life-dashboard, Property 1: Greeting is exhaustive and deterministic
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 23 }), (hour) => {
        const result = getGreeting(hour);
        return VALID_GREETINGS.has(result);
      }),
      { numRuns: 100 }
    );
  });

  it('is deterministic — same hour always produces same greeting', () => {
    // Feature: to-do-life-dashboard, Property 1: Greeting is exhaustive and deterministic
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 23 }), (hour) => {
        return getGreeting(hour) === getGreeting(hour);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// formatTime — unit tests (12-hour format)
// ---------------------------------------------------------------------------
describe('formatTime()', () => {
  it('formats midnight (00:00:00) as "12:00:00 AM"', () => {
    const midnight = new Date(2024, 0, 15, 0, 0, 0); // Jan 15 2024, 00:00:00
    expect(formatTime(midnight)).toBe('12:00:00 AM');
  });

  it('formats noon (12:00:00) as "12:00:00 PM"', () => {
    const noon = new Date(2024, 0, 15, 12, 0, 0);
    expect(formatTime(noon)).toBe('12:00:00 PM');
  });

  it('formats 23:59:59 as "11:59:59 PM"', () => {
    const almostMidnight = new Date(2024, 0, 15, 23, 59, 59);
    expect(formatTime(almostMidnight)).toBe('11:59:59 PM');
  });

  it('formats 14:30:05 as "02:30:05 PM" (zero-padded hour)', () => {
    const afternoon = new Date(2024, 0, 15, 14, 30, 5);
    expect(formatTime(afternoon)).toBe('02:30:05 PM');
  });

  it('formats 01:05:03 as "01:05:03 AM"', () => {
    const earlyMorning = new Date(2024, 0, 15, 1, 5, 3);
    expect(formatTime(earlyMorning)).toBe('01:05:03 AM');
  });
});

// ---------------------------------------------------------------------------
// formatDate — unit tests
// ---------------------------------------------------------------------------
describe('formatDate()', () => {
  it('formats January 15, 2024 (Monday) correctly', () => {
    const date = new Date(2024, 0, 15); // Monday, January 15, 2024
    expect(formatDate(date)).toBe('Monday, January 15, 2024');
  });

  it('formats July 4, 2024 (Thursday) correctly', () => {
    const date = new Date(2024, 6, 4); // Thursday, July 4, 2024
    expect(formatDate(date)).toBe('Thursday, July 4, 2024');
  });

  it('formats December 31, 2023 (Sunday) correctly', () => {
    const date = new Date(2023, 11, 31); // Sunday, December 31, 2023
    expect(formatDate(date)).toBe('Sunday, December 31, 2023');
  });
});
