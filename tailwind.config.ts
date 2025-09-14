import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#cfd5df",
          300: "#a7b2c8",
          400: "#7a8dab",
          500: "#5b6f8f",
          600: "#485874",
          700: "#3b465e",
          800: "#333b4f",
          900: "#2c3243"
        },
        accent: {
          500: "#0A84FF",
          600: "#0066CC"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)"
      }
    }
  },
  plugins: [],
};

export default config;
