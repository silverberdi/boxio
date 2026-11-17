# foundation-workspace Specification

## Purpose

Establece una base de workspace reproducible para que las futuras entregas de Boxio compartan contratos y puedan compilarse y probarse sin servicios externos.

## Requirements

### Requirement: D0 workspace structure
El repositorio SHALL proporcionar un workspace de aplicación PWA web, un workspace de servidor Fastify y una librería TypeScript reutilizable para el motor, con fronteras de paquete explícitas y sin servicio adicional.

#### Scenario: Clean checkout builds all workspaces
- **WHEN** se instala la versión fijada de las dependencias en un checkout limpio y se ejecuta el comando documentado de build
- **THEN** los tres workspaces compilan sin red adicional, credenciales ni servicios externos

#### Scenario: No unapproved service is required
- **WHEN** se ejecutan los comandos documentados de instalación, build y test
- **THEN** no se inicia, despliega ni requiere hosting, backend desplegado, base de datos, cola u otro servicio externo

### Requirement: Shared type conventions
Los paquetes SHALL consumir convenciones TypeScript compartidas para identificar de forma estable tableros, celdas cuadradas, aristas, movimientos, jugadores y estado de partida, sin introducir geometrías no cuadradas.

#### Scenario: Consumers use canonical game shapes
- **WHEN** un consumidor importa los contratos compartidos
- **THEN** puede representar un tablero y un movimiento con identificadores estables y tipos explícitos sin duplicar definiciones incompatibles

#### Scenario: Non-square region is rejected by the contract boundary
- **WHEN** se intenta describir una región que no está formada por una celda cuadrada delimitada por cuatro aristas
- **THEN** la validación del contrato la rechaza o la deja fuera del conjunto de estados aceptables

### Requirement: Reproducible quality commands
El proyecto SHALL documentar comandos deterministas para instalar dependencias, compilar y ejecutar pruebas automatizadas, incluyendo evidencia de ejecución desde un checkout limpio.

#### Scenario: Tests run without external services
- **WHEN** se ejecuta el comando de test documentado en un entorno sin servicios externos
- **THEN** las pruebas apropiadas para D0 se ejecutan y reportan su resultado de forma verificable

#### Scenario: Tool compatibility is recorded
- **WHEN** se comprueba la compatibilidad efectiva entre OpenSpec 1.13.1, Node y el tooling de paquetes instalado
- **THEN** el resultado y cualquier restricción reproducible quedan documentados para la implementación sin inventar una decisión funcional sobre OPEN-14
