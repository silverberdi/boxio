# Proposal

## Why

D5 debe convertir el soporte abstracto de máscaras cuadradas preparado en D1 en tableros especiales jugables y seleccionables, sin introducir un motor distinto por figura. Esto permite entregar la variedad visual comprometida por PRD-08 y DEC-26 en máquina y local, conservando las invariantes de puntuación, turnos, fin y empates de GAME-01..GAME-10.

## What Changes

- Incorporar un catálogo local con cruz, corazón y estrella simple, cada una en variantes pequeña, mediana y grande.
- Derivar y validar topologías a partir de máscaras JSON de celdas unitarias cuadradas: solo se crearán aristas de celdas presentes, con aristas compartidas deduplicadas.
- Añadir al selector de configuración las nueve variantes especiales junto con las opciones clásicas dentro de los límites de DEC-22.
- Reutilizar el motor, el render SVG genérico, el flujo de selección de aristas, la puntuación, el turno extra y el resultado para cualquier máscara válida.
- Asegurar que las modalidades máquina y local aceptan un tablero especial sin reglas ni estrategia específicas de una figura; los bots seguirán recibiendo el estado canónico.
- Rechazar configuraciones clásicas fuera de 2–8 filas/columnas y máscaras especiales vacías, inválidas o desconectadas sin crear ni corromper estado.
- Mantener las máscaras JSON del repositorio como únicos assets específicos de la funcionalidad y reutilizar los assets visuales, tokens y audio canónicos existentes.
- Excluir editor libre, T, triángulos, hexágonos, tamaño muy grande, imágenes externas, chat, perfiles, rankings y cualquier modalidad online nueva.

## Capabilities

### New Capabilities

- `silhouette-boards`: catálogo de siluetas cuadradas, variantes de tamaño, validación de máscaras y generación de topología.

### Modified Capabilities

- `game-contracts`: activar máscaras válidas del catálogo y extender la configuración canónica para preservar las mismas invariantes en tableros especiales.
- `local-game-ux`: permitir seleccionar y renderizar las variantes especiales mediante el selector y el tablero SVG genéricos.
- `automatic-opponents`: garantizar que las tres dificultades deciden sobre cualquier silueta catalogada usando el contrato del motor sin políticas por figura.

## Impact

- Motor puro: preparación/validación de máscaras, catálogo y generación de aristas/celdas; sin dependencia de UI, red, reloj o assets raster.
- UI local: selector de tamaños/siluetas, render dinámico de celdas cuadradas y manejo de errores de configuración; conserva controles táctiles, zoom/pan y feedback existentes.
- Máquina: reutilización del estado serializable y de la selección de aristas ya definida para tableros no rectangulares.
- Assets: ampliación del catálogo JSON bajo `assets/boards/`; uso de `assets/design-tokens.json`, `assets/audio/boxio-sounds.ts` y los SVG existentes, sin CDN ni PNG de chat.
- Pruebas: escenarios Gherkin/regresión para topología con huecos, cierres dobles, validación de máscaras, catálogo 3×3, independencia de siluetas y no regresión de tableros clásicos/modos 2–4.
- Entrega: planificación OpenSpec de D5 únicamente; la implementación, validación nativa, PR y revisión humana pertenecen a la fase de apply/verify autorizada por separado.
