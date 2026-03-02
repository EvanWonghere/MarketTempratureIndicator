import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0d0d0f",
          elevated: "#161618",
          muted: "#1c1c1f",
        },
        border: {
          DEFAULT: "#2a2a2e",
          muted: "#1f1f23",
        },
      },
    },
  },
  plugins: [],
};

export default config;
