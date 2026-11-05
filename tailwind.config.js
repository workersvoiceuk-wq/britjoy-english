/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: { DEFAULT: '#398401', dark: '#2C6701', light: '#D7FFB8' },
        bad: { DEFAULT: '#FF4B4B', dark: '#B3261E', light: '#FFDFE0' },
        ink: { DEFAULT: '#3C3C3C', soft: '#636363', line: '#E5E5E5' },
        accent: { DEFAULT: 'var(--accent)', dark: 'var(--accent-dark)', light: 'var(--accent-light)' },
        // British palette
        navy: { DEFAULT: '#1D2D5C', dark: '#111B3A', light: '#E3E8F5' },
        royal: { DEFAULT: '#C8102E', dark: '#950B22', light: '#FBE3E7' },
        cream: { DEFAULT: '#FBF6EC', dark: '#F1E8D6' },
        gold: { DEFAULT: '#C9A227', dark: '#7A5F0A', light: '#FFF4CC' },
      },
    },
  },
  plugins: [],
};
