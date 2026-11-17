# D0 toolchain evidence

The candidate uses npm workspaces and records the observed local toolchain. The diagnostic command is `npm run diagnostics`.

Observed before implementation: Node `22.22.1`, npm `9.2.0`, OpenSpec `1.13.1`; pnpm and yarn were not installed. Candidate package versions are pinned in `package.json`/`package-lock.json`: Angular `21.2.26`, Fastify `5.12.8`, TypeScript `5.9.3`, and Vitest `4.1.12`.

This is candidate-local evidence, not published-version evidence; no published SHA is used to claim task completion.
