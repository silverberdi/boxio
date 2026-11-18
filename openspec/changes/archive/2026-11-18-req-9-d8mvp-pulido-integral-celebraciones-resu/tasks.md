# Tasks

## 1. Celebraciones, preferencias y resultados

- [x] 1.1 Integrar el resultado de movimiento con la celebración normal/múltiple no bloqueante y verificar con pruebas de cierre simple y múltiple que el siguiente turno queda interactuable y conserva las invariantes GAME-03..07.
- [x] 1.2 Conectar mute y movimiento reducido al flujo de audio/animación y verificar que mute no emite audio y reduced motion muestra el estado final sin animación intensa.
- [x] 1.3 Completar resultados normal, empate y abandono público con causal explícita y verificar que continuar vuelve al inicio con estado nuevo y sin revancha automática.

## 2. Regresión funcional y online

- [x] 2.1 Añadir o ajustar escenarios automatizados de las cuatro modalidades en los viewports aprobados y verificar que cada flujo inicia, juega y termina sin assets ausentes.
- [x] 2.2 Cubrir invariantes del motor, aristas duplicadas/ausentes, cierre múltiple, último movimiento, empate e independencia de siluetas y verificar la evidencia Gherkin/regresión.
- [x] 2.3 Cubrir comandos online duplicados, fuera de turno, identidad/versiones inválidas, reconexión de 60 segundos, ingreso tardío privado y abandono público, verificando que los rechazos no mutan estado.
- [x] 2.4 Verificar accesibilidad móvil, texto de turno/causal no dependiente solo del color, áreas táctiles y preferencia de movimiento en los viewports definidos.

## 3. PWA, assets y evidencia de candidato

- [x] 3.1 Verificar manifest, caché, revisita sin red, ausencia de llamadas externas, juego local offline y actualización no disruptiva usando exclusivamente el catálogo canónico de `assets/`.
- [x] 3.2 Ejecutar la matriz final automatizada y generar evidencia reproducible por modalidad, viewport y requisito, registrando cualquier fallo como bloqueante antes del candidato.
- [x] 3.3 Registrar por separado como pendientes las pruebas físicas Chrome Android/Safari iPhone/Chromium escritorio y las métricas de campo p75 LCP ≤ 2,5 s, INP ≤ 200 ms y CLS ≤ 0,1; verificar que no se declaran ejecutadas.

## 4. Cierre del change

- [x] 4.1 Revisar que no se hayan añadido assets externos, chat, perfiles, tienda, tiendas móviles, deploy o merge automático y verificar el diff limitado al alcance D8.
- [x] 4.2 Ejecutar la verificación OpenSpec del change y dejar el PR/candidato listo para revisión humana sin afirmar despliegue ni validación física.
