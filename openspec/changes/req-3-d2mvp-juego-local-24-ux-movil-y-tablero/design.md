# Design

## Context

El repositorio ya contiene `packages/web`, `packages/engine` y el catálogo bajo `assets/`; D1 es la autoridad para legalidad de aristas, cierres, puntuación, turno y resultado. La propuesta y `specs/local-game-ux/spec.md` definen el comportamiento observable. El diseño mantiene la frontera del motor puro y evita introducir servidor, persistencia o assets nuevos para una partida local.

## Goals / Non-Goals

**Goals:**

- Construir el flujo local en el frontend existente, con estado de navegación/configuración/partida/resultado claramente separado.
- Consumir el motor como única autoridad para aplicar movimientos y derivar puntuaciones, turnos, cierres y fin; la UI solo renderiza intención y resultado.
- Renderizar el tablero rectangular como celdas cuadradas y aristas con geometría estable, incluyendo hit areas táctiles de 44 CSS px o más.
- Aislar el reconocimiento de toque frente a pan/zoom y conservar la barra de estado de jugadores fuera del viewport transformado.
- Reutilizar assets locales, tokens y audio sintetizado con una carga reproducible sin red.
- Probar comportamiento, regresiones del motor y tamaños de viewport antes de abrir el candidato a revisión humana.

**Non-Goals:**

- No implementar online, backend, WebSockets, PostgreSQL, bots, siluetas definitivas ni PWA offline completa de D3.
- No persistir una partida local después de cerrar el navegador ni añadir cuentas, chat, ranking, tienda o registro.
- No diseñar geometrías no cuadradas, editor de tableros, botón de fin de turno ni un catálogo de assets nuevo.
- No afirmar validación física en teléfonos/tablets/escritorio sin un candidato desplegado y personas/dispositivos reales.

## Decisions

### 1. Estado local y motor

El frontend mantendrá un estado efímero de sesión local: configuración de participantes, plantilla rectangular seleccionada, estado serializable del motor, fase de la vista y feedback de la última acción. Cada toque válido se convierte en una intención de arista y se entrega al motor de D1; el resultado reemplaza el estado mostrado. Se elige este flujo sobre duplicar reglas en componentes para impedir divergencias en cierres dobles, bonus, empates o rechazos.

### 2. SVG y gestos

El tablero se dibujará en SVG con una capa visual de aristas y una capa de hit areas transparentes o visualmente neutras, ambas derivadas de las mismas identidades canónicas. El gesto se considera selección solo cuando comienza y termina sin desplazamiento/escala que lo clasifique como navegación; durante pan/zoom se cancela la intención pendiente. Se elige SVG sobre canvas porque conserva estructura accesible e identificadores de arista, y sobre geometría de CSS porque el motor ya expresa vértices/aristas.

### 3. Layout responsive

Turno y marcadores vivirán fuera del grupo SVG transformable, en una región fija y accesible. El área del tablero podrá desplazarse y escalar dentro de un viewport acotado; el layout usará los tokens existentes y reservará espacio para cuatro marcadores en 360×640. Tablet y escritorio se comprobarán con el mismo contrato, sin crear una segunda experiencia.

### 4. Navegación y modalidades no entregadas

El inicio tendrá cuatro opciones, pero solo la local será accionable en este change. Las restantes conservan estado no habilitado y sus rutas no crean sesión. Se elige una sola entrada local explícita sobre placeholders que parezcan funcionales, para que el límite de D2 sea observable y no se anticipe online o máquina.

### 5. Feedback y assets

La celebración se decide a partir del resultado del motor: una captura usa feedback normal y dos o más capturas usan la variante reforzada. Los colores/personajes/iconos/audio se resuelven desde `assets/`; `boxio-sounds.ts` se invoca sin archivos de sonido externos. Se evita una librería visual o de audio nueva para preservar build offline y el catálogo canónico.

### 6. Evidencia y pruebas

Se cubrirán escenarios de configuración, arista libre/ocupada, doble cierre, bonus, empate, gesto y layout con pruebas automatizadas del nivel adecuado. Las comprobaciones automatizadas de 360×640, 768×1024 y 1280×800 serán evidencia del PR; la validación manual en dispositivos se etiquetará como pendiente hasta un candidato desplegado. No se confundirá una captura local con evidencia de despliegue.

## Risks / Trade-offs

- [Riesgo] Un hit area grande puede solaparse con una arista vecina en tableros pequeños → Mitigación: derivar áreas desde la geometría, resolver la arista más próxima solo en toque estático y verificar selección determinista en pruebas.
- [Riesgo] Un gesto de dedo puede parecer un toque → Mitigación: umbral explícito de movimiento/escala, cancelación al iniciar pan/zoom y pruebas de no selección accidental.
- [Riesgo] Cuatro marcadores y el tablero compiten por 360×640 → Mitigación: mantener estado fuera del SVG, usar layout compacto con hit areas mínimas y comprobar primero el viewport de referencia.
- [Riesgo] La UI puede intentar reproducir una transición inválida después de un toque duplicado → Mitigación: ignorar/rechazar la intención contra el estado actual y no modificar estado visual ni turno cuando el motor rechace.
- [Riesgo] Un asset importado desde una ruta no canónica rompe el build sin red → Mitigación: inventariar imports contra `assets/README.md` y ejecutar build/test en modo sin conectividad como evidencia.
- [Riesgo] El audio puede estar bloqueado por políticas de autoplay → Mitigación: dispararlo solo tras interacción del jugador y mantener la celebración visual como feedback suficiente.

## Migration Plan

No hay migración de datos ni cambio de API online. La entrega se integra como un PR sobre `packages/web` y consume los contratos ya existentes de `packages/engine`; rollback consiste en revertir el PR antes del merge humano. El despliegue queda fuera de este workflow y cualquier validación física se ejecuta posteriormente sobre un candidato autorizado.
