# Proposal

## Why

D0 y D1 dejan disponible la base del workspace y el motor determinista, pero todavía no existe una experiencia jugable que permita a 2–4 personas configurar y completar una partida local desde un dispositivo compartido. D2 aporta el flujo visible del MVP —inicio, configuración, juego y resultado— con un tablero SVG táctil y una referencia móvil verificable, para convertir los contratos existentes en valor jugable sin introducir servicios online.

## What Changes

- Añadir la experiencia local para 2–4 jugadores invitados: navegación inicial con cuatro modalidades, estados no habilitados para las modalidades aún no entregadas, configuración de apodos y colores, y selección rectangular de tablero.
- Añadir la pantalla de juego local con turno actual, marcadores de 2–4 participantes, bonus automático al cerrar uno o más cuadrados y resultado final con ganadores compartidos en caso de empate.
- Añadir un tablero SVG basado en celdas cuadradas y aristas canónicas, con áreas táctiles de al menos 44×44 CSS px, interacción de zoom/desplazamiento y protección contra selecciones accidentales durante gestos.
- Integrar feedback visual y sonoro de conquistas usando exclusivamente el catálogo local incluido, con una celebración reforzada al cerrar dos cuadrados en una confirmación.
- Cubrir la experiencia en viewport móvil vertical de 360×640 CSS px y comprobaciones automatizadas adicionales para 768×1024 y 1280×800.
- Rechazar visualmente y sin mutación los toques de aristas ocupadas o movimientos inválidos, conservando turno y marcador.
- Mantener fuera de este change las salas online, bots, quinto jugador, registro, chat, rankings, tiendas, botones de fin de turno y nuevos assets externos.
- Registrar que la validación física en dispositivos requiere un candidato desplegado y no se declara ejecutada por mini me.

## Capabilities

### New Capabilities

- `local-game-ux`: Flujo de navegación, configuración, partida local 2–4, tablero SVG táctil, feedback de conquistas y resultados responsive.

### Modified Capabilities

No se modifican los requisitos existentes del motor ni del catálogo de assets. La nueva experiencia consume esos contratos y recursos sin duplicar sus reglas ni ampliar su catálogo.

## Impact

- Frontend PWA Angular/TypeScript: rutas/vistas de inicio, configuración, partida y resultados; estado efímero de la partida local; adaptación responsive y accesibilidad táctil.
- Integración del motor TypeScript de D1: selección de aristas, aplicación de movimientos y renderizado del resultado confirmado por el motor.
- Renderizador SVG y control de gestos: geometría de celdas cuadradas, aristas, zoom/pan y separación entre gesto y toque.
- Catálogo local bajo `assets/`: wordmark, icono, fondo, tokens, personajes, iconos de UI y `boxio-sounds.ts`; no se añaden dependencias de red, MP3/WAV ni CDN.
- Pruebas automatizadas de comportamiento, regresión del motor y viewport; la comprobación manual de dispositivos queda condicionada al candidato desplegado.
