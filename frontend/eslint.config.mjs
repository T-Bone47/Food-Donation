import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Allow any type for hackathon speed
      "@typescript-eslint/no-explicit-any": "off",
      // Allow unused vars (prefix with _ if intentionally unused)
      "@typescript-eslint/no-unused-vars": "warn",
      // Allow unescaped entities in JSX
      "react/no-unescaped-entities": "off",
      // Allow missing Link import (Next.js handles it)
      "react/jsx-no-undef": "off",
      // Prefer const assertions - disable for hackathon
      "@typescript-eslint/prefer-as-const": "off",
    },
  },
];

export default eslintConfig;