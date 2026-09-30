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
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        ebony: "#09090b", // Modern OLED Zinc-950
        white: "#ffffff",
        lightGray: "#a1a1aa", // Zinc-400
        darkGray: "#18181b", // Zinc-900 surface
        electricBlue: "#6366f1", // Modern Indigo
        redAccent: "#ef4444",
        softPurple: "#8b5cf6",
        softGreen: "#10b981",
        softRed: "#f87171",
      },
      boxShadow: {
        glass: "0 8px 30px rgba(0, 0, 0, 0.12)",
        subtle: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)",
        elevated: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        electricBlue: "0 4px 20px rgba(99, 102, 241, 0.25)",
        darkGray: "0 4px 20px rgba(0, 0, 0, 0.2)",
        softPurple: "0 4px 20px rgba(139, 92, 246, 0.25)",
        lightGray: "0 4px 20px rgba(0, 0, 0, 0.06)",
        softRed: "0 4px 20px rgba(239, 68, 68, 0.25)"
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
