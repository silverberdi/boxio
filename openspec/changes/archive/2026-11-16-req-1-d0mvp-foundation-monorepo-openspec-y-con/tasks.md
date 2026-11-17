# Tasks

## 1. Toolchain y estructura del workspace

- [x] 1.1 Confirmar y registrar versiones efectivas de Node, package manager, TypeScript, Angular, Fastify y OpenSpec 1.13.1; verificar la compatibilidad ejecutando el comando de diagnóstico documentado y conservar su salida.
- [x] 1.2 Crear la estructura mínima de los paquetes web PWA, server Fastify y engine/contracts, con dependencias unidireccionales; verificar que el listado de workspaces no incluye servicios adicionales.
- [x] 1.3 Fijar scripts reproducibles de instalación, build y test para todo el workspace; verificar que la instalación ocurre desde checkout limpio sin credenciales ni servicios externos.

## 2. Contratos compartidos y motor base

- [x] 2.1 Implementar los tipos públicos de tablero, celda cuadrada, vértice, arista, jugador, movimiento y estado de partida según `specs/game-contracts/spec.md`; verificar compilación sin imports de UI, servidor o persistencia.
- [x] 2.2 Implementar la representación mínima de aristas/celdas y validación de estados necesaria para GAME-01..GAME-05; verificar aristas inexistentes/duplicadas, cierre simple y cierre doble.
- [x] 2.3 Implementar la transición mínima de turno, puntuación, finalización y empate para GAME-06..GAME-10; verificar bonus de turno, cadena sin límite arbitrario, suma total y equivalencia entre siluetas cuadradas.
- [x] 2.4 Añadir pruebas automatizadas deterministas de los escenarios de `game-contracts`, incluyendo límites y negativos; verificar que el paquete engine pasa sus pruebas sin red.

## 3. Integración de paquetes y assets locales

- [x] 3.1 Exponer los contratos del engine a web y server mediante la API pública del workspace; verificar que no se duplican definiciones y que ambos consumidores compilan.
- [x] 3.2 Incorporar al build los recursos canónicos `assets/branding/boxio-wordmark.svg`, `assets/branding/boxio-app-icon.svg` y `assets/audio/boxio-sounds.ts`; verificar imports offline sin CDN, credenciales ni PNG generado en chat.
- [x] 3.3 Añadir una comprobación automatizada de rutas y contenido mínimo del catálogo local; verificar que la ausencia de un recurso falla de forma explícita y no activa una descarga alternativa.

## 4. Evidencia de cierre de D0

- [x] 4.1 Ejecutar desde un checkout limpio los comandos fijados de instalación, build y test de todos los paquetes; verificar y guardar evidencia de éxito o registrar el bloqueo concreto.
- [x] 4.2 Revisar el diff contra los límites D0 y ejecutar las pruebas de regresión de contratos; verificar que no hay despliegue, hosting, backend operativo, servicio adicional, multiplayer, chat, ranking, tienda, perfil ni registro obligatorio.
- [x] 4.3 Preparar el resultado para revisión humana con trazabilidad entre requisitos, escenarios, pruebas y evidencia; verificar que la entrega no declara validación de dispositivo real ni despliegue.
