/**
 * timer.test.js — Unit and property-based tests for timer.js pure helpers
 *
 * Covers:
 *   - formatCountdown(seconds)
 *   - getControlState(status)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatCountdown, getControlState } from './timer.js';

// ---------------------------------------------------------------------------
// Unit tests — formatCountdown
// ---------------------------------------------------------------------------

describe('formatCountdown', () => {
  it('returns "00:00" for 0 seconds', () => {
    expect(formatCountdown(0)).toBe('00:00');
  });

  it('returns "25:00" for 1500 seconds', () => {
    expect(formatCountdown(1500)).toBe('25:00');
  });

  it('returns "01:05" for 65 seconds', () => {
    expect(formatCountdown(65)).toBe('01:05');
  });

  it('zero-pads single-digit minutes and seconds', () => {
    expect(formatCountdown(61)).toBe('01:01');
  });

  it('returns "00:01" for 1 second', () => {
    expect(formatCountdown(1)).toBe('00:01');
  });
});

// ---------------------------------------------------------------------------
// Unit tests — getControlState
// ---------------------------------------------------------------------------

describe('getControlState', () => {
  it('idle: start enabled, stop disabled, reset enabled', () => {
    expect(getControlState('idle')).toEqual({
      startDisabled: false,
      stopDisabled: true,
      resetDisabled: false,
    });
  });

  it('running: start disabled, stop enabled, reset enabled', () => {
    expect(getControlState('running')).toEqual({
      startDisabled: true,
      stopDisabled: false,
      resetDisabled: false,
    });
  });

  it('paused: start enabled, stop disabled, reset enabled', () => {
    expect(getControlState('paused')).toEqual({
      startDisabled: false,
      stopDisabled: true,
      resetDisabled: false,
    });
  });

  it('finished: start disabled, stop disabled, reset enabled', () => {
    expect(getControlState('finished')).toEqual({
      startDisabled: true,
      stopDisabled: true,
      resetDisabled: false,
    });
  });
});

// ---------------------------------------------------------------------------
// Property-based tests
// ---------------------------------------------------------------------------

// Feature: to-do-life-dashboard, Property 9: Countdown format is always valid MM:SS
describe('Property 9: formatCountdown always returns valid MM:SS', () => {
  it('for any integer in [0, 1500], output is "MM:SS" and MM*60+SS === input', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1500 }), (seconds) => {
        const result = formatCountdown(seconds);

        // Must match MM:SS pattern with exactly two digits each side
        expect(result).toMatch(/^\d{2}:\d{2}$/);

        // Reconstruct seconds from MM and SS and verify round-trip
        const [mmStr, ssStr] = result.split(':');
        const mm = parseInt(mmStr, 10);
        const ss = parseInt(ssStr, 10);
        expect(mm * 60 + ss).toBe(seconds);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: to-do-life-dashboard, Property 10: Timer control state is pure and deterministic
describe('Property 10: getControlState is pure and deterministic', () => {
  it('for any valid status, repeated calls return the same map', () => {
    const validStatuses = ['idle', 'running', 'paused', 'finished'];

    fc.assert(
      fc.property(fc.constantFrom(...validStatuses), (status) => {
        const first = getControlState(status);
        const second = getControlState(status);
        expect(first).toEqual(second);
      }),
      { numRuns: 100 }
    );
  });
});
