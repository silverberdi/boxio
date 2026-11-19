# Design

## Context

El cliente público está usando rutas REST `/public/...` y un WebSocket `/public/matches/...` en la raíz, mientras que el web container ya deriva `/api/` al servicio API. El cambio debe corregir ese único límite de encaminamiento sin duplicar proxy, tocar el modelo PostgreSQL ni cambiar la autoridad de D7. La motivación y el resultado observable están en `proposal.md`; los contratos verificables están en `specs/public-online-matchmaking/spec.md`.

## Goals / Non-Goals

**Goals:**

- Hacer que el cliente público construya las rutas REST y WebSocket compatibles con el proxy existente.
- Confirmar el contrato del cliente mediante el servidor Fastify autoritativo en proceso, incluyendo método HTTP, handshake/upgrade y eventos.
- Confirmar estáticamente que Nginx mantiene el único `proxy_pass` al API y los encabezados de upgrade requeridos.
- Mantener intactos los contratos de matchmaking, cancelación, identidad, persistencia, reconexión y juego autoritativo.
- Probar dos sesiones independientes contra Fastify real y la persistencia de prueba disponible, con evidencia de estado compartido y cancelación, sin exigir Docker ni servicios externos al sandbox.

**Non-Goals:**

- No rediseñar el proxy ni añadir otro servicio, gateway o tabla.
- No cambiar endpoints internos del API, mensajes de D7, reglas del motor, expiraciones o política de bots.
- No desplegar a producción ni afirmar validación física de campo.
- No reemplazar la integración por mocks de UI.

## Decisions

### Reutilizar el prefijo `/api/` ya derivado por el web container

Las URLs REST públicas se construirán bajo `/api/public/...`, manteniendo el recurso y método que ya entiende el API. Esto corrige el 405 en el origen y evita que el web server intente interpretar una operación API como ruta de contenido. No se elige añadir una excepción raíz `/public/` porque duplicaría el contrato de proxy y permitiría que cliente y configuración diverjan otra vez.

### Encajar el WebSocket público en la misma frontera proxificada

La URL WebSocket pública se cambiará al espacio de rutas que el web container entrega al API bajo `/api/`, conservando el sufijo de identificación de la partida y la semántica de upgrade. El contenedor debe reenviar explícitamente los encabezados de upgrade ya previstos por su proxy; no se crea una segunda capa de encaminamiento. La alternativa de mantener `/public/matches/...` se descarta porque no atraviesa la frontera que ya funciona para API.

### Verificar el servidor autoritativo y la frontera Nginx de forma determinista

Las pruebas de este cambio enviarán REST mediante `app.inject` y WebSocket mediante el upgrade real del servidor Fastify, y comprobarán el resultado observable en dos sesiones independientes. La persistencia de prueba en proceso aísla el candidato y permite repetir la validación sin Docker, contenedores ni orquestación externa. En paralelo, una prueba estática inspeccionará `ops/bootstrap/web/nginx.conf` para verificar el único `proxy_pass`, el prefijo `/api/` y los encabezados de upgrade. Esto prueba tanto el comportamiento autoritativo como la configuración de la frontera proxificada, sin confundir una validación del sandbox con una prueba física del web container desplegado.

### Mantener el estado autoritativo existente

El cliente aplicará respuestas y eventos del servidor sin convertir la corrección de URL en una nueva autoridad local. La prueba de jugada comprobará versión, turno y puntuación compartidos después de una transición válida, además de que la cancelación deja la búsqueda fuera de la cola. No se modifica el esquema ni la transacción de matchmaking.

## Risks / Trade-offs

- **[Riesgo]** El prefijo esperado por el proxy y el prefijo producido por el cliente pueden volver a divergir en una ruta secundaria. → **Mitigación:** cubrir inicio, consulta, cancelación y WebSocket en Fastify, y verificar estáticamente la frontera Nginx, no solo la búsqueda.
- **[Riesgo]** El WebSocket puede responder HTTP correctamente pero perder el upgrade o los encabezados necesarios. → **Mitigación:** comprobar handshake real y recepción de eventos desde dos sesiones.
- **[Riesgo]** Una prueba determinista en proceso puede no detectar un fallo operacional de un contenedor desplegado. → **Mitigación:** verificar estrictamente las directivas Nginx versionadas y dejar la comprobación física del despliegue como evidencia posterior separada, sin presentarla como validación del candidato.
- **[Riesgo]** Un cambio de ruta puede ocultar una regresión en reglas D7. → **Mitigación:** mantener escenarios de emparejamiento, cancelación y jugada compartida con estado persistido, sin relajar validaciones.

## Migration Plan

1. Confirmar las rutas efectivas del web container y los endpoints públicos existentes antes de editar el cliente.
2. Cambiar las construcciones de URL REST/WebSocket del cliente y ajustar solo la configuración de proxy necesaria para conservar el upgrade.
3. Ejecutar las pruebas deterministas contra Fastify y la verificación estática de Nginx; no levantar Docker ni orquestación externa como requisito del candidato.
4. Si falla la validación, revertir el cambio de rutas/configuración del candidato; no ejecutar migraciones ni modificar datos productivos.
5. PostgreSQL sigue siendo la persistencia de producción, pero no es un prerrequisito de esta verificación de encaminamiento en proceso.
6. El despliegue y cualquier comprobación física posterior son pasos separados y requieren evidencia propia.

## Open Questions

No hay preguntas abiertas que cambien este contrato o su desglose. Los detalles de nombres internos de módulos y comandos de test se resolverán al aplicar el change según el repositorio efectivo.
