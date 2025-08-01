import type { Config } from "tailwindcss";

// tailwind.config.ts
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./config/**/*.json", // ✅ REQUIRED to extract classnames from JSON
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
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
    "text-gray-400",
    // Modal styling classes
    "backdrop-blur-sm",
    "backdrop-blur",
    "backdrop-blur-md",
    "border-white/20",
    "border-white/30",
    "border-white/50",
    "border-8",
    "bg-black/70",
    "bg-black/80",
    "bg-black/50",
    "bg-black/60",
    "rounded-lg",
    "rounded-xl",
    "rounded-full",
  ],
};

export default config;
