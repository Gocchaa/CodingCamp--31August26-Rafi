/**
 * greeting.js — Greeting Component
 *
 * Displays the current time, date, and a time-based greeting.
 * Updates every second via setInterval.
 */

/**
 * Returns the greeting string for a given hour (0–23).
 *
 * @param {number} hour - Integer in [0, 23]
 * @returns {string}
 */
export function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 16) return 'Good Afternoon';
  if (hour >= 17 && hour <= 20) return 'Good Evening';
  return 'Good Night'; // 21–23 and 0–4
}

/**
 * Formats a Date object to "hh:mm:ss AM/PM" (12-hour clock).
 *
 * @param {Date} date
 * @returns {string}
 */
export function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Formats a Date object to "Weekday, Month DD, YYYY".
 *
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Mounts the greeting component into the given container element.
 *
 * @param {HTMLElement} containerEl
 */
export function initGreeting(containerEl) {
  containerEl.innerHTML = `
    <p class="time" aria-live="polite" aria-atomic="true"></p>
    <p class="date"></p>
    <p class="greeting"></p>
  `;

  const timeEl = containerEl.querySelector('.time');
  const dateEl = containerEl.querySelector('.date');
  const greetingEl = containerEl.querySelector('.greeting');

  function render() {
    const now = new Date();
    timeEl.textContent = formatTime(now);
    dateEl.textContent = formatDate(now);
    greetingEl.textContent = getGreeting(now.getHours());
  }

  render(); // Immediate render — no 1-second blank
  setInterval(render, 1000);
}
