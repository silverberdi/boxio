# Tasks

## 1. Delimitar el fallo y los callbacks existentes

- [x] 1.1 Inventariar los callbacks actuales de respuesta REST, polling y WebSocket de la modalidad pública y documentar qué estado de vista actualiza cada uno; verificar que no se cambian rutas, payloads, eventos ni reglas de D7. (Spec: Public UI preserves the existing D7 contracts)
- [x] 1.2 Preparar la prueba de reproducción del fallo con respuestas `201`, snapshot inicial y cambios de versión, registrando que editar el apodo deja de ser un requisito una vez corregida la integración. (Spec: Public UI preserves the existing D7 contracts)

## 2. Integrar la actualización visual mínima

- [x] 2.1 Integrar los callbacks existentes con el mecanismo nativo mínimo de Angular para que la vista pública se actualice al recibir búsqueda, emparejamiento, conexión, tablero, turno, aristas, marcador, resultado, cancelación y desconexión; verificar con pruebas de componente/integración que cada transición es visible sin un segundo evento Angular. (Spec: Public UI renders every authoritative asynchronous state immediately)
- [x] 2.2 Mantener los snapshots/eventos autoritativos como única fuente de verdad y evitar polling, proxy, store global, bus de eventos o predicción de jugadas nuevos; verificar mediante revisión de diff y pruebas que permanecen intactos los contratos REST/WebSocket y la autoridad D7. (Spec: Public UI preserves the existing D7 contracts)

## 3. Pruebas de estados y contratos

- [x] 3.1 Cubrir búsqueda iniciada, emparejamiento, conexión, tablero/turno, jugada propagada, marcador, resultado, cancelación y desconexión en la suite adecuada; verificar mensajes y controles visibles sin escritura, toque adicional, recarga ni interacción de compensación. (Spec: Public UI renders every authoritative asynchronous state immediately)
- [x] 3.2 Añadir una prueba negativa de regresión que no dispare edición del apodo ni otro evento artificial después de recibir el estado; verificar que la UI ya muestra rival, conexión, tablero y aristas. (Spec: Public UI preserves the existing D7 contracts)
- [x] 3.3 Verificar que las pruebas de contrato existentes de rutas, identidad, persistencia, turnos, duplicidad, versión, puntuación, finalización y matchmaking 1v1 siguen pasando; verificar que no se introducen migraciones ni cambios de servidor. (Spec: Public UI preserves the existing D7 contracts)

## 4. Verificación del candidato y E2E

- [x] 4.1 Preparar el candidato con los servicios reales de prueba disponibles (web, Fastify autoritativo en proceso y navegador cuando apliquen) y ejecutar pruebas en dos sesiones independientes; verificar búsqueda, emparejamiento, conexión, jugadas, turno, marcador y resultado sin mocks de API/WebSocket. (Spec: Public UI behavior is verified with real test services and cleanup)
- [x] 4.2 Cubrir en la misma ejecución cancelación y cierre/desconexión WebSocket, verificando que ambas vistas dejan de mostrar estado obsoleto y que no queda un match activo. (Spec: Public UI behavior is verified with real test services and cleanup)
- [x] 4.3 Ejecutar la validación oficial del change con la CLI OpenSpec instalada previa al PR, verificar que los artefactos no declaran pruebas ni despliegues no ejecutados, y registrar cualquier comprobación física del despliegue en evidencia separada. (Spec: Public UI behavior is verified with real test services and cleanup)
