# local-assets Specification

## Purpose

Garantiza que la fundación pueda consumir la identidad visual y el audio canónicos del repositorio sin depender de descargas, credenciales ni archivos generados fuera del proyecto.

## Requirements

### Requirement: Self-contained canonical assets
El build web SHALL poder importar el wordmark SVG, el icono SVG y los efectos de audio TypeScript desde las rutas canónicas bajo `assets/`, sin red, credenciales o servicio de assets externo. La PWA SHALL además publicar y cachear el shell y los recursos locales necesarios para la modalidad local, y SHALL generar los iconos raster de instalación a partir del icono SVG local dentro del proceso reproducible del repositorio.

#### Scenario: Asset imports resolve offline
- **WHEN** se ejecuta el build sin conectividad externa usando el catálogo local
- **THEN** los recursos canónicos se resuelven y el build no intenta descargarlos

#### Scenario: Prepared PWA serves cached asset catalog
- **WHEN** se revisita la PWA preparada sin red
- **THEN** wordmark, icono, fondo, tokens, personajes, UI y efectos locales requeridos se sirven desde el build o caché y permiten entrar a la modalidad local

#### Scenario: Raster icons derive from canonical SVG
- **WHEN** se inspeccionan los iconos declarados por el manifest
- **THEN** son derivados reproducibles de `assets/branding/boxio-app-icon.svg` y no dependen de un adjunto o PNG generado fuera del repositorio

#### Scenario: Chat-generated PNGs are not required
- **WHEN** el catálogo de assets se valida desde un checkout limpio
- **THEN** ningún PNG generado en chat ni otro adjunto externo es necesario para completar la construcción o preparar la PWA
