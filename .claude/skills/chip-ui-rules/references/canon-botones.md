# Canon de botones — CHIP 2.0

Esta referencia define el canon de uso de botones en el proyecto. Cubre 14 familias funcionales, cada una con su severity, label, icono, ubicación y accesibilidad esperados.

**Sirve para dos modos** (el flujo lo dicta la SKILL.md):

- **Modo A — pantalla nueva:** estás creando los botones, así que **eliges** la familia que necesitas y aplicas el canon directamente. El árbol de decisión te ayuda a ubicar rápido la familia correcta.
- **Modo B — normalización de pantalla existente:** estás auditando código que ya está, así que **clasificas** la función real de cada botón antes de tocar. Aquí entra el Paso 0 obligatorio y la lista de excepciones.

> **Importante (Modo B sobre todo):** el canon **no se aplica a ciegas**. Algunas pantallas tienen botones con función propia que legítimamente no siguen el patrón general (wizard, confirmaciones destructivas, pares primaria+secundaria intencionales). En normalización, identifica primero qué hace el botón, aplica la regla donde encaja, y deja una lista de excepciones detectadas para validar con el equipo (un dev que conozca el código).

---

## Paso 0 — clasificar antes de cambiar (sólo Modo B)

Aplica cuando vas a tocar un botón que **ya existe** en el código. En Modo A (pantalla nueva) no hay nada que clasificar porque tú decides la función al crearlo — simplemente ubica la familia en el árbol y aplica.

Para clasificar un botón existente, identifica su **función real** (no su verbo):

**Cómo clasificar — árbol de decisión rápido:**

1. ¿Es **navegación entre pasos** de un wizard / multietapa? → **F4 · Navegación wizard**
2. ¿Es una **acción destructiva** (elimina, revierte, borra definitivamente)? → **F3 · Destructiva**
3. ¿Es para **subir/adjuntar** un archivo? → **F9 · Adjuntar / cargar archivo**
4. ¿Es para **descargar / exportar** algo? → **F6 · Descarga / exportación**
5. ¿**Envía** al backend o a un sistema externo (distinto de "guardar local")? → **F10 · Enviar / confirmación de acción**
6. ¿**Copia** al portapapeles? → **F11 · Copiar**
7. ¿Está **en una fila de tabla**, sólo con icono y tooltip? → **F7 · Icon-only en tabla**
8. ¿Es un **menú contextual** (tres puntos, ellipsis) que abre más acciones? → **F8 · Menú contextual**
9. ¿Es el par **"Limpiar" + "Buscar/Aplicar"** al pie de un panel de filtros? → **F5 · Filtros**
10. ¿Cambia entre **dos estados** (activo/inactivo, grid/lista)? → **F14 · Toggles de estado**
11. ¿Es **flotante** (fuera del flujo, esquina inferior)? → **F13 · Floating buttons**
12. ¿Es de **accesibilidad** (tamaño de letra, contraste)? → **F12 · Accesibilidad**
13. ¿Es la **acción principal** del formulario/modal (guardar, confirmar, aceptar)? → **F1 · Acción primaria**
14. ¿Acompaña a una primaria como **"Cancelar / Cerrar"**? → **F2 · Acción secundaria**
15. **¿No encaja en ninguna?** → Detente. Avisa al usuario antes de aplicar canon a ciegas — probablemente sea una excepción legítima o haga falta una familia nueva.

---

## Las 14 familias

### F1 · Acción primaria

**Función:** ejecutar la acción principal del flujo. Cierra modal con éxito, guarda formulario, confirma decisión.

| Atributo | Canon |
|---|---|
| Severity | Cobalto sólido (default) — sin `severity`, sin `[outlined]`, sin `[text]` |
| Labels canónicos | "Guardar", "Guardar cambios", "Confirmar", "Aceptar", "Crear", "Restablecer" |
| Iconos típicos | `pi-save`, `pi-check`, `pi-check-circle`, `pi-plus` (al crear) |
| Ubicación | Header derecha (en pantallas de listado, junto a "Crear") · Footer modal lado derecho · Pie de formulario lado derecho |
| Accesibilidad | Label visible; no requiere `aria-label` adicional |

Normalmente sólo hay **una** primaria por contexto. Si hay dos botones en cobalto sólido juntos, alguno está mal clasificado.

---

### F2 · Acción secundaria

**Función:** abandonar / cancelar el flujo. Siempre acompaña a una acción primaria.

| Atributo | Canon |
|---|---|
| Severity | `severity="secondary"` + `[text]="true"` (recomendado) o `[outlined]="true"` |
| Labels canónicos | "Cancelar", "Cerrar" |
| Iconos típicos | `pi-times`, o sin icono |
| Ubicación | Footer modal lado izquierdo, **antes** de la primaria · Pie de formulario lado izquierdo |
| Accesibilidad | Label visible |

Regla: en pares "Confirmaciones encima de rechazos en footer" del CLAUDE.md → la primaria queda a la derecha, la secundaria a la izquierda.

---

### F3 · Acción destructiva

**Función:** eliminar, revertir, borrar definitivamente. Siempre requiere confirmación explícita (modal o `p-confirmDialog`).

| Atributo | Canon |
|---|---|
| Severity | `severity="danger"` |
| Labels canónicos | "Eliminar", "Eliminar definitivamente", "Sí, eliminar", "Sí, revertir todos" |
| Iconos típicos | `pi-trash`, `pi-times-circle`, `pi-undo` (revertir) |
| Ubicación | Fila de tabla (icon-only con tooltip) · Footer de modal de confirmación · Footer de panel detalle |
| Accesibilidad | Si es icon-only, `aria-label` o `pTooltip` obligatorio |

**Variante icon-only en tabla:** `[rounded]="true" [text]="true" severity="danger" pTooltip="Eliminar"`.

**Excepción legítima:** los botones "Sí, [acción destructiva]" en modal de confirmación a veces necesitan label explícito ("Sí, revertir todos") para que el usuario lea exactamente qué confirma — no abreviar a "Sí".

---

### F4 · Navegación wizard

**Función:** avanzar/retroceder en flujos multietapa. **Esta familia es distinta de F1/F2** — el botón "Siguiente" de un wizard no es una acción primaria, es navegación.

| Atributo | Canon |
|---|---|
| Severity | **Siguiente / Avanzar:** default cobalto sólido, `iconPos="right"` · **Volver / Anterior:** `severity="secondary" [outlined]="true"` |
| Labels canónicos | "Siguiente", "Anterior", "Volver", "Atrás", "Volver al inicio" |
| Iconos típicos | `pi-arrow-right` (siguiente, con `iconPos="right"`) · `pi-arrow-left` (anterior) · `pi-chevron-*` (carrusel) |
| Ubicación | Footer del paso (par "Anterior" izquierda + "Siguiente" derecha) · Encabezado de paso (back link) |
| Accesibilidad | Label visible; usar `aria-current="step"` en el paso activo de la barra de pasos |

**Excepción legítima:** el último paso del wizard suele cambiar "Siguiente" por "Finalizar" / "Enviar" / "Guardar" → en ese momento sí pasa a familia F1 o F10.

**Pasos del wizard (botones nativos `<button class="form-wizard__step">`):** estos no son `p-button` y no entran en este canon — siguen su propio patrón en `formularios.component`.

---

### F5 · Filtros (Limpiar + Buscar)

**Función:** controlar búsqueda y filtrado de un listado. Suelen aparecer como par.

| Atributo | Canon |
|---|---|
| Severity | **Buscar / Aplicar:** default cobalto sólido · **Limpiar:** `severity="secondary" [outlined]="true"` o `[text]="true"` |
| Labels canónicos | "Buscar", "Consultar", "Aplicar filtros" · "Limpiar", "Limpiar filtros", "Limpiar todo" |
| Iconos típicos | `pi-search` (buscar) · `pi-filter-slash`, `pi-times`, `pi-refresh` (limpiar) |
| Ubicación | **Al pie del panel de filtros** (no en el header de pantalla). Par alineado a la derecha del panel |
| Accesibilidad | Label visible. "Limpiar" puede estar visualmente atenuado pero debe seguir siendo accesible por teclado |

Cuando los filtros están colapsados y hay filtros activos, mostrar chips removibles + un "Limpiar todo" — ver CLAUDE.md sección Filtros.

---

### F6 · Descarga / exportación

**Función:** descargar un archivo (PDF, Excel, CSV, preset, plantilla) o exportar datos.

| Atributo | Canon |
|---|---|
| Severity | Con label visible: `severity="success"` (verde) **o** `severity="secondary" [outlined]="true"` según contexto · Icon-only en tabla: `[rounded]="true" [text]="true" severity="secondary"` |
| Labels canónicos | "Descargar", "Descargar PDF", "Descargar XLSX", "Exportar", "Exportar Excel" |
| Iconos típicos | `pi-download`, `pi-file-pdf`, `pi-file-excel` |
| Ubicación | Header derecha (acción global de la pantalla) · Toolbar encima de tabla · Fila de tabla (icon-only) |
| Accesibilidad | Si es icon-only, `pTooltip` y `aria-label` obligatorios; especificar formato en el label ("Descargar PDF" mejor que "Descargar") cuando hay ambigüedad |

---

### F7 · Icon-only en tabla

**Función:** acciones rápidas por fila en `p-table` — ver detalle, editar, eliminar, descargar adjunto.

| Atributo | Canon |
|---|---|
| Estilo | `[rounded]="true" [text]="true"` siempre |
| Severity | Default (neutro) para "Ver" · `severity="success"` para "Editar" · `severity="danger"` para "Eliminar" · `severity="secondary"` para "Descargar" |
| Iconos típicos | `pi-eye` (ver), `pi-pencil` (editar), `pi-trash` (eliminar), `pi-download` (descargar adjunto) |
| Ubicación | Columna "Acciones" — última columna de la tabla, alineada a la derecha o centrada |
| Accesibilidad | **`pTooltip` y `aria-label` son obligatorios** — el botón no tiene label visible, así que el tooltip es lo único que comunica la acción. El tooltip debe describir el efecto ("Editar usuario", no sólo "Editar" cuando hay ambigüedad). |

Orden estándar en la columna: **Ver → Editar → [acciones especiales] → Eliminar**. La destructiva siempre al final.

---

### F8 · Menú contextual (ellipsis)

**Función:** abrir un dropdown de acciones secundarias (`p-menu`). Útil cuando hay más de 3-4 acciones por fila y los icon-only saturarían.

| Atributo | Canon |
|---|---|
| Estilo | Icon-only: `[rounded]="true" [text]="true" severity="secondary"` · Con label: default `severity="secondary"` |
| Labels canónicos | "Acciones" (cuando lleva label) · sin label cuando es icon-only |
| Iconos típicos | `pi-ellipsis-v` (tres puntos vertical) |
| Ubicación | Fila de tabla (alternativa al stack de icon-only) · Header de panel · Toolbar |
| Accesibilidad | `pTooltip="Más acciones"` o label visible; `aria-haspopup="menu"` en el botón; el `p-menu` asociado debe tener `aria-label` propio |

Orden estándar dentro del menú (ver CLAUDE.md): Acción principal · Acciones especiales · Separador · Acción destructiva al final.

---

### F9 · Adjuntar / cargar archivo

**Función:** abrir el selector de archivos para subir un documento (RUT, certificado, anexo).

| Atributo | Canon |
|---|---|
| Severity | `[outlined]="true"` (outlined enmarca bien la idea de "adjuntar") · `severity="secondary"` cuando es opcional · default cuando es la acción principal del paso |
| Labels canónicos | "Adjuntar [tipo]" (ej. "Adjuntar RUT", "Adjuntar certificado") · "Seleccionar archivo" · "Importar" |
| Iconos típicos | `pi-upload`, `pi-folder-open`, `pi-paperclip` |
| Ubicación | Sección de carga de documento en formulario · Paso de wizard donde se requiere el archivo |
| Accesibilidad | El input `<input type="file">` real va oculto pero accesible; el botón visible debe estar asociado con el input por `(click)` y por `<label for>` para que screen readers conecten ambos |

Después de cargar, mostrar nombre del archivo + botón para reemplazar/eliminar.

---

### F10 · Enviar / confirmación de acción

**Función:** enviar al backend o a un sistema externo. **Distinto de F1 ("Guardar"):** "Guardar" es local (mantiene el flujo abierto), "Enviar" cierra el flujo y dispara la transacción.

| Atributo | Canon |
|---|---|
| Severity | Default cobalto sólido **o** `severity="success"` cuando refuerza idea de "completado" |
| Labels canónicos | "Enviar", "Enviar reporte", "Enviar al CHIP central", "Enviar adjunto" |
| Iconos típicos | `pi-send`, `pi-paperclip` (en envío con adjunto) |
| Ubicación | Footer modal de confirmación · Último paso del wizard (sustituye al "Siguiente") · Pie de formulario terminal |
| Accesibilidad | Label visible; si la acción es irreversible, advertirlo en el modal previo |

Después de enviar, el toast de éxito debe ser explícito sobre **qué** se envió y a **dónde**.

---

### F11 · Copiar al portapapeles

**Función:** copiar contenido técnico (código, HTML, URL, ID) al portapapeles.

| Atributo | Canon |
|---|---|
| Severity | `severity="secondary" [outlined]="true"` — es acción auxiliar, no debe robar protagonismo del contenido que se copia |
| Labels canónicos | "Copiar código", "Copiar HTML", "Copiar enlace", "Copiar ID" |
| Iconos típicos | `pi-copy` |
| Ubicación | Junto al bloque de código/contenido a copiar (esquina superior derecha del bloque) |
| Accesibilidad | Después de copiar, dar feedback visual (cambiar icono a `pi-check` por 2s, o disparar toast corto) — el screen reader debe anunciar "Copiado al portapapeles" |

---

### F12 · Accesibilidad (controles a11y)

**Función:** ajustar parámetros globales de accesibilidad (tamaño de letra, contraste, modo oscuro).

| Atributo | Canon |
|---|---|
| Estilo | **Botones nativos `<button>`**, NO `p-button` — son parte del chrome global, no del flujo de la pantalla |
| Severity | Clase custom (`.a11y-btn` o similar); usar el token `--chip-cobalt-700` para focus |
| Labels canónicos | (no llevan label visible) — usar `aria-label` describiendo la acción concreta ("Aumentar tamaño de letra", "Cambiar contraste") |
| Iconos típicos | Iconos custom (no PrimeIcons necesariamente) |
| Ubicación | Toolbar superior del header (derecha) · Panel de accesibilidad flotante |
| Accesibilidad | `aria-label` obligatorio · estado actual comunicado por `aria-pressed` cuando aplique |

**Excepción de canon:** estos botones se rigen por las reglas WCAG (Resolución 1519/2020) más que por el canon PrimeNG. No intentar uniformarlos con `p-button`.

---

### F13 · Floating buttons (servicio)

**Función:** acceso rápido a features auxiliares que no son parte del flujo principal — chat de ayuda, contacto, "volver arriba", panel de accesibilidad.

| Atributo | Canon |
|---|---|
| Estilo | **Botones nativos `<button>`**, NO `p-button` — son chrome global · clases `floating-btn`, `floating-btn--service`, `back-to-top` |
| Posición | `position: fixed`, esquina inferior derecha (apilados verticalmente) · "Volver arriba" puede estar en borde inferior |
| Iconos típicos | SVG custom (silla de ruedas) · PrimeIcons (`pi-comments`, `pi-envelope`, `pi-arrow-up`) |
| Accesibilidad | `pTooltip` con la acción · `aria-label` describiendo la acción · z-index alto pero respetando el orden focal |

**Excepción de canon:** igual que F12, estos están fuera del canon PrimeNG porque son chrome global, no flujo.

---

### F14 · Toggles de estado

**Función:** cambiar entre dos estados (Activar/Desactivar, vista grid/lista, expandir/colapsar).

| Atributo | Canon |
|---|---|
| Estilo | Pares de botones donde el activo va sólido y el inactivo `[outlined]="true"`, con `severity="secondary"` · Para Activar/Desactivar en panel detalle: label dinámico `[label]="selectedX?.activo ? 'Desactivar' : 'Activar'"` |
| Labels canónicos | "Activar" / "Desactivar" (con label dinámico según estado) · Para layout toggle, sin label, sólo icono |
| Iconos típicos | `pi-check` / `pi-times` (estado) · `pi-th-large` / `pi-list` (layout) · `pi-chevron-down` / `pi-chevron-up` (expandir/colapsar) |
| Ubicación | Panel de detalle (Activar/Desactivar) · Toolbar de vista de datos (layout) · Headers expandibles |
| Accesibilidad | `aria-pressed` para indicar el estado actual — esto es lo que diferencia un toggle de un botón de acción común |

---

## Excepciones legítimas conocidas (catálogo)

Estas excepciones ya están validadas por el equipo. No "corregirlas" al hacer cleanup:

1. **Wizard Siguiente/Volver en `formularios.component`** — no son acciones primarias normales, son navegación (F4). El "Siguiente" sí va en cobalto sólido pero su comportamiento es navegar, no guardar.
2. **"Sí, revertir todos" en confirmación destructiva** — usa label largo a propósito para que el usuario lea exactamente qué confirma. No abreviar.
3. **Pares primaria+secundaria intencionales** — cuando hay dos acciones de igual peso semántico pero una debe destacar, una va en cobalto y otra en `[outlined]` aunque ambas sean "acciones". No poner las dos en cobalto.
4. **Botones nativos de accesibilidad (F12) y floating (F13)** — fuera del canon PrimeNG. No intentar convertirlos a `p-button`.
5. **Pasos del wizard (`<button class="form-wizard__step">`)** — son botones nativos con su propio patrón, no entran en este canon.

---

## Cuando un botón no encaja en ninguna familia

Si después de pasar por el árbol de decisión un botón no cae claramente en ninguna familia:

1. **No apliques canon a ciegas.** Es señal de que hay una excepción legítima o de que falta una familia.
2. **Documenta el caso:** archivo, línea, propósito del botón, por qué no encaja.
3. **Pregunta al usuario** antes de modificarlo: ¿es excepción contextual? ¿hay que crear una familia nueva? ¿hay que ajustarlo al patrón general?
4. **Si es excepción confirmada,** agrégala al catálogo de "Excepciones legítimas conocidas" de esta misma referencia.

---

## Entregable estándar al auditar pantallas existentes

Cuando recorres una pantalla revisando todos sus botones, al terminar reporta así:

```
Botones revisados en <pantalla>: N

Aplicados al canon:
- <familia>: M botones — sin cambios (ya cumplían) / ajustados (label/icono/severity)

Excepciones detectadas (no tocadas, requieren validación):
- <archivo:línea>: <descripción del botón> — propuesta de clasificación: <familia o "fuera de canon">

Botones que no encajan en ninguna familia:
- <archivo:línea>: <descripción> — qué función cumple
```

Esta lista es lo que se discute con el equipo antes del PR final.
