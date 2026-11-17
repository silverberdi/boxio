# Spec Delta

## MODIFIED Requirements

### Requirement: Bot difficulty decision contract

El sistema SHALL ofrecer tres dificultades de oponente automático —fácil, medio y difícil— que reciban un estado legal de partida clásico o de cualquiera de las máscaras especiales catalogadas y una semilla, y devuelvan una única arista existente y libre. La decisión SHALL ser reproducible para el mismo estado, dificultad y semilla, SHALL consultar solo el estado serializable y SHALL no contener reglas específicas de cruz, corazón o estrella.

#### Scenario: Legal seeded decision on every silhouette
- **DADO** un estado legal y una semilla en un tablero clásico, cruz, corazón o estrella simple
- **CUANDO** se solicita una decisión de cualquier dificultad
- **ENTONCES** se devuelve una arista válida, libre y perteneciente al tablero

#### Scenario: Legal seeded decision
- **DADO** un estado legal y una semilla
- **CUANDO** se solicita una decisión de cualquier dificultad
- **ENTONCES** se devuelve una arista válida, libre y perteneciente al tablero

#### Scenario: Same seed is reproducible
- **DADO** el mismo estado, dificultad y semilla
- **CUANDO** se solicita la decisión dos veces
- **ENTONCES** ambas decisiones son iguales y no se consulta ninguna dependencia externa

#### Scenario: Bot does not branch by figure
- **DADO** dos estados serializables con la misma topología semántica de celdas cuadradas
- **CUANDO** juega un bot de cualquier dificultad
- **ENTONCES** usa el mismo contrato de selección y validación, sin un motor ni una política exclusiva de una silueta

#### Scenario: Non-rectangular square mask
- **DADO** un tablero no rectangular compuesto únicamente por cuadrados activos
- **CUANDO** juega un bot de cualquier dificultad
- **ENTONCES** calcula una arista legal sin fallar ni usar una API de modelos

### Requirement: Bot turn integration and bounded decision

La integración de un bot SHALL procesar su arista mediante el mismo core que un humano en tableros clásicos y especiales. Si cierra uno o más cuadrados, SHALL conservar el turno y poder decidir nuevamente; si no cierra, SHALL avanzar al participante elegible. La decisión SHALL terminar en menos de 100 ms en el benchmark documentado para cualquier dificultad y tablero de hasta 8×8, además de las máscaras catalogadas.

#### Scenario: Capture keeps bot turn on a special board
- **DADO** un bot que cierra uno o más cuadrados en una silueta válida
- **CUANDO** se procesa su jugada
- **ENTONCES** conserva el turno, puede actuar nuevamente y la partida progresa sin bucle

#### Scenario: Capture keeps bot turn without loop
- **DADO** un bot que cierra uno o más cuadrados
- **CUANDO** se procesa su jugada
- **ENTONCES** conserva el turno, puede actuar nuevamente y la partida progresa sin bucle

#### Scenario: Non-capture advances turn
- **DADO** un bot que ocupa una arista legal sin cerrar cuadrados
- **CUANDO** se procesa su jugada
- **ENTONCES** el turno avanza al siguiente participante elegible sin alterar las invariantes del motor

#### Scenario: Decision meets benchmark boundary
- **DADO** cualquier dificultad y un tablero clásico de hasta 8×8 o una silueta catalogada
- **CUANDO** se mide el cálculo de una jugada en el entorno de benchmark documentado
- **ENTONCES** termina en menos de 100 ms
