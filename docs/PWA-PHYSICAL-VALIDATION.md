# Registro de validación física D3

Este registro separa la comprobación automatizada del candidato de las pruebas físicas posteriores al despliegue. No se declara ejecutado mientras no exista un candidato desplegado con SHA identificable.

| Entorno | Instalación | Modo avión/revisita | Resultado | Evidencia |
|---|---|---|---|---|
| Chrome Android | PENDIENTE — requiere candidato desplegado | PENDIENTE — requiere candidato desplegado | NOT_RUN | — |
| Safari iPhone | PENDIENTE — requiere candidato desplegado | PENDIENTE — requiere candidato desplegado | NOT_RUN | — |
| Chromium escritorio | Automatizado por `node scripts/pwa-e2e.mjs` | Automatización de caché/shell | PASS cuando el comando pase | candidato SHA |

La prueba física debe registrar candidato, dispositivo, versión del navegador, fecha, instalación, cierre/ausencia de red, entrada a modalidad local y resultado sin afirmar recuperación de una partida tras cerrar el navegador.
