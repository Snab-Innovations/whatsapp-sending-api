/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        instagram: {
          blue: '#0095f6',
          blueHover: '#1877f2',
          pink: '#e1306c',
          purple: '#833ab4',
          orange: '#f09433',
          red: '#fd1d1d',
          yellow: '#fcb045',
          bg: '#fafafa',
          surface: '#ffffff',
          border: '#e2e8f0',
          text: '#0f172a',
          secondary: '#64748b',
          bubbleOut: '#0095f6',
          bubbleIn: '#f1f5f9'
        }
      }
    },
  },
  plugins: [],
}
