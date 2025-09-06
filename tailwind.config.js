/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 👈 Busca clases en todos tus componentes React
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
