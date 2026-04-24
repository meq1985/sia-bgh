import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bgh: {
          50: "#eef2fb",
          100: "#d6def5",
          200: "#adbdea",
          300: "#7d94db",
          400: "#506fc9",
          500: "#2e52b4",
          600: "#1f4196",
          700: "#14387f",
          800: "#102c66",
          900: "#0b1f4a",
          DEFAULT: "#14387f",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
