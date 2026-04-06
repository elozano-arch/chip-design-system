import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';

@Component({
  selector: 'app-accesibilidad',
  standalone: true,
  imports: [CommonModule, DividerModule, CodeBlockComponent],
  templateUrl: './accesibilidad.component.html',
  styleUrl: './accesibilidad.component.scss',
})
export class AccesibilidadComponent {
  // Code examples

  codeAriaLabel = `<!-- Botón con aria-label descriptivo -->
<button
  class="btn btn-primary"
  aria-label="Cerrar ventana de notificaciones"
  (click)="cerrarNotificaciones()">
  <i class="pi pi-times"></i>
</button>

<!-- Botón con texto visible no necesita aria-label -->
<button class="btn btn-primary" (click)="guardar()">
  <i class="pi pi-save"></i>
  Guardar cambios
</button>

<!-- Enlace con aria-label para contexto adicional -->
<a
  href="/reportes/cgn-001"
  aria-label="Descargar reporte CGN-001 en formato PDF">
  Descargar PDF
</a>`;

  codeFormAccessible = `<form (ngSubmit)="onSubmit()" novalidate>
  <fieldset>
    <legend>Información de la entidad</legend>

    <!-- Campo con label asociado correctamente -->
    <div class="form-group">
      <label for="nombre-entidad">
        Nombre de la entidad
        <span class="required" aria-hidden="true">*</span>
      </label>
      <input
        id="nombre-entidad"
        type="text"
        [(ngModel)]="nombre"
        name="nombre"
        required
        aria-required="true"
        aria-describedby="nombre-error nombre-hint"
        [attr.aria-invalid]="nombreInvalid ? 'true' : null"
        class="form-control" />
      <small id="nombre-hint" class="form-hint">
        Ingrese el nombre completo de la entidad.
      </small>
      <div
        id="nombre-error"
        class="form-error"
        role="alert"
        *ngIf="nombreInvalid">
        El nombre de la entidad es obligatorio.
      </div>
    </div>

    <!-- Campo de selección -->
    <div class="form-group">
      <label for="tipo-entidad">Tipo de entidad</label>
      <select
        id="tipo-entidad"
        [(ngModel)]="tipo"
        name="tipo"
        aria-describedby="tipo-hint">
        <option value="">Seleccione un tipo</option>
        <option value="nacional">Nacional</option>
        <option value="territorial">Territorial</option>
      </select>
      <small id="tipo-hint" class="form-hint">
        Seleccione la clasificación de la entidad.
      </small>
    </div>
  </fieldset>

  <div class="form-actions">
    <button type="submit" class="btn btn-primary">
      Guardar entidad
    </button>
    <button type="button" class="btn btn-secondary">
      Cancelar
    </button>
  </div>
</form>`;

  codeSkipToContent = `<!-- Enlace "Saltar al contenido" al inicio del body -->
<a href="#contenido-principal" class="sr-only sr-only-focusable">
  Saltar al contenido principal
</a>

<!-- Header y navegación aquí -->
<header role="banner">...</header>
<nav aria-label="Menú principal">...</nav>

<!-- Contenido principal con el id de destino -->
<main id="contenido-principal" tabindex="-1">
  <h1>Título de la página</h1>
  <!-- Contenido de la página -->
</main>

<!-- Estilos CSS para el enlace sr-only -->
<style>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.sr-only-focusable:focus {
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 10000;
  width: auto;
  height: auto;
  padding: 12px 24px;
  margin: 0;
  overflow: visible;
  clip: auto;
  background: #0943B5;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  border-radius: 4px;
  text-decoration: none;
}
</style>`;

  codeFocusDialog = `<!-- Diálogo accesible con gestión de foco -->
<div
  class="dialog-overlay"
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-titulo"
  aria-describedby="dialog-desc"
  (keydown.escape)="cerrarDialogo()">

  <div class="dialog-content" #dialogContent>
    <h2 id="dialog-titulo">Confirmar eliminación</h2>
    <p id="dialog-desc">
      ¿Está seguro de que desea eliminar esta entidad?
      Esta acción no se puede deshacer.
    </p>

    <div class="dialog-actions">
      <button
        type="button"
        class="btn btn-secondary"
        (click)="cerrarDialogo()">
        Cancelar
      </button>
      <button
        type="button"
        class="btn btn-danger"
        (click)="confirmarEliminacion()">
        Eliminar
      </button>
    </div>
  </div>
</div>

<!-- En el componente TypeScript -->
<!--
  @ViewChild('dialogContent') dialogContent: ElementRef;

  abrirDialogo() {
    this.visible = true;
    // Mover el foco al diálogo al abrirlo
    setTimeout(() => {
      this.dialogContent.nativeElement
        .querySelector('h2').focus();
    });
  }

  cerrarDialogo() {
    this.visible = false;
    // Devolver el foco al elemento que abrió el diálogo
    this.triggerElement.nativeElement.focus();
  }
-->`;

  checklistItems = [
    'Todas las imágenes tienen texto alternativo (alt) descriptivo o alt="" si son decorativas.',
    'Los formularios tienen labels asociados correctamente mediante el atributo for/id.',
    'Los mensajes de error se anuncian con role="alert" o aria-live="assertive".',
    'El contraste de color cumple la relación mínima de 4.5:1 para texto normal.',
    'La navegación por teclado funciona en todos los componentes interactivos.',
    'Los indicadores de foco son visibles y tienen suficiente contraste.',
    'Existe un enlace "Saltar al contenido principal" al inicio de la página.',
    'Los diálogos modales atrapan el foco y se cierran con la tecla Escape.',
    'Los atributos aria-label y aria-labelledby se usan cuando el texto visible no es suficiente.',
    'Los campos obligatorios están marcados con aria-required="true".',
    'La estructura de encabezados (h1-h6) sigue un orden jerárquico lógico.',
    'Los elementos interactivos personalizados tienen el role ARIA correcto.',
    'El contenido dinámico utiliza aria-live para notificar cambios a lectores de pantalla.',
    'La página es funcional al 200% de zoom sin pérdida de contenido o funcionalidad.',
    'No se depende exclusivamente del color para transmitir información.',
  ];
}
