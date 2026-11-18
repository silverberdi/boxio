# Design

## Context

El change cruza la UI común, los resultados, las preferencias de accesibilidad, los efectos locales y la evidencia E2E de las modalidades ya entregadas. Debe conservar el motor y la autoridad online existentes, usar el catálogo de `assets/` y respetar la frontera de evidencia definida en `docs/PRODUCT.md`, `docs/EXPERIENCE.md`, `docs/DECISIONS.md` y `docs/DELIVERY.md`.

## Goals / Non-Goals

**Goals:**

- Centralizar la decisión observable de celebración: cantidad de cuadros, mute y movimiento reducido.
- Mantener las transiciones de resultado y retorno al inicio independientes del estado de la partida terminada.
- Crear una matriz de regresión reproducible que atraviese las cuatro modalidades, viewports, offline, seguridad y accesibilidad.
- Dejar evidencia explícita de lo automatizado, lo pendiente de validación física y lo que requiere despliegue.

**Non-Goals:**

- Cambiar reglas del motor, geometría de siluetas, límites de jugadores o semántica de reconexión.
- Añadir servicios, almacenamiento nuevo, assets externos, chat, cuentas, tienda, rankings o publicación en tiendas.
- Simular dispositivos físicos, tráfico real, métricas de campo o autorización de despliegue.

## Decisions

1. **Adaptador común de momentos y preferencias.** La UI consumirá el resultado confirmado del movimiento y las preferencias existentes para decidir una señal visual/audio. Esto evita que cada modalidad implemente una celebración distinta; una alternativa por modalidad se descarta porque puede divergir en mute, movimiento reducido y conteo N.

2. **Resultado como estado terminal desechable.** La acción continuar navegará al inicio y limpiará la referencia de la sesión terminada; el inicio será responsable de crear el siguiente estado. Esto implementa DEC-31 y evita que una revancha automática reutilice identidad, tablero o secuencia. No se añade persistencia tras cerrar el navegador.

3. **Pruebas E2E por contrato observable.** La matriz combinará fixtures de tablero/partida y flujos de navegador para validar invariantes, UX y límites online. Los comandos maliciosos se ejercitarán contra el servidor existente, no mediante mocks que concedan estado al cliente.

4. **Catálogo local como frontera de build.** La regresión bloqueará resoluciones de CDN, chat o assets ausentes y comprobará las rutas canónicas de SVG, JSON y `boxio-sounds.ts`. Los PNG de chat no participan en el build.

5. **Evidencia en dos capas.** El resultado del candidato separará checks automatizados predespliegue de una lista postdespliegue para Chrome Android, Safari iPhone, Chromium escritorio y Core Web Vitals p75. Así no se confunde una prueba de laboratorio con validación de campo.

## Risks / Trade-offs

- [Risk] Una animación larga puede retrasar el siguiente movimiento → limitarla a una señal no modal y probar que el estado siguiente es interactuable.
- [Risk] Preferencias inconsistentes entre modalidades → cubrir mute y movimiento reducido en una matriz común y en al menos un flujo de cada modalidad.
- [Risk] E2E online dependiente de tiempos de red → usar relojes/controles de prueba del servidor solo para reproducir límites contractuales, registrando que no equivalen a métricas de campo.
- [Risk] El catálogo de assets cambia durante D8 → validar rutas canónicas contra checkout y fallar con un diagnóstico de asset ausente, sin buscar sustitutos externos.
- [Risk] Un candidato verde se interpreta como listo para producción → etiquetar la evidencia como candidata, mantener revisión humana, merge y despliegue fuera de este change.

## Migration Plan

No hay migración de datos ni cambio de protocolo autorizado. Implementación y pruebas se ejecutarán sobre las capacidades existentes; si una necesidad exige alterar contrato de motor, persistencia, assets o despliegue, se detendrá el change y se solicitará una actualización de alcance. La reversión consiste en retirar el candidato del PR antes del merge humano.

## Open Questions

No se dejan preguntas abiertas que cambien el contrato: cualquier decisión visible pendiente de negocio se mantiene OPEN y no se resolverá unilateralmente durante la implementación.
