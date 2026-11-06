const brand = (n) => `rgb(var(--brand-${n}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: brand(50), 100: brand(100), 500: brand(500), 600: brand(600), 700: brand(700) }
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Vazir', 'Tahoma', 'Segoe UI', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
