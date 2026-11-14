# BOXIO — Experiencia de usuario, pantallas y momentos del juego

**Estado:** estructura UX acordada; no confundir con diseño visual final, mockups o especificaciones de pixel. Los ejemplos de imagen usados durante la conversación fueron conceptuales y no activos de diseño aprobados.

## 1. Principios

- **Mobile-first y portrait-first:** la experiencia debe ser excelente en celular vertical, sin impedir horizontal en otros dispositivos.
- **Tablero protagonista:** maximizar el área útil para el juego y mantener información necesaria sin saturación.
- **Atractivo desde el MVP:** color, personalidad, animaciones breves y sonidos; no posponer la experiencia agradable para una segunda versión.
- **Inicio sencillo:** cuatro acciones claras, sin registro ni cuentas obligatorias.
- **Camino corto hasta jugar:** minimizar pasos y campos; no se aprobó un número exacto de taps.
- **Información persistente en partida:** nombre/color y puntuación de participantes, turno actual, conexión cuando aplica.
- **Accesibilidad y rendimiento:** controles táctiles legibles, interacción robusta, preferencia de movimiento reducido, alternativa visual a señales sonoras; las métricas exactas siguen pendientes de validar.
- **Offline local:** acceso a modalidades máquina/local tras tener los recursos de PWA disponibles, sin depender de llamadas de red para cada movimiento.

## 2. Mapa de navegación lógico

**UX-01: Inicio**
- Marca Boxio y cuatro opciones: «Contra la máquina», «Multijugador local», «Sala privada», «Partida pública».
- Acceso secundario a sonido/ayuda; no menús extensos, tienda ni registro.
- La ausencia de red no bloquea innecesariamente modo máquina/local. Una modalidad online debe explicar que necesita conectividad.

**UX-02: Elección de tablero**
- Elegir clásico rectangular o silueta predefinida.
- Clásico: tamaños pequeño/mediano/grande + filas y columnas personalizadas con límites UX todavía por definir.
- Siluetas: previsualización de máscara de cuadros y tamaños predefinidos, sin editor ni dimensiones personalizadas.
- Vista previa inmediata, cantidad de cuadros o expectativa cualitativa de duración si es fiable; no inventar tiempos estimados sin evidencia.

**UX-03: Preparación de partida**
- Apodos, identificación cromática legible y número de participantes de acuerdo con modalidad.
- Dificultad fácil/media/difícil cuando hay máquinas.
- Pedir solamente datos relevantes para modalidad seleccionada, no un formulario universal.

**UX-04: Sala privada**
- Presentar código/enlace compartible, número de cupos ocupados sobre 4, participantes y estado.
- Iniciar con dos participantes sin temporizador forzado; anfitrión solo puede esperar, elegir jugar contra máquina o abandonar.
- Tras iniciar, no bloquear incorporaciones tardías en cupos libres; mostrar su entrada de manera no interruptiva.

**UX-05: Emparejamiento público**
- Estado «buscando rival», opción cancelar, transición automática cuando haya dos jugadores.
- No presentar códigos de sala ni configuración de participantes de 3–4.

**UX-06: Pantalla de partida**
- El tablero debe ocupar el máximo espacio razonable.
- Marcador por color y apodo; 2, 3 o 4 jugadores según modalidad.
- Mostrar quién juega mediante texto + tratamiento visual, nunca solo color.
- Movimiento legal: al tocar/elegir una arista, se traza una línea con feedback inmediato.
- Zoom y desplazamiento mediante gestos en tableros grandes; diferenciar claramente arrastre/pinch de seleccionar arista; preservar encabezado o franja de puntuaciones/turno siempre visible.
- Acceso secundario a pausa/opciones sin tapar indebidamente el tablero.
- En online representar pérdida de conexión y reconexión como **estado superpuesto/no bloqueante cuando sea posible**, no obligar a navegar a una pantalla distinta.
- En offline evitar depender de conectividad para registrar avance de la jugada.

**UX-07: Resultados**
- Ganador(es) o empate, puntos finales, efecto celebratorio y opción de revancha/volver.
- Si público termina por abandono, el texto identifica esa causal separada de un triunfo por puntos.
- El comportamiento exacto de revancha online (mismos jugadores, sala nueva, emparejamiento nuevo) permanece abierto y no debe inventarse.

**UX-08: Ajustes mínimos**
- Sonido encendido/apagado, ayuda de reglas y acción salir/abandonar con confirmación contextual.
- Se trata de panel de ajustes o contenido contextual, **no necesariamente otra ruta/pantalla**. No multiplicar pantallas sin necesidad.

El conjunto descrito son vistas o estados funcionales; pueden implementarse reutilizando una plantilla de configuración en vez de siete pantallas técnicas independientes.

## 3. Momentos del juego (especificar en OpenSpec)

**MOM-01 — Seleccionar arista libre.** Feedback instantáneo visual y sonoro opcional. Señal de acción correcta sin animación que bloquee el siguiente movimiento.

**MOM-02 — Arista inválida/ocupada.** No alterar estado, puntos ni turno. Feedback discreto que explique la imposibilidad sin castigar al usuario.

**MOM-03 — Cerrar un cuadro.** La región adquiere color del propietario, aumenta su puntuación una unidad, pequeño efecto de conquista, indicación de que conserva turno.

**MOM-04 — Cerrar múltiples cuadros de una jugada.** Colorear todos los conquistados, sumar tantas unidades como regiones cerradas, **celebración de mayor intensidad** (partículas y sonido distintivo si están activados), conservar turno.

**MOM-05 — Encadenar turnos extra.** No generar pantallas intermedias; la interfaz mantiene jugador activo y ofrece sensación de progreso.

**MOM-06 — Cambio de turno.** Resaltar nueva persona mediante color, nombre, texto/indicador. Evitar overlays modales para cada cambio.

**MOM-07 — Jugador entra tarde a sala privada.** Mostrar nombre/color y puntuación cero, sin reemplazar la vista del tablero. Entra en rotación al finalizar el turno en curso (incluidos bonus).

**MOM-08 — Desconexión online.** Estado visible, plazo de reserva de 60 segundos y recuperación si ocurre. No ocultar el estado real ni prometer reconexión garantizada.

**MOM-09 — Final normal.** Celebrar puntuaciones finales, empate compartido válido, oportunidades de volver a jugar.

**MOM-10 — Victoria por abandono público.** Diferenciar este resultado de ganar por cuadros.

## 4. Diseño visual: dirección y límites

Dirección aprobada: moderna, viva, amistosa y con animaciones de conquista, apropiada para familias y competición casual. **No están aprobados** paleta exacta, logotipo final, tipografías, assets, escala de animación, música, vibraciones obligatorias ni esquema final de navegación. Hacer prototipo evaluable antes de tratarlos como definitivo.

La forma de tablero es una **máscara de celdas cuadradas**. Corazón, estrella, cruz o T se construyen exclusivamente con celdas cuadradas; las líneas jugables nacen de su perímetro real. Las zonas vacías fuera de la máscara no son regiones y no puntúan.

## 5. Diseño responsivo y táctil

- Asegurar separación/precisión suficiente de aristas en pantallas pequeñas. Para tableros grandes debe existir zoom/pan.
- Evitar toques accidentales durante desplazamiento y zoom; no cambiar aristas si el gesto ha sido interpretado como navegación.
- Los marcadores nunca deberían desaparecer completamente por zoom.
- Área táctil de la línea puede ser mayor que el trazo visible, sin que dos aristas resulten ambiguas; definir comportamiento de selección ambigua.
- Animaciones de conquista no pueden interferir con la legalidad de un turno siguiente.
- En equipos con preferencia de movimiento reducido simplificar animaciones; siempre mostrar estado final de conquista.
- Diseñar también teclado/ratón en escritorio, pero priorizar interacción táctil.

## 6. Criterios de aceptación de UX de alto nivel

1. Un invitado puede iniciar máquina/local sin registro.
2. La pantalla inicial ofrece las cuatro modalidades sin rutas confusas.
3. En juego se distinguen jugador activo, cuatro puntajes máximos y cuadros conquistados sin depender solo del color.
4. Se puede seleccionar una arista válida y distinguirla de una no disponible.
5. Una conquista doble suma dos y produce feedback más notable que una simple.
6. Los tableros grandes pueden explorarse sin ocultar el turno/puntajes ni generar jugadas involuntarias.
7. Una pérdida de conexión online no borra puntuación ni salta automáticamente a inicio.
8. Los resultados muestran empates y victorias por abandono con mensajes correctos.

## 7. Abiertos para diseño iterativo

Paleta, tipografía, logotipo, duración/detalles de efectos y sonidos, tamaños exactos de componentes, umbrales de zoom, reglas de cambio de orientación, número objetivo de pasos para iniciar, solución exacta de accesibilidad para aristas densas. Deben optimizarse con prototipos y pruebas, sin bloquear el arranque del motor de reglas.
