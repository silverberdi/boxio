# Design

## Context

La base ya define un motor TypeScript puro para tableros de celdas cuadradas y una dirección técnica de Angular, Fastify, WebSockets y PostgreSQL. D6 añade la primera frontera online y debe reutilizar el motor sin confiar en el cliente para reglas, identidad o puntuación. La motivación y el contrato observable están en `proposal.md` y `specs/private-online-rooms/spec.md`; DEC-27 y DEC-28 fijan los tiempos y el ciclo de vida, mientras DEC-34 sigue siendo una resolución provisional.

## Goals / Non-Goals

**Goals:**

- Construir una única autoridad de sala que serialice comandos, confirme eventos y produzca snapshots recuperables.
- Separar el código de invitación, la credencial privada de reconexión y la identidad histórica del participante.
- Hacer explícitos los límites de capacidad, la integración de entradas tardías, la expiración de 60 segundos, el reemplazo y la retención de 24 horas.
- Persistir únicamente el estado online necesario en PostgreSQL y mantener la solución portable entre hosts.
- Entregar evidencia automatizada de invariantes, carreras, reinicio y límites de tiempo sin afirmar despliegue ni validación física.

**Non-Goals:**

- No implementar público 1v1, matchmaking, cuentas, chat, perfiles, rankings, monetización ni publicación/hosting.
- No introducir Redis, Kafka, microservicios, colas o un segundo motor de reglas.
- No convertir la sala privada en una partida contra bot ni transferir su estado por la salida del anfitrión.
- No prometer SLA ni recuperación de partidas locales tras cerrar el navegador.

## Decisions

### 1. Agregado autoritativo de sala y motor compartido

El servidor mantendrá un agregado serializable de sala/partida: configuración de tablero, participantes actuales e históricos, estado del motor, reservas, versión y resultado. Cada comando se valida contra ese agregado y se procesa mediante la librería pura existente; el cliente solo envía intención y aplica confirmaciones. Esto evita divergencia entre reglas online, local y máquina.

Alternativa descartada: aceptar score, turno o cuadrados calculados por el cliente. Permitiría suplantación y carreras no reproducibles.

### 2. PostgreSQL transaccional con snapshot y secuencia de comandos confirmados

Cada transición válida se guardará en una transacción PostgreSQL junto con la versión siguiente y un identificador de comando único; la confirmación WebSocket se emitirá después del commit. Se conservará el snapshot durable y la secuencia mínima de movimientos/confirmaciones necesarios para recuperar el último estado, sin combinar event sourcing completo con tablas duplicadas. Un índice/constraint por sala y command-id hará idempotente el reintento.

Alternativa descartada: memoria de proceso como fuente de verdad, porque se pierde con reinicios; y event sourcing más snapshots paralelos, porque añade complejidad no justificada por el MVP.

### 3. Tres secretos y roles distintos

La invitación será un localizador de sala de entropía suficiente y no autorizará acciones. La credencial privada de reconexión será opaca, limitada a sala/participante, almacenada de forma no recuperable (hash) y rotada atómicamente al reconectar; la identidad histórica será un ID distinto de ambos secretos. No se escribirán secretos en logs.

Alternativa descartada: usar el código de invitación como token de jugador o reutilizar el ID histórico como secreto.

### 4. Máquina de estados explícita para reservas y entradas tardías

El agregado distinguirá participante conectado, desconectado-reservado, expirado-retirado y reemplazo nuevo. La expiración se evaluará de forma determinista con un reloj inyectable en el dominio de sala: cancela la elegibilidad de reconexión, avanza el turno si corresponde y libera el cupo. La cola de integración de entradas tardías se aplicará al límite de turno confirmado, por lo que una cadena de capturas no se interrumpe.

Alternativa descartada: eliminar inmediatamente al desconectar, porque pierde identidad y hace imposible el contrato de 60 segundos; también se descarta pausar indefinidamente el turno.

### 5. Orden y concurrencia por sala

Los comandos de una sala se procesarán bajo una sección crítica por `roomId` y control optimista de versión en PostgreSQL. El primer comando válido que confirme una versión gana; los demás se rechazan como obsoletos o se resuelven como duplicados por `commandId`, sin emitir dos confirmaciones. La misma secuencia se usa al reanudar sockets y al recuperar tras reinicio.

Alternativa descartada: confiar en el orden de llegada de sockets separados o añadir un broker distribuido; ambos serían frágiles y exceden D6.

### 6. Limpieza sin SLA ni servicio adicional

La limpieza de salas terminadas con edad >=24 horas será una operación idempotente del backend respaldada por índices de estado/fecha; podrá ejecutarse al arranque y durante la operación normal. No se crea un servicio de hosting ni una garantía operativa. El cierre de una sala vacía invalida sus credenciales y comandos pendientes.

Alternativa descartada: conservar indefinidamente datos terminados o introducir un scheduler/servicio separado para una necesidad que no tiene SLA.

## Risks / Trade-offs

- **[Riesgo]** La expiración cerca de 60 segundos puede competir con una reconexión. → Comparar ambas transiciones dentro de la misma transacción y exigir una única decisión de versión; probar antes, exactamente en y después del límite con reloj controlado.
- **[Riesgo]** Un snapshot parcial tras un fallo podría confirmar un movimiento no durable. → Commit de estado y comando antes del ACK/evento; prueba de reinicio entre validación, commit y emisión.
- **[Riesgo]** Los participantes históricos pueden confundirse con ocupantes actuales. → IDs históricos inmutables, estados explícitos y escenarios de resultado que separen retirado y reemplazo.
- **[Riesgo]** Reintentos WebSocket pueden duplicar eventos visuales. → Secuencia monotónica por sala, command-id idempotente y snapshot de reconciliación al reconectar.
- **[Riesgo]** Credenciales privadas expuestas en logs o respuestas de error. → Hash en PostgreSQL, redacción de logs, rotación atómica y pruebas negativas de invitación/credencial caducada.
- **[Riesgo]** El diseño de tablas o runtime exacto todavía depende de D0. → Mantener el contrato en interfaces serializables y concretar nombres/índices solo durante apply con migraciones comprobadas; no convertir esa decisión de tooling en una ampliación funcional.

## Migration Plan

1. Confirmar en apply la frontera del monorepo y las migraciones PostgreSQL/Alembic compatibles con el tooling ya instalado; no crear infraestructura externa.
2. Añadir el agregado/protocolo y las migraciones de sala, credenciales, participantes históricos, comandos confirmados y retención, con pruebas transaccionales.
3. Integrar WebSocket y cliente de sala usando snapshots/eventos confirmados; probar entrada tardía, reconexión, expiración, host y cierre.
4. Ejecutar pruebas de motor y E2E reales, incluyendo dos procesos/clientes y reinicio del backend; registrar evidencia sin afirmar despliegue.
5. Rollback: detener el candidato y revertir el change/migraciones según el procedimiento de apply; no borrar datos de producción ni desplegar automáticamente.

## Open Questions

- DEC-34 queda abierto para revisión del propietario cuando el trabajo se retome; la propuesta conserva exactamente sus dos opciones y no lo convierte en una transferencia automática.
