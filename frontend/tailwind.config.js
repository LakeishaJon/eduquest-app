/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Main brand colors
        primary: '#14b8a6', // Teal
        secondary: '#f97316', // Orange
        accent: '#fbbf24', // Amber/Gold
        
        // Game-specific colors
        math: {
          light: '#5eead4',
          DEFAULT: '#14b8a6',
          dark: '#0f766e',
        },
        word: {
          light: '#fdba74',
          DEFAULT: '#f97316',
          dark: '#c2410c',
        },
        
        // UI colors
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 50%, #10b981 100%)',
        'gradient-math': 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)',
        'gradient-word': 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
      },
    },
  },
  plugins: [],
}
