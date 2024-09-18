/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "100%",
        md: "720px",
        lg: "960px",
        xl: "1140px",
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        // Threads app color palette
        ebony: "#101010", // Primary background color
        white: "#ffffff", // Text and icon color on dark background
        lightGray: "#8e8e8e", // Secondary text and placeholders
        darkGray: "#262626", // Secondary background and UI elements
        electricBlue: "#0095f6", // Links, buttons, notifications
        redAccent: "#ff3040", // Important actions or errors
        softPurple: "#9b51e0", // Reactions or accents
        softGreen: "#27ae60", // Success indicators or positive actions
      },
    },
  },
  darkMode: "class", // Enable dark mode using class strategy
  plugins: [],
};
