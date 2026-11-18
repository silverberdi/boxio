# Proposal

## Why

El MVP ya reúne las cuatro modalidades, el motor, las siluetas y la PWA, pero necesita un cierre transversal que convierta esas entregas en una experiencia coherente, accesible y verificable. D8 aborda las celebraciones no bloqueantes, las preferencias de sonido y movimiento, los resultados y la regresión final antes de preparar un candidato web, manteniendo separadas las comprobaciones físicas y las métricas reales posteriores al despliegue.

## What Changes

- Pulir la presentación de conquistas simples y múltiples para reflejar el número de cuadros sin bloquear el turno siguiente.
- Respetar mute y movimiento reducido: el primero impide emitir audio y el segundo evita animaciones intensas, conservando una señal visual final.
- Completar resultados normal, empate y abandono público con su causal correcta; continuar vuelve al inicio y crea estado nuevo, sin revancha automática.
- Ejecutar una regresión automatizada integrada de máquina, local, sala privada y público 1v1 en los viewports aprobados, incluyendo invariantes del motor, accesibilidad, seguridad, conexión, audio/movimiento y PWA offline.
- Verificar que el candidato usa únicamente el catálogo local canónico y documentar como pendientes las validaciones físicas y métricas de campo postdespliegue (DEC-30).
- Mantener fuera de alcance tiendas, deploy no autorizado, perfiles, chat, tienda, assets externos y cualquier PNG generado en chat.

## Capabilities

### New Capabilities

- `mvp-integrated-qa`: contrato transversal para la regresión D8, la evidencia automatizada de las cuatro modalidades, viewports aprobados, PWA offline y límites de validación postdespliegue.
- `celebration-preferences-results`: comportamiento transversal de celebraciones, preferencias de audio/movimiento y navegación de resultados compartido por las modalidades.

### Modified Capabilities

- `local-game-ux`: celebraciones múltiples no bloqueantes, preferencias de mute y movimiento reducido, resultados con causal y retorno al inicio sin revancha automática.
- `pwa-offline`: comprobación integrada del candidato y separación explícita entre automatización previa al despliegue y validación física posterior.
- `public-online-matchmaking`: cobertura de resultado normal/empate frente a abandono público dentro de la regresión final, sin alterar el contrato de autoridad del servidor.

## Impact

- Afecta la UI compartida de partida/resultados, preferencias de sonido y movimiento, efectos de celebración, navegación de continuación y harness E2E/regresión.
- Requiere integrar pruebas de las cuatro modalidades sobre las capacidades existentes `game-contracts`, `automatic-opponents`, `silhouette-boards`, `private-online-rooms` y `public-online-matchmaking`, sin crear un motor paralelo ni cambiar las reglas.
- Revisa el shell/cache y el catálogo local de la PWA; no añade servicios, assets ni infraestructura.
- La entrega produce un candidato web listo para revisión humana. No autoriza merge, despliegue, medición de campo ni declaración de validación física.
