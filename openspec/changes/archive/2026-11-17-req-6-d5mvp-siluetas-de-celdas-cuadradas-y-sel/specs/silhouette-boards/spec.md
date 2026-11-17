# Spec Delta

## Purpose

Define el catálogo MVP de tableros especiales formados exclusivamente por celdas cuadradas y su validación observable antes de construir una topología jugable.

## ADDED Requirements

### Requirement: Silhouette catalog has three approved sizes

El catálogo SHALL exponer exactamente las siluetas cruz, corazón y estrella simple, y para cada una SHALL exponer exactamente las variantes pequeña, mediana y grande. Cada variante SHALL ser una máscara finita no vacía de celdas cuadradas unitarias.

#### Scenario: Catalog exposes the nine approved variants
- **DADO** el catálogo de siluetas MVP
- **CUANDO** se consultan sus entradas
- **ENTONCES** existen exactamente cruz/pequeña, cruz/mediana, cruz/grande, corazón/pequeña, corazón/mediana, corazón/grande, estrella simple/pequeña, estrella simple/mediana y estrella simple/grande, sin T ni tamaño muy grande

#### Scenario: Catalog masks contain square cells only
- **DADO** cualquiera de las nueve variantes
- **CUANDO** se inspecciona su máscara fuente
- **ENTONCES** cada región activa representa una celda cuadrada unitaria con coordenadas enteras y no existen triángulos, hexágonos ni imágenes externas

### Requirement: Valid masks generate canonical topology

La preparación SHALL aceptar una máscara válida de celdas presentes, deduplicar vértices y aristas compartidas, y generar únicamente las aristas que delimitan celdas presentes. La topología resultante SHALL ser consumible por el mismo motor de tableros clásicos.

#### Scenario: Missing cells do not create edges
- **DADO** una máscara con cuadros ausentes entre o alrededor de cuadros presentes
- **CUANDO** se genera la topología
- **ENTONCES** no se crean celdas ni aristas de regiones ausentes y las aristas de los cuadros presentes quedan identificadas una sola vez

#### Scenario: Shared edge is deduplicated
- **DADO** dos celdas activas adyacentes
- **CUANDO** se genera su topología
- **ENTONCES** la arista común tiene una sola identidad lógica y se relaciona con ambas celdas

### Requirement: Invalid or disconnected special masks are rejected

La configuración SHALL rechazar una máscara vacía, duplicada, con coordenadas no enteras, celdas no cuadradas, datos inconsistentes o componentes desconectados antes de crear un estado de partida. El rechazo SHALL dejar intacto cualquier estado existente.

#### Scenario: Invalid mask does not create game state
- **DADO** una máscara vacía, duplicada, no finita o con coordenadas inválidas
- **CUANDO** se confirma la configuración
- **ENTONCES** se devuelve un error observable y no se crea ni modifica un estado de juego

#### Scenario: Disconnected mask is rejected
- **DADO** una máscara con dos grupos de celdas sin adyacencia por lado
- **CUANDO** se confirma la configuración
- **ENTONCES** la configuración se rechaza como desconectada y el estado permanece sin corrupción

### Requirement: Classic dimensions retain DEC-22 boundaries

Las configuraciones clásicas SHALL aceptar filas y columnas enteras independientes entre 2 y 8 inclusive, con un máximo de 64 celdas, y SHALL rechazar cualquier valor fuera de esos límites sin crear estado utilizable.

#### Scenario: Classic boundary remains accepted
- **DADO** una configuración clásica de 2×2 o 8×8
- **CUANDO** se confirma
- **ENTONCES** se acepta y la topología contiene exactamente el producto de filas por columnas

#### Scenario: Classic out-of-bounds value is rejected
- **DADO** una configuración clásica con una dimensión menor que 2, mayor que 8, fraccionaria, infinita, NaN o no numérica
- **CUANDO** se confirma
- **ENTONCES** se rechaza sin crear ni modificar el estado de partida
