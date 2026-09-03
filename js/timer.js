/**
 * timer.js — Focus Timer Component
 *
 * 25-minute countdown with start / stop / reset controls.
 * Timer state is NOT persisted to localStorage.
 */

const INITIAL_SECONDS = 25 * 60; // 1500

/**
 * Converts a total-seconds value to "MM:SS".
 *
 * @param {number} seconds - Integer in [0, 1500]
 * @returns {string}
 */
export function formatCountdown(seconds) {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

/**
 * @typedef {'idle'|'running'|'paused'|'finished'} TimerStatus
 * @typedef {{ startDisabled: boolean, stopDisabled: boolean, resetDisabled: boolean }} ControlState
 */

/**
 * Returns the button enable/disable map for a given timer status.
 *
 * @param {TimerStatus} status
 * @returns {ControlState}
 */
export function getControlState(status) {
  switch (status) {
    case 'idle':
      return { startDisabled: false, stopDisabled: true, resetDisabled: false };
    case 'running':
      return { startDisabled: true, stopDisabled: false, resetDisabled: false };
    case 'paused':
      return { startDisabled: false, stopDisabled: true, resetDisabled: false };
    case 'finished':
      return { startDisabled: true, stopDisabled: true, resetDisabled: false };
    default:
      return { startDisabled: false, stopDisabled: true, resetDisabled: false };
  }
}

/**
 * Mounts the Focus Timer into the given container element.
 *
 * @param {HTMLElement} containerEl
 */
export function initTimer(containerEl) {
  /** @type {{ totalSeconds: number, intervalId: number|null, status: TimerStatus }} */
  const state = {
    totalSeconds: INITIAL_SECONDS,
    intervalId: null,
    status: 'idle',
  };

  containerEl.innerHTML = `
    <h2>Focus Timer</h2>
    <p class="countdown" aria-live="polite" aria-atomic="true">25:00</p>
    <p class="timer-finished" hidden aria-live="polite">Session complete! Great work.</p>
    <div class="timer-controls">
      <button id="btn-start" aria-label="Start timer">Start</button>
      <button id="btn-stop" aria-label="Stop timer">Stop</button>
      <button id="btn-reset" aria-label="Reset timer">Reset</button>
    </div>
  `;

  const countdownEl = containerEl.querySelector('.countdown');
  const finishedEl = containerEl.querySelector('.timer-finished');
  const btnStart = containerEl.querySelector('#btn-start');
  const btnStop = containerEl.querySelector('#btn-stop');
  const btnReset = containerEl.querySelector('#btn-reset');

  function render() {
    countdownEl.textContent = formatCountdown(state.totalSeconds);
    const cs = getControlState(state.status);
    btnStart.disabled = cs.startDisabled;
    btnStop.disabled = cs.stopDisabled;
    btnReset.disabled = cs.resetDisabled;
    finishedEl.hidden = state.status !== 'finished';
  }

  function tick() {
    if (state.totalSeconds <= 0) {
      clearInterval(state.intervalId);
      state.intervalId = null;
      state.status = 'finished';
      render();
      return;
    }
    state.totalSeconds -= 1;
    render();
  }

  btnStart.addEventListener('click', () => {
    if (state.status === 'idle' || state.status === 'paused') {
      state.status = 'running';
      state.intervalId = setInterval(tick, 1000);
      render();
    }
  });

  btnStop.addEventListener('click', () => {
    if (state.status === 'running') {
      clearInterval(state.intervalId);
      state.intervalId = null;
      state.status = 'paused';
      render();
    }
  });

  btnReset.addEventListener('click', () => {
    if (state.intervalId !== null) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    state.totalSeconds = INITIAL_SECONDS;
    state.status = 'idle';
    render();
  });

  render();
}
