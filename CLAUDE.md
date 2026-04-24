# CHIP 2.0 Design System - Reglas del proyecto

## 🎯 Stack y herramientas

- **Framework**: Angular 19 (standalone components)
- **UI**: PrimeNG 19+ (PRIORITARIO - es lo que usan los desarrolladores)
- **Iconos**: PrimeIcons (`pi pi-*`)
- **Estilos**: SCSS con BEM, tokens en `src/styles.scss`
- **Compilador**: Angular CLI con HMR

**Regla de oro**: PrimeNG prevalece. Si hay conflicto entre Kit UI y PrimeNG, se usa PrimeNG y se ajusta visualmente para acercarse al Kit UI.

---

## 📐 Identidad visual (Kit UI 9.2 GOV.CO)

### Tipografías (obligatorio)
- **Títulos / encabezados**: `Nunito Sans` (Bold/SemiBold)
- **Cuerpo / párrafos**: `Verdana, Geneva, Tahoma, sans-serif` (Regular)
- Definidas en `--font-heading` y `--font-body`

### Colores principales
| Token | Hex | Uso |
|-------|-----|-----|
| `--chip-cobalt-700` | `#0943B5` | **Primario** (botones, links, focus) |
| `--chip-cobalt-50` | `#E8EDF8` | Fondo claro de acción |
| `--chip-bg-solitude` | `#EBF0FA` | Fondo informativo |
| `--chip-bg-corn-silk` | `#FFF8E1` | Fondo aviso |
| `--chip-bg-white-smoke` | `#F5F5F5` | Fondo default |

### Colores informativos (Kit UI)
| Token | Hex | Uso |
|-------|-----|-----|
| `--chip-success` | `#4CAF50` | Verde - éxito/completado |
| `--chip-warning` | `#FBC02D` | Amarillo - pendiente/atención |
| `--chip-danger` | `#F44336` | Rojo - error/urgencia |
| `--chip-info` | `#0943B5` | Azul - informativo |

### Cuadrícula (Bootstrap 5.0)
- **Container**: max-width 1200px, padding 24px
- **Gap**: 24px por defecto entre columnas
- **Breakpoints**: `<576 / ≥576 / ≥768 / ≥992 / ≥1200 / ≥1400`
- **Spacing base**: múltiplos de 8px

---

## 🧩 Componentes - reglas de uso

### Botones (PrimeNG `p-button`)
- **Acción principal**: `<p-button label="..." />` (cobalto sólido)
- **Acción secundaria**: `[outlined]="true"` `severity="secondary"`
- **Acción terciaria**: `[text]="true"`
- **Destructiva**: `severity="danger"`
- **Solo icono**: SIEMPRE incluir `[attr.aria-label]="..."`
- **Centrar botones**: envolver en `<div>` con `display: flex; justify-content: center` (PrimeNG aplica `styleClass` al `<button>` interno, NO al wrapper)

### Modales (PrimeNG `p-dialog`)
- `[modal]="true"` `[draggable]="false"` `[closeOnEscape]="true"`
- Width 480-520px (no fullscreen)
- Confirmaciones encima de rechazos en footer
- Mensajes claros y directos

### Notificaciones (PrimeNG `p-toast` + `p-message`)
- Toast aparece arriba (default PrimeNG)
- Verde = éxito, Rojo = error, Amarillo = atención, Azul = info
- Mensaje corto y conciso
- Toast con `life: 4000` ms mínimo para lectura

### Tablas (PrimeNG `p-table`)
- `[stripedRows]="true"` `[rowHover]="true"`
- Pagination: `[rows]="10"` `[rowsPerPageOptions]="[5, 10, 25]"`
- `currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"`
- **Caption obligatoria** (sr-only) para screen readers
- Empty state con `<i class="pi pi-inbox" aria-hidden="true">` + mensaje

### Forms - Entradas de texto
- Label asociado con `for`/`id` (o `inputId` para PrimeNG)
- `aria-required="true"` en obligatorios
- `aria-invalid="true"` cuando inválido
- `aria-describedby` apuntando al `<small>` de error
- Mensajes de error con cómo solucionar
- Validación visual (`ng-invalid` `ng-dirty`)
- `autocomplete="..."` apropiado

### Filtros - Patrón estandarizado
- Usar clases globales: `.chip-filters` + variantes `--2col`, `--3col`, `--4col`
- Toggle colapsable con `[attr.aria-expanded]` + `aria-controls`
- Chips removibles cuando colapsado: `<p-chip [removable]="true">`
- "Limpiar todo" cuando hay filtros activos

### Iconografía
- Usar PrimeIcons (`pi pi-*`)
- Icono decorativo: `aria-hidden="true"`
- Icono de acción: SIEMPRE con `aria-label` o texto visible
- Tamaño base: 16px, mínimo 14px

---

## ♿ Accesibilidad (WCAG 2.1 AA - Resolución 1519/2020)

### Reglas obligatorias
1. **Skip link** "Saltar al contenido principal" (ya existe en `app.component.html`)
2. **Contraste**: 4.5:1 textos normales, 3:1 textos grandes/iconos
3. **Navegación por teclado**: TODO interactivo accesible con Tab/Enter/Space/Esc
4. **Focus visible**: `:focus-visible` con `outline: 2px solid var(--chip-cobalt-500)`
5. **Etiquetas semánticas**: `<header>`, `<nav>`, `<main>`, `<footer>`, `<button>` (no `<div>` clickeable)
6. **role="main"** en el contenedor principal de cada página
7. **role="region" aria-label="..."** en secciones importantes
8. **aria-live="polite"** en contenido dinámico (chips, contadores, alerts)
9. **Asterisco `*`** con `<span class="field-required">*</span>` + `aria-required="true"`

### Formularios accesibles
- Cada label asociado con su input (`for` + `id`)
- Errores cerca del campo con `aria-describedby`
- Mensajes con texto explícito, no solo color
- Validación válido/inválido con borde de color diferente
- Para campos `<p-select>` usar `inputId="..."` (no `id`)

### Iconos en botones
- Solo-icono: `aria-label` obligatorio
- Con texto: el texto sirve como label
- Decorativos: `aria-hidden="true"`

---

## 🎨 Patrones de pantalla

### Header de página (compartido global)
```html
<div class="usr-header"> <!-- o cpw-header, form-header, etc. -->
  <h1 class="usr-header__title">Título</h1>
  <div class="usr-header__row">
    <p class="usr-header__desc">Descripción.</p>
    <p-button label="Acción primaria" icon="pi pi-..." />
  </div>
</div>
```

Los `*-header` están unificados en `src/styles.scss`. Para una nueva pantalla, agregar la clase a la lista compartida.

### Estado vacío en tablas (mensaje uniforme)
```html
<ng-template #emptymessage>
  <tr>
    <td [attr.colspan]="N" class="usr-empty">
      <i class="pi pi-inbox" aria-hidden="true"></i>
      <p>No se encontraron resultados para los filtros aplicados.</p>
    </td>
  </tr>
</ng-template>
```

### Menús contextuales (orden estándar)
1. Acción principal (Editar, Configurar...)
2. Acciones especiales (Activar/Desactivar, Validar...)
3. **Separador**
4. Acción destructiva (Eliminar) al final

### Diálogos de confirmación
- Header descriptivo: "Confirmar Eliminación"
- Icono de alerta: `pi-exclamation-triangle` `aria-hidden="true"`
- Footer: Cancelar (text) + Acción (severity acorde)
- `[modal]="true"` `[draggable]="false"`

---

## 🛡️ Seguridad y módulo de Login

Reglas del Kit UI:
- Asterisco `*` explicado textualmente
- Errores con texto explícito (no solo color)
- Borde de color diferente para válido/inválido
- Bloqueo tras N intentos con vías de salida (soporte)
- "Mostrar contraseña" toggle accesible (`role="button"` + keyboard)

---

## 📦 Plantillas de correo HTML

### Reglas obligatorias (compatibilidad email)
- **Tablas** para layout (NO flex/grid)
- **Inline CSS** (NO clases externas)
- Width fijo 600px
- Imágenes con dimensiones absolutas
- Preheader invisible (texto preview en bandeja)
- Variables como `{{nombre_variable}}` para que el backend reemplace
- Probadas en Gmail + Outlook + Apple Mail

### Estructura base
- Header con franja cobalto (`#0943B5`)
- Body con padding 32px
- Footer con créditos GOV.CO + link soporte
- Marca "Portal del Estado Colombiano · GOV.CO" al final

---

## 🚫 Lo que NO hacer

- ❌ NO usar `<div (click)>`. Usar `<button>` o agregar `role="button" tabindex="0" (keydown.enter) (keydown.space)`
- ❌ NO usar bullets `<ul>` con `padding-left: 20px` -- preferir lista de items con icono `pi-check`
- ❌ NO usar colores tipo `#BDBDBD` para texto sobre blanco (no pasa contraste). Usar `--chip-grey-400` o más oscuro
- ❌ NO mezclar tipografías fuera de Nunito Sans / Verdana
- ❌ NO usar `position: absolute` para iconos dentro de inputs. Usar `<p-iconfield>` + `<p-inputicon>`
- ❌ NO crear archivos de documentación (.md) sin que el usuario lo pida
- ❌ NO agregar features no solicitadas. Hacer solo lo que el usuario pida
- ❌ NO usar `let` para variables que no cambian. Usar `const`
- ❌ NO duplicar estilos. Si una pantalla nueva usa el mismo header, agregarla a la lista compartida en `src/styles.scss`

---

## ⚙️ Comandos de ejecución local

Este equipo NO tiene Node.js global. Usar el binario embebido de Cursor:

```bash
/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node \
  ./node_modules/.bin/ng serve --open
```

Para build:
```bash
/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node \
  ./node_modules/.bin/ng build --configuration=development
```

---

## 🔍 Decisiones de diseño tomadas

- **Sidebar colapsable** estilo VS Code (botón flotante en el borde derecho)
- **Filtros colapsables con chips** unificados en todas las pantallas
- **Master-detail con miga de pan** para navegación jerárquica
- **Sticky bar de cambios** en editores con muchos cambios pendientes
- **Headers sticky** (govco-topbar + app-header + sidebar) durante scroll
- **Pantallas dentro del layout app** (con sidebar visible) para fines de demo del design system
