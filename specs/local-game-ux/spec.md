# Spec Delta

## MODIFIED Requirements

### Requirement: Local turn, scoring, and celebrations
La experiencia SHALL mostrar el turno actual y los marcadores de 2–4 jugadores, SHALL aplicar automáticamente el turno adicional al cerrar uno o más cuadrados y SHALL no ofrecer botones de fin de turno. Un movimiento que cierre dos cuadrados SHALL asignar ambos colores, sumar exactamente 2 puntos, conservar el turno y mostrar una celebración reforzada no bloqueante que permita presentar el siguiente estado.

#### Scenario: Non-capturing move advances turn
- **WHEN** un movimiento legal no cierra ningún cuadrado
- **THEN** la arista se ocupa y el turno pasa automáticamente al siguiente jugador elegible

#### Scenario: Double capture keeps the player turn
- **WHEN** una confirmación legal cierra dos cuadrados
- **THEN** ambos cuadrados muestran el color del jugador, se suman 2 puntos, se muestra una celebración reforzada no bloqueante y el jugador conserva el turno

#### Scenario: No manual end-turn control exists
- **WHEN** la partida local está activa
- **THEN** los bonus de turno se aplican automáticamente y no se muestra un botón de fin de turno

### Requirement: Results and ties
Al asignarse todas las celdas, la experiencia SHALL mostrar la pantalla de resultados con puntuaciones finales, SHALL listar a todos los ganadores que compartan la puntuación máxima y SHALL devolver al inicio mediante una acción de continuación que no inicie una revancha automática ni reutilice el estado terminado.

#### Scenario: Completed game shows shared winners
- **WHEN** una partida termina con empate
- **THEN** el resultado muestra las puntuaciones, todos los ganadores compartidos y una continuación hacia el inicio

#### Scenario: Continue starts from fresh state
- **WHEN** el jugador continúa desde un resultado local
- **THEN** vuelve al inicio y la siguiente partida se crea con configuración y estado nuevos
