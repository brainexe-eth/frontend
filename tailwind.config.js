/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        void: '#0a0a0b',
        panel: '#111113',
        border: '#27272a',
        muted: '#52525b',
        accent: '#a78bfa',
        accent2: '#4ade80',
        danger: '#f87171',
      },
    },
  },
  plugins: [],
};
