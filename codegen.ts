import type { CodegenConfig } from "@graphql-codegen/cli";

/**
 * GraphQL Code Generator config.
 *
 * In the real stack this points at the SDL exported by
 * `moodscale-platform/packages/graphql` (introspection is OFF in prod — we
 * generate from the committed SDL, never from a live introspection query).
 *
 * Until that monorepo exists locally, codegen is opt-in: `npm run codegen`
 * reads the SDL path below. The app ships HAND-AUTHORED types in
 * `src/lib/graphql/types.ts` that mirror the P0 schema (doc 13 P0-1/P0-2) so the
 * project type-checks and builds standalone, mock-first.
 *
 * TODO(V-3): once packages/graphql is published, swap `schema` to its SDL/entry
 * and replace the hand-authored types with generated ones.
 */
const SDL_PATH =
  process.env.GRAPHQL_SDL_PATH ??
  "../moodscale-platform/packages/graphql/schema.graphql";

const config: CodegenConfig = {
  overwrite: true,
  schema: SDL_PATH,
  documents: ["src/**/*.{ts,tsx}"],
  ignoreNoDocuments: true,
  generates: {
    "src/types/graphql-generated/": {
      preset: "client",
      presetConfig: {
        gqlTagName: "gql",
      },
    },
  },
};

export default config;
