# Spec Delta

## ADDED Requirements

### Requirement: Public UI renders every authoritative asynchronous state immediately
La interfaz pública SHALL reflejar sin interacción adicional cada estado autoritativo recibido del API, polling o WebSocket, incluyendo búsqueda, emparejamiento, conexión, tablero, turno, aristas, marcador, resultado, cancelación y desconexión. La integración SHALL usar el mecanismo nativo mínimo de Angular necesario para que los callbacks actualicen la vista, sin crear una capa nueva de polling, proxy o estado global.

#### Scenario: Search status appears after starting a search
- **DADO** que la modalidad pública está lista para buscar rival
- **CUANDO** la búsqueda se inicia y llega la respuesta asíncrona del servidor
- **ENTONCES** la misma vista muestra «Buscando rival» inmediatamente, sin escribir, tocar otro control, recargar ni generar otro evento Angular

#### Scenario: Match and connection state appear from the received state
- **DADO** que el servidor confirma el emparejamiento de dos participantes
- **CUANDO** la UI recibe el estado de emparejamiento y conexión
- **ENTONCES** muestra al rival, «Conectado», el tablero y el turno vigente sin interacción adicional

#### Scenario: A valid move propagates between independent sessions
- **DADO** que dos sesiones independientes participan en la misma partida pública
- **CUANDO** una sesión realiza una jugada válida y la otra recibe el snapshot o evento correspondiente
- **ENTONCES** la otra sesión muestra la arista ocupada, el turno y el marcador sin recargar ni requerir interacción adicional

#### Scenario: Cancellation and disconnection are not stale
- **DADO** que la UI muestra una búsqueda activa o una conexión WebSocket
- **CUANDO** se confirma la cancelación o el WebSocket se cierra o desconecta
- **ENTONCES** el estado visible cambia inmediatamente al estado recibido y no conserva la búsqueda o conexión como activa

### Requirement: Public UI preserves the existing D7 contracts
La corrección visual SHALL mantener sin cambios las rutas REST/WebSocket, la identidad temporal, la persistencia, la validación autoritativa, las reglas de matchmaking 1v1, la secuencia de eventos y las reglas de juego de D7. La edición de un apodo u otro evento normal de Angular no SHALL ser necesaria para hacer visible un estado ya recibido.

#### Scenario: Reproduction no longer needs a follow-up Angular event
- **DADO** que el servidor ya respondió `201` a las búsquedas, emparejó a ambos participantes y el navegador recibió el snapshot inicial y cambios de versión, incluidas jugadas
- **CUANDO** la UI procesa esos callbacks
- **ENTONCES** muestra emparejamiento, conexión, tablero y aristas sin editar el apodo ni provocar otra interacción

#### Scenario: Existing online contracts remain unchanged
- **DADO** que el encaminamiento de D7 ya está corregido
- **CUANDO** se integra la actualización visual
- **ENTONCES** no cambian las rutas, el contrato de mensajes, la persistencia, las reglas de matchmaking ni la autoridad del servidor

### Requirement: Public UI behavior is verified with real test services and cleanup
La verificación E2E SHALL usar los servicios reales de prueba disponibles del candidato, incluyendo la integración de la interfaz Angular con detección inmediata de cambios en callbacks REST/WebSocket, Fastify autoritativo en proceso y el shell web en navegador, sin sustituir la integración por mocks. SHALL cubrir búsqueda, emparejamiento, conexión, jugadas, resultado, cancelación y desconexión, completar la partida y confirmar que no queda un match de prueba activo. La comprobación del despliegue SHALL registrarse separadamente.

#### Scenario: Two real sessions complete and clean up a public match
- **DADO** que el candidato puede ejecutarse con servicios de prueba reales
- **CUANDO** se verifica el flujo público en dos sesiones, se propagan jugadas y se completa la partida
- **ENTONCES** se observan los estados renderizados sin interacción adicional, el resultado final queda visible y no queda una búsqueda ni un match activo

#### Scenario: Deployment verification is separate evidence
- **DADO** que la prueba E2E se ejecuta contra el candidato con servicios de prueba
- **CUANDO** se requiere comprobar el despliegue
- **ENTONCES** esa comprobación se registra aparte y no se presenta como resultado de la prueba E2E del candidato
