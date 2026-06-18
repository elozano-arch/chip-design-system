import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';

@Component({
  selector: 'app-modales',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    RadioButtonModule,
    SelectModule,
    AppBreadcrumbComponent,
    CodeBlockComponent,
  ],
  templateUrl: './modales.component.html',
  styleUrl: './modales.component.scss',
})
export class ModalesComponent {
  /* ─────────── Estado de cada modal demo ─────────── */
  showConfirm = false;
  showConfirmCritico = false;
  showForm = false;
  showSeleccion = false;

  // V1 crítica — campo de confirmación
  deleteConfirmText = '';
  get deleteConfirmValid(): boolean {
    return this.deleteConfirmText.trim() === 'ELIMINAR';
  }

  // V3 formulario
  formNombre = '';
  formCorreo = '';
  readonly roles = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Analista', value: 'analista' },
    { label: 'Auditor', value: 'auditor' },
  ];
  formRol: string | null = null;

  // V4 selección
  readonly correos = [
    'maria***@contaduria.gov.co',
    'm***gomez@gmail.com',
    'mfgomez***@outlook.com',
  ];
  correoSel: string | null = null;

  /* ─────────── Snippets ─────────── */
  readonly snConfirm = `<p-dialog header="Eliminar usuario" [(visible)]="showConfirm"
  [modal]="true" [draggable]="false" [closeOnEscape]="true"
  [style]="{ width: '460px' }">

  <div class="modal-confirm">
    <i class="pi pi-exclamation-triangle modal-confirm__icon" aria-hidden="true"></i>
    <p>Está a punto de eliminar al usuario <strong>"María Fernanda Gómez"</strong>.</p>
    <p class="modal-confirm__warning">
      <i class="pi pi-info-circle" aria-hidden="true"></i>
      Esta acción <strong>no se puede revertir</strong>.
    </p>
  </div>

  <ng-template #footer>
    <p-button label="Cancelar" [text]="true" severity="secondary"
      (onClick)="showConfirm = false" />
    <p-button label="Eliminar" icon="pi pi-trash" severity="danger"
      (onClick)="confirmarEliminacion()" />
  </ng-template>
</p-dialog>`;

  readonly snConfirmCritico = `<!-- Para eliminaciones irreversibles de alto impacto:
     se exige escribir ELIMINAR antes de habilitar el botón. -->
<div class="modal-confirm__field">
  <label for="del">Para confirmar, escriba <code>ELIMINAR</code>:</label>
  <input pInputText id="del" [(ngModel)]="deleteConfirmText"
    placeholder="Escriba ELIMINAR" autocomplete="off" class="w-full"
    aria-required="true" />
</div>

<ng-template #footer>
  <p-button label="Cancelar" [text]="true" severity="secondary"
    (onClick)="cerrar()" />
  <p-button label="Eliminar definitivamente" icon="pi pi-trash"
    severity="danger" [disabled]="!deleteConfirmValid"
    (onClick)="confirmar()" />
</ng-template>`;

  readonly snForm = `<p-dialog header="Crear usuario" [(visible)]="showForm"
  [modal]="true" [draggable]="false" [style]="{ width: '520px' }">

  <p class="modal-form__hint">
    Los campos con <span class="field-required">*</span> son obligatorios.
  </p>

  <div class="modal-form__grid">
    <div class="modal-form__field">
      <label for="f-nombre">Nombre completo <span class="field-required">*</span></label>
      <input pInputText id="f-nombre" [(ngModel)]="formNombre" class="w-full"
        aria-required="true" />
    </div>
    <div class="modal-form__field">
      <label for="f-rol">Rol <span class="field-required">*</span></label>
      <p-select inputId="f-rol" [options]="roles" [(ngModel)]="formRol"
        optionLabel="label" optionValue="value" placeholder="Selecciona un rol" />
    </div>
  </div>

  <ng-template #footer>
    <p-button label="Cancelar" [text]="true" severity="secondary"
      (onClick)="showForm = false" />
    <p-button label="Guardar" icon="pi pi-check" (onClick)="guardar()" />
  </ng-template>
</p-dialog>`;

  readonly snSeleccion = `<p-dialog header="Selecciona un correo" [(visible)]="showSeleccion"
  [modal]="true" [draggable]="false" [style]="{ width: '480px' }">

  <p>Enviaremos el código de verificación al correo que elijas:</p>
  <div class="modal-radio" role="radiogroup" aria-label="Correos disponibles">
    @for (c of correos; track c) {
      <label class="modal-radio__opt">
        <p-radioButton [value]="c" [(ngModel)]="correoSel" name="correo" />
        <span>{{ c }}</span>
      </label>
    }
  </div>

  <ng-template #footer>
    <p-button label="Cancelar" [text]="true" severity="secondary"
      (onClick)="showSeleccion = false" />
    <p-button label="Enviar código" icon="pi pi-send"
      [disabled]="!correoSel" (onClick)="enviar()" />
  </ng-template>
</p-dialog>`;
}
