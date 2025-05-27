import type { Config } from 'tailwindcss';

// tailwind.config.ts
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./config/**/*.json", // ✅ REQUIRED to extract classnames from JSON
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    "bg-purple-600",
    "hover:bg-purple-700",
    "bg-white",
    "text-gray-700",
    "hover:bg-purple-50",
    "border",
    "border-gray-200",
    "shadow",
    "bg-gradient-to-b",
    "from-white",
    "to-gray-50",
    "text-gray-400"
  ],
};

export default config;

