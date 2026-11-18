# Tasks

## 1. Contratos y persistencia pública

- [x] 1.1 Inventariar los writers/callers y contratos de D6 que gestionan identidad temporal, sesiones, snapshots, eventos y reconexión; verificar que el inventario cubre la reutilización pública sin duplicar autoridad.
- [x] 1.2 Añadir el modelo/migración PostgreSQL para búsqueda pública, estado de emparejamiento, asiento fijo, versión y causal de finalización; verificar constraints de unicidad y migración reversible en una base de prueba.
  - [CANDIDATE_EVIDENCE sha=8332833b94c8b886b328d177acadb45b744c454d] Migración verificada en PostgreSQL real (upgrade y downgrade ejecutados exitosamente con constraints de unicidad y FKs); tests del adaptador de persistencia y reversibilidad en verde (44 tests en server).
- [x] 1.3 Implementar las transiciones autoritativas `searching`, `cancelled` y `matched`, incluyendo expiración de 60 s y deduplicación; verificar con pruebas transaccionales que cada búsqueda termina en un único estado confirmado.

## 2. Emparejamiento y comandos de partida

- [x] 2.1 Implementar entrada, consulta y cancelación de cola pública para invitados; verificar con pruebas de API que una búsqueda cancelada no puede emparejarse y que los reintentos son idempotentes.
- [x] 2.2 Implementar el emparejador atómico de exactamente dos búsquedas y el rechazo de terceros, ingreso tardío, reemplazo y códigos de sala; verificar escenarios de dos invitados, tercer jugador y solicitudes concurrentes.
- [x] 2.3 Conectar la partida pública al motor y al protocolo autoritativo de D6; verificar duplicidad, identidad, turno, versión, aristas, cierres, puntuación, bonus, fin, empate y máscaras de celdas cuadradas mediante regresión del motor y comandos online.
- [x] 2.4 Implementar la opción post-timeout contra máquina como creación de sesión separada; verificar que la búsqueda se consume antes de crearla y que ningún bot aparece en la cola pública.

## 3. Reconexión, abandono y recuperación

- [x] 3.1 Aplicar la reserva de reconexión pública de 60 s con credencial privada rotada y reloj de servidor; verificar recuperación dentro del plazo y rechazo después de expirar.
- [x] 3.2 Implementar la terminación por abandono del rival sin reemplazo ni tercer participante; verificar que el resultado usa causal `abandonment`, conserva el snapshot histórico y no compara ni infiere ganador por cantidad de cuadros.
- [x] 3.3 Integrar recuperación tras reinicio y reconciliación de búsquedas/matches confirmados; verificar que el último movimiento/evento no se duplica y que una transición terminal no se reabre.

## 4. Cliente y experiencia pública

- [x] 4.1 Añadir la entrada «Partida pública», estado de búsqueda y acción cancelar; verificar en prueba de UI que el estado confirmado por servidor se muestra y que cancelar impide una partida futura.
- [x] 4.2 Añadir el estado sin rival a los 60 s con acciones jugar contra la máquina, continuar buscando y cancelar; verificar que cada acción produce el flujo especificado y que jugar contra máquina explica que es una partida separada.
- [x] 4.3 Mostrar conexión, reconexión, reserva y resultado por abandono con texto y señales no dependientes solo del color; verificar teclado, foco, áreas táctiles mínimas y preferencia de movimiento reducido en los estados públicos.

## 5. Validación integrada y entrega

- [x] 5.1 Crear escenarios Gherkin/E2E autenticados para emparejamiento, cancelación concurrente, ausencia de rival, reconexión límite, abandono, rechazo de terceros y fallback contra máquina; verificar ejecución contra backend y PostgreSQL reales, no mocks de todo el flujo.
  - [CANDIDATE_EVIDENCE sha=8332833b94c8b886b328d177acadb45b744c454d] Escenarios E2E integrados en suite con servidor Fastify y adaptadores PostgreSQL reales; concurrencia, reconexión, abandono y persistencia probados en verde (80 tests en suite).
- [x] 5.2 Ejecutar regresión de modalidades privadas y de invariantes del motor, incluyendo reglas 2–4 de D6, celdas cuadradas, doble cierre, bonus, empate y rechazo de comandos inválidos; verificar que no hay regresiones fuera del alcance público.
- [x] 5.3 Verificar catálogo de assets y retirar cualquier ruta/código superseded dentro del alcance D7 solo si el nuevo flujo lo reemplaza; verificar que no quedan dependencias de assets externos ni rutas de matchmaking duplicadas.
- [x] 5.4 Recopilar evidencia reproducible de pruebas, migraciones, concurrencia, accesibilidad y estados de resultado; verificar `openspec validate` y dejar el PR preparado para revisión humana sin merge ni despliegue automático.
