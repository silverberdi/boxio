# Spec Delta

## ADDED Requirements

### Requirement: Configure human and automatic participants

La configuración de partida contra máquina SHALL permitir un humano y de uno a tres bots, para un total de 2–4 participantes, y SHALL permitir seleccionar la dificultad de cada bot entre fácil, medio y difícil sin registro obligatorio.

#### Scenario: Configure one to three bots
- **DADO** una configuración de partida contra máquina
- **CUANDO** se selecciona uno, dos o tres bots junto con el humano
- **ENTONCES** la partida queda configurada con 2, 3 o 4 participantes totales y dificultades válidas

#### Scenario: Reject invalid machine participant count
- **DADO** una configuración contra máquina
- **CUANDO** se intenta iniciar con cero bots o más de tres bots, o sin un humano
- **ENTONCES** la configuración se rechaza sin crear una partida utilizable

### Requirement: Display automatic turns consistently

La experiencia local SHALL identificar al bot activo y reflejar sus puntos, capturas y turnos extra en los mismos marcadores y estados de turno que un participante humano, sin añadir controles de fin de turno ni dependencias de red.

#### Scenario: Bot capture updates local game
- **DADO** un bot activo que cierra uno o más cuadrados
- **CUANDO** se procesa su jugada
- **ENTONCES** se actualizan sus puntos y cuadrados, conserva el turno y el estado visible permite la siguiente decisión automática

#### Scenario: Machine mode remains offline
- **DADO** una partida contra máquina preparada y sin conexión
- **CUANDO** el bot calcula y aplica una jugada
- **ENTONCES** la partida progresa con el motor local sin `fetch`, WebSocket, servidor ni API de modelos
