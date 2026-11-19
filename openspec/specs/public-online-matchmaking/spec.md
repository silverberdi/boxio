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

### Requirement: Public REST operations use the API proxy prefix
Las operaciones REST de búsqueda, consulta y cancelación de partidas públicas SHALL exponerse al cliente mediante el prefijo `/api/` que el web container deriva al servicio API. El encaminamiento SHALL preservar las respuestas autoritativas del servidor y no SHALL dejar estas operaciones en las rutas raíz `/public/...` que atiende el web server como contenido web.

#### Scenario: Search reaches the API through the web container
- **DADO** que el cliente público solicita iniciar una búsqueda
- **CUANDO** envía `POST /api/public/search` a través del web container
- **ENTONCES** la solicitud llega al API, no recibe `405 Method Not Allowed` del web server y la respuesta indica el estado autoritativo de la búsqueda

#### Scenario: Public search status and cancellation use the same API prefix
- **DADO** que existe una búsqueda pública activa
- **CUANDO** el cliente consulta su estado o solicita cancelarla mediante el web container
- **ENTONCES** las solicitudes usan `/api/public/...`, llegan al API y la cancelación confirmada retira la búsqueda de las candidatas a emparejamiento

### Requirement: Public WebSocket uses the web container proxy
El WebSocket de la modalidad pública SHALL conectarse mediante la ruta pública del proxy alineada con el prefijo API existente y SHALL conservar el handshake y upgrade de WebSocket hasta el servicio autoritativo. La conexión SHALL seguir entregando eventos ordenados y el estado confirmado de la partida, sin cambiar las reglas de identidad, turno, versión o validación de comandos de D7.

#### Scenario: Public WebSocket upgrades through the proxy
- **DADO** que dos sesiones han sido emparejadas en una partida pública
- **CUANDO** cada cliente establece el WebSocket público mediante el web container
- **ENTONCES** el proxy conserva el upgrade, ambos sockets llegan al servicio API y cada sesión recibe el estado autoritativo de la partida

#### Scenario: A valid move is observed by both proxied sessions
- **DADO** que dos sesiones tienen WebSockets públicos conectados
- **CUANDO** una sesión envía una jugada válida en su turno
- **ENTONCES** el servidor valida y persiste la transición una sola vez, y ambas sesiones observan el mismo snapshot/evento ordenado con la nueva versión, turno y puntuación

### Requirement: Routing validation uses the authoritative Fastify server and static proxy checks
La validación del encaminamiento público SHALL cubrir las operaciones REST contra el servidor Fastify autoritativo en proceso y el upgrade WebSocket contra ese mismo servidor, incluyendo dos sesiones independientes que buscan rival, se emparejan, conectan el WebSocket y observan una jugada compartida, además de una búsqueda cancelada que no vuelve a ser elegible. SHALL verificar estáticamente las directivas Nginx del web container que establecen el único encaminamiento al API y conservan los encabezados de upgrade. No SHALL exigir Docker, contenedores, orquestación externa, PostgreSQL ejecutándose ni un despliegue productivo en el sandbox de validación; la persistencia de producción y las reglas de D7 permanecen sin cambios.

#### Scenario: Two in-process sessions complete a public match
- **DADO** que el servidor Fastify autoritativo y la persistencia de prueba están disponibles en el proceso de validación
- **CUANDO** dos sesiones independientes buscan rival mediante las rutas REST del servidor, se emparejan, conectan sus WebSockets mediante el upgrade del servidor y una sesión realiza una jugada válida
- **ENTONCES** ambas sesiones completan el flujo sin error de encaminamiento y observan el mismo snapshot/evento autoritativo ordenado

#### Scenario: Cancelled search is not matched later
- **DADO** que una sesión tiene una búsqueda pública creada mediante el API proxificado
- **CUANDO** la cancela y después aparece otra búsqueda elegible
- **ENTONCES** la búsqueda cancelada no se empareja ni crea una partida con esa sesión

#### Scenario: Nginx proxy directives preserve the public boundary
- **DADO** que se inspecciona la configuración Nginx versionada del web container
- **CUANDO** se ejecuta la prueba estática de encaminamiento
- **ENTONCES** se verifica el `proxy_pass` único al API, el prefijo `/api/` y los encabezados `Upgrade`/`Connection`, sin levantar contenedores ni sustituir la comprobación por un mock de la UI

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
