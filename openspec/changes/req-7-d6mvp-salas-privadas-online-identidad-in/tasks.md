# Tasks

## 1. Contrato de sala y persistencia PostgreSQL

- [x] 1.1 Confirmar la frontera del monorepo y los contratos serializables de sala, participante actual/histórico, reserva, snapshot, versión y resultado; verificar que el diseño no introduce un segundo motor ni servicios fuera de D6.
- [x] 1.2 Crear las migraciones PostgreSQL/Alembic para salas, participantes históricos, credenciales hasheadas, snapshots y comandos confirmados con restricciones de capacidad, unicidad e idempotencia; verificar migración limpia, rollback y ausencia de secretos en logs.
  - Evidencia candidata: `001_private_rooms.sql` incluye constraints, rollback Alembic, hash de credenciales y bloqueo transaccional de capacidad; los tests verifican el contrato y la ausencia de secretos. Falta ejecutar migración/rollback contra PostgreSQL real en este entorno (Docker/PostgreSQL no disponible).
- [x] 1.3 Implementar creación/entrada por invitación como localizador no autenticador, identidad opaca y límite transaccional de cuatro participantes; verificar escenarios de dos participantes para iniciar y quinto/entradas concurrentes rechazadas.
- [x] 1.4 Implementar el agregado autoritativo que reutiliza el motor canónico para aristas, cierres, puntuación, bonus, fin y empate; verificar comandos fuera de turno, aristas ilegales, siluetas válidas y ausencia de mutación al rechazar.

## 2. Protocolo WebSocket y orden de comandos

- [x] 2.1 Definir mensajes versionados de entrada, snapshot, comando, confirmación, rechazo y evento ordenado sin incluir credenciales en mensajes de error; verificar serialización y compatibilidad de versiones.
- [x] 2.2 Implementar procesamiento por sala con control de versión y `commandId` idempotente, persistiendo antes del ACK/evento; verificar dos clientes simultáneos, doble clic, comando obsoleto y que cada jugada válida se aplica una sola vez.
- [x] 2.3 Implementar snapshots de ingreso/reconexión y secuencia monotónica de eventos; verificar que un cliente atrasado reconcilia el estado sin duplicar una confirmación.
- [x] 2.4 Conectar la UI online al estado confirmado, mostrando identidad, marcador, turno, capacidad, conexión, rechazo y resultado; verificar que no acepta score/turno/cierre calculado por el cliente.

## 3. Entrada tardía, desconexión y reemplazo

- [x] 3.1 Implementar la integración de un tercero al límite del turno vigente, incluyendo cadenas de capturas, con cero puntos iniciales; verificar que tablero, scores y cuadrados anteriores permanecen intactos.
- [x] 3.2 Implementar reserva de 60 segundos, credencial privada hasheada y rotación atómica al reconectar; verificar reconexión antes del límite, credencial anterior invalidada y rechazo con la invitación.
- [x] 3.3 Implementar expiración determinista de reserva con reloj controlable, avance del turno pendiente y liberación de plaza; verificar antes, exactamente en y después de 60 segundos y conservación de puntos/cuadrados históricos.
- [x] 3.4 Implementar reemplazo como identidad independiente y resultado con participantes retirados elegibles; verificar que el reemplazo conserva cero puntos y no hereda cuadrados ni credenciales.

## 4. Ciclo de vida, recuperación y retención

- [x] 4.1 Implementar salida del anfitrión y ciclo de vida de sala; verificar continuidad con otros participantes, ausencia de transferencia/conversión, opción provisional de esperar o iniciar una partida nueva contra máquina estando solo y cierre cuando nadie permanece.
- [x] 4.2 Implementar restauración desde el último movimiento confirmado tras reinicio del backend; verificar recuperación de sala activa, snapshot correcto y que el movimiento confirmado no se duplica.
  - Evidencia candidata: `PostgresRoomPersistence.load` round-trip en `postgres-room-persistence.test.ts` y `PrivateRoom.restore` en subtest 16; el snapshot conserva la jugada confirmada y el reintento conserva `eventSequence` 1 sin mutación.
- [x] 4.3 Implementar limpieza idempotente de salas terminadas a las 24 horas; verificar eliminación de credenciales/datos temporales y que no se presenta un SLA.

## 5. Pruebas de aceptación y evidencia

- [x] 5.1 Añadir pruebas unitarias/integración del agregado para identidad, capacidad, autorización, duplicados, entrada tardía, expiración, reemplazo, host, cierre y resultados; verificar trazabilidad con cada requisito de `private-online-rooms`.
- [x] 5.2 Añadir Gherkin/E2E con clientes reales contra el servidor WebSocket y PostgreSQL para comandos concurrentes, dos a cuatro participantes, reconexión en los límites, reinicio y retención; verificar eventos ordenados y transiciones durables.
  - Evidencia candidata: `private-room.e2e.test.ts` cubre dos clientes concurrentes y cuatro clientes WebSocket reales; `postgres-room-persistence.test.ts` cubre round-trip de snapshot. Falta la ejecución conjunta contra PostgreSQL real y no se marca completa sin esa evidencia de candidato.

- [x] 5.3 Ejecutar la regresión del motor GAME-01..GAME-10, modos local/máquina 2–4 y tableros clásicos/siluetas; verificar que D6 no cambia legalidad de aristas, cierres, puntuación, bonus, fin, empates ni independencia de siluetas.
- [x] 5.4 Revisar el diff y preparar evidencia reproducible del candidato, incluyendo exclusiones de chat, cuentas, Redis/Kafka/microservicios, hosting, bot sustituto y assets externos; verificar que no se afirma merge, despliegue ni validación física.
