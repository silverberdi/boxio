# BOXIO — Estrategia OpenSpec, backlog GitHub y ejecución por mini me

## 1. Contrato de responsabilidades

**Propietario/producto:** confirma intención de negocio, reglas y decisiones abiertas de impacto.  
**OpenSpec:** define change por incremento, requisitos y escenarios, diseño de solución y tareas verificables usando sus comandos y estructura **reales**.  
**GitHub:** aloja repositorio, backlog, issues, trazabilidad y PRs.  
**mini me:** ejecuta el ciclo de desarrollo de los issues autorizados, usa OpenSpec, verifica y entrega PRs; merge permanece bajo control humano.

El repositorio es la fuente documental de contexto inicial. El backlog inicial **ya existe** en [GitHub issues #1–#9](https://github.com/silverberdi/boxio/issues), como planificación **pendiente de autorización**. Publicar issues no implica ejecutar automáticamente ni resolver decisiones OPEN.

## 2. Principio de descomposición

MVP completo como objetivo, pero desarrollado en incrementos verticales y comprobables. Evitar un solo issue «crear Boxio», un único change OpenSpec totalizante, o múltiples motores de juego. Cada issue entregable referencia IDs PRD/GAME/UX, dependencias, criterios Gherkin y límites explícitos.

La decisión de publicar/desplegar se toma separadamente; tener tests verdes no equivale a autorización de despliegue.

## 3. Orden recomendado de entregas (backlog inicial publicado #1–#9)

### D0 / [Issue #1](https://github.com/silverberdi/boxio/issues/1) — Preparación y contratos
- Confirmar versión de OpenSpec y su estructura nativa; comprobar compatibilidad de `openspec/config.yaml`.
- Crear tooling mínimo del monorepo con Angular, Fastify y paquete motor, sin infraestructura especulativa.
- Contratos de IDs y tipos canónicos para tablero y movimientos.
- Validar que el entorno de mini me puede ejecutar y probar el repositorio.

**Salida verificable:** repo compilable/testeable, convenciones y un escenario e2e mínimo de arranque si aplica. No integrar servicios online aún.

### D1 / [Issue #2](https://github.com/silverberdi/boxio/issues/2) — Motor puro y tableros clásicos
- Invariantes GAME-01..10, generación de grid rectangular, movimientos y estados terminales.
- Tests unitarios, de propiedades/invariantes cuando valga la pena, y Gherkin de casos críticos.
- Filas/columnas personalizadas con límites decididos en OPEN-01.

**Salida:** motor correcto, determinista, sin UI ni backend.

### D2 / [Issue #3](https://github.com/silverberdi/boxio/issues/3) — UI local jugable y PWA base
- Inicio, configuración, render SVG, controles táctiles, puntajes/turnos/feedback.
- Modalidad local 2–4 y recursos offline necesarios; PWA.
- Gestos zoom/pan sin jugadas accidentales.

**Salida:** juego completo local, usable en móvil, independiente de conexión una vez preparado.

### D3 / [Issue #4](https://github.com/silverberdi/boxio/issues/4) — Máquina
- Tres niveles de oponente tradicional y configuración de uno a tres bots.
- Misma lógica pura; escenarios de bonus y secuencias.
- Reproducibilidad en tests.

**Salida:** máquina jugable en distintas dimensiones.

### D4 / [Issue #5](https://github.com/silverberdi/boxio/issues/5) — Siluetas
- Incorporar máscaras de cuadrados parametrizadas y catálogo pequeño razonable.
- Asegurar que ningún cambio del motor es específico de silueta.
- Si una figura complica excesivamente, diferir sin impedir publicación MVP.

**Salida:** al menos una silueta especial validada; catálogo final según decisión OPEN-02.

### D5 / [Issue #6](https://github.com/silverberdi/boxio/issues/6) — Backend de sesiones y privado online
- Identidad temporal segura, invitaciones, ocupación y registro de movimientos servidor.
- PostgreSQL necesario, WebSockets, recuperación/reconexión de 60s.
- Ingresos tardíos y resultado privado, según OPEN-03..06/10/12/16.

**Salida:** partida privada hasta 4, pruebas de concurrencia y reconexión.

### D6 / [Issue #7](https://github.com/silverberdi/boxio/issues/7) — Público 1v1
- Emparejamiento automático, cancelación, inicio con dos y derrota por abandono a los 60s.
- Tests de colas, cancelación, concurrencia y desconexión.

**Salida:** partidas públicas sin reemplazo de participantes.

### D7 / [Issue #8](https://github.com/silverberdi/boxio/issues/8) — Calidad, identidad y cierre MVP
- Pulido de animaciones/celebraciones, experiencia responsiva real, ayuda y resultados.
- Ensayos integrados de cuatro modalidades, accesibilidad, recursos offline, recuperación básica, pruebas PWA.
- Revisión de alcance, de defectos, de rendimiento, de publicación web; entrega solo tras aprobación.

**Salida:** candidato MVP que cumple PRD-01..12 dentro del catálogo acordado.

Este orden es una **estrategia inicial**, no sustituto de planificación basada en el estado del repositorio y la capacidad real del ejecutor. La experiencia agradable es requisito del MVP aunque su pulido final esté en D7: no entregar UI tosca por principio.

### D8 / [Issue #9](https://github.com/silverberdi/boxio/issues/9) — Pulido integral y QA del MVP

Separa el cierre transversal en un issue propio con assets, pruebas E2E, accesibilidad y verificación PWA; corresponde al item #9. No requiere generar medios externos.

## 4. Plantilla de issue (contrato de contenido, no archivo requerido)

Todo issue autorizado debería expresar:
- Objetivo de negocio y resultado observable para el jugador.
- Alcance y fuera de alcance.
- Requisitos referencia (PRD-xx, GAME-xx, UX-xx, CONN-xx, MOM-xx).
- Dependencias y decisiones OPEN que bloquean *solo esa entrega*.
- Escenarios de aceptación en formato Dado/Cuando/Entonces, incluidos errores/reintentos.
- Pruebas esperadas, demo/evidencia requerida y condición de cierre.
- Entrega por PR; merge humano. No deployment por defecto.

## 5. Flujo OpenSpec sin emulación

El ejecutor selecciona el workflow soportado por la versión instalada de OpenSpec (p. ej., explorar/proponer, crear change, especificar, diseñar, planificar, aplicar, verificar, sincronizar y archivar). No se fijan nombres de comandos ni archivos internos no comprobados. La configuración de contexto puede enriquecerse cuando el tooling lo requiera, conservando las referencias a estos documentos.

Durante el desarrollo, si una decisión OPEN es bloqueante para el incremento, se propone solución al propietario y se actualiza `docs/DECISIONS.md` y la especificación relevante. **No avanzar con supuestos contradictorios**.

## 6. Pruebas transversales imprescindibles

**Motor:** tests de invariantes; cierre simple/doble, bonus encadenado, empate, último movimiento, máscara con huecos y aristas de borde, rechazo de duplicados.  
**UI:** ejecución en móvil vertical, precisión de aristas, zoom/pan, turno visible, feedback de conquista, pantallas de error.  
**Máquina:** todas las dificultades, aristas legales, ausencia de bucles, reproducibilidad con seed, funcionamiento con siluetas.  
**Online:** cliente malicioso/fuera de turno, dos movimientos simultáneos, entrada tardía tras bonus, plazas concurrentes, pérdida y recuperación en límites de 60s, reinicio de proceso, abandono.  
**PWA:** carga inicial y revisita sin red, versión de caché, uso local sin backend.

Las pruebas deben corresponder a contratos reales, no perseguir conteos de tests como fin.

## 7. Segunda iteración (backlog aparte)

Cuentas opcionales, perfiles, historial persistente de cuenta, eventual Android/iOS con Capacitor, ampliación social/multijugador y mejoras basadas en feedback. No convertir estos ítems en dependencias de D0–D7.

## 8. No incluir sin autorización

Microservicios, colas distribuidas, servicio de chat, login obligatorio, sistema de amigos, rankings, publicidad, integración de pagos, ML generativo, editor libre de siluetas, publicación automática en tiendas, infraestructura externa y despliegues irreversibles.
