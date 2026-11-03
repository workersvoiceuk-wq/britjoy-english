/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: { DEFAULT: '#58CC02', dark: '#46A302', light: '#D7FFB8' },
        bad: { DEFAULT: '#FF4B4B', dark: '#EA2B2B', light: '#FFDFE0' },
        ink: { DEFAULT: '#3C3C3C', soft: '#777777', line: '#E5E5E5' },
        accent: { DEFAULT: 'var(--accent)', dark: 'var(--accent-dark)', light: 'var(--accent-light)' },
      },
    },
  },
  plugins: [],
};
