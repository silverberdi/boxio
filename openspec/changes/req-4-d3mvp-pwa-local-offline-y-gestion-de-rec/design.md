# Design

## Context

D2 ya define la modalidad local, el motor TypeScript sin IO y el catálogo canónico bajo `assets/`. Este change añade la frontera de distribución offline de la aplicación web y debe reutilizar esos contratos sin introducir servidor, persistencia local de partida ni un motor alternativo. Los requisitos y escenarios completos están en `specs/` del change.

## Goals / Non-Goals

**Goals:**

- Hacer que el build web produzca una PWA instalable/preparable con manifest, iconos derivados localmente y service worker.
- Cachear de forma versionada el shell y el conjunto cerrado de recursos necesarios para iniciar y jugar localmente sin red.
- Mantener el camino local conectado directamente al motor puro del dispositivo; una pérdida de red no debe cambiar la autoridad ni la semántica del juego.
- Coordinar la detección de nuevas versiones con la UI para diferir la activación mientras una partida está activa.
- Probar el comportamiento observable en navegador y dejar una lista de evidencia física separada para Chrome Android, Safari iPhone y Chromium de escritorio.

**Non-Goals:**

- No añadir endpoints, WebSockets, PostgreSQL, autenticación, sincronización ni recuperación de partidas locales.
- No añadir Capacitor, firma, publicación en tiendas, apps nativas, CDN ni generación de assets fuera del repositorio.
- No modificar las reglas del motor, el catálogo de siluetas ni la UX funcional de D2 salvo la continuidad offline y el ciclo de actualización.

## Decisions

### 1. Service worker con precache del shell y recursos declarados

El build web generará un manifest y un service worker con una versión de caché asociada al artefacto. El precache incluirá los entrypoints compilados y los recursos locales referenciados por el shell/juego; las solicitudes no pertenecientes a ese conjunto no se convertirán en una dependencia oculta. Esto hace que la revisita offline sea determinista.

Se reutiliza la integración PWA compatible con Angular y el tooling ya fijado cuando sea suficiente, en vez de introducir una librería de caché o un runtime de servidor. La alternativa de implementar un service worker manual se reserva solo si la integración instalada no puede expresar la política de actualización y se documenta con pruebas equivalentes.

### 2. Iconos derivados desde la fuente SVG canónica

Los iconos raster requeridos por el manifest se producirán como artefactos reproducibles del build desde `assets/branding/boxio-app-icon.svg`, con tamaños declarados para los navegadores objetivo. El SVG fuente permanece como autoridad; no se incorporan PNGs de chat ni binarios descargados. La prueba comprobará existencia, formato declarado y procedencia de la fuente dentro del repositorio.

### 3. Separación estricta entre modo local y transporte online

La pantalla local seguirá invocando la librería del motor directamente. No se añadirá un fallback que intente consultar API antes de validar una arista: en modo local la ausencia de red es un estado esperado y el motor sigue siendo determinista. Las modalidades online, cuando existan en futuras entregas, conservarán su frontera de servidor autoritativo y no se mezclan en este change.

### 4. Actualización diferida mediante estado de partida

El registro de una versión nueva notificará a la aplicación, pero la activación/reload se guardará mientras exista una partida local activa. La UI podrá ofrecer una actualización segura al finalizar o al abandonar la pantalla; la decisión no borra ni serializa una partida para recuperarla después. Si el navegador termina el proceso, D3 no promete reanudación.

### 5. Evidencia de navegador y validación física separadas

La automatización ejecutará un servidor estático del candidato en navegador, inspeccionará manifest y service worker, bloqueará red tras la preparación, comprobará la revisita, interceptará solicitudes y completará una partida local con invariantes del motor. El resultado se guardará como evidencia reproducible. La instalación y modo avión en teléfonos reales se documentarán como pasos posteriores al despliegue y no se marcarán como ejecutados por las pruebas de escritorio.

## Risks / Trade-offs

- [Riesgo] Un cambio de hash o de versión puede dejar entradas antiguas en caché. → Usar nombres/versiones generados por build, limpiar caches obsoletos de forma controlada y probar revisita tras actualización.
- [Riesgo] Activar el worker inmediatamente puede mezclar shell y chunks de versiones distintas. → Instalar la nueva versión en segundo plano y activar solo en frontera segura, con prueba de coherencia de caché.
- [Riesgo] Un recurso local no referenciado por el precache puede fallar offline. → Mantener un inventario explícito del catálogo consumido y probar la ruta de juego con red bloqueada, no solo la carga del documento.
- [Riesgo] Safari/iOS puede aplicar políticas de instalación o caché distintas. → Tratar Chrome Android y Safari iPhone como validación física posterior obligatoria y no extrapolar resultados de Chromium.
- [Riesgo] Intentar persistir la partida para facilitar una actualización ampliaría el contrato y el alcance. → No guardar snapshots locales en D3; la continuidad requerida es durante la pantalla activa y la recuperación tras cierre permanece fuera de promesa.

## Migration Plan

1. Añadir la configuración y artefactos PWA al workspace web, generar iconos derivados y validar el catálogo local.
2. Registrar el service worker solo en el build/candidato destinado a PWA; el entorno de desarrollo no debe falsear evidencia de caché de producción.
3. Verificar en navegador carga inicial, revisita offline, partida local, actualización diferida y ausencia de solicitudes externas.
4. Si el candidato falla, desactivar el registro del worker o servir el artefacto anterior; no requiere migración de datos ni rollback de servidor.
5. Tras un despliegue autorizado, ejecutar y registrar instalación/modo avión en los dispositivos objetivo. No realizar despliegue ni afirmar esa evidencia dentro de este change.

## Open Questions

No quedan preguntas abiertas que cambien el contrato o el enfoque: la política de no recuperación tras cerrar, los objetivos de navegador y la exclusión de Capacitor/tiendas están resueltos por DEC-24 y el issue #4. Los nombres concretos de comandos de test y la configuración exacta del builder se determinarán durante apply contra las versiones efectivamente instaladas, sin alterar los requisitos.
