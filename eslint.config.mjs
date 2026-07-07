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
      ".next/**",
      "node_modules/**",
      "src/types/graphql-generated/**",
    ],
  },
  {
    rules: {
      // Allow intentionally-unused args/vars prefixed with "_" (e.g. scaffolded
      // tab components that accept `filters` but don't read it yet).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Hard rule: this client must never import a Supabase data client, a
      // service-role key, or do direct DB access. Guard it at lint time.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@supabase/supabase-js",
              importNames: ["createClient"],
              message:
                "Do not create a raw Supabase data client here. Use src/lib/supabase/client.ts (Auth-only, anon key). All data must come from the GraphQL API.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
