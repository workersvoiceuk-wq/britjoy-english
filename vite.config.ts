/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset paths so the build works under any sub-path (e.g. GitHub Pages /<repo>/).
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      // Two pages: the general app and «Inglés para el día a día», a separate course at vida-diaria/.
      input: { main: 'index.html', vidaDiaria: 'vida-diaria/index.html' },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
