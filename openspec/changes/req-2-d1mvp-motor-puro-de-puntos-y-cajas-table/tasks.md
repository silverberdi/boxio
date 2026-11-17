# Tasks

## 1. Contratos y construcción del tablero

- [x] 1.1 Definir los tipos serializables del motor para celdas cuadradas, vértices, aristas canónicas, participantes, estado, movimiento, rechazo y resultado; verificar que no importen UI, DOM, reloj, red, persistencia, imágenes ni audio.
- [x] 1.2 Implementar la validación de filas y columnas enteras, finitas y entre 2 y 8 inclusive; verificar aceptación de 2×2 y 8×8 y rechazo de valores menores, mayores, fraccionarios, no finitos y no numéricos.
- [x] 1.3 Implementar la construcción determinista del tablero rectangular y la deduplicación de aristas compartidas y de borde; verificar conteos, IDs estables y cuatro aristas por celda.
- [x] 1.4 Implementar la preparación/validación genérica de máscaras de celdas cuadradas sin registrar un catálogo definitivo; verificar aceptación de coordenadas válidas y rechazo de celdas no enteras, no cuadradas o topológicamente inconsistentes.

## 2. Transiciones del motor

- [x] 2.1 Implementar la inicialización de participantes, aristas libres, propietarios vacíos, puntuaciones, jugador activo y estado no terminal; verificar que el estado inicial sea serializable y coherente.
- [x] 2.2 Implementar la transición de una arista legal y la detección de celdas cerradas, incluyendo cero, una y dos celdas; verificar asignación única y un punto por cada celda cerrada.
- [x] 2.3 Implementar la conservación del turno tras capturar y el avance al siguiente participante elegible cuando no hay captura; verificar cadenas de turnos extra sin límite artificial.
- [x] 2.4 Implementar rechazos de arista inexistente, duplicada, fuera de turno y movimiento posterior al final; verificar estado, turno y puntuación sin cambios.
- [x] 2.5 Implementar la finalización al asignar todas las celdas, la suma total de puntos y el resultado con todos los jugadores empatados en la máxima puntuación; verificar el último movimiento y empates.

## 3. Pruebas de invariantes y regresión

- [x] 3.1 Añadir pruebas de GAME-01..GAME-05 para legalidad, inmutabilidad de aristas, cierre de celda, puntuación individual y cierre doble por arista común; verificar que cada celda se puntúe una sola vez.
- [x] 3.2 Añadir pruebas de GAME-06..GAME-09 para bonus de turno, cambio de turno, fin, suma de puntos y empate; verificar resultados normales y negativos.
- [x] 3.3 Añadir pruebas de GAME-10 y determinismo comparando secuencias equivalentes en rectángulos y máscaras válidas; verificar independencia de silueta y repetibilidad del estado serializado.
- [x] 3.4 Añadir pruebas de límites 2×2, 8×8, 64 celdas, bordes/esquinas y máscara con huecos; verificar que no aparezcan aristas o celdas inexistentes.
- [x] 3.5 Ejecutar la suite automatizada del workspace y revisar que la evidencia cubra los escenarios de la spec sin introducir UI, IA, persistencia, WebSocket ni assets; verificar el resultado antes de preparar el PR de revisión humana.
