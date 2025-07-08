/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#DC2626', // Rouge US Aignan
        secondary: '#000000', // Noir US Aignan
        'primary-hover': '#B91C1C', // Un rouge un peu plus foncé pour le hover
        'secondary-hover': '#1F2937', // Un gris foncé pour le hover du noir
      },
    },
  },
  plugins: [],
};
