# Proposal

## Why

La entrega D0 dejó contratos base, pero el MVP necesita un motor ejecutable y determinista que convierta tableros rectangulares de celdas cuadradas en movimientos, cierres, puntuaciones, turnos y resultados verificables. Formalizar ahora este núcleo permite que la UI, los bots y las sesiones online posteriores compartan una única semántica, sin introducir dependencias de presentación, red o persistencia.

## What Changes

- Completar el contrato del motor puro de Puntos y Cajas para tableros rectangulares con filas y columnas enteras entre 2 y 8, con un máximo de 64 celdas.
- Definir la construcción determinista de celdas activas, vértices y aristas canónicas deduplicadas, incluyendo aristas de borde y aristas compartidas.
- Definir el procesamiento de movimientos legales, inválidos, duplicados y fuera de turno como transiciones sin mutación cuando corresponda.
- Preservar el cierre de uno o dos cuadrados, la asignación única, un punto por cuadrado, el turno adicional, el cambio de turno y el resultado final con empates.
- Preparar el algoritmo para consumir máscaras de celdas cuadradas sin implementar todavía el catálogo definitivo de siluetas.
- Añadir criterios de pruebas automatizadas para los invariantes GAME-01..10, límites de dimensiones, determinismo, independencia de siluetas y suma total de puntos.
- Mantener explícitamente fuera de esta entrega la UI/SVG, IA, persistencia, WebSocket, PWA, assets visuales/audio y modalidades online.

## Capabilities

### New Capabilities

<!-- No se introduce una capacidad separada: D0 ya estableció el contrato base del motor. -->

### Modified Capabilities

- `game-contracts`: concretar el contrato base en un motor puro ejecutable, incorporando el tablero rectangular 2–8×2–8, transiciones de movimiento, validación de dimensiones, preparación de máscaras y evidencia de invariantes.

## Impact

- Afecta al paquete/librería TypeScript del motor definido por la arquitectura, sus tipos serializables y sus pruebas unitarias, de propiedades o Gherkin según resulte adecuado.
- Las entregas posteriores de UI, bots y online consumirán el resultado del movimiento y el estado terminal, pero no forman parte de este change.
- No requiere nuevas dependencias de runtime, base de datos, red, navegador, imágenes ni sonidos.
- Requiere trazabilidad a PRD-01, PRD-07, GAME-01..10 y DEC-02, DEC-03, DEC-22; la revisión y el merge permanecen humanos y no se autoriza despliegue.
