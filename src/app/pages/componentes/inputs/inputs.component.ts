import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TextareaModule } from 'primeng/textarea';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';

@Component({
  selector: 'app-inputs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    PasswordModule,
    IconFieldModule,
    InputIconModule,
    TextareaModule,
    AppBreadcrumbComponent,
    CodeBlockComponent,
  ],
  templateUrl: './inputs.component.html',
  styleUrl: './inputs.component.scss',
})
export class InputsComponent {
  texto = '';
  busqueda = '';
  clave = '';
  obs = '';

  // demo de validación: el correo es inválido si no tiene "@"
  correo = '';
  correoTouched = false;
  get correoInvalido(): boolean {
    return this.correoTouched && !this.correo.includes('@');
  }

  readonly snTexto = `<div class="chip-field">
  <label for="nombre">Nombre completo <span class="field-required">*</span></label>
  <input pInputText id="nombre" [(ngModel)]="nombre"
    placeholder="Ej: María Fernanda Gómez"
    class="w-full" autocomplete="name"
    aria-required="true"
    aria-describedby="nombre-help" />
  <small id="nombre-help" class="chip-field__help">Como aparece en el documento de identidad.</small>
</div>`;

  readonly snValidacion = `<div class="chip-field">
  <label for="correo">Correo <span class="field-required">*</span></label>
  <input pInputText id="correo" [(ngModel)]="correo"
    (blur)="correoTouched = true"
    [class.ng-invalid]="correoInvalido" [class.ng-dirty]="correoTouched"
    class="w-full" autocomplete="email"
    aria-required="true"
    [attr.aria-invalid]="correoInvalido"
    aria-describedby="correo-error" />
  @if (correoInvalido) {
    <small id="correo-error" class="chip-field__error">
      Escribe un correo válido, debe incluir &#64; (ej: nombre&#64;dominio.gov.co).
    </small>
  }
</div>`;

  readonly snIcono = `<!-- Icono dentro del input: SIEMPRE con p-iconfield, nunca position:absolute -->
<div class="chip-field">
  <label for="buscar">Buscar</label>
  <p-iconField iconPosition="left">
    <p-inputIcon styleClass="pi pi-search" />
    <input pInputText id="buscar" [(ngModel)]="busqueda"
      placeholder="Nombre o código" class="w-full" />
  </p-iconField>
</div>`;

  readonly snPassword = `<div class="chip-field">
  <label for="clave">Contraseña <span class="field-required">*</span></label>
  <p-password inputId="clave" [(ngModel)]="clave"
    [toggleMask]="true" [feedback]="true"
    promptLabel="Escribe una contraseña" weakLabel="Débil"
    mediumLabel="Media" strongLabel="Fuerte"
    styleClass="w-full" [inputStyle]="{ width: '100%' }"
    aria-required="true" />
</div>`;

  readonly snTextarea = `<div class="chip-field">
  <label for="obs">Observaciones</label>
  <textarea pTextarea id="obs" [(ngModel)]="obs" rows="3"
    class="w-full" maxlength="500"
    placeholder="Detalle adicional (opcional)"></textarea>
</div>`;
}
