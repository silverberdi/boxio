# Evidencia automatizada de viewport

Fecha de ejecución: 2026-11-16 (entorno local del candidato).

La suite `packages/web/src/local-game.test.ts` registra y verifica los tres viewports requeridos por UX:

| Viewport CSS | Etiqueta | Resultado |
|---:|---|---|
| 360×640 | mobile | PASS |
| 768×1024 | tablet | PASS |
| 1280×800 | desktop | PASS |

Comando: `npm test`.

La evidencia comprueba el contrato de tamaños definido por el change y la compilación responsive del frontend. La validación física en teléfono, tablet y escritorio permanece `PENDING` hasta disponer de un candidato desplegado y dispositivos/personas reales; no se presenta como ejecutada.
