# Design

## Context

La propuesta define una fundación sin implementación de modalidades completas. El repositorio contiene contratos funcionales en `docs/GAMEPLAY.md`, dirección técnica en `docs/ARCHITECTURE.md` y la regla de entrega incremental en `docs/DELIVERY.md`; no hay specs publicadas existentes que reutilizar.

## Goals / Non-Goals

**Goals:**

- Separar una aplicación web Angular/PWA, un proceso Fastify preparado para contratos futuros y una librería pura de motor.
- Mantener los tipos del juego independientes de UI, red y persistencia.
- Fijar una estrategia de workspace, package manager y comandos que pueda comprobarse en entorno limpio.
- Hacer que los assets canónicos sean recursos locales importables.

**Non-Goals:**

- No implementar una partida completa, bots, matchmaking, WebSockets, PostgreSQL, autenticación ni persistencia.
- No desplegar ni añadir infraestructura, Capacitor, servicios externos o backend operativo.
- No decidir requisitos abiertos de producto fuera de OPEN-14 ni anticipar D1–D8.

## Decisions

### Workspace único con paquetes separados

Se usará un workspace monorepo con tres paquetes explícitos: web, server y engine/contracts. Esto mantiene una única instalación y comandos comunes, pero conserva fronteras para que el motor no dependa del navegador o Fastify. Un repositorio separado por paquete aumentaría coordinación y duplicaría tooling sin valor para D0; un framework full-stack único mezclaría responsabilidades y reduciría la portabilidad prevista.

### Motor puro y contratos compartidos

Los tipos canónicos y la lógica mínima verificable vivirán en el paquete TypeScript reutilizable. Angular y Fastify solo consumirán contratos públicos; no se duplicarán modelos en DTOs ad hoc. La autoridad del servidor online se deja para D6/D7, mientras D0 asegura que el modelo no imponga una dependencia de red.

### Tooling fijado por compatibilidad observada

La versión de OpenSpec instalada y las versiones efectivas de Node, package manager y herramientas se comprobarán durante la implementación y se registrarán en los artefactos del cambio. No se escogerá una versión de runtime por preferencia si el entorno real demuestra otra combinación compatible; cualquier conflicto que cambie el alcance deberá volver como actualización del change.

### Pruebas por capas

El paquete engine tendrá pruebas deterministas de contratos e invariantes; web y server tendrán pruebas mínimas de compilación/arranque apropiadas a D0. La evidencia de instalación, build y test se conservará como salida reproducible, sin afirmar despliegue ni validación manual de dispositivos.

### Assets locales como entradas de build

Las rutas bajo `assets/` serán la única fuente de los recursos incluidos en D0. Se prefieren imports empaquetables y el audio TypeScript existente frente a CDN o generación durante el build, porque eliminan credenciales y hacen el resultado offline reproducible.

## Risks / Trade-offs

- [Toolchain incompatibility] → Ejecutar una matriz mínima de versiones disponible en el entorno y registrar el bloqueo exacto; no ocultarlo con una herramienta alternativa no autorizada.
- [Workspace coupling] → Mantener dependencias unidireccionales: web/server pueden consumir engine, pero engine no importa runtime de UI, servidor ni assets.
- [Premature contracts] → Exponer solo las entidades exigidas por GAME-01..10 y marcar cualquier detalle no decidido como pendiente, evitando diseñar protocolo online.
- [Asset path drift] → Validar las rutas canónicas durante build/test y fallar con un mensaje claro si falta un recurso; no descargar un reemplazo.

## Migration Plan

No hay migración ni despliegue en D0. La implementación añadirá la estructura en un checkout sin código de aplicación previo; rollback consiste en retirar el change antes del merge humano. Las entregas posteriores consumirán los contratos publicados mediante dependencias del workspace.

## Open Questions

Ninguna pregunta abierta adicional es necesaria para implementar el alcance declarado. Las decisiones funcionales de D1 en adelante permanecen fuera de este change.
