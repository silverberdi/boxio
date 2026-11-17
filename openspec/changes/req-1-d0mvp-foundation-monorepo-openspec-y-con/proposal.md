# Proposal

## Why

Boxio necesita una base reproducible y verificable para que las entregas posteriores compartan contratos de juego, tipos y tooling sin introducir infraestructura prematura. D0 establece esa base ahora, antes de construir UI jugable, bots o sesiones online, y resuelve OPEN-14 mediante compatibilidad comprobada del entorno real.

## What Changes

- Crear una base mínima de monorepo TypeScript con un workspace PWA Angular, un workspace Fastify y una librería reutilizable del motor de juego.
- Establecer convenciones de tipos compartidos para tablero, celdas cuadradas, aristas, movimientos y estado de partida, alineadas con GAME-01..10.
- Configurar comandos reproducibles de instalación, build y test que funcionen desde un checkout limpio sin servicios externos.
- Incorporar pruebas automatizadas de contratos y arranque apropiadas para D0, incluyendo rechazo de decisiones fuera de alcance y regresión de invariantes cuando corresponda a la base compartida.
- Importar los assets canónicos locales sin descargas ni credenciales; los PNG generados en chat no serán dependencia del build.
- Comprobar y documentar la compatibilidad efectiva entre la versión instalada de OpenSpec, Node y el tooling de paquetes, sin convertir OPEN-14 en una decisión funcional unilateral.
- Mantener fuera de alcance la implementación de reglas complejas adicionales, modos multiplayer, persistencia online, despliegue, hosting, backend desplegado, servicios adicionales, chat, rankings, tiendas, perfiles y registro obligatorio.

## Capabilities

### New Capabilities

- `foundation-workspace`: Monorepo mínimo, workspaces Angular/Fastify/engine, tipos compartidos y comandos reproducibles de build/test para la fundación D0.
- `game-contracts`: Contratos TypeScript verificables para el modelo abstracto de Puntos y Cajas y sus invariantes GAME-01..10, sin implementar todavía una experiencia completa de juego.
- `local-assets`: Catálogo de assets locales consumible por el build sin dependencias externas, credenciales o descargas.

### Modified Capabilities

No existen capacidades publicadas en `openspec/specs/` que modificar.

## Impact

- Afectará únicamente a la estructura de repositorio, configuración de paquetes, contratos TypeScript, pruebas, documentación de tooling y referencias locales bajo `assets/`.
- Preparará las interfaces que consumirán D1–D8, pero no implementará esas entregas ni sus servicios online.
- No requiere PostgreSQL, WebSockets, hosting, despliegue ni credenciales externas.
- La aceptación se basará en comandos reproducibles y evidencia verificable desde checkout limpio; la revisión y el merge seguirán siendo humanos.
