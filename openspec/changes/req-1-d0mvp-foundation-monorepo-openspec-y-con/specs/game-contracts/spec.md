# Spec Delta

## Purpose

Define los contratos observables del motor de Puntos y Cajas que deben compartir las entregas posteriores, preservando las invariantes del juego antes de añadir UI, bots o sesiones online.

## ADDED Requirements

### Requirement: Canonical game model
La librería SHALL representar un tablero como un conjunto finito de celdas cuadradas activas, sus vértices y aristas únicas, junto con participantes, aristas ocupadas, propietarios de celdas, turno, puntuación y estado terminal.

#### Scenario: Same model supports square silhouettes
- **WHEN** se describe un tablero rectangular o una máscara conexa compuesta por celdas cuadradas
- **THEN** ambos usan el mismo modelo de aristas y celdas, sin un algoritmo distinto por silueta

### Requirement: Legal edge and square invariants
El contrato SHALL preservar GAME-01..GAME-05: solo se ocupan aristas existentes y libres; una arista ocupada no se libera; una celda se asigna al jugador que cierra su cuarta arista; cada celda vale un punto; y una arista compartida puede cerrar y puntuar todas las celdas completadas una sola vez.

#### Scenario: Invalid edge leaves state unchanged
- **WHEN** un movimiento apunta a una arista inexistente o ya ocupada
- **THEN** el estado, turno y puntuaciones no cambian y el movimiento no consume turno

#### Scenario: Shared edge closes multiple cells
- **WHEN** una arista libre compartida completa dos celdas activas
- **THEN** ambas celdas se asignan al jugador del movimiento y la puntuación aumenta exactamente en dos

### Requirement: Turn, completion, and result invariants
El contrato SHALL preservar GAME-06..GAME-09: cerrar al menos una celda conserva el turno, no cerrar avanza al participante elegible, las capturas encadenadas no tienen límite arbitrario, la partida termina al asignar todas las celdas y permite empates con todos los ganadores máximos.

#### Scenario: Capture grants another turn
- **WHEN** un movimiento legal cierra una o más celdas
- **THEN** el jugador conserva el turno y la puntuación coincide con las nuevas celdas asignadas

#### Scenario: Last cell produces a complete tied result
- **WHEN** se asigna la última celda activa y la puntuación máxima está compartida
- **THEN** el estado termina, la suma de puntos coincide con el número de celdas activas y el resultado contiene todos los ganadores

### Requirement: Silhouette independence
El contrato SHALL garantizar GAME-10: detección de cierres, puntuación y cambio de turno producen el mismo resultado semántico para cualquier silueta válida de celdas cuadradas.

#### Scenario: Equivalent move sequence has equivalent semantics
- **WHEN** se aplica una secuencia válida equivalente en un tablero rectangular y en una silueta válida
- **THEN** cada cierre, puntuación, turno extra y estado terminal se determina con las mismas reglas, ajustado únicamente al conjunto de celdas activas
