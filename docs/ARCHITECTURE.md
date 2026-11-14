# BOXIO — Arquitectura objetivo y límites técnicos

**Estado:** elección tecnológica acordada a nivel de dirección, pendiente validar versiones concretas y detalles de operaciones en el diseño de cada entrega OpenSpec.

## 1. Objetivos de arquitectura

- Un motor de reglas consistente para todos los tableros y modalidades.
- Desarrollar y mantener una sola base de frontend web, reutilizable para PWA y eventual Android/iOS.
- Soportar turnos concurrentes online con estado autoritativo.
- Permitir máquina y local offline.
- Hosting independiente de proveedor; posibilidad de usar la infraestructura actual del propietario sin acoplarla como requisito.
- Escalar por evidencia, no por arquitectura especulativa.
- Favorecer desarrollo incremental con mini me, PRs revisables y pruebas deterministas.

## 2. Stack base

| Capa | Decisión propuesta/aprobada en conversación | Observación |
|---|---|---|
| UI | **Angular + TypeScript** | SPA/PWA; no se necesita crear de entrada frontend nativo |
| Tablero | **SVG** | Vértices, aristas, cuadrados, máscara de silueta, gestos/animaciones |
| Motor | **TypeScript puro, librería separada** | Funciones deterministas; sin dependencia del DOM ni de sockets |
| Backend | **Node.js + Fastify + TypeScript** | Un servicio; validar versiones estables y compatibilidades al crear proyecto |
| Tiempo real | **WebSockets** | Cliente envía intención, servidor valida y emite resultados |
| Persistencia online | **PostgreSQL** | Datos de salas/partidas, recuperación y reconexiones; retención pendiente |
| Distribución | **PWA** | Caching controlado para local/máquina offline; online requiere conexión |
| Futuro móvil | **Capacitor** | Adaptación posterior Android/iOS, no entrega obligatoria del MVP |
| Repositorio | **Monorepo simple** | Separación UI, API, motor; toolchain a determinar con mínimo overhead |

Estas tecnologías fueron aceptadas como dirección; no derivar automáticamente ORM, framework de estado, sistema de colas, infraestructura de hosting, versión exacta de Node, biblioteca UI ni proveedor cloud.

## 3. Límites entre componentes

### Motor puro
Entrada: definición de tablero con conjunto de celdas cuadradas, estado inmutable o controlado, jugador y arista solicitada. Salida: resultado con legalidad, arista seleccionada, cuadrados nuevos, puntuaciones, turno siguiente y estado terminal. Debe ser determinista y serializable, sin IO de red, tiempo de reloj ni componentes de Angular.

### Frontend Angular
Responsable de renderizar y recoger intención, configurar partidas, mostrar turnos, puntuaciones y estados. Para local/máquina llama motor puro en el dispositivo; para online emite solicitud de movimiento y aplica estado confirmado por servidor. Puede optimizar respuesta visual sin convertir predicción de cliente en autoridad del juego.

### Backend Fastify
Responsable de identidad temporal del invitado, acceso a salas, ocupación de cupos, orden de turnos online, validación de movimientos, 60 segundos de reconexión, cierre/resultados y snapshots/versionado. Reutiliza librería del motor. No confiar en cliente para score, cierre de regiones o selección de otro turno.

### PostgreSQL
Persistencia mínima compatible con recuperación de sesión online. Evitar guardar secretos en logs y no almacenar más datos personales que los indispensables. Definir ciclo de vida y limpieza en diseño. No imponer guardar partidas locales en servidor.

## 4. Esquema lógico sugerido (no migraciones aprobadas)

Entidades conceptuales:
- **BoardTemplate:** ID de silueta, versión, conjunto de celdas activas y tamaños predefinidos.
- **GameSession:** ID, modalidad, tablero inicial, estado, versión y resultado.
- **Participant:** ID opaco por partida, apodo, color, tipo humano/bot, estado de conectividad, incorporación, marcador.
- **EdgeClaim:** arista, jugador y secuencia de movimiento (o su representación compacta serializable).
- **CellOwnership:** celda, propietario, secuencia de cierre.
- **Invitation/JoinCredential:** código para encontrar sala y credencial privada de participante distinta para reconectar.

Un snapshot consistente del motor puede reducir necesidad de múltiples tablas; la estrategia exacta depende de operaciones, volumen, recuperación y pruebas. **No implementar simultáneamente snapshots/event sourcing/tablas duplicadas salvo justificación real.**

## 5. Comunicación y coherencia

- Mensajes con identificador de sesión, participante autenticado mediante credencial opaca, ID de comando y versión/orden.
- El servidor serializa/resuelve movimientos concurrentes para la misma partida.
- Retornar al cliente rechazo explícito por movimiento inválido/versión obsoleta, sin aplicar mutación.
- Snapshot al unirse/reconectarse y secuencia de cambios para mantener clientes sincronizados.
- Probar doble clic, reconexión, concurrencia de cierre de último cuadro e intentos fuera de turno.
- La URL/código de invitación **no debe bastar** para suplantar identidad de participante existente.
- Autoridad del backend no depende de mantener socket original cuando se reconecta.
- Considerar expiración de 60 segundos con tiempo de servidor, no reloj cliente.
- Definir tratamiento tras reinicio del proceso y concurrencia multiinstancia solo si el alcance operativo lo requiere; no añadir infraestructura preventiva.

## 6. Tableros y máscaras

Se construye un tablero como conjunto de posiciones enteras (fila,columna) de **cuadrados** presentes. Cada cuadro aporta cuatro aristas canónicas, compartidas por celdas vecinas; la unión deduplica aristas. Las siluetas son conjuntos de cuadros, no polígonos arbitrarios. El motor debe validar coherencia de plantilla, IDs estables y rangos razonables. Una arista puede cerrar hasta dos cuadrados adyacentes.

Tablero clásico rectangular = producto cartesiano filas×columnas. Su configuración personalizada debe validar filas/columnas independientes y límites de dispositivo definidos por UX. Especiales = máscaras predefinidas escaladas/diseñadas cuidadosamente por tamaño, no transformaciones que generen cuadros parciales o aristas inválidas.

La representación visual SVG puede transformarse con zoom/pan sin cambiar topología ni IDs lógicos.

## 7. IA tradicional

Tres políticas fáciles de evaluar sobre el mismo motor: fácil (aleatoriedad y oportunidad ocasional), medio (captura inmediata + evita regalos obvios), difícil (cadenas/secuencias, estrategia adicional). Definir test de comportamiento reproducible con semillas y escenarios de tablero; evitar ML, inferencia remota o modelos generativos. Una silueta no debe tener un agente separado.

## 8. PWA y evolución a tiendas

MVP: PWA web instalable cuando el navegador lo permita; precache de shell y recursos suficientes para máquina/local offline; gestión de actualización que no corrompa partidas activas. Futuro: Capacitor empaqueta Angular para Android/iOS y requiere adaptación de APIs nativas, políticas, pruebas en dispositivo, firma, publicación y revisión de tiendas. **No se promete cero cambios ni aprobación automática**. Evitar acoplamientos a APIs web indisponibles dentro de WebView; interfaces desacopladas donde haya diferencias (audio, haptics/notificaciones, compartir, almacenamiento).

## 9. Seguridad y privacidad mínimas

Sin registro ni password en MVP, pero la identidad temporal necesita una credencial no adivinable para reconexión. Limitar intentos de códigos y operaciones; validar tamaño y contenido de apodos; escapar/renderizar texto seguro; no revelar secretos en URL/logs; canales online seguros en producción (HTTPS/WSS). Respetar principios de minimización de datos. Política legal y edades objetivo aún no definidas.

## 10. Observabilidad y fiabilidad

Registrar transiciones anómalas y fallas sin credenciales. Medir errores de conexión, movimientos inválidos y coherencia del estado; escoger métricas y objetivos concretos al preparar entrega online. Reintentar conexiones sin duplicar movimientos. Definir pruebas de recuperación a nivel de integración con PostgreSQL real. Evitar Redis, Kafka, Kubernetes, microservicios o servicios de tiempo real externos como requisitos de MVP sin evidencia.

## 11. Estructura posible del monorepo (ilustrativa)

```text
apps/
  web/          # Angular PWA
  server/       # Fastify API + WebSockets
packages/
  game-core/    # Reglas puras TypeScript
openspec/
  config.yaml
docs/
```

La disposición definitiva debe adaptarse al tooling elegido por el agente mediante un change OpenSpec específico; **no crear proyectos vacíos porque esta guía lo muestre**.

## 12. Restricciones de desarrollo

No adelantar despliegue, infraestructura ni cuentas cloud. No rediseñar mini me. No reimplementar OpenSpec. No sobreoptimizar por cargas no medidas. Mantener independencia proveedor-hosting y un solo frontend reutilizable.
