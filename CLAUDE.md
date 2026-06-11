# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test                                  # run full Vitest suite (unit + integration)
npm run test:watch                        # watch mode
npx vitest run tests/unit/generate.test.js  # run a single test file
node test-server/server.js                # start mock GraphQL server on :8085
node src/index.js -u http://localhost:8085/graphql   # run the generator

# Full example with all options
node src/index.js -u http://localhost:8085/graphql -o output -d 10 -e __typename -i --dry-run --verbose
```

No build or lint step — plain ESM Node.js CLI (requires Node >= 18 for native `fetch`).

## Architecture

The tool introspects a live GraphQL endpoint and generates `.graphql` query files, `.json` variable files, and an Insomnia v4 collection export.

**Data flow:**
1. `src/index.js` — CLI entry point (Commander). Merges `.graphqlgenrc.json` config with CLI flags (CLI wins, via `program.getOptionValueSource()`), validates input, drives the pipeline. Interactive mode uses an inquirer v8 checkbox prompt.
2. `src/config.js` — Loads `.graphqlgenrc.json` from CWD; returns `{}` on missing/invalid file.
3. `src/fetchSchema.js` — Sends an introspection query (with AbortController timeout, default 30s), validates the response has `__schema`, returns a `GraphQLSchema` via `buildClientSchema`.
4. `src/generate.js` — Core logic. `generateAll()` iterates every Query and Mutation field. `buildSelectionSet()` recurses into output types (capped at `maxDepth`, default 10); `resolveVariableDefault()` recurses into input types/enums/lists to build default variable values.
5. `src/defaults.js` — Maps scalar type names (`String`, `Int`, `Float`, `Boolean`, `ID`) to default values. Add custom scalar defaults here; unknown scalars fall back to `""`.
6. `src/writer.js` — Writes per-operation files into `<outdir>/queries/` and `<outdir>/mutations/`. Writes are atomic: staged in `<outdir>.tmp`, then renamed into place; the temp dir is cleaned up on failure.
7. `src/insomnia.js` — Builds an Insomnia v4 export: one workspace, one folder named after the endpoint URL, one request per operation. Request bodies are standard GraphQL-over-JSON (`mimeType: application/json`, `variables` as an object).

**Key design details:**
- Union types generate inline fragments (`... on TypeName`); interfaces expand their own fields.
- `--max-depth` and `--timeout` are validated at CLI parse time via Commander argParsers (rejects non-positive/NaN before generation starts).
- Config merge precedence: explicit CLI flag > config file > Commander default. Detected with `getOptionValueSource()` — do not compare against default values to infer "user passed this flag".
- `--quiet` suppresses all non-error output via the `log()` helper in index.js; new user-facing messages should use `log()`/`verbose()`, not `console.log`.

## Tests

`tests/unit/` covers each module in isolation (fetch is stubbed with `vi.stubGlobal`). `tests/unit/cli.test.js` runs the real CLI in a child process — it catches module-load errors that unit tests miss. `tests/integration/pipeline.test.js` starts an Apollo server on port 18085 and runs the full pipeline against it.

`test-server/server.js` is a manual mock server (Apollo Server 3, `User` schema, port 8085) for end-to-end smoke testing.
