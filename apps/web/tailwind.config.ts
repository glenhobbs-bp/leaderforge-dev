import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",           // ✅ For /app directory (App Router)
    "./components/**/*.{js,ts,jsx,tsx}",    // ✅ For shared components
    "./pages/**/*.{js,ts,jsx,tsx}",         // Optional: only if you use Pages Router
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;

