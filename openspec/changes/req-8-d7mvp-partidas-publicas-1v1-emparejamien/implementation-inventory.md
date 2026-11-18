# Inventario D6 reutilizado por D7

| Responsabilidad | Writer/caller vigente | Reutilización pública |
|---|---|---|
| Identidad temporal y credencial privada | `packages/server/src/private-room.ts` (`hostCredentials`, `reconnect`, hash SHA-256) | `public-matchmaking.ts` conserva credencial opaca, hash y rotación; no usa código de sala como autenticación |
| Snapshot, versión y secuencia | `PrivateRoom.snapshot`, `toPersistence` | `PublicMatchSnapshot` mantiene `version` y `eventSequence`; los comandos solo mutan tras validación |
| Comandos y deduplicación | `PrivateRoom.submit` + `RoomCommand` | `PublicMatch.submit` conserva idempotencia por `commandId`, versión, turno, identidad y arista |
| Motor | `@boxio/engine` vía `applyMove` | No existe motor público paralelo; se reutilizan cierres, puntos, bonus, fin y máscaras cuadradas |
| Reconexión | `PrivateRoom.disconnect/reconnect/expireReservations` | Reserva pública de 60 s; expiración produce `abandonment`, sin reemplazo |
| Persistencia SQL | `PostgresRoomPersistence`, `001_private_rooms.sql` | `002_public_matchmaking.sql` añade cola, match y asientos; PostgreSQL queda como estado durable previsto |

No se duplica autoridad: la cola pública solo selecciona dos búsquedas; `PublicMatch` es la autoridad de la partida y llama al motor compartido. El frontend proyecta snapshots confirmados.
