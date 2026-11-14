# Boxio

**Boxio** es un videojuego casual y competitivo, multijugador, basado en *Puntos y Cajas* (Dots and Boxes). Se juega cerrando cuadrados mediante la selección por turnos de aristas entre puntos. El producto tendrá tablero rectangular clásico y tableros con siluetas formadas exclusivamente por cuadrados.

> **Estado:** definición funcional y arquitectónica del MVP (14-11-2026). No se autoriza implementar, desplegar ni ampliar el alcance por el mero hecho de existir esta documentación.

## Propósito de esta documentación

Esta documentación constituye el contexto de negocio y de producto para OpenSpec, el futuro backlog GitHub y el ejecutor **mini me**. Debe evitar que los agentes reconstruyan el propósito del producto a partir de issues aislados, supongan reglas no acordadas o introduzcan sobreingeniería.

## Lectura recomendada

1. [Contexto y producto](docs/PRODUCT.md): visión, público, alcance MVP vs segunda iteración.
2. [Reglas y modalidades](docs/GAMEPLAY.md): contrato de reglas, salas, turnos y reconexión.
3. [Experiencia de usuario](docs/EXPERIENCE.md): navegación, pantallas, estados y accesibilidad.
4. [Arquitectura](docs/ARCHITECTURE.md): límites técnicos, autoridad del servidor, despliegue agnóstico.
5. [Decisiones y pendientes](docs/DECISIONS.md): decisiones confirmadas frente a recomendaciones y vacíos.
6. [Estrategia de entrega](docs/DELIVERY.md): descomposición en incrementos, OpenSpec, GitHub y mini me.
7. [Guía de agentes](AGENTS.md) y [configuración OpenSpec](openspec/config.yaml).

## Reglas no negociables de contexto

- Todas las regiones jugables son **cuadrados**. Un corazón o una estrella es una **silueta formada por cuadrados**, no una mezcla de triángulos, hexágonos o polígonos arbitrarios.
- Cada cuadrado cerrado vale **1 punto**; una arista puede cerrar más de uno.
- Cerrar al menos un cuadrado concede otro turno.
- El MVP admite máquina, multijugador local, sala privada online y emparejamiento público 1 vs 1.
- La sala privada admite hasta cuatro jugadores, puede iniciar con dos y admitir nuevas personas durante la partida.
- Reserva de reconexión: **60 segundos**; normas específicas por modalidad en GAMEPLAY.
- MVP: participantes invitados con apodo, sin cuenta obligatoria.
- Web móvil vertical primero, PWA, y arquitectura preparada para adaptación posterior a tiendas mediante Capacitor sin reconstruir el frontend.
- **No convertir recomendaciones abiertas en requisitos definitivos sin validación.**
- **No iniciar implementación por leer este repositorio.** El trabajo se autoriza y delimita mediante issues y cambios OpenSpec.

## Trazabilidad

Los requisitos persistentes residen en estos documentos hasta que sean formalizados como especificaciones OpenSpec. Los cambios ejecutables deben usar el flujo **nativo de OpenSpec**, no una imitación. Los issues de GitHub deben referenciar IDs de requisitos y cambios, sin duplicar ni reinterpretar contratos. El backlog inicial de planificación está publicado en los [issues #1–#9](https://github.com/silverberdi/boxio/issues). Su creación no autoriza la ejecución; cada incremento requiere su change nativo OpenSpec y las decisiones abiertas pertinentes. Los assets disponibles se inventarían en [assets/README.md](assets/README.md).
