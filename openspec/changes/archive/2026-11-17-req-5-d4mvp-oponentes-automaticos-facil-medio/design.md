# Design

## Context

D1 proporciona un core puro de Puntos y Cajas con aristas y celdas cuadradas, y D2 consume ese core para el juego local. D4 debe añadir decisiones automáticas sin duplicar la transición de estado ni introducir red, reloj, persistencia o servicios de IA. Véanse `proposal.md` y las deltas de `automatic-opponents`, `game-contracts` y `local-game-ux`.

## Goals / Non-Goals

**Goals:**

- Mantener una frontera de decisión pura: estado legal + dificultad + semilla → arista candidata.
- Hacer que la misma transición del core valide y aplique jugadas humanas y automáticas.
- Proporcionar políticas diferenciadas, reproducibles y suficientemente rápidas para tableros de hasta 8×8.
- Integrar uno a tres bots con un humano en la configuración y el flujo local existente.

**Non-Goals:**

- No crear un agente de lenguaje, ML, inferencia remota, API pagada ni servicio backend.
- No cambiar reglas de puntuación, cierre, turnos extra, fin, empates o topología de siluetas.
- No implementar online, persistencia de partidas, nuevos assets ni una nueva modalidad social.

## Decisions

### 1. Una única frontera pura de decisión

Cada dificultad se implementará como una política que recibe una vista inmutable/serializable del estado y un generador pseudoaleatorio derivado de la semilla. Devuelve una arista del conjunto legal; el core vuelve a validar la arista y es la única autoridad para aplicar efectos.

Se elige esta frontera sobre callbacks de UI o un servicio separado porque conserva el aislamiento de D1, permite pruebas sin navegador y evita que un bot pueda saltarse GAME-01..10. El estado del generador se consumirá solo dentro de la decisión y no se obtendrá del reloj.

### 2. Políticas deterministas por dificultad

- **Fácil:** calcula capturas inmediatas y usa la siguiente muestra del generador para una decisión de captura con probabilidad 20 %; si no activa esa rama, selecciona de forma pseudoaleatoria entre todas las aristas legales. El orden canónico de aristas y un desempate por índice estabilizan el resultado.
- **Medio:** prioriza capturas inmediatas. Si no existen, simula cada arista legal sobre una copia efímera y clasifica como segura la que no deja una captura inmediata al siguiente participante; selecciona una segura, o la mejor alternativa legal disponible si no existe ninguna.
- **Difícil:** explora con DFS y memoización las continuaciones de captura que el jugador puede encadenar, tratando el cierre como permanencia de turno y la no captura como cambio de turno. Ordena candidatos de forma canónica y usa el número esperado de cuadros y la exposición inmediata como función de evaluación. La búsqueda se limita a la cadena de captura alcanzable, no a una partida completa.

Se eligen simulación local y búsqueda acotada sobre minimax completo porque expresan las reglas observables con menos complejidad y mantienen el objetivo de 100 ms. Si el benchmark del entorno documentado detecta un caso fuera del límite, se optimizarán representación, memoización u ordenación dentro del mismo contrato; no se degradará silenciosamente a una política distinta.

### 3. Integración por participante y scheduler local

El participante tendrá una identidad de tipo humano o automático y, para el segundo, una dificultad y estado de semilla. El scheduler local solo invocará la política cuando el participante automático sea el jugador activo; aplicará el resultado mediante el comando normal del core y repetirá únicamente mientras el core conserve legalmente el turno. El estado terminal detiene el scheduler.

Esto evita bucles de UI y hace explícito que un turno extra es una transición del motor, no una excepción del bot. La configuración validará un humano y entre uno y tres bots antes de construir la partida.

### 4. Compatibilidad de siluetas y assets

La política consultará las aristas/celdas ya derivadas por el core, no coordenadas rectangulares asumidas. Así, una máscara válida de cuadrados usa el mismo camino que un tablero rectangular. No se añade ningún recurso visual o sonoro: los marcadores y feedback existentes de D2 representan también a los bots.

## Risks / Trade-offs

- [Riesgo] La evaluación difícil puede crecer con el número de aristas libres. → Limitar la exploración a cadenas de captura, memoizar estados equivalentes y medir cada dificultad en el benchmark de 8×8.
- [Riesgo] Un orden de aristas accidentalmente dependiente de la colección puede romper reproducibilidad. → Derivar y ordenar candidatos con el identificador canónico del core antes de cualquier desempate.
- [Riesgo] Una política podría producir una arista obsoleta si el estado cambia entre cálculo y aplicación. → Ejecutar la decisión sobre el turno actual y pasarla siempre por la validación normal; rechazar sin mutación si ya no es legal.
- [Riesgo] El flujo local podría mostrar la UI antes de que termine una cadena automática. → Mantener el scheduler como transición controlada por estado terminal/turno y probar capturas múltiples sin recursión no acotada.

## Migration Plan

No hay migración de datos ni cambios de red. Se añaden tipos de participante y políticas al core, se habilita la configuración contra máquina en la ruta local y se conserva la ruta humana existente. El rollback consiste en retirar el acceso a la configuración de máquina y revertir el cambio; los estados locales previos siguen siendo interpretables porque el contrato humano no cambia.
