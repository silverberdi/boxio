# Boxio — Catálogo de assets autocontenidos

**Estado:** paquete inicial utilizable para comenzar la ingeniería. No son los renders PNG de esta conversación ni se afirma que el diseño de marca sea definitivo.

## Archivos existentes y uso

| Ruta | Tipo | Uso |
|---|---|---|
| `branding/boxio-wordmark.svg` | SVG | Wordmark Boxio (vector compatible web) |
| `branding/boxio-app-icon.svg` | SVG | Icono maestro para favicon/PWA; las variantes raster se derivan de este sin pedir diseño externo |
| `backgrounds/sky-grid.svg` | SVG | Fondo de menú y configuraciones |
| `characters/{yellow,blue,coral,green}.svg` | SVG | Personajes de apoyo; no necesarios para el core |
| `ui/crown.svg`, `ui/star.svg` | SVG | Marcadores y celebraciones |
| `design-tokens.json` | JSON | Paleta, colores por jugador, movimiento propuesto |
| `boards/silhouette-candidates.json` | JSON | Máscaras fuente pequeñas aprobadas para cruz, corazón y estrella simple, compuestas por **cuadrados**. Las variantes mediana y grande son entregables del Issue #6; la T no forma parte del catálogo MVP |
| `audio/boxio-sounds.ts` | TypeScript / WebAudio | Doce efectos originales sintetizados y listos para importar; **no hay dependencia de archivos MP3/WAV de terceros** |

## Estado y límites

- Todo recurso aquí es autocontenido, sin descargas, cuentas de diseño, CDN de fuentes ni bibliotecas de sonido requeridas.
- Los SVG son recursos vectoriales funcionales y propios de esta base inicial; **no reproducen exactamente las ilustraciones PNG generadas en el chat**.
- Los PNG conceptuales de logo, menú, partida, lobby, victoria y siluetas que aparecieron en el chat **no están subidos al repositorio** y **ningún issue debe depender de ellos**. El catálogo adjunto al repo manda sobre referencias externas.
- La implementación debe respetar la regla de 2–4 participantes, cuadrículas exclusivamente cuadradas, ningún botón «fin de turno» manual, y ningún marcador de cinco jugadores. Los renders conceptuales no son pantallas funcionales.
- El banco de audio produce sonidos usando osciladores nativos WebAudio; se inicializa solo tras una interacción del usuario y debe respetar mute. No requiere archivos externos ni generación por un tercero.
- Para iOS/Android se derivarán las resoluciones raster requeridas desde SVG mediante tooling de build; no publicar tiendas en MVP.
- El propietario aprobó cruz, corazón y estrella simple con tamaños pequeño/mediano/grande para MVP. El JSON actual contiene las máscaras fuente pequeñas; producir las variantes mediana y grande es trabajo explícito del Issue #6, no una dependencia de arte externo. Cada variante debe conservar la forma reconocible y estar hecha de celdas cuadradas.
- La identidad visual inicial está cubierta por los recursos presentes; no es la identidad de marca final. La verificación de marca y dominios queda antes de publicación comercial.
- Los criterios de accesibilidad generales incluyen móvil vertical 360×640 CSS px y áreas táctiles de al menos 44×44 CSS px; los detalles para aristas densas se validan en UX.
- Para el tablero el asset canónico es la topología de celdas y el render SVG dinámico de cada arista; NO crear una imagen independiente para cada posible tablero.

## Eventos sonoros existentes

`edge`, `invalid`, `capture`, `multi`, `extra_turn`, `next_turn`, `join`, `reconnect`, `disconnect`, `victory`, `tie`, `click`.

## Criterio de entrega para cada issue

Un issue puede referenciar únicamente este catálogo y los documentos `docs/`; **no debe decir «esperar asset», «generar logo», «buscar sonido en internet» o «usar imagen del chat»**. Si se detecta un activo específico verdaderamente indispensable no cubierto, se formaliza como cambio de alcance con recurso concreto en el repositorio ANTES de asignarlo a mini me.
