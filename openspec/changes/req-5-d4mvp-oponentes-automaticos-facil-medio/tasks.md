# Tasks

## 1. Contrato del core y participantes

- [x] 1.1 Extender el modelo de participante para distinguir humano y automático, conservar dificultad/semilla del bot y verificar con pruebas de serialización y configuración válida.
- [x] 1.2 Exponer la frontera pura de decisión que recibe estado legal, dificultad y semilla, devuelve una arista candidata y no importa UI, DOM, reloj, red, persistencia o APIs de modelos; verificar con tests ejecutados en entorno sin navegador.
- [x] 1.3 Integrar la arista candidata con el comando normal del core y comprobar rechazo sin mutación para aristas inexistentes, ocupadas o fuera de turno, preservando GAME-01..10.

## 2. Políticas reproducibles

- [x] 2.1 Implementar el generador pseudoaleatorio con orden canónico de aristas y verificar que estado, dificultad y semilla idénticos producen la misma decisión.
- [x] 2.2 Implementar la política fácil con capturas inmediatas y rama probabilística reproducible del 20 %, verificando legalidad, determinismo y selección aleatoria cuando no corresponde capturar.
- [x] 2.3 Implementar la política media priorizando capturas y clasificando alternativas seguras mediante simulación efímera, verificando que evita regalar cuadros cuando existe una alternativa.
- [x] 2.4 Implementar la evaluación de cadenas de captura de la política difícil con búsqueda limitada a la cadena, memoización y desempate canónico; verificar decisiones de apertura/evitación y legalidad.

## 3. Turnos, siluetas y rendimiento

- [x] 3.1 Integrar el scheduler de bots con el turno del core, verificando capturas múltiples, conservación del turno, avance tras no capturar, estado terminal y ausencia de bucles.
- [x] 3.2 Ejecutar pruebas de regresión sobre tableros rectangulares y máscaras no rectangulares de cuadrados para las tres dificultades, verificando independencia de silueta y ausencia de API de modelos.
- [x] 3.3 Añadir y ejecutar el benchmark documentado para tableros de hasta 8×8, verificando menos de 100 ms por decisión en fácil, medio y difícil.

## 4. Configuración y experiencia local

- [x] 4.1 Añadir la configuración de un humano con uno a tres bots y dificultad por bot, verificando los límites 2–4 participantes y rechazo de configuraciones inválidas sin crear partida.
- [x] 4.2 Mostrar bots, puntos, capturas y turnos extra mediante los estados existentes de la partida local, verificando la siguiente decisión automática y la ausencia de botón de fin de turno.
- [x] 4.3 Verificar que el modo contra máquina funciona offline sin `fetch`, WebSocket, servidor ni recursos/integaciones externas, reutilizando únicamente el motor y catálogo local.

## 5. Validación del change

- [x] 5.1 Añadir escenarios automatizados Gherkin/regresión que cubran PRD-02, GAME-01..10, DEC-05/25, reproducibilidad, 20 %, límites de jugadores, siluetas y rendimiento; verificar el comando de pruebas documentado.
- [x] 5.2 Ejecutar la validación nativa compatible con la CLI OpenSpec y revisar que la implementación no añade assets, ML, APIs pagadas, servicios online ni cambios fuera del alcance; registrar la evidencia para revisión humana.
