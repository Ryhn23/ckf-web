/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        heading: ['Sora', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(15, 118, 110, 0.18)',
      },
    },
  },
  plugins: [],
};
