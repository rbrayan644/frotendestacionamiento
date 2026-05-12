/** @type {import('tailwindcss').Config} */
module.exports = {
  // Añadimos la carpeta "app" y "components" a las rutas que Tailwind debe vigilar
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
