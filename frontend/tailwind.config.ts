import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand / Primary
        "brand-primary": "4F46E5",
        "brand-primary-foreground": "FFFFFF",
        "brand-subtle": "E4E6F1",

        // Surface & Card
        "surface": "F8FAFC",
        "card": "FFFFFF",
        "card-foreground": "1E293B",

        // Muted
        "muted": "94A3B8",
        "muted-foreground": "64748B",

        // Borders
        "border": "E2E8F0",
        "border-focus": "4F46E5",

        // Status colors (role-based)
        "status-available": "22C55E",
        "status-assigned": "F59E0B",
        "status-picked-up": "EAB308",
        "status-delivered": "8B5CF6",
        "status-completed": "10B981",
        "status-cancelled": "6B7280",
        "status-expired": "EF4444",

        // Action colors
        "action-primary": "4F46E5",
        "action-secondary": "6B7280",

        // Semantic
        "success": "10B981",
        "warning": "F59E0B",
        "error": "EF4444",
        "info": "6366F1",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        lg: "0.5rem",   // rounded-lg
        md: "0.375rem", // rounded-md
        sm: "0.125rem", // rounded-sm
        full: "9999px", // rounded-full
      },
      borderWidth: {
        DEFAULT: "1px",
        0: "0px",
      },
    },
  },
  plugins: [],
};
export default config;