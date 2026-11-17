# Spec Delta

## MODIFIED Requirements

### Requirement: SVG board edge interaction

El tablero SHALL representar únicamente celdas cuadradas y aristas canónicas del motor, SHALL permitir seleccionar una arista libre mediante toque y SHALL mantener zoom y desplazamiento táctiles sin ocultar turno ni marcadores. En modalidad local preparada u offline, la validación SHALL ejecutarse en el dispositivo sin requerir red ni API.

#### Scenario: Tap selects a legal edge
- **WHEN** un jugador toca una arista libre en una partida local preparada, con o sin conexión
- **THEN** se procesa la selección conforme a las reglas del motor local y se refleja el resultado confirmado

#### Scenario: Pan or zoom does not select an edge
- **WHEN** el usuario ejecuta un gesto de zoom o desplazamiento
- **THEN** el tablero se transforma según el gesto y no se toma una arista accidentalmente

#### Scenario: Occupied edge is rejected
- **WHEN** el usuario toca una arista ya ocupada, incluso sin conexión
- **THEN** el movimiento se rechaza, no cambia el turno y no cambia ningún marcador

#### Scenario: Offline move has no network dependency
- **WHEN** una partida local pierde la conexión y el jugador selecciona una arista legal
- **THEN** el motor local valida la arista y actualiza tablero, puntuación y turno sin `fetch`, API ni servidor

### Requirement: Local scope and deployment evidence boundary

Este change SHALL limitarse a juego local 2–4 y SHALL excluir salas online, quinto jugador, nuevos assets externos, chat, rankings, tiendas, perfiles, registro obligatorio y otras modalidades no entregadas. La validación física en dispositivos SHALL quedar explícitamente pendiente de un candidato desplegado. La PWA SHALL no prometer recuperar una partida local después de cerrar el navegador.

#### Scenario: Excluded online scope is absent
- **WHEN** se revisa la experiencia entregada por D3
- **THEN** no permite iniciar ni jugar una sala online ni añade un quinto jugador

#### Scenario: Physical device validation is not self-claimed
- **WHEN** se registra la evidencia de viewport, instalación y modo avión
- **THEN** la automatización del PR queda separada de la prueba física, que se marca pendiente hasta disponer de un candidato desplegado

#### Scenario: Browser close recovery is not promised
- **WHEN** el usuario cierra el navegador durante una partida local y vuelve posteriormente
- **THEN** la experiencia no afirma ni exige recuperar la partida anterior

