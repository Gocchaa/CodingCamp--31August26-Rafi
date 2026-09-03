import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use jsdom environment for localStorage and DOM API access
    environment: 'jsdom',
    globals: true,
  },
});
