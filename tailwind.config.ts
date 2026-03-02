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
      gridTemplateColumns: {
        "24": "repeat(24, minmax(0, 1fr))",
      },
      colors: {
        surface: {
          DEFAULT: "#0a0a0a",
          elevated: "#141414",
          muted: "#171717",
        },
        border: {
          DEFAULT: "#262626",
          muted: "#1f1f1f",
        },
        "terminal-up": "#00ff00",
        "terminal-down": "#ff003c",
      },
    },
  },
  plugins: [],
};

export default config;
