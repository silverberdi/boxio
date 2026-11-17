# private-online-rooms Specification

## Purpose

Define the observable contract for private online Boxio rooms so invited guests can play with authoritative state, recover a temporary identity after a short disconnection, and leave a durable, auditable result without accounts or platform-specific hosting.

## Requirements

### Requirement: Private room identity and invitation access

La sala privada SHALL permitir crear o entrar mediante un código o enlace opaco, pero el código o enlace SHALL localizar la sala y nunca autenticar ni suplantar a un participante existente. Cada participante SHALL recibir una identidad opaca temporal y la sala SHALL admitir como máximo cuatro participantes; la partida SHALL poder comenzar desde que haya dos participantes.

#### Scenario: Invitation does not authenticate an existing participant
- **DADO** un enlace o código válido de una sala con un participante existente
- **CUANDO** un cliente nuevo entra usando únicamente ese enlace o código
- **ENTONCES** recibe una identidad nueva o un rechazo de capacidad, pero no la identidad, credencial ni puntuación del participante existente

#### Scenario: Room starts with two and caps at four
- **DADO** una sala privada con entre cero y cuatro plazas ocupadas
- **CUANDO** entran participantes válidos
- **ENTONCES** la partida puede iniciar al llegar al segundo, acepta hasta cuatro y rechaza cualquier entrada que exceda cuatro sin mutar la ocupación

### Requirement: Authoritative private game commands

El servidor SHALL ser la autoridad de identidad, turno, aristas, cuadrados, puntuación, bonus, fin y resultado. SHALL validar cada comando contra la identidad autenticada, la versión/turno vigente, la existencia y disponibilidad de la arista y un identificador de comando; SHALL emitir eventos ordenados y un rechazo observable sin mutar estado cuando falle una validación.

#### Scenario: Out-of-turn or forged command is rejected
- **DADO** una sala activa y un participante que no es elegible para jugar
- **CUANDO** envía una jugada, o intenta usar la identidad de otro participante
- **ENTONCES** el servidor rechaza el comando, no ocupa la arista y no cambia turno, cuadrados ni puntuaciones

#### Scenario: Simultaneous duplicate commands apply once
- **DADO** dos clientes que envían simultáneamente el mismo comando o comandos con el mismo identificador
- **CUANDO** el servidor los valida para una sala activa
- **ENTONCES** solo los comandos válidos se aplican en un orden confirmado y cada identificador válido produce como máximo una mutación

### Requirement: Late entry and capacity during play

Un participante SHALL poder entrar en una sala privada activa si hay plaza, conservar el tablero y puntuaciones ya confirmados, comenzar con cero puntos y ser integrado al final del turno vigente, incluidos los turnos extra. Si entra después de terminar la cadena de bonus vigente, SHALL esperar el punto de integración definido por el servidor y no alterar la historia.

#### Scenario: Third participant joins during a turn chain
- **DADO** una sala con dos participantes jugando y una jugada que mantiene el turno por haber cerrado cuadrados
- **CUANDO** entra un tercer participante con una plaza disponible
- **ENTONCES** recibe el tablero y puntuaciones existentes sin cambios, no juega dentro de la cadena actual y queda elegible al integrar el siguiente turno

#### Scenario: Late participant starts at zero
- **DADO** una sala activa con una cadena de bonus ya terminada
- **CUANDO** entra un nuevo participante
- **ENTONCES** su puntuación y cuadrados históricos son cero y los participantes previos conservan exactamente sus puntuaciones y cuadrados

### Requirement: Reconnection reservation and credential rotation

Al perder conexión un participante, la sala SHALL reservar su identidad durante 60 segundos. Dentro de ese plazo, solo una credencial privada válida para esa identidad y sala SHALL permitir recuperar el mismo participante, puntuación y cuadrados; al reconectar, el servidor SHALL invalidar la credencial anterior y emitir una nueva. La invitación no SHALL servir como credencial de reconexión.

#### Scenario: Reconnect within reservation
- **DADO** un participante desconectado hace menos de 60 segundos con una credencial privada válida
- **CUANDO** se conecta de nuevo a la misma sala
- **ENTONCES** recupera la misma identidad, puntuación, cuadrados y posición elegible, y la credencial anterior deja de ser válida

#### Scenario: Expired credential cannot recover identity
- **DADO** una reserva que ha superado 60 segundos
- **CUANDO** el cliente intenta reconectar con la credencial privada anterior
- **ENTONCES** el servidor rechaza la credencial, no recupera la identidad y deja la plaza disponible para una entrada nueva

### Requirement: Expiration, replacement, and historical result eligibility

Cuando expire una reserva, el servidor SHALL avanzar cualquier turno pendiente del participante desconectado hacia el siguiente participante elegible, conservar sus puntos y cuadrados completados y mantenerlo elegible para el resultado final. Un reemplazo posterior SHALL ser una identidad separada con cero puntos y sin heredar cuadrados ni credenciales.

#### Scenario: Reservation expiration advances pending turn
- **DADO** un participante desconectado cuyo turno está pendiente y cuya reserva de 60 segundos expira
- **CUANDO** el servidor evalúa la expiración
- **ENTONCES** el turno pasa al siguiente participante elegible y la historia del participante expirado conserva sus puntos y cuadrados

#### Scenario: Replacement remains distinct in final result
- **DADO** un participante con cuadrados históricos cuya reserva expiró
- **CUANDO** entra un reemplazo y la partida termina
- **ENTONCES** los cuadrados históricos siguen contando para el participante original, este sigue siendo elegible para el resultado, y el reemplazo aparece separado con cero puntos por esos cuadrados

### Requirement: Host departure and room lifecycle

La salida del anfitrión SHALL no transferir ni convertir el estado si quedan otros participantes; la sala SHALL continuar con las mismas identidades e historia. Si no queda ningún participante, la sala SHALL cerrarse. Si el anfitrión está solo en el lobby, podrá esperar o salir y comenzar una partida nueva contra la máquina; la sala privada no se convierte en esa partida.

#### Scenario: Host leaves while others remain
- **DADO** una sala con anfitrión y al menos otro participante
- **CUANDO** el anfitrión abandona
- **ENTONCES** la sala continúa sin transferir el rol como conversión de estado ni modificar la historia de juego

#### Scenario: Empty room closes
- **DADO** una sala cuyos participantes conectados y reservas activas han salido o expirado
- **CUANDO** el servidor evalúa el ciclo de vida
- **ENTONCES** la sala se cierra y no acepta nuevos comandos ni reconexiones a ese estado

### Requirement: Durable recovery and retention

El estado de una sala activa y su último movimiento confirmado SHALL persistirse en PostgreSQL de forma transaccional antes de emitir confirmación al cliente. Tras un reinicio, el servidor SHALL restaurar una sala activa desde ese último movimiento sin duplicarlo. Una sala terminada SHALL eliminarse al cumplirse 24 horas; el MVP SHALL prometer ningún SLA de disponibilidad o recuperación.

#### Scenario: Restart restores last confirmed move once
- **DADO** una sala activa con un último movimiento confirmado y clientes desconectados por reinicio
- **CUANDO** el backend vuelve a estar disponible y los clientes solicitan el estado
- **ENTONCES** reciben el snapshot y secuencia hasta ese movimiento, sin aplicar ni anunciar la jugada dos veces

#### Scenario: Finished room is removed after retention
- **DADO** una sala terminada cuya marca de finalización tiene al menos 24 horas
- **CUANDO** se ejecuta la limpieza de retención
- **ENTONCES** la sala y sus datos temporales de acceso se eliminan y no se promete un servicio posterior

### Requirement: Private online scope remains bounded

La capacidad SHALL reutilizar las invariantes GAME-01..GAME-10 del motor y los tableros de dos a cuatro participantes, y SHALL excluir chat, perfiles, registro obligatorio, rankings, tiendas, Redis, Kafka, microservicios, hosting obligatorio, sustitución automática por bot y assets externos. La resolución provisional de DEC-34 SHALL permanecer identificada para revisión.

#### Scenario: Online room preserves engine invariants
- **DADO** una sala privada con un tablero clásico o una silueta válida
- **CUANDO** se confirma una secuencia de movimientos legales e ilegales
- **ENTONCES** se preservan legalidad de aristas, cierres, puntuación, bonus, fin, empates e independencia de la silueta, y los rechazos no mutan estado

#### Scenario: Excluded capability is not required
- **DADO** un usuario que crea o juega una sala privada D6
- **CUANDO** completa el flujo de invitación, juego, reconexión o resultado
- **ENTONCES** no se le exige cuenta, chat, ranking, hosting propio, servicio distribuido ni recurso visual fuera del catálogo canónico
