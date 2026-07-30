# Mínimo viable tablet — contrato de validación

Contrato que toda interfaz de CHIP 2.0 debe cumplir en el rango **576–992px** (tablet vertical y horizontal) para considerarse terminada. No es "responsive completo": es el piso mínimo verificable, pensado para poder aplicarse pantalla por pantalla sin reescribir el SCSS existente.

**Alcance del rango.** La pantalla `/responsive` del design system tiene dos definiciones de "tablet" que no coinciden: la tabla de breakpoints parte 576–768 (tablet) y 768–992 (desktop small), mientras que la tabla de comportamiento de componentes usa 576–992 como un solo rango tablet. Para validar **dispositivos reales** se toma el rango completo **576–992px**, porque un iPad vertical mide 768px exactos y quedaría en la frontera. Si en algún momento se unifica esa pantalla, actualizar también este archivo.

---

## Infraestructura

Los breakpoints viven en `src/styles/_breakpoints.scss`. El archivo **no emite CSS** (sólo variables, funciones y mixins), y `angular.json` tiene `stylePreprocessorOptions.includePaths: ["src/styles"]`, así que cualquier componente lo importa sin ruta relativa:

```scss
@use 'breakpoints' as bp;

.form-wizard__grid {
  grid-template-columns: repeat(3, 1fr);

  @include bp.down('lg') { grid-template-columns: repeat(2, 1fr); }
  @include bp.down('md') { grid-template-columns: 1fr; }
}
```

| Mixin | Rango | Cuándo usarlo |
|---|---|---|
| `bp.up($n)` | `min-width` | Código nuevo (mobile-first, sentido preferido) |
| `bp.down($n)` | `max-width` | Ajustar pantallas ya escritas en desktop-first |
| `bp.between($a, $b)` | rango cerrado | Comportamiento exclusivo de un tramo |
| `bp.mobile` | < 576 | Alias |
| `bp.tablet` | 576–992 | Alias — el rango que valida este contrato |
| `bp.tablet-portrait` | 576–768 | Alias |
| `bp.tablet-landscape` | 768–992 | Alias |
| `bp.desktop` | ≥ 992 | Alias |
| `bp.touch-target($size)` | — | `min-width`/`min-height` 44px |
| `bp.scroll-x` | — | `overflow-x: auto` + scroll táctil |

Escala disponible: `'sm'` 576, `'md'` 768, `'lg'` 992, `'xl'` 1200, `'xxl'` 1400.

**Nota sobre `down()`:** resta 0.02px al límite (Bootstrap 5), así que `bp.down('md')` es `max-width: 767.98px`, no `768px`. Esto evita que `up('md')` y `down('md')` apliquen a la vez a 768px exactos. Al migrar un `@media (max-width: 768px)` escrito a mano, el comportamiento en ese píxel cambia — es el resultado correcto, pero conviene saberlo.

---

## Los 6 parámetros

### a. Sin scroll horizontal del `<body>` a 768px

El defecto más común y el más visible. Cualquier elemento que exceda el ancho del viewport empuja la página entera y rompe la lectura.

Causas habituales: `width` fijo en px, `min-width` en un contenedor de nivel alto, grid con más columnas de las que caben, texto largo con `white-space: nowrap` sin `max-width`, tablas sin contenedor de scroll.

**Verificar:** a 768px, `document.body.scrollWidth` no debe superar `window.innerWidth`.

### b. Tablas anchas hacen scroll en su propio contenedor

Una tabla con muchas columnas no se comprime hasta lo ilegible ni empuja la página: su wrapper hace scroll horizontal.

```scss
.mi-tabla-wrap {
  @include bp.scroll-x;
}
:host ::ng-deep .mi-tabla table { min-width: 520px; }
```

El `min-width` de la tabla es lo que fuerza el scroll en vez del aplastamiento. Debe ir **en la tabla**, nunca en el wrapper — si va en el wrapper, empuja el `<body>` (parámetro a).

Alternativa PrimeNG: `[scrollable]="true"` con `scrollHeight`. Preferir el wrapper con `scroll-x` cuando la tabla ya está estilizada, para no alterar el markup interno de `p-table`.

### c. Grids y filtros: máximo 2 columnas en tablet

Las clases `.chip-filters--3col` / `--4col` deben colapsar a 2 columnas en el rango tablet y a 1 bajo 576px. Lo mismo para cualquier `grid-template-columns: repeat(3+, …)`.

Un panel de 4 filtros a 768px da ~170px por campo: un `p-select` con placeholder queda truncado y deja de ser usable.

### d. Touch targets ≥ 44×44px

WCAG 2.5.5 y Resolución 1519/2020. Aplica a todo lo interactivo cuando el input es táctil: botones icon-only de tabla (familia F7), toggles de ayuda (`panel-help`), botones de paginación, chips removibles, checkboxes de selección de fila.

```scss
@include bp.down('lg') {
  .mi-boton-icono { @include bp.touch-target; }
}
```

El área táctil puede lograrse con padding aunque el icono visible sea de 16px. No agrandar el icono.

### e. Breakpoints de la escala oficial

Sólo 576 / 768 / 992 / 1200 / 1400, vía los mixins. Nada de 480, 520, 600, 640, 700, 720, 880, 900, 1024.

Los valores ad-hoc son la razón por la que hoy no se puede razonar sobre el comportamiento responsive del proyecto: cada pantalla se rompe en un ancho distinto. Al tocar una pantalla, migrar sus media queries al mixin más cercano de la escala.

**Excepción legítima:** un breakpoint de contenido (el ancho exacto donde *ese* componente concreto se rompe) puede justificarse. Debe llevar un comentario explicando qué se rompe y a qué ancho; si no, se normaliza.

### f. Sin anchos fijos mayores a 100%

Usar `max-width` para limitar crecimiento y `width: 100%` para fluidez. `min-width` sólo en elementos internos que ya viven dentro de un contenedor con scroll propio.

```scss
/* ✗ */ .panel { width: 720px; }
/* ✓ */ .panel { width: 100%; max-width: 720px; }
```

Las imágenes: `max-width: 100%; height: auto;`.

---

## Cómo auditar una pantalla

1. **Levantar el dev server** y abrir la pantalla con el viewport en 768px y en 992px. La verificación de tipos no equivale a verificación visual.
2. **Recorrer los 6 parámetros** en ese orden — (a) primero, porque un scroll horizontal de página suele ser síntoma de (b), (c) o (f).
3. **Aplicar los mixins** donde el parámetro no se cumple.
4. **Listar las excepciones** que no se tocaron y por qué.

## Entregable

```
<Pantalla> — validación mínimo viable tablet (576–992px)

a. Scroll horizontal del body:  ✓ / ✗ <qué lo causaba>
b. Tablas con scroll propio:    ✓ / ✗ <cuáles>
c. Grids ≤ 2 col en tablet:     ✓ / ✗ <cuáles>
d. Touch targets ≥ 44px:        ✓ / ✗ <cuáles>
e. Breakpoints de la escala:    ✓ / ✗ <valores ad-hoc encontrados>
f. Sin anchos fijos > 100%:     ✓ / ✗ <cuáles>

Excepciones no tocadas (requieren validación con el equipo):
- <archivo:línea>: <descripción> — motivo
```
