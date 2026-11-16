# BOXIO — Contexto de negocio y especificación de producto

**Fecha de corte:** 2026-11-15
**Estado:** baseline de contexto para formalización en OpenSpec, no especificaciones de implementación aprobadas.

## 1. Intención de negocio

Convertir el juego tradicional *Puntos y Cajas* en una experiencia digital social, accesible, visualmente atractiva y fácil de aprender, disponible desde navegadores y PWA, y susceptible de evolución a tiendas móviles sin rehacer su base técnica.

Boxio debe recuperar la emoción de completar cuadrados, robar oportunidades, desencadenar conquistas y competir con amigos o desconocidos. El nombre comercial acordado es **Boxio** (nombre anterior de trabajo: Cuadrito). El eslogan candidato «Connect. Capture. Conquer.» no es una decisión de marca aprobada; registro, dominios y tiendas están pendientes de verificación.

La estrategia de negocio del MVP es **validar jugabilidad, atractivo visual, estabilidad y dinámica social**, no monetizar prematuramente. No se ha aprobado un modelo de ingresos, publicidad, suscripciones ni compras integradas.

## 2. Usuarios y contexto

- Personas que conocen Puntos y Cajas o desean aprenderlo sin instrucciones complejas.
- Amigos/familia compartiendo un dispositivo o jugando a distancia por invitación.
- Jugadores casuales que buscan rivales mediante emparejamiento público.
- Público familiar; edad objetivo de producto desde los 6 años para el MVP. No equivale a una clasificación legal o de tienda.
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
- **Fácil:** elige movimientos legales al azar y toma una captura inmediata en el 20 % de las ocasiones en que haya una disponible.
- **Medio:** toma capturas inmediatas y evita regalar cuadros cuando exista una alternativa segura.
- **Difícil:** además reconoce cadenas de capturas y elige abrirlas o evitarlas según el resultado esperado.

Los tres niveles son reproducibles con semilla y deben decidir en menos de 100 ms incluso en un tablero clásico de 8×8. Deben funcionar en todas las siluetas admitidas.

### 5.2 Local
De 2 a 4 personas juegan por turnos en un mismo dispositivo. Es accesible offline tras disponer de los recursos requeridos. La interfaz muestra con claridad quién debe jugar.

### 5.3 Sala privada online
Hasta 4 participantes, con acceso por enlace o código. No se obliga a completar todos los cupos ni a esperar un temporizador de arranque. Dos jugadores pueden iniciar; posteriormente pueden ingresar otros hasta llenar cupos. Los entrantes parten de cero y no alteran regiones previas. El anfitrión sin acompañantes puede esperar o salir y empezar una partida nueva contra la máquina; la sala privada no se convierte ni transfiere estado. Si sale el último participante, se cierra la sala (DEC-34). Ver reglas de ocupación, turnos y abandono en GAMEPLAY.

### 5.4 Pública online
Partidas competitivas fijas de dos participantes, emparejamiento automático sin código ni invitación. Comienzan cuando ambos están conectados. No se incorpora un tercero ni se sustituye al ausente. Si un jugador supera 60 segundos desconectado, pierde por abandono. No confundir con las salas privadas.

## 6. Tableros: definición visual correcta

La **celda elemental siempre es un cuadrado**. Distintas siluetas son conjuntos de esas celdas. Prohibida la interpretación de «geométricos» como triángulos, hexágonos u otras regiones de distinto número de lados.

- **Clásico:** rectangular (incluye cuadrado), opciones pequeño/mediano/grande, dimensiones independientes enteras entre 2 y 8 filas y entre 2 y 8 columnas, sin forzar proporción. El máximo es 64 celdas.
- **Especiales:** cruz, corazón y estrella simple, todas compuestas solo por cuadrados, con tamaños predefinidos pequeño/mediano/grande. No incluir T, editor libre ni tamaño muy grande en el MVP.
- La cantidad de jugadores NO reconfigura ni expande el tablero después del comienzo.
- Cada tablero admitido debe ser jugable contra máquina, local, privado y público.
- Zoom/desplazamiento táctil para tableros grandes, sin ocultar el estado de turnos y puntuaciones.

## 7. Fuera del MVP

Registro y perfiles persistentes, historial de partidas de cuenta, clasificación global, chat, tienda, compras, publicidad, cosméticos complejos, editor de siluetas, multijugador público 3–4 y port nativo con lanzamiento en tiendas. **No añadirlos por iniciativa de agentes.**

## 8. Segunda iteración — acuerdos para retomar, aún no especificación de implementación

Estos acuerdos preservan lo decidido y evitan volver a inventar el alcance. No autorizan implementación de la segunda iteración.

- **Cuentas:** evaluar registro e inicio de sesión opcionales, perfiles e historial persistente. El MVP se mantiene sin cuentas.
- **Tiendas móviles:** después del MVP, evaluar un port Android/iOS con Capacitor y publicación en tiendas sobre la base Angular. La PWA del MVP no incluye Capacitor, firma ni publicación en tiendas. El port requerirá adaptar y probar APIs nativas, resolver firma y políticas de tienda, y someterse a revisión; no se promete cero cambios ni aprobación automática.
- **Privacidad y edad:** el MVP se orienta a público familiar desde los 6 años, no solicita edad ni datos personales, y no incluye cuentas, chat, mensajes privados, anuncios ni seguimiento publicitario. Antes de la versión pública/comercial se revisarán la política de privacidad, el público/edad y la clasificación aplicable según los mercados elegidos; la edad objetivo del producto no es una clasificación legal.
- **Identidad de marca:** el MVP usa los recursos visuales ya presentes en el repositorio y no usa el eslogan candidato. Antes de una publicación comercial se revisarán marca registrada, dominios e identidad final.
- **Ampliaciones:** considerar modos sociales/públicos adicionales y cambios basados en evidencia de uso del MVP. No se comprometen cuentas obligatorias, chat, rankings, monetización ni otros servicios.

### Validaciones posteriores al despliegue del MVP

No son funcionalidades de la segunda iteración ni tareas que mini me pueda certificar sin un despliegue y personas/dispositivos reales:

- La validación manual en teléfono, tablet y escritorio se hará con el candidato desplegado y antes de declarar validado el producto.
- Después de tener tráfico real, evaluar Core Web Vitals móvil en percentil 75: LCP ≤2,5 s, INP ≤200 ms y CLS ≤0,1. Antes del despliegue, la verificación automatizada del candidato no se presentará como medición de usuarios reales.
- La PWA del MVP tendrá como objetivos Chrome en Android y Safari en iPhone; Chromium de escritorio será comprobación adicional. Una vez cargada/instalada, debe permitir jugar localmente offline. No se promete recuperar una partida local tras cerrar el navegador.

## 9. Criterios de éxito del MVP

Criterios cualitativos aprobados: jugador puede iniciar partida sin registro, reglas correctas, experiencia agradable en móvil, modalidades completas, partidas online coherentes, recuperación razonable ante desconexión y experiencia offline local. No se han fijado métricas cuantitativas de adopción, latencia, concurrencia, rendimiento ni retención; deben proponerse con evidencia y validarse antes de convertirse en contrato.

## 10. Salvaguarda de alcance

La prioridad de negocio es **entregar un MVP real, no un MVP eterno**. Toda opción que multiplique estados, tecnologías o dependencias debe justificar valor observable. Las siluetas especiales son contenido parametrizado; no debe existir un motor distinto por silueta.
