# Spec Delta

## Purpose

Define la evidencia automatizada de cierre D8 para comprobar de forma reproducible la integración del MVP sin confundir pruebas previas al despliegue con validación física o métricas de campo.

## ADDED Requirements

### Requirement: Integrated regression covers the approved MVP surface
La regresión SHALL ejecutar escenarios automatizados para máquina, local, sala privada y público 1v1, en los viewports aprobados, cubriendo reglas del motor, siluetas cuadradas, accesibilidad móvil, sonido/mute, movimiento reducido, resultados normal/empate/abandono, seguridad de comandos, estados de conexión y PWA offline.

#### Scenario: Four modes pass automated smoke coverage
- **WHEN** se ejecuta la regresión integrada contra el candidato web
- **THEN** las cuatro modalidades completan sus flujos críticos sin defectos bloqueantes ni assets ausentes y la evidencia identifica cada modalidad y viewport

#### Scenario: Engine invariants remain covered
- **WHEN** la regresión ejecuta movimientos legales, duplicados, cierres múltiples, último movimiento, empate y máscaras con huecos
- **THEN** conserva legalidad de aristas, puntuación, turno extra, fin, empate e independencia del algoritmo respecto de la silueta

#### Scenario: Online security and lifecycle remain covered
- **WHEN** un cliente envía un comando duplicado, fuera de turno, con identidad o versión inválida, o se desconecta en los límites de 60 segundos
- **THEN** el servidor rechaza sin mutar el estado indebido y la evidencia cubre reconexión, reemplazo privado y abandono público según su modalidad

### Requirement: Pre-deployment evidence does not claim field validation
La evidencia automatizada SHALL separar los resultados del candidato de las comprobaciones físicas en Chrome Android, Safari iPhone y escritorio, y SHALL registrar como pendientes las métricas de campo p75 LCP ≤ 2,5 s, INP ≤ 200 ms y CLS ≤ 0,1 hasta disponer de despliegue y tráfico real.

#### Scenario: Physical checks remain pending
- **WHEN** se cierra la regresión antes de desplegar el candidato
- **THEN** la evidencia marca instalación, modo avión, dispositivos físicos y métricas de campo como pendientes, sin declararlos ejecutados

#### Scenario: Automated PWA evidence is reproducible
- **WHEN** se verifica la PWA preparada con el navegador automatizado
- **THEN** se registran manifest, caché, revisita sin red, ausencia de llamadas externas, juego local offline y actualización no disruptiva
