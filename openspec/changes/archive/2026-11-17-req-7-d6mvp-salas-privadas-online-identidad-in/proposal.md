# Proposal

## Why

D6 convierte la modalidad privada online definida en PRD-04 y PRD-12 en una sala jugable y recuperable: los invitados necesitan una identidad temporal que no pueda suplantarse con el código de invitación, y una caída de conexión no debe perder su marcador ni corromper el turno. Es el siguiente incremento después de D5 y debe establecer una autoridad de servidor persistida antes de abordar el público 1v1 de D7.

## What Changes

- Crear salas privadas con código o enlace de invitación, identidad opaca temporal, máximo de cuatro participantes e inicio desde dos.
- Mantener el estado del tablero, puntuaciones, cuadrados históricos y orden de movimientos bajo autoridad Fastify/WebSocket; aceptar comandos solo una vez tras validar identidad, turno, versión y legalidad.
- Permitir el ingreso tardío durante una partida sin alterar el tablero ni las puntuaciones existentes; integrar al nuevo participante al final del turno vigente y asignarle cero puntos.
- Reservar durante 60 segundos la identidad desconectada mediante una credencial privada del mismo dispositivo; rotar la credencial al reconectar y liberar el cupo al expirar.
- Conservar como participante elegible para el resultado a quien se retire tras haber puntuado, distinguiéndolo de cualquier reemplazo nuevo con cero puntos y sin cuadrados heredados.
- Avanzar el turno pendiente al expirar una reserva, continuar la sala si se va el anfitrión con otros participantes y cerrar cuando no quede nadie.
- Persistir en PostgreSQL el último movimiento confirmado y recuperar salas activas tras reinicio sin duplicar movimientos; eliminar salas terminadas tras 24 horas, sin prometer SLA.
- Mantener abierta para revisión la resolución provisional de DEC-34: un anfitrión solo puede esperar o salir y comenzar una partida nueva contra la máquina, sin convertir ni transferir la sala.
- Excluir chat, perfiles, registro obligatorio, rankings, tiendas, Redis, Kafka, microservicios, hosting obligatorio, sustitución automática por bot y assets externos o PNGs de chat.

## Capabilities

### New Capabilities

- `private-online-rooms`: identidad temporal, invitación no autenticadora, ocupación, ingreso tardío, reconexión, abandono, autoridad de comandos, recuperación y retención de salas privadas online.

### Modified Capabilities

- Ninguna. Las especificaciones existentes del motor y de las modalidades locales no cambian sus requisitos; D6 añade el contrato online privado como capacidad nueva y reutiliza el motor canónico.

## Impact

- Backend Node.js/Fastify/TypeScript y WebSockets: protocolo de sala, credenciales opacas, serialización de comandos, eventos ordenados, expiraciones y recuperación.
- Persistencia PostgreSQL: estado durable mínimo, movimientos confirmados, participantes históricos, reservas y limpieza de salas terminadas mediante migraciones SQLAlchemy/Alembic cuando se implemente.
- Cliente Angular/PWA: creación/entrada por invitación, apodo, estados de conexión, snapshot confirmado, reconexión y errores de acceso; no convierte predicciones del cliente en autoridad.
- Motor puro: reutilización del contrato existente para validar aristas, cierres, puntuación, bonus, fin y empate de dos a cuatro participantes.
- Pruebas: Gherkin y regresión para concurrencia, duplicados, límites de capacidad, ingreso durante bonus, expiración en el límite, reinicio, host, cierre y distinción entre identidad retirada y reemplazo.
- Entrega: solo planificación OpenSpec en este workflow; implementación, validación, PR, merge humano y despliegue requieren fases/autorizaciones separadas.
