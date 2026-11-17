# Spec Delta

## MODIFIED Requirements

### Requirement: Local mode entry and configuration

La experiencia SHALL mostrar cuatro modalidades desde el inicio y SHALL presentar como no habilitada la ruta de cualquier modalidad que todavía no corresponda a una entrega disponible. La modalidad local SHALL permitir entre 2 y 4 jugadores, apodos, colores y selección de tablero clásico o de cualquiera de las nueve variantes especiales aprobadas, sin registro obligatorio.

#### Scenario: Configure a special local board
- **WHEN** se configura una partida local con 2, 3 o 4 participantes y se selecciona una silueta y tamaño del catálogo
- **THEN** se puede iniciar la partida con esa instantánea de tablero, manteniendo apodos, colores y límites de jugadores

#### Scenario: Configure two to four local players
- **WHEN** se configura una partida local con 2, 3 o 4 participantes
- **THEN** se pueden establecer apodos y colores para cada participante y seleccionar un tablero rectangular válido

#### Scenario: Reject player count outside local bounds
- **WHEN** se intenta configurar una partida local con menos de 2 o más de 4 participantes
- **THEN** la configuración no se puede iniciar y conserva un error observable sin crear estado de partida

#### Scenario: Unavailable mode remains disabled
- **WHEN** una modalidad todavía no está disponible
- **THEN** su opción y ruta muestran estado no habilitado y no inician una partida

### Requirement: SVG board edge interaction

El tablero SHALL representar únicamente celdas cuadradas y aristas canónicas del motor, tanto clásicas como derivadas de una máscara especial; SHALL permitir seleccionar una arista libre mediante toque y SHALL mantener zoom y desplazamiento táctiles sin ocultar turno ni marcadores. En modalidad local preparada u offline, la validación SHALL ejecutarse en el dispositivo sin requerir red ni API.

#### Scenario: Render every silhouette through the generic board
- **WHEN** se inicia una partida local con cruz, corazón o estrella simple en cualquier tamaño aprobado
- **THEN** el mismo render SVG genérico muestra sus celdas y aristas cuadradas sin una ruta visual específica de la figura

#### Scenario: Tap selects a legal special-board edge
- **WHEN** un jugador toca una arista libre derivada de una silueta
- **THEN** se procesa conforme al motor local y se refleja el resultado confirmado

#### Scenario: Tap selects a legal edge
- **WHEN** un jugador toca una arista libre en una partida local
- **THEN** se procesa la selección conforme a las reglas del motor local y se refleja el resultado confirmado

#### Scenario: Pan or zoom does not select an edge
- **WHEN** el usuario ejecuta un gesto de zoom o desplazamiento
- **THEN** el tablero se transforma según el gesto y no se toma una arista accidentalmente

#### Scenario: Occupied or absent edge is rejected
- **WHEN** el usuario toca una arista ya ocupada o una región ausente de la máscara
- **THEN** el movimiento se rechaza, no cambia el turno y no cambia ningún marcador

#### Scenario: Occupied edge is rejected
- **WHEN** el usuario toca una arista ya ocupada
- **THEN** el movimiento se rechaza, no cambia el turno y no cambia ningún marcador

#### Scenario: Offline move has no network dependency
- **WHEN** una partida local pierde la conexión y el jugador selecciona una arista legal
- **THEN** el motor local valida la arista y actualiza tablero, puntuación y turno sin `fetch`, API ni servidor
