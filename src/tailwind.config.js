// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // scan all your source files
  ],
  theme: {
    extend: {
      // You don’t need to manually add colors here since you’re using @theme in CSS,
      // but you can add extra utilities if needed.
      borderRadius: {
        lg: "var(--radius)", // maps to your CSS variable
      },
      fontFamily: {
        sans: "var(--sans)",
        mono: "var(--mono)",
      },
    },
  },
  plugins: [
    // Add any Tailwind plugins you want here
    require("tailwindcss-animate"), // matches your tw-animate-css import
  ],
};
