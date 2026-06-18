import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-botones',
  standalone: true,
  imports: [CommonModule, ButtonModule, DividerModule, TooltipModule, MenuModule],
  templateUrl: './botones.component.html',
  styleUrl: './botones.component.scss',
})
export class BotonesComponent {
  // Ejemplo principal F8 — CRUD estándar (mismo modelo que tree-table / home)
  menuItems: MenuItem[] = [
    { label: 'Ver detalle', icon: 'pi pi-eye' },
    { label: 'Editar', icon: 'pi pi-pencil' },
    { label: 'Duplicar', icon: 'pi pi-copy' },
    { separator: true },
    { label: 'Eliminar', icon: 'pi pi-trash' },
  ];

  /* ───────────────────────────────────────────────────────────────
     Submenús generalizados — los menús "..." reales que se repiten
     en las pantallas. Se documentan aquí para que el design system
     comunique el patrón F8 tal como se usa, no un ejemplo genérico.
     ─────────────────────────────────────────────────────────────── */

  // tree-table estándar / home — listado con CRUD completo
  menuCrud: MenuItem[] = [
    { label: 'Ver detalle', icon: 'pi pi-eye' },
    { label: 'Editar', icon: 'pi pi-pencil' },
    { label: 'Duplicar', icon: 'pi pi-copy' },
    { separator: true },
    { label: 'Eliminar', icon: 'pi pi-trash' },
  ];

  // Usuarios — acciones según el estado de la fila (activo)
  menuUsuario: MenuItem[] = [
    { label: 'Editar', icon: 'pi pi-pencil' },
    { label: 'Desactivar', icon: 'pi pi-ban' },
    { separator: true },
    { label: 'Eliminar', icon: 'pi pi-trash' },
  ];

  // Roles — gestión del rol y sus permisos
  menuRol: MenuItem[] = [
    { label: 'Modificar datos del rol', icon: 'pi pi-pencil' },
    { label: 'Modificar permisos del rol', icon: 'pi pi-shield' },
    { separator: true },
    { label: 'Eliminar rol', icon: 'pi pi-trash' },
  ];

  // Formularios — registro y protocolo de importación
  menuFormulario: MenuItem[] = [
    { label: 'Registro manual', icon: 'pi pi-table' },
    { separator: true },
    { label: 'Generar protocolo de importación', icon: 'pi pi-file-export' },
  ];

  isActive = true;
  layoutGrid = true;

  copied: Record<string, boolean> = {};

  snippets: Record<string, string> = {
    F1: `<p-button label="Guardar" icon="pi pi-save" />
<p-button label="Confirmar" icon="pi pi-check" />
<p-button label="Crear" icon="pi pi-plus" />`,

    F2: `<p-button label="Cancelar" severity="secondary" [text]="true" />
<p-button label="Cerrar" severity="secondary" [outlined]="true" />`,

    F3: `<p-button label="Eliminar" icon="pi pi-trash" severity="danger" />
<p-button label="Sí, revertir todos" icon="pi pi-undo" severity="danger" />
<p-button
  icon="pi pi-trash"
  [rounded]="true"
  [text]="true"
  severity="danger"
  pTooltip="Eliminar fila"
  aria-label="Eliminar fila" />`,

    F4: `<p-button
  label="Anterior"
  icon="pi pi-arrow-left"
  severity="secondary"
  [outlined]="true" />
<p-button
  label="Siguiente"
  icon="pi pi-arrow-right"
  iconPos="right" />`,

    F5: `<p-button
  label="Limpiar filtros"
  icon="pi pi-filter-slash"
  severity="secondary"
  [outlined]="true" />
<p-button label="Buscar" icon="pi pi-search" />`,

    F6: `<p-button label="Descargar PDF" icon="pi pi-file-pdf" severity="success" />
<p-button
  label="Exportar Excel"
  icon="pi pi-file-excel"
  severity="secondary"
  [outlined]="true" />
<p-button
  icon="pi pi-download"
  [rounded]="true"
  [text]="true"
  severity="secondary"
  pTooltip="Descargar archivo"
  aria-label="Descargar archivo" />`,

    F7: `<p-button
  icon="pi pi-eye"
  [rounded]="true"
  [text]="true"
  pTooltip="Ver detalle"
  aria-label="Ver detalle" />
<p-button
  icon="pi pi-pencil"
  [rounded]="true"
  [text]="true"
  severity="success"
  pTooltip="Editar"
  aria-label="Editar" />
<p-button
  icon="pi pi-trash"
  [rounded]="true"
  [text]="true"
  severity="danger"
  pTooltip="Eliminar"
  aria-label="Eliminar" />`,

    F8: `<p-button
  icon="pi pi-ellipsis-v"
  [rounded]="true"
  [text]="true"
  severity="secondary"
  pTooltip="Más acciones"
  aria-label="Más acciones"
  (onClick)="menu.toggle($event)" />
<p-menu #menu [model]="menuItems" [popup]="true" appendTo="body" />

// menuItems — CRUD estándar (principal → especiales → sep → destructiva)
menuItems: MenuItem[] = [
  { label: 'Ver detalle', icon: 'pi pi-eye' },
  { label: 'Editar', icon: 'pi pi-pencil' },
  { label: 'Duplicar', icon: 'pi pi-copy' },
  { separator: true },
  { label: 'Eliminar', icon: 'pi pi-trash' },
];`,

    F9: `<p-button label="Adjuntar RUT" icon="pi pi-upload" [outlined]="true" />
<p-button
  label="Seleccionar archivo"
  icon="pi pi-folder-open"
  severity="secondary"
  [outlined]="true" />
<p-button label="Importar" icon="pi pi-file-import" />`,

    F10: `<p-button label="Enviar" icon="pi pi-send" />
<p-button label="Enviar reporte" icon="pi pi-send" severity="success" />`,

    F11: `<p-button
  label="Copiar código"
  icon="pi pi-copy"
  severity="secondary"
  [outlined]="true" />
<p-button
  icon="pi pi-copy"
  [rounded]="true"
  [text]="true"
  severity="secondary"
  pTooltip="Copiar al portapapeles"
  aria-label="Copiar al portapapeles" />`,

    F12: `<button type="button" class="a11y-btn" aria-label="Aumentar tamaño de letra">
  <i class="pi pi-search-plus" aria-hidden="true"></i>
</button>
<button
  type="button"
  class="a11y-btn"
  aria-label="Cambiar contraste"
  [attr.aria-pressed]="contrastOn">
  <i class="pi pi-sun" aria-hidden="true"></i>
</button>`,

    F13: `<button type="button" class="floating-btn" aria-label="Chat de ayuda">
  <i class="pi pi-comments" aria-hidden="true"></i>
</button>
<button type="button" class="floating-btn back-to-top" aria-label="Volver arriba">
  <i class="pi pi-arrow-up" aria-hidden="true"></i>
</button>`,

    F14: `<p-button
  [label]="isActive ? 'Desactivar' : 'Activar'"
  [icon]="isActive ? 'pi pi-times' : 'pi pi-check'"
  [severity]="isActive ? 'secondary' : 'success'"
  [outlined]="!isActive"
  [attr.aria-pressed]="isActive"
  (onClick)="isActive = !isActive" />`,
  };

  copySnippet(key: string): void {
    const text = this.snippets[key];
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copied[key] = true;
      setTimeout(() => (this.copied[key] = false), 2000);
    });
  }
}
