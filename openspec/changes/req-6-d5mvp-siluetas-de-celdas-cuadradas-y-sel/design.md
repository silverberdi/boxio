# Design

## Context

El motor actual ya representa `Board` como celdas cuadradas y deduplica aristas, y `prepareCellMask` permite probar máscaras con huecos. La UI local y el flujo de bots todavía construyen la partida desde `rows`/`columns`, mientras que `assets/boards/silhouette-candidates.json` contiene solo las tres fuentes pequeñas. El cambio se limita a D5 y debe preservar la frontera del motor puro, el render SVG dinámico y las cuatro modalidades previstas; las modalidades online no tienen implementación en este incremento.

## Goals / Non-Goals

**Goals:**

- Convertir el catálogo de máscaras en una entrada canónica de configuración con nueve variantes válidas.
- Mantener una única representación de celdas, aristas, cierres, score, turnos, fin y empate para clásico y siluetas.
- Hacer que la UI local y la máquina consuman una configuración de tablero común, con errores de validación sin mutación.
- Mantener los assets específicos como JSON local y reutilizar el render SVG, tokens y audio existentes.
- Cubrir con pruebas de motor, UI y E2E la topología con huecos, el cierre doble, las variantes, los límites clásicos y las partidas máquina/local.

**Non-Goals:**

- No añadir editor libre, máscaras definidas por usuario, T, triángulos, hexágonos ni tamaño muy grande.
- No crear un motor, renderer, estrategia de bot o regla de puntuación por silueta.
- No modificar contratos de salas online, PostgreSQL, WebSockets, reconexión ni despliegue.
- No solicitar ni generar imágenes externas; los PNG de chat no forman parte del candidato.

## Decisions

### 1. Catálogo JSON explícito, con variantes completas

El catálogo existente se ampliará en `assets/boards/silhouette-candidates.json` para contener las nueve entradas, conservando la fuente pequeña y agregando las máscaras mediana y grande en el mismo archivo. Las variantes serán datos explícitos de celdas activas, no imágenes ni una textura raster. Esto hace auditable la forma, permite validar el archivo en checkout limpio y evita que la UI o el motor conozcan nombres de figuras.

Alternativa descartada: escalar una imagen o generar celdas desde SVG en runtime. Perdería la topología cuadrada verificable y añadiría una dependencia visual donde el contrato exige máscaras JSON.

### 2. Una frontera de configuración para clásico y máscara

La configuración de partida representará una selección clásica (`rows`/`columns`) o una referencia a una entrada validada del catálogo. El adaptador construirá un `Board` antes de crear `GameState`; `createGame` seguirá recibiendo solo un tablero ya preparado y continuará siendo agnóstico del origen.

Alternativa descartada: añadir condicionales de silueta dentro de `applyMove`, bots o el renderer. Duplicaría la lógica y contradiría GAME-10.

### 3. Validación previa e inmutable

La preparación validará forma de cada celda, unicidad, finitud, conectividad por lado y aristas derivadas antes de permitir iniciar. Los errores se devolverán como rechazo de configuración; el estado de una sesión ya iniciada se conservará sin cambios. El selector solo expondrá entradas que pasen la misma validación canónica, pero el motor volverá a validar para proteger consumidores directos.

Alternativa descartada: confiar únicamente en el selector de UI. No protege pruebas, bots ni futuros consumidores online y permitiría corrupción desde configuraciones serializadas.

### 4. Render SVG por topología, no por figura

La vista seguirá iterando `board.cells` y `board.edges`; las celdas ausentes no se pintan y las aristas provienen de la topología. El selector cambiará el origen de configuración, no el componente de interacción, geometría de aristas, gesto zoom/pan, puntuación o feedback.

Alternativa descartada: una ilustración o layout fijo por cruz/corazón/estrella. No sería jugable de forma uniforme y dependería de assets no canónicos.

### 5. Bots sin conocimiento del catálogo

La máquina recibirá el mismo `GameState` serializable y continuará eligiendo entre `board.edges` libres. Las pruebas parametrizarán catálogo y dificultad, incluyendo captura doble y progreso de turnos, sin añadir ramas por `silhouetteId`.

### 6. Retirada segura de la ruta rectangular única

Se inventariarán todos los escritores/lectores de `rows` y `columns` en `packages/web/src/app.ts`, `packages/web/src/local-game.ts` y sus pruebas. La ruta rectangular se conservará como una opción válida; se retirará únicamente el supuesto de que sea la única opción y cualquier selector/validación duplicada que lo impida. Se repetirá el E2E después de retirar ese supuesto para demostrar que no quedan rutas divergentes.

## Risks / Trade-offs

- **[Riesgo]** Las máscaras mediana/grande pueden deformar la figura o quedar desconectadas. → Validar conectividad, reconocer la forma mediante pruebas de catálogo y revisar visualmente cada variante en el selector/render.
- **[Riesgo]** Un hueco puede generar una arista exterior que el producto no considera jugable. → Derivar aristas exclusivamente de celdas activas, deduplicar por identidad canónica y probar movimientos sobre regiones ausentes.
- **[Riesgo]** El selector puede aceptar una configuración que el motor rechaza. → Compartir el mismo preparador/validador y añadir una prueba de contrato desde la configuración hasta `createGame`.
- **[Riesgo]** Tableros dispersos aumentan el área visual en móvil. → Mantener viewBox basado en la extensión de celdas, conservar zoom/pan y verificar 360×640, 768×1024 y 1280×800; la validación física seguirá pendiente de candidato desplegado.
- **[Riesgo]** Ampliar el catálogo puede introducir regresiones en bots o turnos extra. → Parametrizar las pruebas existentes, comprobar invariantes GAME-01..GAME-10 y ejecutar el benchmark de decisión hasta 8×8 además de las siluetas.
- **[Riesgo]** El asset fuente usa lenguaje histórico de “candidates”. → El cambio debe actualizar el contenido del catálogo y sus pruebas/uso sin depender de imágenes; cualquier conflicto documental se reporta y no se resuelve con una ruta paralela.

## Migration Plan

1. Añadir las seis máscaras faltantes y su validación automatizada al catálogo existente.
2. Extender la configuración compartida para aceptar una selección clásica o una entrada especial y conectar el selector local.
3. Ejecutar pruebas de motor, bots, UI local, assets y PWA E2E; comparar invariantes con la línea base clásica.
4. Retirar únicamente el selector/validación que presupone tablero rectangular único y repetir la suite relevante.
5. No hay migración de base de datos ni despliegue en D5. Rollback consiste en revertir el candidato del change; no se modifican datos durables.

## Open Questions

No quedan preguntas abiertas que cambien el contrato o el desglose: catálogo, tamaños, límites y exclusiones están fijados por la solicitud y DEC-22/DEC-26. La validación física en dispositivos y cualquier decisión de despliegue quedan fuera de este workflow de planificación.
