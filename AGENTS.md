# Instrucciones para agentes — Boxio

## Orden de precedencia

1. Instrucciones explícitas y vigentes del propietario para la tarea.
2. Especificaciones canónicas OpenSpec aceptadas y aplicables al alcance.
3. Decisiones confirmadas en `docs/DECISIONS.md` y contratos en `docs/GAMEPLAY.md`.
4. Contexto del producto y arquitectura en `docs/`.
5. Recomendaciones y propuestas marcadas como tales.

Si hay conflicto, **detener la suposición**, registrar el conflicto concreto y solicitar resolución antes de modificar comportamiento afectado. No inferir aprobación a partir de una recomendación del asistente.

## Flujo de trabajo

- **mini me** es el ejecutor del SDLC. El repositorio GitHub aporta historial, revisión humana y backlog.
- Se emplea la CLI y los workflows reales de **OpenSpec** (según versión efectivamente instalada). No inventar directorios, comandos, estados, validadores o archivos de compatibilidad que no pertenezcan a la versión instalada.
- La carpeta `openspec/` contiene configuración de contexto; **no** significa que toda la aplicación sea un único change OpenSpec.
- Descomponer trabajo en entregables verificables, cada uno con criterios de aceptación, pruebas y límites claros; no fabricar un único gran cambio del MVP.
- La solución está en diseño; **no crear implementación ni infraestructura por iniciativa propia**.
- Priorizar simplicidad, testabilidad y compatibilidad web/PWA/Capacitor; no añadir servicios sin necesidad demostrada.
- Toda decisión abierta debe tratarse como **OPEN**, nunca como una licencia para escoger unilateralmente comportamientos visibles.
- Las pantallas/ilustraciones de referencia conceptuales no constituyen diseños finales aprobados.

## Calidad obligatoria al implementar una entrega autorizada

- Identificar requisitos por ID, casos normales, límites y negativos.
- Definir escenarios estilo Gherkin verificables y pruebas automatizadas en el nivel adecuado.
- Probar invariantes del motor: legalidad de aristas, cierre de cuadrados, puntuación, bonus de turno, fin, empates e independencia de siluetas.
- En online: comandos validados por servidor; comprobación de turno, identidad y duplicidad; eventos ordenados; reconexión y expiración.
- No crear PR o issue adicional sin relación con el entregable autorizado; PR y merge humano según el contrato operativo de mini me.
- No introducir chat, rankings, tiendas, perfiles ni registro obligatorio en el MVP.

## Documentos de entrada

`docs/PRODUCT.md`, `docs/GAMEPLAY.md`, `docs/EXPERIENCE.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/DELIVERY.md`.
