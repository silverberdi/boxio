# Proposal

## Why

La modalidad pública 1v1 de D7 está desplegada con un desajuste entre las rutas que usa el cliente y el prefijo que el web container deriva al API: `POST /public/search` cae en el web server y responde `405 Method Not Allowed`, dejando la interfaz sin conexión y sin crear la búsqueda. El cambio es necesario ahora para que las sesiones públicas utilicen el encaminamiento API/WebSocket ya soportado por el proxy y puedan completar el flujo real entre dos navegadores.

## What Changes

- Alinear las llamadas REST de la modalidad pública con el prefijo `/api/` que el web container deriva al servicio API.
- Alinear el WebSocket público con el encaminamiento del web container, conservando el upgrade de WebSocket.
- Mantener las rutas, identidad, validación de comandos, matchmaking 1v1, cancelación, persistencia PostgreSQL, reconexión y reglas de juego de D7; no cambiar su comportamiento de negocio.
- Añadir o ajustar pruebas deterministas contra el servidor Fastify autoritativo para REST y WebSocket, incluyendo dos sesiones que se emparejan, observan el mismo estado y cancelan una búsqueda.
- Verificar estáticamente las directivas Nginx del web container para confirmar el único `proxy_pass` y los encabezados de upgrade, sin exigir ejecutar Docker, contenedores ni orquestación externa en el sandbox del candidato.
- Mantener PostgreSQL como persistencia de producción conforme al contrato de D7; esta verificación de encaminamiento en proceso usa la persistencia de prueba disponible y no afirma una validación PostgreSQL/containerizada.
- No usar despliegue productivo; cualquier comprobación física posterior al despliegue queda fuera de este cambio.
- No añadir otra capa de proxy, nuevas tablas, bot en cola ni alcance social.

## Capabilities

### New Capabilities

<!-- None. The change corrects the access paths of an existing D7 capability. -->

### Modified Capabilities

- `public-online-matchmaking`: las operaciones REST y el WebSocket público deben ser accesibles mediante el prefijo y proxy existentes, sin alterar las reglas autoritativas de matchmaking, cancelación, identidad, persistencia o juego.

## Impact

- Cliente público de la aplicación web: construcción de URLs REST y URL de WebSocket.
- Configuración/servidor del web container y su encaminamiento Nginx existente, únicamente en lo necesario para hacer efectiva la ruta API/WebSocket ya soportada.
- API pública y contrato de conexión WebSocket: deben seguir atendiendo las mismas operaciones detrás del proxy.
- Pruebas deterministas del servidor Fastify y verificación estática de la configuración Nginx; no se modifica el esquema de persistencia ni se requiere infraestructura adicional para validar el candidato.
