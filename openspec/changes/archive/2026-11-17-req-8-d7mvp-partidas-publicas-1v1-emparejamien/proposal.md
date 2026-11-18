# Proposal

## Why

Boxio necesita completar su modalidad online pública para que dos invitados puedan encontrar una partida 1v1 sin códigos ni registro, con un resultado justo ante cancelaciones y desconexiones. Este incremento corresponde a D7 y debe apoyarse en la identidad, autoridad, persistencia y reconexión entregadas por D6 antes de ampliar el MVP.

## What Changes

- Añadir una cola pública de exactamente dos invitados y emparejamiento automático con participantes fijados al iniciar la partida.
- Añadir cancelación explícita de la búsqueda y una transición atómica entre cancelar y emparejar, determinada por la primera confirmación del servidor.
- Tras 60 segundos sin rival, ofrecer jugar contra la máquina en una partida nueva y separada, continuar buscando o cancelar; elegir máquina no inserta un bot en la cola pública.
- Aplicar en partida pública la reserva de reconexión de 60 segundos; si vence, finalizar por abandono y declarar vencedor al rival, sin derivarlo de los cuadros conquistados.
- Rechazar terceros, sustituciones e ingresos tardíos en una partida pública existente.
- Exponer estados de búsqueda, cancelación, conexión, reconexión y resultado por abandono de forma comprensible y accesible.
- Mantener las invariantes GAME-01..GAME-10, los tableros de celdas cuadradas y la autoridad del servidor heredada de D6.

## Capabilities

### New Capabilities

- `public-online-matchmaking`: Cola pública 1v1, emparejamiento, cancelación, fallback separado contra máquina y ciclo de vida público con reconexión/abandono.

### Modified Capabilities

- Ninguna. La capacidad `private-online-rooms` de D6 no cambia sus requisitos; el público 1v1 es un flujo separado.

## Impact

- API Fastify/WebSocket y persistencia PostgreSQL para estados de cola, reservas y partidas públicas, reutilizando la autoridad e identidad temporal de D6.
- Cliente PWA: entrada «Partida pública», estado de búsqueda, acciones de cancelar/seguir buscando/jugar contra máquina y resultado diferenciado por abandono.
- Motor compartido: ninguna regla nueva; las jugadas públicas deben seguir validándose con el contrato existente.
- Pruebas automatizadas de Gherkin/regresión para emparejamiento, carrera concurrente, timeout, reconexión, rechazo de terceros y preservación de invariantes.
- Sin ranking, chat, cuentas, salas públicas de 3–4, bots en cola, sustitución, ingreso tardío, assets externos ni despliegue automático.
