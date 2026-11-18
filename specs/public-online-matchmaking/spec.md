# Spec Delta

## MODIFIED Requirements

### Requirement: Public lifecycle and accessibility expose authoritative state
La interfaz pública SHALL mostrar búsqueda activa, acción cancelar, transición a partida, pérdida de conexión, tiempo de reserva cuando aplique, reconexión y resultado por abandono con texto y señales no dependientes únicamente del color. SHALL mantener accesible la acción elegida tras el timeout, explicar que jugar contra la máquina inicia una partida separada y permitir continuar desde cualquier resultado hacia el inicio sin revancha automática.

#### Scenario: Search can be cancelled visibly
- **DADO** que un invitado está buscando rival
- **CUANDO** observa el estado de la modalidad pública
- **ENTONCES** ve que está buscando, puede activar cancelar y, si cancela con confirmación del servidor, deja de aparecer como elegible para una futura partida

#### Scenario: Abandonment result is distinct from normal victory
- **DADO** que una partida pública finaliza por timeout de reconexión
- **CUANDO** los participantes reciben el resultado
- **ENTONCES** la interfaz identifica explícitamente la victoria por abandono y no la presenta como victoria normal por puntos

#### Scenario: Public result continues to a fresh start
- **DADO** que una partida pública terminó por puntos, empate o abandono
- **CUANDO** el jugador continúa desde el resultado
- **ENTONCES** vuelve al inicio y no se crea una revancha automática ni se reutiliza la sesión terminada
