/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          900: '#05071a',
          800: '#0a0e27',
          700: '#121738',
          600: '#1c2350',
          500: '#2a3470',
        },
        glow: {
          common: '#ffd666',
          uncommon: '#7cf8b7',
          rare: '#7ec8ff',
          legendary: '#ff9cf2',
        },
      },
      fontFamily: {
        display: ['ui-rounded', 'system-ui', 'sans-serif'],
      },
      animation: {
        'drift': 'drift 8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(10px, -6px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
      },
    },
  },
  plugins: [],
};
