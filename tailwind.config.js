/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Grade-driven accent colours
        gradeD: '#C0392B',
        gradeC: '#E67E22',
        gradeB: '#F1C40F',
        gradeA: '#27AE60',
        gradeS: '#00BFA5',
        // Movement category colours
        pull: '#4ECDC4',
        squat: '#A29BFE',
        press: '#FF6B6B',
        posterior: '#FDCB6E',
        // Base
        base: '#0F0F14',
        surface: '#1A1A24',
        surfaceHigh: '#252535',
        border: '#2E2E42',
      },
    },
  },
  plugins: [],
};
