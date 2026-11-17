# Evidencia del candidato D6

- Identidad de repositorio/worktree: `boxio` / `request-7-d6mvp-salas-privadas-online-identidad-in`.
- Base inspeccionada: `git rev-parse HEAD` debe capturarse por el coordinador antes de integrar; este worktree contiene cambios sin commit.
- Verificación técnica: `npm run build` y `npm test` pasan; engine 23/23, server 15/15, web 12/12.
- Evidencia funcional: pruebas unitarias del agregado, entrada tardía durante cadena de captura, reemplazo/histórico, restauración serializada, adapter SQL parametrizado, prueba HTTP y dos clientes WebSocket reales con comando concurrente.
- Alcance excluido y no introducido: chat, cuentas obligatorias, perfiles, rankings, tiendas, Redis, Kafka, microservicios, hosting obligatorio, sustitución por bot y assets externos.
- No se afirma merge, despliegue, disponibilidad, SLA ni validación física en dispositivos.
- Limitación explícita: no se ejecutó PostgreSQL real ni reinicio durable porque no hay daemon Docker/PostgreSQL disponible en este entorno; las tareas 1.2, 4.2 y 5.2 permanecen sin marcar.
