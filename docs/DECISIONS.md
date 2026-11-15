# BOXIO — Registro de decisiones, incertidumbres y procedencia

**Objetivo:** impedir que mini me convierta sugerencias del asistente en compromisos del propietario. Baseline inicial al 14 de noviembre de 2026; decisiones adicionales confirmadas por el propietario el 15 de noviembre de 2026. En caso de discrepancia, pedir aclaración puntual; no reinterpretar silenciosamente.

## 1. Confirmadas

| ID | Decisión | Estado |
|---|---|---|
| DEC-01 | Nombre del producto: **Boxio**; Cuadrito era nombre de trabajo | Confirmada |
| DEC-02 | Juego Puntos y Cajas; **todas** las regiones son cuadrados, incluso en tableros con siluetas | Confirmada; corrige interpretación previa incorrecta de triángulos/hexágonos |
| DEC-03 | Cada cuadro vale un punto; cerrar uno o varios concede otro turno; empates válidos | Confirmada |
| DEC-04 | Cuatro modalidades MVP: contra máquina, local, privado online y público online | Confirmada |
| DEC-05 | Máquina con tres dificultades, de 2 a 4 participantes totales incluyendo 1 humano | Confirmada |
| DEC-06 | Local 2–4 humanos y offline una vez preparada PWA | Confirmada |
| DEC-07 | Privado hasta 4 plazas, sin espera fija ni necesidad de cuatro al inicio; entrada tardía | Confirmada |
| DEC-08 | Entrada tardía mantiene tablero/puntos existentes; nuevo comienza en cero y espera fin de turno vigente | Confirmada |
| DEC-09 | Reserva de reconexión de 60 s; privado libera plaza y no cede puntos al reemplazo | Confirmada |
| DEC-10 | Público 1v1 fijo; emparejamiento automático; 60 s y derrota por abandono sin sustitución | Confirmada |
| DEC-11 | Invitados con apodo, sin cuentas ni registro obligatorio en MVP | Confirmada |
| DEC-12 | Clásico rectangular con filas y columnas personalizadas libres dentro de límites razonables | Confirmada |
| DEC-13 | Siluetas solo de cuadros, tamaños predefinidos; no personalizados | Confirmada |
| DEC-14 | Todos los tableros utilizables en máquina, local y online | Confirmada |
| DEC-15 | Inicio simple con cuatro modalidades; tablero protagonista y score/turno visibles | Confirmada |
| DEC-16 | Celebración de conquistas y efectos más vistosos si se cierran múltiples cuadros | Confirmada |
| DEC-17 | Zoom y pan para tableros grandes en móvil, conservando info de jugadores/turno | Confirmada |
| DEC-18 | Angular/TypeScript PWA + SVG, Node/Fastify/WebSockets, motor TS reutilizable, PostgreSQL | Dirección técnica aceptada |
| DEC-19 | Arquitectura agnóstica del hosting; Capacitor en evolución a tiendas sin rehacer frontend | Aceptada |
| DEC-20 | mini me desarrollará con OpenSpec y backlog GitHub por entregables, no una ejecución monolítica | Confirmada |
| DEC-21 | No implementar ni desplegar mientras seguimos definiendo; evitar MVP eterno | Confirmada |
| DEC-22 | Tablero clásico: de 2 a 8 filas y de 2 a 8 columnas, enteras; máximo 64 celdas | Confirmada por el propietario, 2026-11-15 |
| DEC-23 | Móvil vertical como referencia: 360×640 CSS px; controles táctiles ≥44×44 CSS px. Tablet 768×1024 y escritorio 1280×800 son comprobaciones adicionales | Confirmada por el propietario, 2026-11-15 |
| DEC-24 | PWA MVP objetivo: Chrome Android y Safari iPhone; Chromium de escritorio adicional. Offline local tras cargar/instalar; sin promesa de recuperar partida local tras cerrar el navegador. Tiendas quedan para iteración posterior | Confirmada por el propietario, 2026-11-15 |
| DEC-25 | Bots: fácil captura inmediata en 20 % de ocasiones disponibles; medio captura y evita regalos cuando exista alternativa; difícil considera cadenas; semilla reproducible y <100 ms por decisión hasta tablero 8×8 | Confirmada por el propietario, 2026-11-15 |
| DEC-26 | Siluetas MVP: cruz, corazón y estrella simple, cada una con tamaños pequeño/mediano/grande; todas son conjuntos de celdas cuadradas. Sin T, triángulos, hexágonos, editor ni tamaño muy grande | Confirmada por el propietario, 2026-11-15 |
| DEC-27 | Sala privada: tras desconexión, reserva 60 s; al vencer, liberar el puesto y pasar el turno pendiente, conservar puntos/cuadros y elegibilidad del participante retirado; reemplazo es participante nuevo con cero. Reconexión solo con credencial privada del mismo dispositivo; rotarla al reconectar y no aceptarla tras vencer. El código de invitación no autentica. Si el anfitrión se va, la sala continúa; cerrar si no queda nadie | Confirmada por el propietario, 2026-11-15 |
| DEC-28 | Recuperación online: tras reinicio, restaurar salas desde el último movimiento confirmado en PostgreSQL; sin SLA prometido para MVP; borrar salas terminadas a las 24 h | Confirmada por el propietario, 2026-11-15 |
| DEC-29 | Público 1v1: tras 60 s sin rival, ofrecer máquina, seguir buscando o cancelar; elegir máquina crea una partida separada. Carrera cancelación/emparejamiento se resuelve por la primera confirmación del servidor | Confirmada por el propietario, 2026-11-15 |
| DEC-30 | QA MVP: automatizar las cuatro modalidades y candidato en varios tamaños. Pruebas manuales en dispositivos reales después del despliegue. Objetivos móviles de campo en p75: LCP ≤2,5 s, INP ≤200 ms, CLS ≤0,1; predespliegue no se afirma como dato de usuarios | Confirmada por el propietario, 2026-11-15 |
| DEC-31 | Sin revancha automática en MVP; mostrar resultado y volver al inicio. Una partida nueva crea sala y estado nuevos | Confirmada por el propietario, 2026-11-15 |
| DEC-32 | Público objetivo MVP familiar desde 6 años; no se presenta como clasificación legal/de tienda. Sin cuentas, chat, mensajes privados, anuncios, seguimiento publicitario, solicitud de edad ni datos personales; apodo y datos temporales necesarios para jugar | Confirmada por el propietario, 2026-11-15 |
| DEC-33 | MVP usa los assets existentes, sin eslogan candidato ni rebranding. Revisar marca, dominios, identidad y privacidad/edad antes de apertura pública/comercial | Confirmada por el propietario, 2026-11-15 |

## 2. Propuestas condicionadas y alcance diferido

| ID | Asunto | Interpretación segura |
|---|---|---|
| COND-01 | (Cerrada) Catálogo MVP: cruz, corazón y estrella simple; ver DEC-26 | Ya no es una propuesta abierta |
| COND-02 | (Cerrada para MVP) No habrá tamaño «muy grande»; ver DEC-26 | Podrá reconsiderarse con evidencia posterior |
| COND-03 | «Siete pantallas» | Es estructura de vistas/estados UX, no obligación de siete rutas/implementaciones distintas |
| COND-04 | Arquitectura interna exacta (tablas/monorepo) | Referencial hasta diseñar cambios puntuales |
| COND-05 | Efectos específicos, partículas, haptics | Dirección estética general aprobada, detalles abiertos |
| COND-06 | (Cerrada para MVP) PostgreSQL restaura desde último movimiento confirmado; salas terminadas se borran tras 24 h; ver DEC-28 | Aprobado por el propietario |

## 3. Preguntas abiertas y estado de resolución

| ID | Pregunta de producto/ingeniería | Estado al 2026-11-15 |
|---|---|---|
| OPEN-01 | Límites numéricos de filas/columnas personalizadas y tamaños reales por silueta | Resuelto para MVP: DEC-22 y DEC-26 |
| OPEN-02 | Conjunto final y máscaras válidas de siluetas para primera entrega | Resuelto para MVP: DEC-26 |
| OPEN-03 | Qué significa «pasar a máquina» desde sala privada de anfitrión solo y si puede volver a unirse un humano | Sigue abierto; debe quedar fuera del Issue #7 salvo decisión específica |
| OPEN-04 | Política de turno y suspensión cuando jugador desconecta, incluido su turno extra | Resuelto para MVP: DEC-27 |
| OPEN-05 | Efectos de abandono voluntario, del anfitrión ausente y sala con 0–1 jugadores | Resuelto para MVP: DEC-27 |
| OPEN-06 | Elegibilidad y puntuación de jugadores retirados con propiedad histórica | Resuelto para MVP: DEC-27 |
| OPEN-07 | Revancha según modalidad y reinicio de salas/turnos | Resuelto para MVP: DEC-31 |
| OPEN-08 | Persistencia y reanudación de partida local tras cerrar navegador | Resuelto para MVP: no se promete; DEC-24 |
| OPEN-09 | Lobby, cancelación, matchmaking y ausencia de rivales | Resuelto para MVP: DEC-29 |
| OPEN-10 | Identidad opaca, expiración y rotación al reconectar | Resuelto para MVP: DEC-27 |
| OPEN-11 | Rendimiento cuantificado, carga, dispositivos y accesibilidad fina | Metas móviles y referencias resueltas: DEC-23 y DEC-30; detalles de accesibilidad se verifican contra criterios del Issue #3 |
| OPEN-12 | SLA, limpieza PostgreSQL y recuperación tras caída backend | Resuelto para MVP: DEC-28; no se promete SLA |
| OPEN-13 | Marca y activos definitivos | Resuelto para MVP: DEC-33; revisión final queda antes de publicación comercial |
| OPEN-14 | Versiones runtime, workspace tooling, repositorio, paquete UI y esquema de test | Abierto para el diseño técnico de Issue #1; mini me lo resolverá con compatibilidad comprobada |
| OPEN-15 | Privacidad, público objetivo/edad y modelo de negocio | Público y límites de privacidad del MVP resueltos: DEC-32; revisión legal/comercial previa a apertura pública: DEC-33. No hay modelo de ingresos aprobado |
| OPEN-16 | Turnos de quien vence la reserva de desconexión en sala privada | Resuelto para MVP: DEC-27 |
| OPEN-17 | Dificultad de bot, semilla y tiempo por acción | Resuelto para MVP: DEC-25 |

## 4. Reglas para la gestión de pendientes

1. No pedir aprobación de todos los OPEN antes de hacer tareas independientes del motor.
2. Elevar **solamente** el OPEN que afecta el entregable en preparación.
3. Acompañar cada consulta con recomendación, impacto y alternativa simple.
4. Marcar la solución finalmente aprobada con fecha, origen y pruebas afectadas.
5. Nunca poner un OPEN en el backlog como si fuera una funcionalidad ya definida.

## 5. Cambios corregidos del análisis histórico

- En una transferencia anterior se habló de triángulos, hexágonos y regiones irregulares. **Eso fue contradicho explícitamente**: todas las celdas son cuadrados. Esa sección está invalidada.
- La conversación tuvo una ambigüedad al decir «no me parece bien» sobre unas siluetas; una respuesta del asistente la trató erróneamente como aprobación. Por eso el catálogo de corazón/estrella/cruz/T es **provisional** aunque se consideró razonable si no ralentiza el MVP.
- Un «no sé todavía» fue dirigido a otra persona; **no debe usarse** como rechazo ni reapertura de dimensiones libres, que quedaron aceptadas.
- No hay evidencia recuperable completa del chat temporal anterior. No adjudicar al propietario decisiones ausentes.

## 6. Lo que NO debe deducirse

No existen cifras aprobadas de usuarios concurrentes, presupuesto de infraestructura, fecha comercial, ingresos, precios, ranking, chat, modelo económico, garantía de aprobación en tiendas ni matriz completa de compatibilidad. No inferirlas.
