# cr-vc-reference-apps — Operating Rules

> Reference issuer + verifier Express services for the Costa Rica SSI driving ecosystem. Wraps `@attestto/cr-vc-sdk`.

## Stack

- pnpm workspaces (root + `apps/issuer/` + `apps/verifier/`)
- Node 20+, Express, TypeScript NodeNext modules
- Vitest + supertest for integration tests
- Docker Compose for end-to-end demo
- GitHub Actions CI (typecheck → build → test)

## Commands

- `pnpm install` — install all workspace deps
- `pnpm build` — build both apps via tsc
- `pnpm test` — run vitest in both apps
- `pnpm typecheck` — strict TS check
- `pnpm issuer:dev` — issuer dev server on :3001
- `pnpm verifier:dev` — verifier dev server on :3002
- `docker compose up --build` — both services in containers

## Architecture

- Each app is independent: own package.json, tsconfig, Dockerfile
- Express factories in `src/app.ts` exported separately from `src/index.ts` for testability via supertest
- Issuer key material is generated on startup unless `ISSUER_PRIVATE_KEY` is provided
- Verifier maintains a static trust registry from `TRUSTED_ISSUERS` env

## Rules

- This is a public reference repo — third parties clone it. Apache 2.0.
- Do not introduce CORTEX-specific patterns (no Adonis, no Lucid).
- Ship tests with every endpoint. Use supertest against the Express app factory.
- Do not add a database — credentials are stateless in/out. Persistence is the consumer's responsibility.
- Do not add an admin UI — separate concern, separate repo.
- Do not run `pnpm dev` autonomously — user owns the dev server.
