# Design

## Context

El contrato existente `openspec/specs/game-contracts/spec.md` describe las invariantes del juego, pero D1 debe convertirlas en una frontera de motor que pueda ejercitarse sin UI ni servicios. La arquitectura establece TypeScript puro y un modelo de celdas cuadradas con aristas canónicas; las dimensiones 2–8 y el máximo de 64 celdas están confirmados por DEC-22. Véase `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**

- Definir una representación serializable y determinista de tablero, participantes, aristas, celdas, puntuaciones, turno y finalización.
- Derivar aristas desde celdas mediante coordenadas enteras canónicas, deduplicando las aristas interiores y conservando las de borde.
- Hacer que una transición válida devuelva los cambios observables: arista ocupada, celdas cerradas, puntos, turno siguiente y estado terminal; los rechazos no mutan el estado.
- Compartir el algoritmo entre el rectángulo y futuras máscaras de celdas cuadradas, validando la máscara antes de jugar.
- Mantener tipos y dependencias portables para consumo futuro desde UI local y servidor autoritativo.

**Non-Goals:**

- No crear componentes Angular/SVG, interacción táctil, animaciones ni sonidos.
- No implementar bots, sesiones online, WebSocket, PostgreSQL, autenticación, reconexión ni persistencia.
- No activar el catálogo de cruz, corazón o estrella; D1 solo deja preparada la entrada de máscaras.
- No decidir detalles abiertos de siluetas, UX, rendimiento de dispositivos o infraestructura que pertenecen a otras entregas.

## Decisions

### Modelo único de celdas y aristas

Se usará un modelo lógico basado en coordenadas enteras de celda `(row, column)` y segmentos entre vértices contiguos. La identidad de una arista se normaliza ordenando sus dos extremos; así una arista compartida por dos celdas aparece una sola vez y una consulta de cierre puede obtener cero, una o dos celdas vecinas.

Alternativa descartada: almacenar cuatro copias independientes por celda. Simplifica la generación inicial, pero permite inconsistencias y duplica la arista común, contradiciendo GAME-05.

### Transiciones puras y estado inmutable para el contrato

El procesamiento recibirá un estado válido, la identidad del jugador activo y una arista solicitada, y devolverá un resultado explícito de aceptación o rechazo junto con el estado resultante. La implementación podrá compartir estructuras internamente, pero su frontera observable no dependerá de mutación externa, reloj, IO o efectos secundarios.

Alternativa descartada: exponer un objeto mutable con métodos que actualizan score y turno. Haría más difícil demostrar que los rechazos no cambian el estado y aumentaría el acoplamiento con UI/servidor.

### Validación de dimensiones y máscaras antes de iniciar

La construcción de un rectángulo validará enteros finitos en `[2, 8]` y el límite de 64 celdas. La preparación genérica de máscaras validará coordenadas, celdas cuadradas y relaciones derivadas antes de producir un tablero jugable. El catálogo definitivo y sus tamaños quedan para D5.

Alternativa descartada: aceptar cualquier número y fallar al calcular movimientos. Traslada errores de configuración a una partida activa y no hace verificable DEC-22.

### Resultado calculado desde la asignación de celdas

La puntuación será una consecuencia de la propiedad de cada celda, nunca un contador independiente que el consumidor pueda declarar. El turno conserva al jugador si el movimiento cierra al menos una celda; en caso contrario avanza por el orden de participantes. El final se determina cuando todas las celdas activas tienen propietario y el resultado incluye todos los máximos.

Alternativa descartada: recalcular el resultado solo al solicitar la pantalla final. Oculta inconsistencias durante la partida y no protege contra doble asignación.

## Risks / Trade-offs

- [Riesgo] Una normalización incompleta puede crear dos IDs para una arista común → centralizar la clave canónica y probar bordes, esquinas y cierres dobles.
- [Riesgo] Un rechazo podría mutar accidentalmente una estructura compartida → verificar igualdad del estado antes/después en pruebas de inválidos, duplicados y fuera de turno.
- [Riesgo] Preparar máscaras demasiado permisivas introduciría regiones no cuadradas → validar coordenadas y relaciones antes de exponer el tablero, sin registrar un catálogo definitivo.
- [Riesgo] El modelo de estado elegido puede limitar adaptaciones online futuras → mantenerlo serializable, sin reloj/IO y con identificadores explícitos; el servidor podrá envolverlo en una capa autoritativa posteriormente.
- [Riesgo] La cobertura puede confundir invariantes del motor con comportamiento de UI → limitar la evidencia D1 a pruebas del paquete puro y dejar pruebas visuales/online para sus changes.

## Migration Plan

No hay migración de datos ni despliegue en D1. Al aplicar el change, se añadirá el motor y sus pruebas al workspace preparado por D0; si la integración rompe el contrato existente, el rollback consiste en revertir el commit del change antes de que cualquier consumidor de UI/online lo adopte. La validación y el PR quedan sujetos a revisión humana; no se autoriza merge automático ni despliegue.

## Open Questions

No quedan preguntas abiertas que cambien esta especificación o su descomposición. El catálogo y las máscaras concretas de siluetas se mantienen deliberadamente fuera de alcance y se especificarán en D5.
