# Design

## Context

El proposal define el flujo público 1v1. D6 ya establece identidad temporal, autoridad de comandos, PostgreSQL, snapshots/eventos y reserva de reconexión para salas privadas; D7 debe reutilizar esos contratos sin alterar su ciclo de vida. La modalidad pública añade una cola corta y una terminación específica por abandono. Ver `proposal.md`, `specs/public-online-matchmaking/spec.md`, `docs/GAMEPLAY.md` (CONN-05/06/09/10) y DEC-10/29.

## Goals / Non-Goals

**Goals:**

- Modelar búsqueda, emparejamiento, cancelación y timeout como transiciones autoritativas e idempotentes.
- Mantener PostgreSQL como único estado durable y el servidor como autoridad de identidad, turno, tablero y resultado.
- Compartir el motor puro y el contrato online de D6 sin acoplar el motor a cola, sockets o UI.
- Entregar un flujo PWA entendible en móvil y escritorio, con estados de conexión y abandono accesibles.
- Mantener portabilidad a otro hosting y futura adaptación a Capacitor sin introducir servicios distribuidos.

**Non-Goals:**

- No cambiar reglas del motor, contratos de salas privadas, persistencia local, siluetas ni dificultad de la máquina.
- No crear cuentas, ranking, chat, perfiles, emparejamiento 3–4, bot en cola, sustitución o ingreso tardío.
- No añadir Redis/Kafka/microservicios, CDN, assets nuevos ni despliegue.

## Decisions

### 1. Cola y partida como estados transaccionales del mismo backend

La cola pública se representará con estados explícitos (`searching`, `cancelled`, `matched`) y una partida pública separada con dos asientos fijados. La confirmación de cancelación y la reserva de dos búsquedas se ejecutarán en una transacción PostgreSQL con restricciones que impidan consumir una búsqueda ya cancelada o crear más de una partida por búsqueda. Se elige esta opción porque DEC-29 exige que gane la primera confirmación del servidor y D6 ya requiere PostgreSQL; una cola en memoria perdería justicia tras reinicio. No se introduce un broker distribuido: añade complejidad sin una necesidad aprobada.

### 2. Reloj y expiración en servidor

El instante de entrada a la cola y el inicio de la reserva de reconexión se registrarán con tiempo de servidor. Un job periódico o evaluación al leer/escribir estado podrá materializar expiraciones de forma idempotente, usando una transición condicionada por estado y versión. El cliente solo muestra el contador; nunca decide que venció el plazo. Así se evita que relojes manipulados o pestañas dormidas alteren el resultado.

### 3. Contrato de comandos y eventos reutilizado de D6

El público usará el mismo mecanismo de identidad privada, rotación de credenciales, versionado, deduplicación, snapshot inicial y secuencia ordenada de D6. El servidor publicará estados de búsqueda y partida mediante eventos explícitos; los clientes no derivarán abandono, participantes ni puntuación de su propia vista. El timeout público será una terminación de partida con causal `abandonment`, distinta de `normal`, y no una jugada sintética ni una comparación de cuadros.

### 4. Fallback contra máquina como modalidad nueva

La acción «jugar contra la máquina» cancela primero la búsqueda confirmando su transición y luego crea una sesión de máquina totalmente nueva con la configuración disponible. No se reutiliza la partida pública ni se publica un bot en la cola. Esta separación conserva la regla de D7 y evita que una respuesta tardía de matchmaking pueda adjuntar al jugador a la partida equivocada.

### 5. Cliente como proyección accesible del estado confirmado

La UI mantendrá una única experiencia de búsqueda/partida con estados superpuestos para conectividad, texto visible y controles de al menos 44×44 CSS px. El color se acompañará de nombre, texto o icono; el resultado por abandono tendrá una causal explícita. Las animaciones y sonidos usarán únicamente assets locales y nunca bloquearán la recepción o aplicación del estado confirmado.

## Risks / Trade-offs

- [Carrera entre timeout, reconexión y nueva solicitud] → aplicar transiciones condicionadas por estado/versión en una transacción y cubrir los límites antes/después de 60 s.
- [Reinicio durante emparejamiento] → persistir búsquedas y match confirmado antes de emitir confirmación; reconciliar estados pendientes al arrancar.
- [Dos procesos intentando tomar la misma cola] → bloqueo/constraint transaccional en PostgreSQL y prueba con solicitudes concurrentes; no confiar en orden de llegada del cliente.
- [Cliente muestra un rival o resultado obsoleto] → snapshot + secuencia ordenada, versión monotónica y rechazo explícito de versión obsoleta.
- [Contador visual engaña al usuario] → tratarlo como indicador informativo y hacer que la decisión real dependa únicamente del reloj del servidor.
- [Alcance se expande hacia capacidades sociales] → conservar la lista de exclusiones en proposal/spec y rechazar requisitos que no sean trazables a D7.

## Migration Plan

1. Aplicar migraciones PostgreSQL de D7 de forma compatible con el esquema de D6, con índices/constraints para estado de búsqueda, unicidad de participante y causal de finalización.
2. Desplegar backend que entienda los estados nuevos y mantenga intactos los flujos privados existentes.
3. Habilitar la UI pública solo cuando el backend anuncie la capacidad; clientes sin la capacidad conservarán las modalidades existentes.
4. Verificar concurrencia, reinicio, reconexión y timeout en un entorno de prueba antes de cualquier despliegue autorizado.
5. Rollback: deshabilitar la entrada pública y retirar búsquedas no iniciadas; no borrar históricos de partidas D6 ni ejecutar migraciones destructivas. La publicación/merge requiere aprobación humana separada.

## Open Questions

No quedan preguntas abiertas que cambien el contrato: DEC-10 y DEC-29 resuelven la duración, el resultado por abandono, el fallback y la carrera cancelación/emparejamiento. Detalles menores de presentación pueden resolverse durante implementación sin cambiar la spec.
