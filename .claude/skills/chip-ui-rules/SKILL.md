---
name: chip-ui-rules
description: Reglas obligatorias de diseño e implementación UI para el proyecto CHIP 2.0 (Angular 19 + PrimeNG + Kit UI 9.2 GOV.CO). Activar SIEMPRE que se vaya a crear, modificar o ajustar visualmente cualquier pantalla, componente, formulario, botón, tabla, header, modal, card, icono u otro elemento de interfaz, incluso si el usuario no menciona explícitamente "diseño", "UI" o "estilos" — cualquier trabajo visual del proyecto debe pasar por estas reglas. Cubre Kit UI 9.2 GOV.CO, co-branding corporativo (sólo en cabezote), consistencia de componentes (altura de inputs, prioridad de PrimeNG), criterios UX y preparación para despliegue en Vercel. Úsala también cuando se revise código existente buscando consistencia visual o cuando se pregunte si una pantalla está "lista".
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

## Criterio de finalización

Una pantalla o componente **sólo se considera terminado** cuando cumple **todos** estos puntos. Trátalo como checklist y verifica explícitamente cada uno antes de reportar el trabajo como completo:

- [ ] Cumple con el Kit UI 9.2 GOV.CO (`docs/kit-ui-9-2.pdf`).
- [ ] Respeta el manual de identidad visual corporativa (`docs/document.pdf`).
- [ ] El co-branding está **únicamente** en el cabezote/header (en ningún otro lugar).
- [ ] Usa correctamente los estilos, colores, iconografía y recursos del design system (tokens de `src/styles.scss`, PrimeIcons, tipografías Nunito Sans + Verdana).
- [ ] Mantiene el alto definido para los inputs (consistente con el resto del proyecto).
- [ ] Usa PrimeNG cuando es conveniente y compatible; si fue necesario adaptarlo, los estilos custom no rompen la coherencia.
- [ ] Funciona correctamente en Angular 19 (compila sin errores, sin warnings de tipos, sin dependencias incompatibles).
- [ ] Puede visualizarse correctamente en el entorno preparado para Vercel.
- [ ] Ha sido revisado desde criterios UI/UX (jerarquía, espaciado, legibilidad, alineación, estados, accesibilidad básica, consistencia).

Si alguno de estos puntos no se cumple, **no reportar la tarea como terminada** — primero corregirlo. Si hay una limitación que impide cumplir un punto (p. ej. el usuario pidió algo que se sale del Kit UI), advertírselo al usuario antes de seguir.

---

## Flujo recomendado al recibir una tarea de UI

1. **Entender el alcance.** ¿Es una pantalla nueva, una modificación, un componente, un ajuste visual?
2. **Consultar referencias.** Revisar el Kit UI (secciones previas a las pantallas: ejemplos, recursos, iconografía) y, si toca el header, el manual de co-branding. Revisar también `CLAUDE.md` y el código de pantallas similares ya hechas.
3. **Identificar componentes PrimeNG aplicables.** Antes de escribir desde cero, ver si PrimeNG ya resuelve el caso.
4. **Implementar** siguiendo las 6 reglas.
5. **Revisar contra el criterio de finalización** punto por punto antes de cerrar la tarea.
6. **Probar visualmente.** Para cambios de UI, levantar el dev server y verificar en el navegador (la verificación de tipos no equivale a verificación visual).
