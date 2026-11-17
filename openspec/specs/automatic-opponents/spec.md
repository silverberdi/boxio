# automatic-opponents Specification

## Purpose

Define oponentes automáticos locales, puros y reproducibles para que un humano pueda jugar partidas Boxio contra dificultades fácil, media o difícil sin red, ML ni servicios externos.

## Requirements

### Requirement: Bot difficulty decision contract

El sistema SHALL ofrecer tres dificultades de oponente automático —fácil, medio y difícil— que reciban un estado legal de partida y una semilla, y devuelvan una única arista existente y libre. La decisión SHALL ser reproducible para el mismo estado, dificultad y semilla, y SHALL no consultar UI, DOM, reloj, red, persistencia, imágenes, audio ni APIs de modelos.

#### Scenario: Legal seeded decision
- **DADO** un estado legal y una semilla
- **CUANDO** se solicita una decisión de cualquier dificultad
- **ENTONCES** se devuelve una arista válida, libre y perteneciente al tablero

#### Scenario: Same seed is reproducible
- **DADO** el mismo estado, dificultad y semilla
- **CUANDO** se solicita la decisión dos veces
- **ENTONCES** ambas decisiones son iguales y no se consulta ninguna dependencia externa

#### Scenario: Non-rectangular square mask
- **DADO** un tablero no rectangular compuesto únicamente por cuadrados activos
- **CUANDO** juega un bot de cualquier dificultad
- **ENTONCES** calcula una arista legal sin fallar ni usar una API de modelos

### Requirement: Easy opponent policy

El bot fácil SHALL elegir una arista legal de forma pseudoaleatoria reproducible. Cuando existan capturas inmediatas disponibles, SHALL elegir una de ellas en el 20 % de las ocasiones definidas por su flujo pseudoaleatorio; en las demás ocasiones SHALL conservar la política aleatoria legal, sin seleccionar aristas ocupadas.

#### Scenario: Easy chooses legal random move
- **DADO** un estado legal sin captura inmediata
- **CUANDO** el bot fácil elige una jugada
- **ENTONCES** devuelve una arista libre elegida por la secuencia pseudoaleatoria de la semilla

#### Scenario: Easy capture probability is seeded
- **DADO** un estado con al menos una captura inmediata y una semilla reproducible
- **CUANDO** se repite la decisión con el mismo estado y semilla
- **ENTONCES** el resultado es determinista y la selección de captura respeta la probabilidad acordada del 20 %

### Requirement: Medium opponent policy

El bot medio SHALL priorizar una captura inmediata disponible. Si no puede capturar, SHALL elegir una alternativa que no regale un cuadro cuando exista alguna alternativa segura; si todas las alternativas regalan o no hay alternativa segura, SHALL devolver una jugada legal determinista.

#### Scenario: Medium takes immediate capture
- **DADO** un estado con una o más capturas inmediatas
- **CUANDO** el bot medio elige una jugada
- **ENTONCES** devuelve una captura inmediata legal

#### Scenario: Medium avoids a gift when safe move exists
- **DADO** un estado sin captura inmediata y con una alternativa segura
- **CUANDO** el bot medio elige una jugada
- **ENTONCES** devuelve una alternativa segura y no una arista que regale un cuadro

### Requirement: Hard opponent chain evaluation

El bot difícil SHALL evaluar las cadenas de capturas alcanzables desde las jugadas legales y SHALL elegir una arista legal conforme al resultado esperado de esa evaluación, pudiendo abrir o evitar una cadena según el estado.

#### Scenario: Hard evaluates capture chains
- **DADO** un estado legal con una cadena de capturas posible
- **CUANDO** el bot difícil elige una jugada
- **ENTONCES** considera la cadena alcanzable y devuelve una arista legal coherente con la evaluación

### Requirement: Bot turn integration and bounded decision

La integración de un bot SHALL procesar su arista mediante el mismo core que un humano. Si cierra uno o más cuadrados, SHALL conservar el turno y poder decidir nuevamente; si no cierra, SHALL avanzar al participante elegible. La decisión SHALL terminar en menos de 100 ms en el benchmark documentado para cualquier dificultad y tablero de hasta 8×8.

#### Scenario: Capture keeps bot turn without loop
- **DADO** un bot que cierra uno o más cuadrados
- **CUANDO** se procesa su jugada
- **ENTONCES** conserva el turno, puede actuar nuevamente y la partida progresa sin bucle

#### Scenario: Non-capture advances turn
- **DADO** un bot que ocupa una arista legal sin cerrar cuadrados
- **CUANDO** se procesa su jugada
- **ENTONCES** el turno avanza al siguiente participante elegible sin alterar las invariantes del motor

#### Scenario: Decision meets benchmark boundary
- **DADO** cualquier dificultad y un tablero de hasta 8×8
- **CUANDO** se mide el cálculo de una jugada en el entorno de benchmark documentado
- **ENTONCES** termina en menos de 100 ms
