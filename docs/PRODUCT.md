# BOXIO — Contexto de negocio y especificación de producto

**Fecha de corte:** 2026-11-14  
**Estado:** baseline de contexto para formalización en OpenSpec, no especificaciones de implementación aprobadas.

## 1. Intención de negocio

Convertir el juego tradicional *Puntos y Cajas* en una experiencia digital social, accesible, visualmente atractiva y fácil de aprender, disponible desde navegadores y PWA, y susceptible de evolución a tiendas móviles sin rehacer su base técnica.

Boxio debe recuperar la emoción de completar cuadrados, robar oportunidades, desencadenar conquistas y competir con amigos o desconocidos. El nombre comercial acordado es **Boxio** (nombre anterior de trabajo: Cuadrito). El eslogan candidato «Connect. Capture. Conquer.» no es una decisión de marca aprobada; registro, dominios y tiendas están pendientes de verificación.

La estrategia de negocio del MVP es **validar jugabilidad, atractivo visual, estabilidad y dinámica social**, no monetizar prematuramente. No se ha aprobado un modelo de ingresos, publicidad, suscripciones ni compras integradas.

## 2. Usuarios y contexto

- Personas que conocen Puntos y Cajas o desean aprenderlo sin instrucciones complejas.
- Amigos/familia compartiendo un dispositivo o jugando a distancia por invitación.
- Jugadores casuales que buscan rivales mediante emparejamiento público.
- Usuarios móviles con orientación vertical como experiencia principal; también escritorio y tablet.
- Personas sin interés en crear cuenta: en MVP solo hay jugadores invitados.

## 3. Propuesta de valor

- Reglas familiares con presentación moderna y celebraciones satisfactorias.
- Diversidad de tamaños para partidas cortas o prolongadas (importante hasta 4 jugadores).
- Siluetas divertidas formadas por cuadrados sin cambiar las reglas.
- Cuatro maneras de jugar sin registro.
- Entrada flexible a partidas privadas ya iniciadas.
- Posibilidad de jugar offline localmente una vez que la PWA esté instalada/cargada con los recursos necesarios.

## 4. Alcance MVP — requisitos de alto nivel

| ID | Capacidad | Alcance |
|---|---|---|
| PRD-01 | Reglas universales | Seleccionar aristas, cerrar cuadrados, puntuar, conceder turnos adicionales, acabar y resolver empates |
| PRD-02 | Contra máquina | 2–4 participantes totales, un humano y oponentes automáticos; dificultad fácil/media/difícil |
| PRD-03 | Local | 2–4 personas en el mismo dispositivo; sin conexión tras cargar recursos |
| PRD-04 | Privado online | Enlace/código, máximo 4 personas, inicio con al menos 2; ingresos tardíos en cupos disponibles |
| PRD-05 | Público online | Emparejamiento automático fijo 1 vs 1 |
| PRD-06 | Invitados | Apodos e identidad temporal suficiente para turnos y reconexión |
| PRD-07 | Tablero clásico | Rectangular de celdas cuadradas, tamaños predefinidos y dimensiones personalizadas filas × columnas |
| PRD-08 | Tableros de siluetas | Figuras de celdas cuadradas con tamaños predefinidos, sin editor |
| PRD-09 | Interfaz | Mobile-first, orientación vertical, accesible, atractiva y rápida |
| PRD-10 | Celebración | Animación y sonido por conquista, mayor intensidad ante conquistas múltiples |
| PRD-11 | PWA | Instalación cuando disponible, recursos locales para modo offline, adaptación futura a tiendas |
| PRD-12 | Estados de conexión | Reconexión de 60 segundos, estados visibles y reglas diferenciadas privado/público |

Estos IDs son **referencias de trazabilidad**, no sustituyen especificaciones OpenSpec completas.

## 5. Modalidades

### 5.1 Máquina
Un jugador humano puede enfrentarse a rivales automáticos en partidas de 2 a 4 participantes totales. No requiere IA generativa ni API de modelos. Tres niveles:
- **Fácil:** predominantemente aleatorio, algunas conquistas oportunistas.
- **Medio:** aprovecha cierres inmediatos y trata de evitar regalar cuadros; heurísticas básicas.
- **Difícil:** reconoce cadenas y optimiza secuencias; estrategias avanzadas.

Las tres dificultades deben funcionar en todas las siluetas admitidas. Los algoritmos exactos, su evaluación y sus límites de tiempo se precisarán en una entrega de diseño sin cambiar este contrato.

### 5.2 Local
De 2 a 4 personas juegan por turnos en un mismo dispositivo. Es accesible offline tras disponer de los recursos requeridos. La interfaz muestra con claridad quién debe jugar.

### 5.3 Sala privada online
Hasta 4 participantes, con acceso por enlace o código. No se obliga a completar todos los cupos ni a esperar un temporizador de arranque. Dos jugadores pueden iniciar; posteriormente pueden ingresar otros hasta llenar cupos. Los entrantes parten de cero y no alteran regiones previas. El anfitrión sin acompañantes puede esperar, iniciar contra máquina o salir. Ver reglas de ocupación, turnos y abandono en GAMEPLAY.

### 5.4 Pública online
Partidas competitivas fijas de dos participantes, emparejamiento automático sin código ni invitación. Comienzan cuando ambos están conectados. No se incorpora un tercero ni se sustituye al ausente. Si un jugador supera 60 segundos desconectado, pierde por abandono. No confundir con las salas privadas.

## 6. Tableros: definición visual correcta

La **celda elemental siempre es un cuadrado**. Distintas siluetas son conjuntos de esas celdas. Prohibida la interpretación de «geométricos» como triángulos, hexágonos u otras regiones de distinto número de lados.

- **Clásico:** rectangular (incluye cuadrado), opciones pequeño/mediano/grande, personalización independiente de filas y columnas (p. ej. 8×12, sin forzar proporción); límites mínimos y máximos aún por fijar y validar en móviles.
- **Especiales:** biblioteca propuesta de corazón, estrella simple, cruz y T, cada una compuesta solo por cuadrados. Tamaños predefinidos pequeño/mediano/grande y eventualmente muy grande según legibilidad. No dimensiones arbitrarias ni editor. Estas cuatro siluetas son **candidatas de alcance flexible**, no compromiso irrevocable: si una retrasa el MVP o requiere reglas especiales, se difiere.
- La cantidad de jugadores NO reconfigura ni expande el tablero después del comienzo.
- Cada tablero admitido debe ser jugable contra máquina, local, privado y público.
- Zoom/desplazamiento táctil para tableros grandes, sin ocultar el estado de turnos y puntuaciones.

## 7. Fuera del MVP

Registro y perfiles persistentes, historial de partidas de cuenta, clasificación global, chat, tienda, compras, publicidad, cosméticos complejos, editor de siluetas, multijugador público 3–4 y port nativo con lanzamiento en tiendas. **No añadirlos por iniciativa de agentes.**

## 8. Segunda iteración — dirección, no especificación cerrada

Mantener invitados y agregar registro/inicio de sesión **opcionales**, perfiles e historial persistente. Evaluar publicación Android/iOS mediante Capacitor sobre la base Angular, funcionalidades nativas cuando aporten valor, y posibles modos públicos ampliados. Priorizar según evidencia de uso del MVP; la segunda iteración no es una condición para publicar la primera.

## 9. Criterios de éxito del MVP

Criterios cualitativos aprobados: jugador puede iniciar partida sin registro, reglas correctas, experiencia agradable en móvil, modalidades completas, partidas online coherentes, recuperación razonable ante desconexión y experiencia offline local. No se han fijado métricas cuantitativas de adopción, latencia, concurrencia, rendimiento ni retención; deben proponerse con evidencia y validarse antes de convertirse en contrato.

## 10. Salvaguarda de alcance

La prioridad de negocio es **entregar un MVP real, no un MVP eterno**. Toda opción que multiplique estados, tecnologías o dependencias debe justificar valor observable. Las siluetas especiales son contenido parametrizado; no debe existir un motor distinto por silueta.
