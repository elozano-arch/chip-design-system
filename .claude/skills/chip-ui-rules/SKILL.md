---
name: chip-ui-rules
description: Reglas obligatorias de diseño e implementación UI para el proyecto CHIP 2.0 (Angular 19 + PrimeNG + Kit UI 9.2 GOV.CO). Activar SIEMPRE que se vaya a crear, modificar, auditar o ajustar visualmente cualquier pantalla, componente, formulario, botón, lista desplegable, dropdown, select, multiselect, tabla, header, modal, card, icono u otro elemento de interfaz, incluso si el usuario no menciona explícitamente "diseño", "UI" o "estilos" — cualquier trabajo visual del proyecto debe pasar por estas reglas. Incluye el canon de botones por familia funcional (acción primaria, secundaria, destructiva, navegación de wizard, filtros, descarga, icon-only en tabla, menú contextual, adjuntar, enviar, copiar, accesibilidad, floating, toggles) y el canon de listas desplegables (p-select / p-select [filter] / p-multiSelect, con búsqueda obligatoria a partir de 10 opciones). Cubre Kit UI 9.2 GOV.CO, co-branding corporativo (sólo en cabezote), consistencia de componentes (altura de inputs, prioridad de PrimeNG), criterios UX y preparación para despliegue en Vercel. Úsala también cuando se revise código existente buscando consistencia visual, cuando se normalicen botones o dropdowns en pantallas existentes, o cuando se pregunte si una pantalla está "lista".
metadata:
  type: project
---

# Reglas de diseño e implementación UI — CHIP 2.0

Estas reglas son **obligatorias** para cualquier trabajo de UI en este proyecto. Aplican al diseñar pantallas nuevas, modificar pantallas existentes, crear componentes, ajustar estilos, o revisar código visual.

Antes de implementar nada, lee y aplica las reglas que siguen. Al terminar, verifica el [criterio de finalización](#criterio-de-finalización) — una pantalla **no está terminada** hasta que cumple todos los puntos.

---

## Recursos de referencia (siempre disponibles)

El proyecto tiene dos PDFs en la carpeta `docs/` que son la fuente de verdad del diseño:

| Archivo | Qué contiene | Cuándo consultarlo |
|---------|--------------|---------------------|
| `docs/kit-ui-9-2.pdf` | Kit UI 9.2 GOV.CO — colores, iconografía, recursos gráficos, ejemplos de pantallas, componentes | Antes de diseñar/implementar **cualquier** pantalla. Revisar especialmente las secciones de ejemplos, recursos gráficos e iconografía **antes** de las secciones de pantallas |
| `docs/document.pdf` | Manual de identidad visual corporativa (co-branding) | Antes de tocar el header/cabezote de cualquier página |

Estos PDFs son grandes — si necesitas consultar una sección específica, usa `Read` con el parámetro `pages` para leer rangos concretos (máx 20 páginas por llamada).

También revisar siempre el `CLAUDE.md` raíz del proyecto, que tiene tokens, patrones y reglas técnicas complementarias.

---

## Las 6 reglas

### 1. Respetar el sistema de diseño

- Aplicar los lineamientos del Kit UI 9.2 GOV.CO (`docs/kit-ui-9-2.pdf`).
- Usar los colores, tipografías, iconografía, recursos y componentes definidos en el design system del proyecto (ver tokens en `src/styles.scss` y reglas en `CLAUDE.md`).
- **Antes de diseñar una pantalla nueva**, revisar las secciones del Kit UI **previas** a las pantallas: ejemplos visuales, recursos gráficos e iconografía. Esto evita reinventar patrones que ya existen.

**Por qué:** el Kit UI 9.2 es la guía oficial GOV.CO. Salirse de él rompe la coherencia con el resto de productos del Estado y genera retrabajo cuando un revisor lo señale.

### 2. Aplicar correctamente el co-branding

- El co-branding (logo institucional + GOV.CO) se aplica **únicamente** en el cabezote/header de las páginas.
- **No** aplicarlo en otros componentes, modales, footers internos, cards, ni en ninguna otra sección — a menos que el usuario lo pida explícitamente.
- Para detalles de uso del co-branding (proporciones, espacios, versiones), consultar `docs/document.pdf`.

**Por qué:** el manual corporativo restringe el uso del co-branding al cabezote para mantener el peso visual correcto y evitar saturación. Aplicarlo en otros lugares es un error de marca.

### 3. Mantener consistencia en los componentes

- **Altura de inputs:** respetar el alto ya definido en el proyecto. No introducir alturas nuevas; reutilizar las que ya están. Si no estás seguro de cuál usar, revisa un input existente del proyecto y replícalo.
- **Consistencia visual** entre botones, formularios, tablas, cards, iconos y cualquier otro elemento — todos deben sentirse parte del mismo sistema (mismos radios, sombras, colores, espaciados).
- **PrimeNG primero:** priorizar los componentes de PrimeNG cuando sean compatibles con el Kit UI. Es lo que usan los desarrolladores y lo que el proyecto ya tiene cableado.
- **Si PrimeNG no coincide visualmente con el Kit UI:** adaptarlo con estilos personalizados (SCSS, `:host ::ng-deep` con cuidado, tokens del sistema). Nunca cambiar a otra librería ni reinventar el componente desde cero.

**Por qué:** la consistencia es lo que hace que un design system se sienta sólido. Una altura distinta en un input rompe la sensación de producto profesional. Cambiar de librería fragmenta la base y multiplica el mantenimiento.

### 4. Cuidar siempre la experiencia de usuario

Antes de considerar una pantalla terminada, validar desde UX:

- **Jerarquía visual:** ¿lo más importante salta a la vista primero?
- **Espaciado:** ¿hay aire suficiente? ¿el grid de 8px se respeta?
- **Legibilidad:** ¿el contraste pasa AA (4.5:1 texto normal, 3:1 texto grande)?
- **Alineación:** ¿los elementos están alineados a un grid coherente?
- **Estados de interacción:** hover, focus, active, disabled, loading, error, empty — ¿todos están diseñados?
- **Accesibilidad básica:** labels asociados, `aria-*` cuando corresponde, navegación por teclado, focus visible.
- **Consistencia general:** ¿se parece a las otras pantallas del proyecto?

Una pantalla que funciona técnicamente pero no es clara o agradable **no está terminada**.

**Por qué:** un design system existe para hacer la vida del usuario más fácil. Si el resultado no se siente bien al usarlo, las reglas técnicas no compensan.

### 5. Garantizar compatibilidad con Angular

- Todo debe funcionar en Angular 19 con componentes standalone.
- Seguir buenas prácticas: componentes reutilizables, organizados, fáciles de mantener; `const` donde no haya reasignación; tipado correcto; signals/inputs/outputs modernos cuando aplique.
- **No** usar soluciones que dependan de frameworks o librerías incompatibles con Angular (React, Vue, jQuery, Bootstrap JS, etc.).
- Mantener separación: lógica en `.ts`, plantilla en `.html`, estilos en `.scss` (BEM, tokens, sin valores hardcoded cuando exista un token).

**Por qué:** este proyecto es Angular puro. Cualquier dependencia incompatible se vuelve deuda técnica inmediata.

### 6. Preparar el proyecto para despliegue (Vercel)

- La implementación debe poder ejecutarse localmente y luego desplegarse en Vercel sin ajustes especiales.
- No depender de configuración local específica de la máquina que no esté versionada.
- Las pantallas deben funcionar como demos reales, no como prototipos estáticos — datos mockeados está bien, pero la interacción debe ser real (clicks, formularios, validaciones, navegación).

**Por qué:** el objetivo del proyecto es mostrar las pantallas funcionando en Vercel. Algo que sólo corre en una máquina específica no sirve.

---

## Canon de botones y listas desplegables

Esta sección funciona en **dos modos**. Identifica primero cuál aplica al contexto — la forma de trabajar es distinta:

| Modo | Cuándo aplica | Cómo se trabaja |
|---|---|---|
| **A — Pantalla nueva** | Estás creando los botones/dropdowns desde cero | Eliges la familia que necesitas y aplicas el canon directamente. Sin clasificación ni lista de excepciones — tú estás decidiendo la función. |
| **B — Normalización de pantalla existente** | Estás auditando o ajustando botones/dropdowns que ya están en el código | Paso 0 obligatorio: clasifica antes de tocar. Entregable: lista de excepciones detectadas para validar con un dev del equipo. |

El detalle completo vive en los reference files; aquí abajo está lo mínimo para arrancar en cada modo.

### Modo A — Pantalla nueva (flujo directo)

Cuando creas un botón o dropdown nuevo, **ya sabes qué función tendrá** porque tú lo estás eligiendo. La skill funciona como manual de referencia, no como cuestionario:

1. **Identifica la familia que vas a crear.** "Voy a poner un Crear" → F1 Primaria. "Necesito el par Limpiar+Buscar al pie de los filtros" → F5 Filtros. "Icon-only de Editar en fila de tabla" → F7. Si dudas entre dos familias, mira la tabla de las 14 familias más abajo.
2. **Consulta el canon de esa familia** (severity, label, icono, ubicación, accesibilidad) en la tabla resumen y, si necesitas detalle, en `references/canon-botones.md`.
3. **Aplícalo directamente.** No hay nada que "preguntar" — el canon te dice cómo construirlo correctamente.

Lo mismo con dropdowns: decide selección única o múltiple, cuenta las opciones para saber si activar `[filter]`, aplica el componente que corresponda (`p-select` / `p-select [filter]` / `p-multiSelect`). Detalle en `references/canon-dropdowns.md`.

### Modo B — Normalización de pantalla existente (Paso 0: clasifica antes de tocar)

Hay ~253 botones en el código y muchos no siguen el patrón general **a propósito**. Antes de modificar un botón existente, identifica su **función real**, no su verbo. El "Siguiente" de un wizard no es acción primaria — es navegación. El "Sí, revertir todos" es destructivo aunque diga "Sí". Aplicar el canon a ciegas genera regresiones; aplicarlo después de clasificar genera consistencia real.

Lo mismo vale para dropdowns existentes: revisa si el tipo es correcto y si necesita búsqueda según el número real de opciones cargadas.

**Flujo de normalización:**

1. **Recorre** los botones/dropdowns de la pantalla.
2. **Clasifica** cada uno usando el árbol de decisión de `references/canon-botones.md` (botones) o el de `references/canon-dropdowns.md` (dropdowns).
3. **Aplica el canon** donde la clasificación es clara y el patrón no se cumple.
4. **Lista las excepciones** que detectes (botones intencionalmente raros, casos que no encajan en ninguna familia). NO las modifiques — déjalas en el entregable para validar con un dev del equipo que conozca el código (ver memoria sobre [[chip-team-cris]]).
5. **Reporta el entregable** al final de la auditoría (formato más abajo).

### Familias de botones (14)

| # | Familia | Cuándo aplica | Severity/estilo |
|---|---|---|---|
| F1 | **Acción primaria** | Guardar, Confirmar, Crear, Aceptar | Cobalto sólido (default) |
| F2 | **Acción secundaria** | Cancelar, Cerrar — acompaña a una primaria | `secondary` + `[text]` o `[outlined]` |
| F3 | **Destructiva** | Eliminar, Revertir | `severity="danger"` |
| F4 | **Navegación wizard** | Siguiente, Anterior, Volver — pasos multietapa | Siguiente cobalto + `iconPos="right"`; Volver `secondary [outlined]` |
| F5 | **Filtros** | Par "Limpiar" + "Buscar" al pie del panel de filtros | Buscar default; Limpiar `secondary [outlined]` o `[text]` |
| F6 | **Descarga/exportación** | Descargar PDF/XLSX, Exportar | `success` o `secondary [outlined]`; icon-only en tabla |
| F7 | **Icon-only en tabla** | Ver, Editar, Eliminar por fila | `[rounded] [text]` con tooltip; severity según acción |
| F8 | **Menú contextual** | Ellipsis (tres puntos) que abre más acciones | `[rounded] [text] secondary` |
| F9 | **Adjuntar archivo** | Subir documento, importar | `[outlined]` |
| F10 | **Enviar / confirmación** | Enviar al backend (distinto de Guardar local) | Default o `success` |
| F11 | **Copiar** | Copiar al portapapeles (código, HTML, enlace) | `secondary [outlined]` |
| F12 | **Accesibilidad** | Cambiar tamaño letra, contraste | `<button>` nativo (fuera del canon PrimeNG) |
| F13 | **Floating** | Chat, contacto, volver arriba, panel a11y | `<button>` nativo flotante |
| F14 | **Toggles** | Activar/Desactivar, vista grid/lista | Activo sólido + inactivo `[outlined]`; usar `aria-pressed` |

Cuando un botón no encaja claramente en ninguna, detente y avisa al usuario — probablemente sea una excepción legítima o haga falta una familia nueva.

### Listas desplegables — regla rápida

| Caso | Componente |
|---|---|
| 1 opción de pocas (≤10) | `p-select` sin filtro |
| 1 opción de muchas (>10) | `p-select [filter]` con `filterBy` y `filterPlaceholder` |
| Varias opciones | `p-multiSelect` (con `[filter]` si >10) |
| Lista enorme (>500) o dinámica desde backend | `p-select [filter]` con `(onFilter)` debounced |

Siempre `inputId` (no `id`) para que el `<label for>` asocie. Siempre `aria-required` y `aria-invalid` cuando aplique. Placeholder con verbo en imperativo ("Selecciona…").

### Referencias detalladas (leer al tocar botones / dropdowns)

| Quieres… | Lee… |
|---|---|
| Saber severity, label, icono, ubicación y excepciones exactas de cada familia de botones, con el árbol de decisión completo | `references/canon-botones.md` |
| Saber cómo configurar `p-select` / `p-multiSelect` con accesibilidad, validación, dependencias entre dropdowns y umbrales de búsqueda | `references/canon-dropdowns.md` |

Léelos cuando vayas a tocar botones o dropdowns concretos — no antes, no después. La SKILL.md no carga su contenido por defecto.

### Entregable al auditar pantallas existentes

Cuando recorras una pantalla normalizando botones o dropdowns, al terminar reporta:

```
<Pantalla>: N botones revisados / M dropdowns revisados.

Aplicados al canon:
- F1 Primaria: <conteo> — sin cambios / ajustados (label/icono/severity)
- F3 Destructiva: …

Excepciones detectadas (no tocadas, requieren validación):
- <archivo:línea>: <descripción> — clasificación propuesta: <familia o "fuera de canon">

Botones que no encajan en ninguna familia:
- <archivo:línea>: <descripción> — función que cumple
```

La lista de excepciones es lo que se discute con el equipo antes del PR final. Ese es el espíritu de la regla: el canon aplica donde encaja, y las excepciones se validan, no se aplastan.

---

## Criterio de finalización

Una pantalla o componente **sólo se considera terminado** cuando cumple **todos** estos puntos. Trátalo como checklist y verifica explícitamente cada uno antes de reportar el trabajo como completo:

- [ ] Cumple con el Kit UI 9.2 GOV.CO (`docs/kit-ui-9-2.pdf`).
- [ ] Respeta el manual de identidad visual corporativa (`docs/document.pdf`).
- [ ] El co-branding está **únicamente** en el cabezote/header (en ningún otro lugar).
- [ ] Usa correctamente los estilos, colores, iconografía y recursos del design system (tokens de `src/styles.scss`, PrimeIcons, tipografías Nunito Sans + Verdana).
- [ ] Mantiene el alto definido para los inputs (consistente con el resto del proyecto).
- [ ] Usa PrimeNG cuando es conveniente y compatible; si fue necesario adaptarlo, los estilos custom no rompen la coherencia.
- [ ] **Los botones siguen el canon por familia funcional** (severity, label, icono, ubicación) — ver `references/canon-botones.md`. Si se tocaron botones de una pantalla existente, las excepciones detectadas quedaron listadas para validar.
- [ ] **Las listas desplegables usan el componente correcto** (`p-select` / `p-select [filter]` / `p-multiSelect`) y activan búsqueda cuando hay más de 10 opciones — ver `references/canon-dropdowns.md`.
- [ ] Funciona correctamente en Angular 19 (compila sin errores, sin warnings de tipos, sin dependencias incompatibles).
- [ ] Puede visualizarse correctamente en el entorno preparado para Vercel.
- [ ] Ha sido revisado desde criterios UI/UX (jerarquía, espaciado, legibilidad, alineación, estados, accesibilidad básica, consistencia).

Si alguno de estos puntos no se cumple, **no reportar la tarea como terminada** — primero corregirlo. Si hay una limitación que impide cumplir un punto (p. ej. el usuario pidió algo que se sale del Kit UI), advertírselo al usuario antes de seguir.

---

## Flujo recomendado al recibir una tarea de UI

1. **Entender el alcance.** ¿Es una pantalla nueva, una modificación, un componente, un ajuste visual?
2. **Consultar referencias.** Revisar el Kit UI (secciones previas a las pantallas: ejemplos, recursos, iconografía) y, si toca el header, el manual de co-branding. Revisar también `CLAUDE.md` y el código de pantallas similares ya hechas.
3. **Identificar componentes PrimeNG aplicables.** Antes de escribir desde cero, ver si PrimeNG ya resuelve el caso.
4. **Aplicar el canon según el modo** (ver sección "Canon de botones y listas desplegables"):
   - **Modo A — pantalla nueva:** elige la familia que corresponde a cada botón/dropdown y aplica el canon directamente. Consulta los `references/` si necesitas el detalle.
   - **Modo B — normalización de pantalla existente:** Paso 0 obligatorio (clasificar antes de tocar) + lista de excepciones detectadas como entregable.
5. **Implementar** siguiendo las 6 reglas + el canon de la familia correspondiente.
6. **Revisar contra el criterio de finalización** punto por punto antes de cerrar la tarea.
7. **Probar visualmente.** Para cambios de UI, levantar el dev server y verificar en el navegador (la verificación de tipos no equivale a verificación visual).
