# Evidencia reproducible D7

## Candidato

- Worktree: `request-8-d7mvp-partidas-publicas-1v1-emparejamien`
- Validación: `openspec validate --changes "req-8-d7mvp-partidas-publicas-1v1-emparejamien" --strict`
- Resultado: `1 passed, 0 failed`
- No se usó evidencia publicada ni SHA de una versión publicada.

## Pruebas técnicas y E2E

- `npm test`
  - Engine: 23 passed.
  - Server: 37 passed, incluyendo migración/adapter PostgreSQL, carrera de cola, comandos autoritativos, reconexión, abandono, reinicio y E2E HTTP.
  - Web: 13 passed, incluyendo contrato UI de estados públicos, acciones accesibles, movimiento reducido y áreas táctiles.
- `npm run test --workspace @boxio/server`
  - Incluye E2E HTTP contra Fastify real para emparejamiento, rechazo de comandos, reconexión con rotación de credencial y fallback contra máquina usando reloj de servidor.
  - Incluye un escenario de integración PostgreSQL real que usa el pool de producción, HTTP sobre un servidor Fastify escuchando, carrera cancelación/emparejamiento, reinicio, abandono terminal y upgrade/downgrade de migración; permanece omitido sin `DATABASE_URL`.
- `npm run test --workspace @boxio/web`
  - Compila la aplicación Angular de producción y ejecuta las pruebas Vitest.

## Cobertura de contrato

- Migración reversible `002_public_matchmaking.py` y SQL con estados, versión, causal de finalización, asientos fijos y constraints de unicidad.
- Adapter PostgreSQL transaccional con hashes de credenciales, sin secretos en texto plano.
- Restore de snapshot y comandos deduplicados tras reinicio; transición terminal de abandono no reabrible.
- Gherkin en `packages/server/test/public-online-matchmaking.feature` y escenarios ejecutados por las suites unitarias/E2E del servidor.
- Contexto no disponible: no hay `DATABASE_URL`, daemon Docker ni cliente PostgreSQL en este worktree, por lo que la migración y el flujo combinado contra PostgreSQL real quedan pendientes de ejecución en CI/entorno de integración.
- No se ejecutó despliegue ni validación post-deploy; queda fuera del alcance de este Change.
