import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/.turbo/**", "**/coverage/**", "**/next-env.d.ts", "pnpm-lock.yaml"],
  },
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Banyak halaman legacy masih melakukan fetch-on-mount di useEffect.
      // Tetap laporkan pola ini, tetapi jangan jadikan blocker sampai migrasi dilakukan per halaman.
      "react-hooks/set-state-in-effect": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      // Nonaktifkan sementara — 1035 warning tidak ada yang error.
      // TypeScript compiler sudah handle unused var detection via tsc --noEmit.
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off",
    },
  },
);
