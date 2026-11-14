# BOXIO — Registro de decisiones, incertidumbres y procedencia

**Objetivo:** impedir que mini me convierta sugerencias del asistente en compromisos del propietario. Estado al 14 de noviembre de 2026, derivado de una conversación cuyo antecedente temporal no se recuperó completo. En caso de discrepancia, pedir aclaración puntual; no reinterpretar silenciosamente.

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

## 2. Propuestas condicionadas (no cerradas)

| ID | Asunto | Interpretación segura |
|---|---|---|
| COND-01 | Siluetas especiales corazón, estrella simple, cruz y T | Propuesta de catálogo pequeño, sujeta a complejidad real. No tratar las cuatro como compromiso comercial obligatorio; diferir sin bloquear MVP si conviene |
| COND-02 | Tamaño «muy grande» en tableros especiales | Solo cuando sea jugable; no se fijó como universal |
| COND-03 | «Siete pantallas» | Es estructura de vistas/estados UX, no obligación de siete rutas/implementaciones distintas |
| COND-04 | Arquitectura interna exacta (tablas/monorepo) | Referencial hasta diseñar cambios puntuales |
| COND-05 | Efectos específicos, partículas, haptics | Dirección estética general aprobada, detalles abiertos |
| COND-06 | PostgreSQL para recuperar partidas online | Tecnología aceptada, modelo/retención no aprobados |

## 3. Pendientes que bloquean sus entregas específicas

| ID | Pregunta de producto/ingeniería | Momento de resolver |
|---|---|---|
| OPEN-01 | Límites numéricos de filas/columnas personalizadas y tamaños reales por silueta | Antes de configurar tableros/UI |
| OPEN-02 | Conjunto final y máscaras válidas de siluetas para primera entrega | Antes de comprometer biblioteca de tableros |
| OPEN-03 | Qué significa exactamente «pasar a máquina» desde sala privada de anfitrión solo; ¿sale de online? ¿puede volverse a unir humano? | Antes del flujo sala→máquina |
| OPEN-04 | Política de turno y suspensión cuando jugador desconecta, incluido su turno extra | Antes de online privado |
| OPEN-05 | Efectos de abandono voluntario, del anfitrión ausente y sala con 0–1 jugadores | Antes de online privado |
| OPEN-06 | Elegibilidad al ganar y score visible de jugadores retirados que mantienen propiedad histórica | Antes del resultado privado |
| OPEN-07 | Revancha según modalidad y reinicio de salas/turnos | Antes de UX de resultados |
| OPEN-08 | Persistencia y reanudación de partida local (más allá de offline en ejecución) | Antes de storage local si se incluye |
| OPEN-09 | Política de lobby, cancelación, fallo de matchmaking y ausencia de rivales | Antes de online público |
| OPEN-10 | Identidad opaca, expiración de credenciales, rotación al reconectar y garantías mínimas antiabuso | Antes de identidad online |
| OPEN-11 | Rendimiento cuantificado, carga inicial, dispositivos de referencia, accesibilidad fina | Antes de cerrar pruebas de UX |
| OPEN-12 | SLA de sesiones, limpieza de estados PostgreSQL, recuperación tras caída backend | Antes de servidor/operación |
| OPEN-13 | Logotipo, paleta, tipografía y activos de sonido definitivos | Antes de pulido final de identidad |
| OPEN-14 | Versiones runtime, workspace tooling, repositorio, paquete UI, esquema de test | En primer diseño técnico OpenSpec |
| OPEN-15 | Política de privacidad, público objetivo/edad y eventual modelo de negocio | Antes de apertura pública comercial |
| OPEN-16 | ¿Cómo se gestionan turnos de un jugador que vence desconexión en una partida privada todavía activa? | Antes de online privado |
| OPEN-17 | Dificultad de bot (métricas, semilla reproducible, tiempo máximo por acción) | Antes del entregable IA |

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
