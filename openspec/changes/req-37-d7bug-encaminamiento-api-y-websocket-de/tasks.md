# Tasks

## 1. Confirmar el contrato de encaminamiento

- [x] 1.1 Identificar en el cliente público todas las URLs REST de búsqueda, estado y cancelación, y verificar contra la configuración real del web container que se transforman a `/api/public/...` sin modificar métodos, payloads ni respuestas; comprobarlo con una prueba de ruta que reproduzca que `POST /public/search` ya no es utilizado.
- [x] 1.2 Identificar la URL WebSocket pública y alinearla con la frontera proxificada bajo `/api/`, conservando el identificador de partida y verificando mediante el upgrade real de Fastify que no se obtiene una respuesta HTTP de contenido.

## 2. Conservar el proxy y el servidor autoritativo

- [x] 2.1 Ajustar únicamente el encaminamiento del web container necesario para que la ruta REST y el upgrade WebSocket lleguen al API, y verificar que no se introduce una segunda capa de proxy ni se alteran rutas ajenas a D7.
- [x] 2.2 Verificar que las solicitudes proxificadas siguen usando la identidad, validación de turno/versión/duplicidad, persistencia y eventos ordenados existentes; comprobar que no requiere migraciones, nuevas tablas ni cambios en las reglas de puntuación o finalización.

## 3. Cobertura de integración pública

- [x] 3.1 Añadir o adaptar una prueba HTTP contra Fastify autoritativo en proceso que cubra crear, consultar y cancelar una búsqueda pública, verificando que no hay `405`, que el estado mostrado procede del servidor y que una cancelación confirmada deja de ser elegible.
- [x] 3.2 Añadir o adaptar una prueba WebSocket contra el servidor Fastify real que compruebe el handshake/upgrade, la recepción de estado inicial y el orden de eventos para dos sesiones emparejadas.
- [x] 3.3 Ejecutar el escenario determinista con dos sesiones independientes, Fastify real y persistencia de prueba en proceso: ambas búsquedas se emparejan, ambos WebSockets conectan y una jugada válida produce el mismo snapshot/versionado en las dos sesiones.

## 4. Verificación del candidato

- [x] 4.1 Ejecutar la suite focalizada de rutas REST/WebSocket y el flujo de cancelación/emparejamiento con un entorno determinista en proceso, registrando comandos, evidencia de respuestas, upgrade y estado compartido, y verificar estáticamente las directivas Nginx del web container sin levantar Docker.
- [x] 4.2 Ejecutar la validación del change según el CLI OpenSpec instalado y revisar que los artefactos, requisitos, tareas y pruebas no declaran despliegue productivo ni comprobación física previa; dejar cualquier evidencia posterior al despliegue como pendiente separada.

## Evidence notes

- `npm test`: build y suite completa pasan; engine 23/23, server 45/45, web 18/18.
- La prueba nueva `two real public WebSocket sessions receive ordered authoritative snapshots` pasa contra Fastify real en proceso y verifica dos snapshots iniciales de versión 0 y dos eventos compartidos de versión 1.
- La prueba web `public-routing.test.ts` verifica las siete rutas REST públicas, el WebSocket bajo `/api/`, el único `proxy_pass` y los encabezados de upgrade de `ops/bootstrap/web/nginx.conf`.
- `openspec validate "req-37-d7bug-encaminamiento-api-y-websocket-de" --type change --strict --json`: validación PASS.
- Cobertura determinista del candidato: las tareas 1.2, 3.1, 3.2, 3.3 y 4.1 quedan comprobadas mediante Fastify real con upgrade WebSocket y persistencia de prueba en proceso en `packages/server/src/public-matchmaking.e2e.test.ts`, más verificación de directivas Nginx y prefijos `/api/` en `packages/web/src/public-routing.test.ts`. Esta evidencia no declara ejecución de Docker, contenedores, PostgreSQL externo ni despliegue.
