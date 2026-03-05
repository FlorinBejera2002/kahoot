/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#DC2626', dark: '#b91c1c', light: '#ef4444' },
        accent: '#EAC243',
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f9fafb',
          dark: '#111827',
        },
        kahoot: {
          red: '#DC2626',
          blue: '#2563eb',
          yellow: '#d97706',
          green: '#16a34a',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'scale-in': { from: { transform: 'scale(0.8)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        'shake': { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-5px)' }, '75%': { transform: 'translateX(5px)' } },
        'bounce-in': { '0%': { transform: 'scale(0)' }, '50%': { transform: 'scale(1.15)' }, '100%': { transform: 'scale(1)' } },
        'pulse-ring': { '0%': { transform: 'scale(1)', opacity: '1' }, '100%': { transform: 'scale(1.5)', opacity: '0' } },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'bounce-in': 'bounce-in 0.5s ease-out',
        'pulse-ring': 'pulse-ring 1s ease-out infinite',
      },
    },
  },
  plugins: [],
};
