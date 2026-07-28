import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-nunito)", "sans-serif"],
        playfair: ["var(--font-playfair)", "Georgia", "serif"],
      },
      colors: {
        'ts-orange': '#C8531A',
        'ts-orange-hover': '#A8431A',
        gold: {
          50:  "#fffbeb",
          100: "#fef3c7",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        },
        'ts-teal': {
          50:  '#e8f5f6',
          100: '#c8e8ec',
          200: '#a3d4da',
          300: '#8ec3cc',
          400: '#7BADB5',
          500: '#5d9099',
          600: '#3d6b73',
          700: '#2d5560',
          800: '#1e3a40',
          900: '#132630',
          950: '#0a1820',
        },
      },
      animation: {
        "bounce-slow": "bounce 3s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
