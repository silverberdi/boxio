# BOXIO — Contrato funcional del juego y sesiones

**Interpretación normativa:** reglas confirmadas salvo donde se señala explícitamente «por precisar». Los IDs sirven para trazabilidad en OpenSpec.

## 1. Modelo abstracto

- **Vértice:** punto de intersección de la cuadrícula.
- **Arista:** segmento entre vértices contiguos que delimita uno o dos cuadrados presentes en la silueta.
- **Región/celda/cuadro:** SIEMPRE un cuadrado unitario (o escalado visualmente), delimitado por exactamente cuatro aristas. Una silueta puede omitir cuadrados.
- **Tablero:** conjunto finito de cuadrados activos, vértices y aristas únicos derivadas de sus límites; con identificadores estables. No se dibujan ni reclaman regiones inexistentes de la máscara.
- **Movimiento:** reivindicar una arista aún libre.
- **Jugador:** identidad de participación, apodo, color, orden de turno, puntos y estado de conexión.
- **Estado de partida:** tablero canónico, aristas tomadas, propietarios de celdas, participantes, turno, estado terminal y secuencia/versionado de acciones.

La geometría/máscara del tablero no altera la regla básica de cierre. Las máscaras MVP deben ser conexas y estar formadas por celdas cuadradas; validar su topología antes de activarlas.

## 2. Invariantes (GAME-01 a GAME-10)

**GAME-01** Solo se puede ocupar una arista existente y libre. Un intento sobre arista inexistente/ya tomada/no autorizado no modifica estado ni consume turno.

**GAME-02** Una arista ocupada no se libera durante la partida; el dueño visual de la línea no sustituye al dueño de cada cuadro.

**GAME-03** Un cuadrado se considera conquistado cuando sus cuatro aristas están ocupadas; se asigna al jugador que acaba de cerrar la última arista.

**GAME-04** Cada cuadrado conquistado aporta **exactamente un punto** a su propietario, independientemente de tamaño de tablero, silueta o número de cuadrados cerrados en el movimiento.

**GAME-05** Una arista compartida puede completar más de un cuadrado; se asignan y puntúan **todos** los cuadrados cerrados por ese movimiento, una sola vez cada uno.

**GAME-06** Si un movimiento conquista uno o más cuadrados, el mismo jugador conserva el turno; si no conquista ninguno, el turno avanza al siguiente participante elegible.

**GAME-07** Una conquista adicional puede producir una cadena de turnos extra sin límite arbitrario.

**GAME-08** Finaliza cuando todos los cuadrados activos están asignados; la cantidad total de puntos coincide con el número total de cuadrados activos.

**GAME-09** Gana(n) el/los participante(s) con la mayor cantidad de cuadros; se permiten empates y victoria compartida en una partida completada de manera normal.

**GAME-10** Los tableros de distinta silueta usan el mismo algoritmo de detección, score y cambio de turno.

## 3. Ejemplos de aceptación

### Cierre simple
Dado un cuadrado activo con tres aristas ocupadas, cuando el jugador actual ocupa la cuarta arista libre, entonces el cuadrado pasa a su propiedad, suma un punto y conserva el turno.

### Cierre doble
Dados dos cuadrados adyacentes cuyas únicas aristas abiertas coinciden en una arista compartida, cuando el jugador actual la ocupa, entonces adquiere ambos cuadrados, suma 2 puntos y conserva el turno.

### Jugada sin cierre
Cuando un jugador ocupa una arista válida sin cerrar ningún cuadrado, entonces el estado de esa arista se guarda y el turno pasa al siguiente elegible.

### Jugada inválida
Cuando se intenta ocupar una arista ya ocupada o que no forma parte de la máscara, entonces no cambian puntuación, turno ni estado de tablero.

### Victoria compartida
Cuando se reclama el último cuadrado y dos o más jugadores comparten la puntuación máxima, entonces el resultado refleja todos los ganadores sin desempate inventado.

### Consistencia
Para cualquier estado legal, puntos acumulados = cantidad de cuadrados asignados y ningún cuadrado tiene más de un propietario.

## 4. Inicio y jugadores

- **Máquina:** entre 2 y 4 participantes en total; un humano y uno a tres rivales automáticos.
- **Local:** 2–4 humanos en un dispositivo.
- **Privado online:** anfitrión crea sala y comparte código/enlace; máximo cuatro plazas. Con dos participantes puede empezar, sin cuenta regresiva obligatoria ni exigencia de completar cupos.
- **Público:** rival desconocido, exactamente dos participantes fijados desde el inicio.
- La partida toma una instantánea del tablero y tamaño elegidos al comenzar; la máscara no cambia con abandonos o ingresos.

## 5. Privado online — ingresos tardíos

**PRIV-01** Puede entrar un tercero o cuarto una vez iniciada la partida si hay cupo.

**PRIV-02** El nuevo participante comienza con cero puntos; propietarios y puntajes preexistentes permanecen intactos.

**PRIV-03** El nuevo participante entra en el orden de turnos **una vez terminado el turno actual**; no interrumpe movimiento ni animación ni cambia el jugador activo.

**PRIV-04** Si el jugador actual encadena turnos extra, el ingreso espera la conclusión efectiva de ese turno extendido; el mecanismo de reordenamiento exacto debe implementarse determinísticamente y probarse con 2→3 y 3→4 participantes.

**PRIV-05** Con cuatro cupos ocupados, se rechazan ingresos adicionales.

**PRIV-06** No hay temporizador obligatorio para esperar invitados antes de comenzar.

**PRIV-07** Si solo está el anfitrión, puede continuar esperando o salir y empezar una partida nueva contra la máquina. La nueva partida no reutiliza ni transforma la sala privada; no transfiere su estado. Si sale el último participante, se cierra la sala (DEC-34).

## 6. Desconexión, abandono y reconexión

**CONN-01** Cuando un participante online pierde conexión, se reserva su puesto por **60 segundos** para intentar reconectar a la misma identidad de participación.

**CONN-02** La reconexión oportuna conserva sus cuadros, puntuación y participación. Requiere credencial privada distinta al código/link de invitación; este no autentica. La credencial solo recupera la identidad desde el mismo dispositivo, rota tras reconexión y deja de ser válida al vencer la reserva. No incluir secretos en URL ni logs.

**CONN-03 (privado)** Al vencer 60 segundos sin regresar, se pasa el turno pendiente y el cupo se libera. Otra persona puede ocupar un cupo libre; entra con **cero puntos**, sin heredar identidad ni puntuación del ausente. Las celdas ya conquistadas siguen asignadas históricamente al anterior jugador; el tablero no se resetea. El participante retirado sigue contando en el resultado final y puede ganar por sus cuadros históricos. Si regresa tras vencer la reserva, entra como participante nuevo solo si hay cupo.

**CONN-04 (privado)** El ingreso de reemplazo no altera el turno en curso ni una cadena de turnos extra; se suma a la rotación una vez terminada. Si el anfitrión se desconecta o abandona, la sala continúa para los demás; no hay transferencia de anfitrión que altere la partida.

**CONN-05 (público)** Al vencer 60 segundos sin reconexión, la partida finaliza por **abandono** y el rival presente gana por abandono. Esta causal no equivale a victoria normal por cantidad de cuadros.

**CONN-06** En público no se admite reemplazo ni un tercer participante.

**CONN-07** En privado, la reserva comienza cuando el servidor detecta la desconexión; al vencer, se pasa el turno pendiente, incluso si era turno extra. La sala continúa si queda alguien conectado y se cierra cuando no queda ningún participante. Los puntos/cuadros históricos del retirado permanecen visibles y cuentan para el resultado final.

**CONN-08** Después de reiniciar el backend, restaurar cada sesión desde el último movimiento confirmado en PostgreSQL. No se promete SLA de disponibilidad para el MVP. Borrar sesiones terminadas tras 24 horas.

**CONN-09 (público)** Si la búsqueda pública lleva 60 segundos sin rival, ofrecer jugar contra la máquina en una partida nueva, seguir buscando o cancelar. Elegir máquina cancela la búsqueda y no coloca el bot en la cola pública.

**CONN-10 (público)** Cancelación y emparejamiento son una transición atómica según el orden de confirmación del servidor. Si confirma la cancelación primero, la búsqueda no puede emparejarse después; si confirma el match primero, se muestra la partida encontrada y ya no se cancela esa búsqueda.

## 7. Estados mínimos de sesión

Estados conceptuales para concretar luego en specs: sala en espera, preparando/iniciando, partida activa, jugador temporalmente desconectado (atributo de participación), partida terminada normal, terminada por abandono (público), cancelada. Definir explícitamente quién puede disparar cada transición y qué ocurre en reintentos/duplicados.

## 8. Idempotencia y justicia online

- El servidor valida: pertenencia a sesión, turno, arista libre y versión/orden de comando.
- Un movimiento se aplica como máximo una vez; reconexión y retransmisión no duplican puntos.
- El estado enviado a otros participantes deriva de una fuente autoritativa, no de puntuación declarada por el cliente.
- El protocolo debe ser tolerante a pérdida/duplicidad/reordenación de mensajes; no depende de que el cliente «se porte bien».
- No permitir a un cliente adjudicar arbitrariamente cuadrados, cambiar tablero o simular turnos de otros.
- La partida local debe reproducir los mismos resultados del motor compartido a partir de la misma secuencia válida.

## 9. Riesgos que requieren contratos específicos

- Un jugador se desconecta mientras tiene turno extra y otro entra.
- Dos jugadores intentan ocupar simultáneamente la última plaza privada.
- Dos clientes remiten la misma arista casi a la vez.
- Cliente se reconecta al vencerse los 60 segundos.
- Uno de los jugadores abandona justo al completarse el último cuadro.
- Una sesión privada llega a 0 o 1 jugador activo.
- Un jugador retirado conserva propiedad histórica y puede haber ganado por puntos: definir elegibilidad al resultado final sin alterar el historial.

Estos son casos para decidir/verificar antes de entregar el cambio correspondiente, no permiso para añadir nuevos modos.
