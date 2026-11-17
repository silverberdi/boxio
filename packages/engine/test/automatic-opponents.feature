# D4 automated-opponents regression scenarios; executable assertions live in bots.test.ts and bot.benchmark.test.ts.
Característica: Oponentes automáticos locales reproducibles

  Escenario: una semilla devuelve una arista legal
    Dado un tablero rectangular o una máscara de cuadrados
    Cuando el bot decide con dificultad fácil, media o difícil
    Entonces la arista pertenece al tablero y está libre

  Escenario: el bot medio prioriza capturas y evita regalos
    Dado un estado legal con una captura inmediata o una alternativa segura
    Cuando decide el bot medio
    Entonces captura primero o escoge una alternativa que no regala un cuadro

  Escenario: el turno automático conserva las invariantes
    Dado un humano y entre uno y tres bots sin conexión
    Cuando el scheduler procesa el turno automático
    Entonces usa el comando normal, conserva capturas y termina sin bucles

  Escenario: el cálculo cumple el límite de 8x8
    Dado cualquier dificultad en un tablero de 8 por 8
    Cuando se mide una decisión
    Entonces termina en menos de 100 milisegundos
