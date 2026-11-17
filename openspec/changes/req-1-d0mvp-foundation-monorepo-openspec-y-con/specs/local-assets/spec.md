# Spec Delta

## Purpose

Garantiza que la fundación pueda consumir la identidad visual y el audio canónicos del repositorio sin depender de descargas, credenciales ni archivos generados fuera del proyecto.

## ADDED Requirements

### Requirement: Self-contained canonical assets
El build web SHALL poder importar el wordmark SVG, el icono SVG y los efectos de audio TypeScript desde las rutas canónicas bajo `assets/`, sin red, credenciales o servicio de assets externo.

#### Scenario: Asset imports resolve offline
- **WHEN** se ejecuta el build sin conectividad externa usando el catálogo local
- **THEN** los recursos canónicos se resuelven y el build no intenta descargarlos

#### Scenario: Chat-generated PNGs are not required
- **WHEN** el catálogo de assets se valida desde un checkout limpio
- **THEN** ningún PNG generado en chat ni otro adjunto externo es necesario para completar la construcción
