# Inventario de callbacks de la UI pública

La modalidad pública mantiene como fuente de verdad las respuestas REST, el polling de búsqueda y los snapshots/eventos WebSocket existentes. El único cambio de este change es solicitar el renderizado Angular después de aplicar cada estado recibido.

| Callback | Estado actualizado | Integración de renderizado |
| --- | --- | --- |
| `startPublicSearch` (`POST`, respuesta `201`) | `publicSearch`, identidad temporal, `publicMatch`, estado de búsqueda | `renderPublicState()` antes de iniciar polling/socket |
| `refreshPublicSearch` (polling GET) | búsqueda, timeout, `publicMatch` inicial, estado | `renderPublicState()` después de cada respuesta autoritativa |
| `cancelPublicSearch` / `continuePublicSearch` / `playPublicMachine` | estado de búsqueda, error y navegación | `renderPublicState()` después de la respuesta |
| WebSocket `onopen` | conexión establecida | `renderPublicState()` |
| WebSocket `onmessage` | snapshot, versión, aristas, turno, marcador, resultado y reserva | `renderPublicState()` después de aplicar snapshot |
| WebSocket `onclose` | desconexión y reserva visible | `renderPublicState()` |
| `publicMove` (respuesta de comando) | snapshot confirmado o error | `renderPublicState()` |

No se modifican rutas, payloads, eventos, persistencia, autoridad del servidor ni reglas de matchmaking D7. Tampoco se añade polling, proxy, store global, bus de eventos o predicción de jugadas.
