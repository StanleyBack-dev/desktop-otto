import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["out/**", "dist/**", "node_modules/**", "resources/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["scripts/**/*.mjs", "*.config.{ts,mjs}"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  },
  {
    files: ["src/renderer/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  // Layers: the screens never reach the Node side (it holds the client key
  // and the session tokens); they only use the preload bridge.
  {
    files: ["src/renderer/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/main/**", "electron", "node:*", "fs", "path"],
              message:
                "Screens use window.otto (preload bridge), never Node or the main process.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/renderer/src/design-system/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/features/**"],
              message: "The design system is domain-agnostic.",
            },
          ],
        },
      ],
    },
  },
);
