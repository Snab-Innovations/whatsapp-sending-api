/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          dark: '#0b141a',
          card: '#111b21',
          hover: '#202c33',
          border: '#222d34',
          accent: '#00a884',
          accentHover: '#008f6f',
          textMuted: '#8696a0',
          textBright: '#e9edef',
          bubbleOut: '#005c4b',
          bubbleIn: '#202c33'
        }
      }
    },
  },
  plugins: [],
}
