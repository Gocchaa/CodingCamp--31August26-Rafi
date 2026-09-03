/**
 * main.js — entry point for To-Do Life Dashboard
 *
 * Initialises all four components after the DOM is ready.
 */

import { initGreeting } from './greeting.js';
import { initTimer } from './timer.js';
import { initTasks } from './tasks.js';
import { initQuickLinks } from './quicklinks.js';

document.addEventListener('DOMContentLoaded', () => {
  initGreeting(document.getElementById('greeting-section'));
  initTimer(document.getElementById('timer-section'));
  initTasks(document.getElementById('tasks-section'));
  initQuickLinks(document.getElementById('links-section'));
});
