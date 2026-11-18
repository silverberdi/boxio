# public-online-matchmaking Specification

## Purpose
Define el flujo público online de Boxio para emparejar exactamente a dos invitados, mantener una partida 1v1 autoritativa y resolver cancelación, espera, reconexión y abandono de forma determinista.

## Requirements

### Requirement: Public queue pairs exactly two eligible guests
La modalidad pública SHALL permitir que un invitado se incorpore a una cola de búsqueda y SHALL crear una partida nueva únicamente cuando existan exactamente dos búsquedas activas elegibles. La partida SHALL fijar esos dos participantes, el tablero configurado y la identidad temporal de cada uno desde el inicio; no SHALL aceptar códigos de sala, un tercer participante, ingreso tardío ni sustitución.

#### Scenario: Two guests are matched
- **DADO** que exactamente dos invitados tienen búsquedas públicas activas y elegibles
- **CUANDO** el servidor confirma el emparejamiento
- **ENTONCES** crea una partida pública 1v1 con esos dos participantes fijos, retira ambas búsquedas de la cola y emite el estado inicial autoritativo

#### Scenario: Third guest is rejected
- **DADO** que existe una partida pública 1v1 activa con sus dos participantes fijados
- **CUANDO** un tercer invitado intenta ingresar mediante cualquier operación de sala o partida pública
- **ENTONCES** el servidor rechaza el ingreso sin cambiar participantes, tablero, turno ni puntuaciones

### Requirement: Queue cancellation and matching are an atomic race
El servidor SHALL tratar cancelar una búsqueda y emparejarla como transiciones mutuamente excluyentes, ordenadas por la primera confirmación autoritativa. Una búsqueda cuya cancelación haya sido confirmada SHALL quedar cancelada y no podrá emparejarse después; una búsqueda cuyo emparejamiento haya sido confirmado SHALL mostrar la partida y no podrá cancelarse como búsqueda pendiente. Los reintentos duplicados SHALL ser idempotentes.

#### Scenario: Cancellation wins the race
- **DADO** que una búsqueda pública activa recibe concurrentemente una solicitud de cancelación y una oportunidad de emparejamiento
- **CUANDO** el servidor confirma primero la cancelación
- **ENTONCES** la búsqueda queda cancelada, no se crea una partida con ese jugador y los reintentos de emparejamiento no la vuelven elegible

#### Scenario: Matching wins the race
- **DADO** que una búsqueda pública activa recibe concurrentemente una solicitud de cancelación y una oportunidad de emparejamiento
- **CUANDO** el servidor confirma primero el emparejamiento
- **ENTONCES** la búsqueda queda consumida por la partida 1v1 y la cancelación posterior se rechaza o se informa como ya resuelta sin deshacer la partida

### Requirement: Unmatched search offers a separate machine option
Si una búsqueda pública permanece sin rival durante 60 segundos medidos por el servidor, el sistema SHALL ofrecer al invitado tres opciones: jugar contra la máquina en una partida nueva y separada, continuar buscando o cancelar. Elegir la máquina SHALL cancelar/consumir la búsqueda antes de iniciar la partida separada y SHALL no insertar un bot en la cola pública ni convertir una partida pública existente.

#### Scenario: No rival after 60 seconds
- **DADO** que un invitado busca rival sin otra búsqueda elegible
- **CUANDO** transcurren 60 segundos según el tiempo del servidor
- **ENTONCES** recibe las opciones de jugar contra la máquina en una partida separada, continuar buscando o cancelar, y su búsqueda no se empareja automáticamente por el solo vencimiento

#### Scenario: Machine option leaves public queue
- **DADO** que el invitado recibe la oferta tras 60 segundos
- **CUANDO** elige jugar contra la máquina
- **ENTONCES** la búsqueda pública queda cancelada de forma idempotente y comienza una partida contra la máquina con estado nuevo, sin bot en la cola pública

### Requirement: Public game commands remain server-authoritative
La partida pública SHALL reutilizar la autoridad del servidor, la identidad temporal, la persistencia y los eventos ordenados de D6. Cada comando SHALL validarse contra identidad, pertenencia, turno, versión vigente, arista libre e identificador de comando; un rechazo SHALL no mutar aristas, cuadrados, puntuaciones, turno ni resultado. La modalidad SHALL preservar GAME-01..GAME-10: aristas legales, cierres, un punto por cuadrado, turno extra, fin, empate e independencia de la máscara de celdas cuadradas.

#### Scenario: Invalid public command does not mutate state
- **DADO** una partida pública activa y un cliente que envía una jugada duplicada, fuera de turno, con versión obsoleta o suplantando otra identidad
- **CUANDO** el servidor valida el comando
- **ENTONCES** lo rechaza de forma observable y conserva exactamente el snapshot, la secuencia, las puntuaciones y el turno confirmados

#### Scenario: Legal move preserves game invariants
- **DADO** una partida pública con tablero clásico o máscara válida de celdas cuadradas
- **CUANDO** el servidor confirma una arista libre que cierra cero, uno o varios cuadrados
- **ENTONCES** aplica la jugada como máximo una vez, puntúa cada cuadrado cerrado una unidad, conserva el turno si cerró al menos uno y cambia el turno si no cerró ninguno

### Requirement: Public reconnection ends in abandonment, not board inference
Cuando un participante público se desconecte, el servidor SHALL reservar su identidad durante 60 segundos y permitir recuperar dentro de ese plazo el mismo snapshot, puntuación, cuadrados e índice de participación mediante la credencial privada válida de D6. Si el plazo vence sin reconexión, SHALL terminar la partida por abandono y declarar vencedor al rival presente; no SHALL admitir reemplazo, tercer participante ni inferir el resultado por cantidad de cuadros.

#### Scenario: Disconnected guest reconnects within 60 seconds
- **DADO** que un participante está desconectado durante una partida pública hace menos de 60 segundos y conserva una credencial privada válida
- **CUANDO** regresa a la misma partida
- **ENTONCES** recupera la identidad y el estado autoritativo de la partida, y la credencial anterior deja de ser válida tras su rotación

#### Scenario: Timeout declares abandonment
- **DADO** que un participante está desconectado durante una partida pública
- **Y** han transcurrido 60 segundos sin que regrese con una credencial válida
- **CUANDO** vence la reserva según el reloj del servidor
- **ENTONCES** la partida termina con causal abandono, el rival gana por abandono y el resultado no se calcula ni se infiere por la cantidad de cuadros

#### Scenario: Reconnection after timeout cannot rejoin
- **DADO** que una partida pública terminó por abandono al vencer la reserva
- **CUANDO** el participante ausente intenta reconectar o un tercero intenta ocupar su lugar
- **ENTONCES** el servidor rechaza ambos accesos y conserva el resultado final de abandono

### Requirement: Public lifecycle and accessibility expose authoritative state
La interfaz pública SHALL mostrar búsqueda activa, acción cancelar, transición a partida, pérdida de conexión, tiempo de reserva cuando aplique, reconexión y resultado por abandono con texto y señales no dependientes únicamente del color. SHALL mantener accesible la acción elegida tras el timeout y SHALL explicar que jugar contra la máquina inicia una partida separada.

#### Scenario: Search can be cancelled visibly
- **DADO** que un invitado está buscando rival
- **CUANDO** observa el estado de la modalidad pública
- **ENTONCES** ve que está buscando, puede activar cancelar y, si cancela con confirmación del servidor, deja de aparecer como elegible para una futura partida

#### Scenario: Abandonment result is distinct from normal victory
- **DADO** que una partida pública finaliza por timeout de reconexión
- **CUANDO** los participantes reciben el resultado
- **ENTONCES** la interfaz identifica explícitamente la victoria por abandono y no la presenta como victoria normal por puntos

### Requirement: Public scope excludes unrelated social and asset capabilities
El incremento SHALL excluir ranking, perfiles, registro obligatorio, chat, salas públicas de 3–4 jugadores, bots en cola, sustitución, ingreso tardío, revancha automática, assets externos y despliegue automático. Los recursos visuales o sonoros necesarios SHALL provenir únicamente del catálogo del repositorio.

#### Scenario: Public MVP does not require excluded capabilities
- **DADO** un invitado que completa búsqueda, partida, reconexión o resultado público
- **CUANDO** usa el flujo D7
- **ENTONCES** no se le exige cuenta, ranking, chat, código de sala, recurso externo ni configuración de más de dos participantes
