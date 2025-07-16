/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        secondary: 'var(--secondary-color)',
        'primary-hover': 'var(--primary-color-hover)',
        'secondary-hover': 'var(--secondary-color-hover)',
      },
    },
  },
  plugins: [],
};
