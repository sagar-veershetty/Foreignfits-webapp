/** @type {import('tailwindcss').Config} */
export default {
  // Scan Angular templates and TS (for inline templates/classes)
  content: [
    './index.html',
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
