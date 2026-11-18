# Spec Delta

## MODIFIED Requirements

### Requirement: Automated and physical validation boundary
La entrega SHALL automatizar comprobaciones de manifest, caché, revisita sin red, ausencia de llamadas de red, partida local offline y actualización no disruptiva en navegador, como parte de la regresión integrada del candidato. La instalación y modo avión en Chrome Android y Safari iPhone SHALL registrarse como validación física posterior a un candidato desplegado; Chromium de escritorio SHALL ser una comprobación adicional. Las métricas de campo p75 no SHALL declararse antes de disponer de despliegue y tráfico real.

#### Scenario: Browser automation records offline evidence
- **WHEN** se ejecuta la verificación automatizada contra un candidato previo al despliegue
- **THEN** registra resultados reproducibles de manifest, caché, revisita sin red, partida local, ausencia de red y actualización no disruptiva

#### Scenario: Physical validation is pending before deployment
- **WHEN** todavía no existe un candidato desplegado ni dispositivos reales disponibles
- **THEN** la evidencia marca Chrome Android y Safari iPhone como pendientes y no afirma que la instalación o el modo avión hayan sido ejecutados

#### Scenario: Field metrics remain post-deployment evidence
- **WHEN** se prepara el cierre del candidato sin tráfico real
- **THEN** LCP, INP y CLS de campo p75 quedan anotados como pendientes postdespliegue y no se presentan como mediciones observadas
