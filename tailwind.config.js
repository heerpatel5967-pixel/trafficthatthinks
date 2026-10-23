/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        command: {
          bg: '#070b14',
          surface: '#0d1527',
          card: '#131e36',
          border: '#1f2f54',
          hover: '#192849',
        },
        cyber: {
          cyan: '#00f2fe',
          blue: '#4facfe',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          purple: '#8b5cf6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'beacon': 'beacon 1s ease-in-out infinite alternate',
      },
      keyframes: {
        beacon: {
          '0%': { opacity: '0.4', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1.02)' },
        },
      },
    },
  },
  plugins: [],
};
