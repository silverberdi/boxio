# Spec Delta

## Purpose

Define el comportamiento transversal de las celebraciones, preferencias accesibles y resultados que debe percibirse de forma consistente en las cuatro modalidades del MVP.

## ADDED Requirements

### Requirement: Celebration is non-blocking and reflects capture count
La interfaz SHALL mostrar una celebración visual breve por cada conquista y una variante reforzada que refleje el número de cuadrados cerrados por una jugada múltiple, sin bloquear la recepción o presentación del siguiente estado de turno. El sonido SHALL ser opcional y nunca la única señal.

#### Scenario: Multiple capture celebration is non-blocking
- **WHEN** una jugada confirmada cierra N cuadrados, donde N es mayor que uno
- **THEN** la celebración identifica visualmente la conquista múltiple y el siguiente turno puede presentarse sin esperar una interacción o pantalla modal

#### Scenario: Single capture uses the normal celebration
- **WHEN** una jugada confirmada cierra exactamente un cuadrado
- **THEN** se muestra la celebración normal, se actualiza el resultado del movimiento y no se altera la regla de turno extra

### Requirement: Audio and reduced-motion preferences are respected
La interfaz SHALL conservar una preferencia de sonido activado/apagado y una preferencia de movimiento reducido. Con sonido apagado no SHALL emitir efectos de audio por movimientos o conquistas. Con movimiento reducido SHALL mostrar directamente el estado final y una transición no intensa, sin partículas ni animación prolongada.

#### Scenario: Muted movement emits no audio
- **WHEN** el usuario tiene el mute activado y ocurre un movimiento o conquista
- **THEN** no se solicita ni reproduce ningún efecto de audio

#### Scenario: Reduced motion skips intense capture animation
- **WHEN** la preferencia de movimiento reducido está activa y se cierra un cuadrado
- **THEN** el cuadro aparece en su estado final con señal visual no intensa y sin animación prolongada

### Requirement: Results state identifies cause and starts fresh
La pantalla de resultados SHALL distinguir final normal, empate y victoria por abandono público, mostrar puntuaciones y ganadores aplicables, y ofrecer continuar hacia el inicio. Continuar SHALL crear una configuración/estado nuevo y no SHALL iniciar una revancha automática.

#### Scenario: Normal result returns to home
- **WHEN** una partida termina porque se asignaron todos los cuadrados y existe un ganador único
- **THEN** el resultado identifica la victoria normal y continuar vuelve al inicio sin reutilizar el estado terminado

#### Scenario: Tie result lists shared winners
- **WHEN** una partida completada termina con la máxima puntuación compartida
- **THEN** el resultado identifica el empate, lista a todos los ganadores y continuar crea una partida nueva solo tras una nueva configuración

#### Scenario: Abandonment result identifies its cause
- **WHEN** una partida pública termina al vencer la reserva de reconexión de 60 segundos
- **THEN** el resultado identifica explícitamente la victoria por abandono, separada de una victoria por puntos
