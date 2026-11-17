# Spec Delta

## ADDED Requirements

### Requirement: Automatic participants use the pure game boundary

El contrato SHALL representar participantes automáticos junto con participantes humanos sin crear un motor paralelo. La decisión del bot SHALL consumir únicamente un estado serializable y devolver una arista candidata; el core SHALL validar turno, existencia, libertad, captura, puntuación, turno extra, fin y empate con las mismas reglas GAME-01..GAME-10.

#### Scenario: Bot move uses canonical invariants
- **DADO** un participante automático en turno y una arista candidata
- **CUANDO** el core procesa la jugada
- **ENTONCES** aplica exactamente las invariantes de una jugada humana y rechaza una arista inválida sin modificar el estado

#### Scenario: Bot does not bypass silhouette topology
- **DADO** una máscara válida de celdas cuadradas
- **CUANDO** un bot solicita una jugada
- **ENTONCES** solo puede elegir aristas derivadas de esa máscara y el algoritmo de cierre compartido permanece único

