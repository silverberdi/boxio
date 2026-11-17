# Evidencia reproducible D0

Worktree candidato: `req-1-d0mvp-foundation-monorepo-openspec-y-con`.

Comandos ejecutados desde checkout con dependencias ausentes:

```text
npm ci --ignore-scripts --no-audit --no-fund
added 905 packages in 8s

npm run diagnostics
Node v22.22.1
npm 9.2.0
TypeScript 5.9.3
Angular 21.2.26
Fastify 5.12.8
Vitest 4.1.12
OpenSpec 1.13.1

npm run build
@boxio/engine: tsc passed
@boxio/server: tsc passed
@boxio/web: Angular production/development bundle passed

npm test
@boxio/engine: 1 test file, 6 tests passed
@boxio/server: 1 test passed
@boxio/web: production build passed

npm run check:assets
Validated 3 local canonical assets
```

No deployment, hosting, database, queue, external service, credentials, CDN or device validation was used. This is candidate-local evidence, not published-version evidence; therefore no `[PUBLISHED_EVIDENCE]` claim is used.
