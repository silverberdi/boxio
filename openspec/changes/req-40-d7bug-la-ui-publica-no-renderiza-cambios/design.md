# Design

## Context

La propuesta corrige un fallo de actualización visual posterior a respuestas que ya llegan al cliente. El servidor autoritativo, las rutas, el proxy y el contrato de D7 quedan fuera del cambio; la especificación delta define los estados que deben hacerse visibles y la evidencia E2E requerida.

## Goals / Non-Goals

**Goals:**

- Hacer que el modelo de vista pública se marque para renderizado cuando un callback asíncrono ya existente recibe un estado autoritativo.
- Mantener una única fuente de verdad en las respuestas/snapshots del API y WebSocket, sin duplicar estado de partida ni alterar la autoridad del servidor.
- Cubrir con pruebas el fallo reproducido y los flujos de búsqueda, partida, resultado, cancelación y desconexión en dos sesiones.
- Separar la evidencia del candidato de cualquier comprobación física del despliegue.

**Non-Goals:**

- No cambiar endpoints, payloads, eventos, persistencia PostgreSQL, matchmaking, reglas del motor ni política de reconexión.
- No añadir polling, proxy, store global, bus de eventos o servicio nuevo.
- No sustituir la prueba real por mocks de API/WebSocket ni declarar validado un despliegue que no se haya comprobado por separado.

## Decisions

### Integrar callbacks con el mecanismo nativo mínimo de Angular

Los puntos existentes que reciben `fetch`, polling y WebSocket actualizarán el modelo de vista y solicitarán la actualización de la vista mediante la integración nativa de Angular que corresponda al modo de ejecución actual. La decisión evita que un evento posterior del apodo actúe accidentalmente como disparador y evita introducir una capa de estado. Se descarta envolver el flujo en un nuevo polling o reescribir el matchmaking porque el fallo está en la frontera de renderizado, no en la entrega del estado.

### Aplicar snapshots/eventos autoritativos sin predicción adicional

La UI seguirá aplicando el estado confirmado recibido, respetando versión, turno, aristas, marcador, resultado y estados de conexión existentes. No se infiere una jugada local ni se modifica la validación del servidor; así se conserva la separación entre Angular y el motor/backend autoritativo descrita en `docs/ARCHITECTURE.md`.

### Verificar por capas y con dos sesiones reales

Las pruebas de componente/integración aislarán que cada callback provoca la actualización visible. La prueba Playwright comprobará después el flujo contra los servicios reales de prueba en dos sesiones independientes y finalizará la partida/cancelará cualquier búsqueda residual. Si el entorno de despliegue se comprueba, su evidencia se guarda como registro separado para no mezclar candidato y producción.

## Risks / Trade-offs

- **[Riesgo]** Un callback puede actualizar solo parte del modelo y dejar textos, tablero o conexión desincronizados. → **Mitigación:** cubrir cada transición y verificar conjuntamente rival, estado, aristas, turno, marcador y resultado.
- **[Riesgo]** La prueba local puede pasar mientras el proxy o los servicios reales difieren. → **Mitigación:** ejecutar Playwright contra el candidato con web/API/proxy/PostgreSQL de prueba y separar explícitamente la evidencia de despliegue.
- **[Riesgo]** Un intento de corregir el renderizado puede añadir una segunda fuente de verdad. → **Mitigación:** reutilizar snapshots/eventos existentes y limitar el cambio a la integración de detección de cambios.

## Migration Plan

1. Identificar los callbacks actuales y el punto único donde actualizan el estado de la vista pública.
2. Integrar allí el mecanismo nativo mínimo de Angular, sin cambiar contratos de red ni reglas.
3. Ejecutar pruebas focalizadas, reproducción del fallo y Playwright E2E con dos sesiones.
4. Completar la partida y cancelar/limpiar cualquier búsqueda o match residual; registrar por separado la comprobación de despliegue si existe.
5. Revertir únicamente la integración de renderizado si la evidencia falla; no ejecutar migraciones ni modificar datos productivos.

## Open Questions

No hay preguntas abiertas que cambien el contrato o el desglose; el detalle exacto del mecanismo nativo se seleccionará al aplicar el change según la versión y configuración Angular presentes.
