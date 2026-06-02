# Canon de listas desplegables — CHIP 2.0

Esta referencia define cómo elegir y configurar listas desplegables (dropdowns) en el proyecto. La regla central: **elegir el componente correcto según el caso de uso** (selección única vs múltiple, con búsqueda vs sin búsqueda) y **activar búsqueda cuando hay más de 10 opciones**.

**Aplica en dos modos** (igual que el canon de botones):

- **Modo A — pantalla nueva:** decides el caso de uso al diseñar el campo, eliges el componente correspondiente y aplicas el canon directamente.
- **Modo B — normalización de pantalla existente:** revisas si los dropdowns existentes usan el tipo correcto y si su `[filter]` corresponde al número real de opciones cargadas. Aquí también hay excepciones legítimas (filtros encadenados, selectores con jerarquía) que se listan, no se modifican a ciegas.

---

## Paso 0: identifica el caso de uso

Antes de elegir o tocar un dropdown, responde:

1. ¿El usuario va a seleccionar **una sola opción** o **varias**?
   - Una → `p-select`
   - Varias → `p-multiSelect`
2. ¿Cuántas opciones tiene la lista?
   - 10 o menos → sin filtro
   - 11 o más → `[filter]="true"` (búsqueda obligatoria)
3. ¿Las opciones son **estáticas** (cargadas al inicio) o **dinámicas** (dependen de otro dropdown, llamada al backend)?
   - Dinámicas → ver sección "Dependencias entre dropdowns"
4. ¿Es un dropdown de **filtros** (sobre una tabla) o de **formulario** (parte de un registro)?
   - Filtros → label corto, comportamiento de búsqueda inmediata o diferida según UX
   - Formulario → label completo + validación

---

## Elegir el componente correcto

### `p-select` — selección única

Uso por defecto cuando el usuario elige **un solo valor** de una lista cerrada.

```html
<label for="pais">País <span class="field-required">*</span></label>
<p-select
  inputId="pais"
  [options]="paises"
  [(ngModel)]="paisSeleccionado"
  optionLabel="nombre"
  optionValue="codigo"
  placeholder="Selecciona un país"
  [showClear]="true"
  aria-required="true"
  [attr.aria-invalid]="form.controls.pais.invalid && form.controls.pais.dirty"
  aria-describedby="pais-error"
/>
<small id="pais-error" *ngIf="form.controls.pais.invalid && form.controls.pais.dirty" class="p-error">
  Selecciona un país para continuar
</small>
```

**Reglas:**
- Usar `inputId` (no `id`) para que el label asocie correctamente — PrimeNG genera el input real internamente.
- `placeholder` describe la acción ("Selecciona un país"), no es un valor por defecto.
- `[showClear]="true"` cuando el campo es opcional y se permite "ningún valor".
- Si hay un valor inicial, NO usar `[showClear]` salvo que el negocio permita deseleccionar.

---

### `p-select` con búsqueda — más de 10 opciones

Activar `[filter]="true"` cuando la lista tiene **más de 10 opciones**. El umbral exacto puede variar, pero la regla práctica es: si el usuario necesita scrollear para encontrar lo que busca, necesita búsqueda.

```html
<label for="entidad">Entidad <span class="field-required">*</span></label>
<p-select
  inputId="entidad"
  [options]="entidades"
  [(ngModel)]="entidadSeleccionada"
  optionLabel="nombre"
  optionValue="id"
  placeholder="Selecciona una entidad"
  [filter]="true"
  filterBy="nombre"
  [resetFilterOnHide]="true"
  filterPlaceholder="Buscar entidad..."
  [showClear]="true"
/>
```

**Reglas:**
- `filterBy="nombre"` define el campo por el que se busca — si la búsqueda debe abarcar varios campos, separar por coma: `filterBy="nombre,codigo"`.
- `[resetFilterOnHide]="true"` para que al cerrar y reabrir el dropdown la búsqueda se limpie (evita confusión en sesiones largas).
- `filterPlaceholder` en español y específico al contexto.

**Excepciones legítimas para no activar `[filter]`:**
- Listas con orden semántico fuerte (días de la semana, meses, prioridad alta/media/baja) aunque tengan >10 opciones — la búsqueda no aporta porque el usuario las recorre visualmente.
- Listas donde la propia agrupación visual (con `[group]`) ya resuelve la navegación.

---

### `p-multiSelect` — selección múltiple

Cuando el usuario puede elegir **varios valores** de la lista.

```html
<label for="permisos">Permisos asignados</label>
<p-multiSelect
  inputId="permisos"
  [options]="permisosDisponibles"
  [(ngModel)]="permisosAsignados"
  optionLabel="nombre"
  optionValue="codigo"
  placeholder="Selecciona permisos"
  [filter]="true"
  filterBy="nombre"
  [showHeader]="true"
  display="chip"
  [maxSelectedLabels]="3"
  selectedItemsLabel="{0} permisos seleccionados"
/>
```

**Reglas:**
- `display="chip"` cuando se quiere ver cada selección como chip individual (mejor para hasta ~5 selecciones).
- `display="comma"` (default) cuando se prefiere texto compacto.
- `[maxSelectedLabels]` para que cuando haya muchas selecciones se compacte a "N items" — evita que el campo crezca verticalmente.
- `selectedItemsLabel` con plural en español ("{0} permisos seleccionados", no "{0} items").
- Para listas de **más de 10 opciones**, el `[filter]` es prácticamente siempre obligatorio en multiSelect porque la lista crece más rápido.

---

## Umbral de búsqueda — regla general

| Tamaño de la lista | Componente | Búsqueda |
|---|---|---|
| 2-5 opciones | `p-select` o radio buttons (si son acciones excluyentes muy visibles) | No |
| 6-10 opciones | `p-select` | No (a menos que el usuario tipée más rápido que mire) |
| 11-50 opciones | `p-select [filter]` | Sí |
| 50+ opciones | `p-select [filter]` con búsqueda al backend (`(onFilter)`) | Sí, posiblemente con debounce |

**Cuando la lista es muy grande (>500) o viene del backend:** usar `(onFilter)` con debounce para no atacar el servidor en cada tecla:

```ts
onEntidadFilter = debounce((event: any) => {
  this.entidadService.buscar(event.filter).subscribe(...);
}, 300);
```

---

## Accesibilidad (obligatoria)

Para que un dropdown sea accesible WCAG 2.1 AA:

| Requisito | Cómo |
|---|---|
| Label asociado | `<label for="x">` apunta a `inputId="x"` del `p-select` |
| Campo requerido | `aria-required="true"` + asterisco visual con `<span class="field-required">*</span>` |
| Error visible | `aria-invalid="true"` cuando inválido + `aria-describedby="x-error"` apuntando al `<small>` con el texto |
| Navegación teclado | Funciona por defecto en PrimeNG: Tab para enfocar, Space/Enter para abrir, ↑↓ para navegar, Enter para seleccionar, Esc para cerrar |
| Focus visible | Heredado del proyecto (`:focus-visible` con `outline: 2px solid var(--chip-cobalt-500)`) |
| Texto del error | Explica **cómo solucionar**, no sólo "Campo inválido". Ej: "Selecciona una entidad para continuar" |

---

## Labels y placeholders

| Caso | Patrón |
|---|---|
| Label visible (siempre) | `<label for="x">Texto</label>` — encima del input, no flotante |
| Campo obligatorio | `<label>Texto <span class="field-required">*</span></label>` |
| Placeholder | Verbo en imperativo o sustantivo descriptivo: "Selecciona una entidad", "País", "Estado" |
| Texto de búsqueda interna | `filterPlaceholder="Buscar [tipo]..."` en español, con elipsis |
| Mensaje "sin resultados" | `emptyFilterMessage="No se encontraron resultados"` |

**Anti-patrón:** label dentro del placeholder ("Entidad: selecciona...") — el label debe estar siempre visible para usuarios que tabulan rápido.

---

## Validación visual

Estados que el dropdown debe mostrar claramente:

- **Default** — borde gris, fondo blanco.
- **Hover** — borde cobalto suave.
- **Focus** — outline cobalto visible (`:focus-visible`).
- **Disabled** — opacidad reducida, cursor `not-allowed`, sin hover.
- **Inválido** — borde rojo + mensaje de error debajo con texto explícito.
- **Loading** (cuando carga opciones async) — spinner dentro del campo o skeleton.

PrimeNG aplica `ng-invalid` y `ng-dirty` automáticamente cuando se usa con `FormControl` o `[(ngModel)]`. No reescribir esa lógica.

---

## Dependencias entre dropdowns

Cuando un dropdown depende del valor de otro (ej. Departamento → Municipio):

1. **Deshabilitar el dependiente** mientras el padre no tenga valor: `[disabled]="!departamentoSeleccionado"`.
2. **Limpiar el dependiente** cuando el padre cambia: `(onChange)="municipioSeleccionado = null"`.
3. **Cargar opciones del dependiente** sólo después de elegir el padre, idealmente con loading visible.
4. **No mezclar valores** entre cambios — si el usuario cambió de Antioquia a Cundinamarca, no dejes "Medellín" en el dropdown de municipio.

---

## Excepciones legítimas conocidas

1. **Filtros encadenados con búsqueda al backend** — pueden tener menos de 10 opciones visibles pero igual usar `[filter]` porque la búsqueda dispara la query.
2. **Selectores con jerarquía / tree** (categorías padre/hijo) — pueden requerir `p-treeSelect` en lugar de `p-select`; documentar el motivo.
3. **Dropdowns "informativos" en consulta** (no editables, sólo muestran el valor actual) — pueden venir como `<p-tag>` o texto plano, no como `p-select disabled`.
4. **Dropdowns con virtual scrolling** — para listas con cientos de items se usa `[virtualScroll]="true" [virtualScrollItemSize]="38"`; la búsqueda se vuelve obligatoria.

---

## Cuando un dropdown no encaja

Si después de pasar por el árbol de decisión no sabes qué tipo usar:

1. No fuerces `p-select` por defecto.
2. Pregunta al usuario el caso de negocio exacto.
3. Considera alternativas: ¿debería ser `p-autoComplete`? ¿`p-treeSelect`? ¿`p-cascadeSelect`? ¿`p-listbox` inline?
4. Si confirmas un patrón nuevo recurrente, agrégalo a esta referencia.

---

## Entregable estándar al auditar dropdowns

Al recorrer una pantalla revisando todos sus dropdowns:

```
Dropdowns revisados en <pantalla>: N

Componente correcto:
- <archivo:línea>: <campo> — <p-select / [filter] / p-multiSelect> — OK / ajustado

Búsqueda activada según umbral:
- <archivo:línea>: <campo> con M opciones — [filter] OK / [filter] añadido / [filter] removido por estar en lista corta

Accesibilidad:
- <archivo:línea>: <campo> — label/inputId OK / corregido · aria-* OK / añadido

Excepciones detectadas (no tocadas):
- <archivo:línea>: <campo> — descripción + propuesta
```
