# Proposal

## Why

La UI Angular de la modalidad pública recibe respuestas de búsqueda, emparejamiento y WebSocket, pero puede conservar el estado visual anterior hasta que ocurre otro evento Angular, dejando al jugador en «Listo para buscar rival / Sin conexión» aunque el servidor ya haya enviado el estado actual. El cambio corrige la integración mínima de esos callbacks con la detección de cambios para que el estado visible sea inmediato y verificable en dos sesiones reales de prueba.

## What Changes

- Integrar los callbacks asíncronos ya existentes de `fetch`, polling y WebSocket con el mecanismo nativo mínimo de Angular para que cada estado recibido se refleje inmediatamente.
- Mostrar sin interacción adicional los estados de búsqueda, emparejamiento, conexión, tablero, turno, jugadas, marcador, resultado, cancelación y desconexión.
- Reproducir la evidencia del fallo: tras recibir respuestas y snapshots/eventos del servidor, la UI debe actualizarse sin depender de editar el apodo ni de otro evento Angular.
- Añadir o ajustar pruebas de UI y E2E con Playwright contra los servicios reales de prueba, dos sesiones independientes, proxy Nginx y PostgreSQL de prueba cuando el entorno candidato los proporcione; completar la partida y limpiar cualquier búsqueda o match residual.
- Registrar separadamente la comprobación del despliegue; la prueba del candidato no se presentará como evidencia de despliegue productivo.
- Mantener sin cambios los endpoints REST/WebSocket, persistencia, identidad, validación, reglas de matchmaking 1v1 y contrato de juego de D7.
- No añadir nuevas capas de polling, proxy, estado global ni cambiar las reglas de matchmaking.

## Capabilities

### New Capabilities

<!-- None. This change corrects the visible lifecycle of an existing public-online capability. -->

### Modified Capabilities

- `public-online-matchmaking`: la interfaz pública debe renderizar inmediatamente todos los estados autoritativos recibidos por API y WebSocket, y la verificación debe cubrir los flujos reales sin interacción adicional ni cambios en el contrato de D7.

## Impact

- Componente/controlador y plantilla Angular de la modalidad pública, únicamente en la integración de callbacks con la detección de cambios.
- Pruebas unitarias/integración de la UI y prueba E2E de Playwright con dos sesiones independientes contra servicios reales de prueba.
- Evidencia de ejecución y limpieza de la partida de prueba; la comprobación del despliegue se conserva como registro separado.
- No se modifican rutas REST/WebSocket, API autoritativa, esquema/persistencia PostgreSQL, motor de reglas, proxy ni configuración de matchmaking.
