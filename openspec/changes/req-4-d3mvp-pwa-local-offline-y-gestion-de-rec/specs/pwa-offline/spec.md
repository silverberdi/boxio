# Spec Delta

## Purpose

Permite preparar e instalar la PWA de Boxio con un shell y recursos locales autocontenidos, jugar la modalidad local sin red y actualizar la aplicación sin interrumpir una partida activa.

## ADDED Requirements

### Requirement: Offline PWA shell and local resources

La PWA SHALL publicar un manifest válido, iconos raster derivados de `assets/branding/boxio-app-icon.svg`, un service worker y un caché versionado que incluya el shell y todos los recursos locales necesarios para iniciar y jugar la modalidad local. El funcionamiento SHALL requerir cero assets de CDN, chat, credenciales o recursos externos.

#### Scenario: Prepared application revisits without network
- **WHEN** el usuario ha visitado o preparado la PWA y vuelve a abrirla sin conexión
- **THEN** el shell, el catálogo local requerido y la entrada a la modalidad local se cargan sin solicitar recursos externos

#### Scenario: Manifest exposes local install identity
- **WHEN** un navegador objetivo inspecciona el manifest y los iconos de la PWA
- **THEN** encuentra identidad de Boxio y un icono raster derivado del SVG local en los tamaños/formats declarados, sin depender de un PNG generado en chat

#### Scenario: Missing external network does not block local assets
- **WHEN** se bloquean CDN, API y servidores de assets durante la carga preparada
- **THEN** los recursos visuales, tokens y efectos locales necesarios siguen resolviéndose desde el repositorio o el caché

### Requirement: Offline local game execution

La modalidad local SHALL permitir iniciar y completar partidas de 2, 3 o 4 jugadores en el mismo dispositivo sin servidor. Durante una partida offline, la validación de aristas y las transiciones SHALL ejecutarse con el motor local y conservar las reglas de aristas, cuadrados, puntuación, bonus de turno, fin, empates e independencia de siluetas cuadradas.

#### Scenario: Start and complete local game offline
- **WHEN** el dispositivo pierde conexión después de que la PWA está preparada y se configura una partida con 2–4 jugadores
- **THEN** la partida puede comenzar y completarse usando únicamente el shell, recursos locales y motor del dispositivo

#### Scenario: Offline move does not call network
- **WHEN** un jugador toma una arista durante una partida local offline
- **THEN** la jugada se valida y aplica sin `fetch`, API, WebSocket ni servidor, y el resultado conserva las invariantes del motor

#### Scenario: Offline invalid move remains rejected
- **WHEN** se selecciona una arista inexistente, ocupada o fuera de turno durante una partida local offline
- **THEN** se muestra un rechazo observable y no cambian estado, puntuación ni turno

### Requirement: Non-disruptive PWA update

La PWA SHALL poder incorporar una nueva versión sin forzar una recarga de una pantalla de juego local activa. La versión nueva podrá quedar pendiente hasta un punto seguro, y una recarga voluntaria o el siguiente inicio podrá activarla.

#### Scenario: Active game is not reloaded by update
- **WHEN** el service worker detecta una versión nueva mientras hay una partida local activa
- **THEN** la pantalla y el estado visible de la partida permanecen activos sin recarga forzada ni pérdida del turno actual

#### Scenario: New version activates at a safe boundary
- **WHEN** el usuario termina la partida o abandona voluntariamente la pantalla activa y acepta actualizar
- **THEN** la nueva versión puede activarse y una navegación posterior usa un caché coherente

### Requirement: Automated and physical validation boundary

La entrega SHALL automatizar comprobaciones de manifest, caché, revisita sin red, ausencia de llamadas de red y partida local offline en navegador. La instalación y modo avión en Chrome Android y Safari iPhone SHALL registrarse como validación física posterior a un candidato desplegado; Chromium de escritorio SHALL ser una comprobación adicional.

#### Scenario: Browser automation records offline evidence
- **WHEN** se ejecuta la verificación automatizada contra un candidato previo al despliegue
- **THEN** registra resultados reproducibles de manifest, caché, revisita sin red, partida local y actualización no disruptiva

#### Scenario: Physical validation is pending before deployment
- **WHEN** todavía no existe un candidato desplegado ni dispositivos reales disponibles
- **THEN** la evidencia marca Chrome Android y Safari iPhone como pendientes y no afirma que la instalación o el modo avión hayan sido ejecutados

