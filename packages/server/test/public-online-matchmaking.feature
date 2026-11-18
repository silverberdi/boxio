# D7 escenarios ejecutados por public-matchmaking.e2e.test.ts y public-matchmaking.test.ts
Característica: Partida pública 1v1 autoritativa

  Escenario: Dos invitados se emparejan y un tercero no ocupa la partida
    Dado que dos invitados entran a la cola pública
    Cuando el servidor confirma la segunda búsqueda
    Entonces crea una partida con exactamente dos asientos fijos

  Escenario: La cancelación confirmada gana la carrera
    Dado que una búsqueda está activa
    Cuando se cancela antes de una oportunidad de emparejar
    Entonces queda cancelada y los reintentos son idempotentes

  Escenario: No hay rival al vencer 60 segundos
    Dado que una búsqueda continúa sin rival
    Cuando vence el reloj del servidor
    Entonces ofrece máquina separada, continuar buscando o cancelar

  Escenario: Un comando inválido no cambia el snapshot
    Dado que una partida pública está activa
    Cuando llega una credencial inválida, versión obsoleta o arista duplicada
    Entonces el servidor rechaza sin cambiar evento, turno, aristas ni marcador

  Escenario: La reconexión expira en abandono
    Dado que un participante se desconecta
    Cuando pasan 60 segundos sin credencial válida
    Entonces termina con causal abandono y no admite reemplazo
