# Proposal

## Why

Boxio ya dispone del contrato de juego y de la experiencia local, pero todavía no ofrece el modo contra máquina previsto por PRD-02. D4 incorpora rivales automáticos deterministas para que una persona pueda jugar sola con tres niveles de dificultad, sin red, ML ni servicios externos, manteniendo las invariantes de GAME-01..10.

## What Changes

- Añadir partidas de 2–4 participantes totales con un humano y de uno a tres bots, configurables junto con la modalidad local.
- Añadir una API de decisión pura para bots fácil, medio y difícil, operando sobre el estado legal del core y reproduciendo sus decisiones con una semilla.
- Definir el comportamiento observable de cada dificultad: azar con captura inmediata probabilística del 20 % en fácil, capturas y prevención de regalos en medio, y evaluación de cadenas de captura en difícil.
- Garantizar que toda elección sea una arista existente y libre, que las capturas conserven el turno y que los turnos extra no creen bucles ni rompan el fin de partida.
- Mantener compatibilidad con tableros rectangulares de hasta 8×8 y máscaras no rectangulares formadas por cuadrados, con objetivo documentado de menos de 100 ms por decisión.
- Añadir pruebas automatizadas deterministas, de invariantes, siluetas y rendimiento; la validación física de UI/despliegue queda fuera de este change.
- No añadir ML, APIs pagadas o generativas, red, servicios nuevos, assets externos, chat, rankings, tiendas, perfiles ni registro obligatorio.

## Capabilities

### New Capabilities

- `automatic-opponents`: contratos y decisiones reproducibles de bots fácil, medio y difícil para partidas contra máquina.

### Modified Capabilities

- `game-contracts`: extender el contrato del core para representar participantes automáticos y una frontera de decisión pura, legal y determinista sin alterar GAME-01..10.
- `local-game-ux`: permitir configurar y jugar partidas locales con un humano y de uno a tres bots, mostrando correctamente turnos extra y estados de la partida.

## Impact

- Core de juego y sus tipos/servicios de decisión, sin dependencia de UI, DOM, reloj, red, persistencia o APIs de modelos.
- Configuración y flujo de partida local/PWA ya existente, reutilizando el motor y los assets locales; no se modifica el catálogo de assets.
- Pruebas unitarias y de integración del core, escenarios Gherkin/regresión y benchmark documentado para tableros de hasta 8×8.
- Dependencias de producto: D1 (motor, Request #2) y D2 (juego local, Request #3), ambas archivadas antes de este change.
- Trazabilidad: PRD-02, GAME-01..10, DEC-05 y DEC-25. Las decisiones OPEN no se cierran unilateralmente; cualquier comportamiento no descrito aquí deberá escalarse antes de implementación.
