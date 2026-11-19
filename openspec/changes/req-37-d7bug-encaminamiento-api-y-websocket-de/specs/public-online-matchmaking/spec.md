# Spec Delta

## ADDED Requirements

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
