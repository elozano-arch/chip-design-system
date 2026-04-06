import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { TabsModule } from 'primeng/tabs';
import { StepperModule } from 'primeng/stepper';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DatePickerModule } from 'primeng/datepicker';
import { AvatarModule } from 'primeng/avatar';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { PasswordModule } from 'primeng/password';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, MenuItem } from 'primeng/api';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';

@Component({
  selector: 'app-ejemplos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    MessageModule,
    BreadcrumbModule,
    DividerModule,
    DialogModule,
    TooltipModule,
    PaginatorModule,
    TabsModule,
    StepperModule,
    FloatLabelModule,
    TextareaModule,
    CheckboxModule,
    RadioButtonModule,
    ToggleSwitchModule,
    DatePickerModule,
    AvatarModule,
    FileUploadModule,
    ProgressBarModule,
    PasswordModule,
    AvatarGroupModule,
    IconFieldModule,
    InputIconModule,
    CodeBlockComponent,
  ],
  providers: [MessageService],
  templateUrl: './ejemplos.component.html',
  styleUrl: './ejemplos.component.scss',
})
export class EjemplosComponent {
  // Breadcrumb
  breadcrumbItems: MenuItem[] = [
    { label: 'Inicio', routerLink: '/' },
    { label: 'Ejemplos de uso' },
  ];
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  // Module cards
  modules = [
    { title: 'Seguridad', desc: 'Gestión de usuarios y roles del sistema', icon: 'pi pi-shield', bg: '#EBF0FA' },
    { title: 'Entidades', desc: 'Gestión de entidades, información complementaria y analistas', icon: 'pi pi-building', bg: '#F5F5F5' },
    { title: 'Formularios', desc: 'Gestión y carga de formularios de reportes', icon: 'pi pi-file-edit', bg: '#FFF8E1' },
    { title: 'Parametrización', desc: 'Configuración general del sistema', icon: 'pi pi-cog', bg: '#EBF0FA' },
    { title: 'Operaciones', desc: 'Gestión de procesos operacionales', icon: 'pi pi-bolt', bg: '#F5F5F5' },
    { title: 'Reportes', desc: 'Generación de reportes y análisis', icon: 'pi pi-chart-bar', bg: '#FFF8E1' },
  ];

  // Table - Entidades
  entidades = [
    { id: '110101', nombre: 'Ministerio de Hacienda y Crédito Público', tipo: 'Nacional', estado: 'Activo', reportes: 12 },
    { id: '110201', nombre: 'Departamento Nacional de Planeación', tipo: 'Nacional', estado: 'Activo', reportes: 8 },
    { id: '210105', nombre: 'Gobernación de Antioquia', tipo: 'Territorial', estado: 'Activo', reportes: 15 },
    { id: '210208', nombre: 'Alcaldía de Medellín', tipo: 'Territorial', estado: 'Pendiente', reportes: 3 },
    { id: '310301', nombre: 'Universidad Nacional de Colombia', tipo: 'Mixta', estado: 'Activo', reportes: 6 },
    { id: '110501', nombre: 'Contraloría General de la República', tipo: 'Nacional', estado: 'Inactivo', reportes: 0 },
  ];

  // Dialog
  showConfirmDialog = false;
  showDetailDialog = false;
  selectedEntity: any = null;

  // Form
  formData = {
    nombre: '',
    nit: '',
    tipo: null as any,
    direccion: '',
    observaciones: '',
    activo: false,
  };
  tipoOptions = [
    { label: 'Nacional', value: 'nacional' },
    { label: 'Territorial', value: 'territorial' },
    { label: 'Mixta', value: 'mixta' },
  ];

  // Paginator
  totalRecords = 48;
  rows = 10;

  // Stepper
  activeStep = 1;
  rutFileName = '';
  certFileName = '';

  // DataView
  dataviewLayout: 'grid' | 'list' = 'grid';

  // Full form
  formEstado = 'activo';
  formRegDate: Date | null = null;
  formNotify = true;

  constructor(private messageService: MessageService) {}

  getStateSeverity(estado: string): 'success' | 'warn' | 'danger' | 'info' | undefined {
    switch (estado) {
      case 'Activo': return 'success';
      case 'Inactivo': return 'danger';
      case 'Pendiente': return 'warn';
      default: return 'info';
    }
  }

  viewEntity(entity: any) {
    this.selectedEntity = entity;
    this.showDetailDialog = true;
  }

  confirmDelete(entity: any) {
    this.selectedEntity = entity;
    this.showConfirmDialog = true;
  }

  onDeleteConfirm() {
    this.messageService.add({
      severity: 'success',
      summary: 'Eliminado',
      detail: `La entidad ${this.selectedEntity.nombre} fue eliminada.`,
    });
    this.showConfirmDialog = false;
  }

  onFormSubmit() {
    this.messageService.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'La entidad fue registrada correctamente.',
    });
  }

  // Code snippets
  codeModuleCards = `<div class="module-grid">
  <div class="module-card" style="background-color: #EBF0FA;">
    <i class="pi pi-shield module-card__icon"></i>
    <h3 class="module-card__title">Seguridad</h3>
    <p class="module-card__desc">Gestión de usuarios y roles</p>
  </div>
  <div class="module-card" style="background-color: #F5F5F5;">
    <i class="pi pi-building module-card__icon"></i>
    <h3 class="module-card__title">Entidades</h3>
    <p class="module-card__desc">Gestión de entidades</p>
  </div>
</div>`;

  codeTableActions = `<div class="ej-table-toolbar">
  <p-iconfield>
    <p-inputicon styleClass="pi pi-search" />
    <input pInputText placeholder="Buscar entidad..." />
  </p-iconfield>
  <p-button label="Nueva entidad" icon="pi pi-plus" />
</div>

<p-table [value]="entidades" [stripedRows]="true">
  <ng-template #header>
    <tr>
      <th pSortableColumn="id">
        Código <p-sortIcon field="id" />
      </th>
      <th pSortableColumn="nombre">
        Nombre <p-sortIcon field="nombre" />
      </th>
      <th pSortableColumn="tipo">Tipo</th>
      <th>Estado</th>
      <th pSortableColumn="reportes">Reportes</th>
      <th>Acciones</th>
    </tr>
  </ng-template>
  <ng-template #body let-row>
    <tr>
      <td><strong>{{ row.id }}</strong></td>
      <td>{{ row.nombre }}</td>
      <td>{{ row.tipo }}</td>
      <td>
        <p-tag [value]="row.estado"
          [severity]="getStateSeverity(row.estado)" />
      </td>
      <td>{{ row.reportes }}</td>
      <td>
        <p-button icon="pi pi-eye" [rounded]="true"
          [text]="true" pTooltip="Ver detalle" />
        <p-button icon="pi pi-pencil" [rounded]="true"
          [text]="true" severity="success"
          pTooltip="Editar" />
        <p-button icon="pi pi-trash" [rounded]="true"
          [text]="true" severity="danger"
          pTooltip="Eliminar" />
      </td>
    </tr>
  </ng-template>
</p-table>`;

  codeSearchForm = `<div class="search-card">
  <div class="search-card__header">
    <h4>Búsqueda de Entidades</h4>
    <p-button label="Nueva Entidad" icon="pi pi-plus"
      [outlined]="true" />
  </div>
  <div class="search-card__grid">
    <div class="search-card__field">
      <label for="razon">Razón Social</label>
      <input pInputText id="razon" [(ngModel)]="nombre"
        placeholder="Buscar por razón social..."
        class="w-full" />
    </div>
    <div class="search-card__field">
      <label for="nit">NIT</label>
      <input pInputText id="nit" [(ngModel)]="nit"
        placeholder="Buscar por NIT..." class="w-full" />
    </div>
    <div class="search-card__field">
      <label for="sigla">SIGLA</label>
      <input pInputText id="sigla"
        placeholder="Buscar por SIGLA..." class="w-full" />
    </div>
    <div class="search-card__field">
      <label for="codigo">Código Entidad</label>
      <input pInputText id="codigo"
        placeholder="Buscar por código..." class="w-full" />
    </div>
    <div class="search-card__field">
      <label for="depto">Departamento</label>
      <p-select id="depto" [options]="tipoOptions"
        [(ngModel)]="tipo" placeholder="Todos"
        class="w-full" />
    </div>
    <div class="search-card__field">
      <label for="muni">Municipio</label>
      <p-select id="muni" [options]="[]"
        placeholder="Seleccione departamento"
        class="w-full" [disabled]="true" />
    </div>
  </div>
  <div class="search-card__actions">
    <p-button label="Limpiar Filtros" icon="pi pi-times"
      severity="secondary" [outlined]="true" />
    <p-button label="Buscar" icon="pi pi-search" />
  </div>
</div>`;

  codeDetailTabs = `<p-tabs value="0">
  <p-tablist>
    <p-tab value="0">Información General</p-tab>
    <p-tab value="1">Reportes Enviados</p-tab>
    <p-tab value="2">Historial</p-tab>
  </p-tablist>
  <p-tabpanels>
    <!-- Tab: Información General -->
    <p-tabpanel value="0">
      <div class="ej-detail-grid">
        <div class="ej-detail-item">
          <span class="ej-detail-item__label">Código</span>
          <span class="ej-detail-item__value">110101</span>
        </div>
        <div class="ej-detail-item">
          <span class="ej-detail-item__label">Nombre</span>
          <span class="ej-detail-item__value">
            Ministerio de Hacienda
          </span>
        </div>
        <div class="ej-detail-item">
          <span class="ej-detail-item__label">NIT</span>
          <span class="ej-detail-item__value">
            899999090-2
          </span>
        </div>
        <div class="ej-detail-item">
          <span class="ej-detail-item__label">Estado</span>
          <span class="ej-detail-item__value">
            <p-tag value="Activo" severity="success" />
          </span>
        </div>
      </div>
    </p-tabpanel>

    <!-- Tab: Reportes -->
    <p-tabpanel value="1">
      <p-table [value]="reportes" [stripedRows]="true">
        <ng-template #header>
          <tr>
            <th>Periodo</th>
            <th>Formulario</th>
            <th>Fecha envío</th>
            <th>Estado</th>
          </tr>
        </ng-template>
        <ng-template #body let-row>
          <tr>
            <td>{{ row.periodo }}</td>
            <td>{{ row.nombre }}</td>
            <td>{{ row.fecha }}</td>
            <td>
              <p-tag [value]="row.estado"
                [severity]="row.estado === 'Aprobado'
                  ? 'success' : 'info'" />
            </td>
          </tr>
        </ng-template>
      </p-table>
    </p-tabpanel>

    <!-- Tab: Historial -->
    <p-tabpanel value="2">
      <div class="ej-timeline">
        <div class="ej-timeline__item">
          <i class="pi pi-send ej-timeline__icon"></i>
          <div>
            <strong>Reporte enviado</strong>
            <p>15 de marzo de 2026</p>
          </div>
        </div>
      </div>
    </p-tabpanel>
  </p-tabpanels>
</p-tabs>`;

  codeContextAlerts = `<!-- Alertas en contexto -->
<p-message severity="info">
  Periodo actual: 2026-I. Fecha límite: 15 de abril.
</p-message>
<p-message severity="warn">
  Tiene 3 reportes pendientes por enviar.
</p-message>
<p-message severity="success">
  El reporte CGN-001 fue validado exitosamente.
</p-message>
<p-message severity="error">
  Inconsistencias en las cuentas 1105 y 2405.
</p-message>

<!-- Botones de acción -->
<p-button label="Enviar reporte" icon="pi pi-send" />
<p-button label="Descargar PDF" icon="pi pi-file-pdf"
  severity="success" />
<p-button label="Exportar Excel" icon="pi pi-file-excel"
  severity="secondary" [outlined]="true" />`;

  codeStepperFlow = `<p-stepper [value]="activeStep" [linear]="false">
  <p-step-list>
    <p-step [value]="1">Datos Básicos</p-step>
    <p-step [value]="2">Documentos</p-step>
    <p-step [value]="3">Revisión</p-step>
    <p-step [value]="4">Confirmación</p-step>
  </p-step-list>
  <p-step-panels>
    <p-step-panel [value]="2">
      <ng-template #content
        let-activateCallback="activateCallback">
        <h4>Paso 2: Carga de Documentos</h4>
        <p-message severity="info">
          Adjunte los documentos requeridos.
          Formatos: PDF, JPG. Máximo 5MB.
        </p-message>
        <div class="upload-list">
          <div class="upload-item">
            <p-button label="Adjuntar RUT"
              icon="pi pi-upload" [outlined]="true"
              (onClick)="rutInput.click()" />
            <span class="upload-item__name">
              {{ rutFileName || 'Sin archivo' }}
            </span>
            <input #rutInput type="file"
              accept=".pdf,.jpg" hidden />
          </div>
        </div>
        <div class="stepper-actions">
          <p-button label="Anterior"
            (onClick)="activateCallback(1)" />
          <p-button label="Siguiente"
            (onClick)="activateCallback(3)" />
        </div>
      </ng-template>
    </p-step-panel>
  </p-step-panels>
</p-stepper>`;

  codeFullForm = `<div class="ej-form">
  <div class="ej-form__grid">
    <div class="ej-form__group">
      <label for="nombre">Razón Social *</label>
      <input pInputText id="nombre"
        [(ngModel)]="formData.nombre"
        placeholder="Ingrese la razón social"
        class="w-full" />
    </div>
    <div class="ej-form__group">
      <label for="nit">NIT *</label>
      <input pInputText id="nit"
        [(ngModel)]="formData.nit"
        placeholder="000.000.000-0" class="w-full" />
    </div>
    <div class="ej-form__group">
      <label for="tipo">Tipo de Entidad *</label>
      <p-select id="tipo" [options]="tipoOptions"
        [(ngModel)]="formData.tipo"
        placeholder="Seleccione un tipo"
        class="w-full" />
    </div>
    <div class="ej-form__group">
      <label for="fecha">Fecha de Registro</label>
      <p-datepicker id="fecha"
        [(ngModel)]="formRegDate"
        [showIcon]="true" dateFormat="dd/mm/yy"
        placeholder="DD/MM/AAAA" class="w-full" />
    </div>
    <div class="ej-form__group">
      <label for="dir">Dirección</label>
      <input pInputText id="dir"
        [(ngModel)]="formData.direccion"
        placeholder="Dirección de la entidad"
        class="w-full" />
    </div>
    <div class="ej-form__group">
      <label>Estado</label>
      <div class="ej-form__radios">
        <div class="ej-form__radio-item">
          <p-radiobutton name="estado" value="activo"
            [(ngModel)]="formEstado"
            inputId="est-act" />
          <label for="est-act">Activo</label>
        </div>
        <div class="ej-form__radio-item">
          <p-radiobutton name="estado" value="inactivo"
            [(ngModel)]="formEstado"
            inputId="est-ina" />
          <label for="est-ina">Inactivo</label>
        </div>
      </div>
    </div>
    <div class="ej-form__group ej-form__group--full">
      <label for="obs">Observaciones</label>
      <textarea pTextarea id="obs"
        [(ngModel)]="formData.observaciones"
        rows="3" placeholder="Observaciones..."
        class="w-full"></textarea>
    </div>
    <div class="ej-form__group ej-form__group--full">
      <div class="ej-form__switches">
        <div class="ej-form__switch-item">
          <p-toggleswitch [(ngModel)]="formNotify" />
          <span>Enviar notificación por correo</span>
        </div>
        <div class="ej-form__switch-item">
          <p-checkbox [(ngModel)]="formData.activo"
            [binary]="true" inputId="terms" />
          <label for="terms">
            Acepto los términos y condiciones
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="ej-form__actions">
    <p-button label="Cancelar" severity="secondary"
      [outlined]="true" icon="pi pi-times" />
    <p-button label="Guardar entidad"
      icon="pi pi-save" />
  </div>
</div>`;

  codeDashboard = `<!-- Banner de bienvenida -->
<div class="dash-welcome">
  <div>
    <h3>Bienvenido, Juan Pérez</h3>
    <p>Sistema CHIP 2.0 — Periodo: <strong>2026-I</strong></p>
  </div>
  <p-avatar label="JP" shape="circle" size="large" />
</div>

<!-- Tarjetas de estadísticas -->
<div class="dash-stats">
  <div class="dash-stat">
    <div class="dash-stat__icon">
      <i class="pi pi-check-circle"></i>
    </div>
    <div>
      <span class="dash-stat__value">128</span>
      <span class="dash-stat__label">Reportes enviados</span>
    </div>
  </div>
  <!-- ... más stats -->
</div>

<!-- Grid de módulos -->
<div class="module-grid">
  <div class="module-card">
    <i class="pi pi-shield module-card__icon"></i>
    <h3>Seguridad</h3>
    <p>Gestión de usuarios y roles</p>
  </div>
</div>`;

  codeLoginPreview = `<div class="login-page">
  <header class="govco-topbar" role="banner">
    <img src="assets/logos/govco-logo.png" alt="GOV.CO" height="36" />
  </header>

  <main class="login-page__body">
    <div class="login-card">
      <img src="assets/logos/cobranding.svg" alt="CGN - CHIP" />
      <h1>Iniciar sesión</h1>

      <div class="p-field">
        <label for="usuario">Usuario</label>
        <input pInputText id="usuario"
          placeholder="Ingrese su usuario" />
      </div>

      <div class="p-field">
        <label for="contrasena">Contraseña</label>
        <p-password id="contrasena"
          placeholder="Ingrese su contraseña"
          [toggleMask]="true" [feedback]="false" />
      </div>

      <div class="recaptcha-placeholder">
        <i class="pi pi-shield"></i>
        <span>reCAPTCHA v3</span>
      </div>

      <p-button label="Ingresar" icon="pi pi-sign-in"
        styleClass="w-full" />

      <a href="#">¿Olvidó su contraseña?</a>
    </div>
  </main>
</div>`;

  codeDataView = `<!-- Toolbar con toggle grid/lista -->
<div class="dataview-toolbar">
  <p-iconfield>
    <p-inputicon styleClass="pi pi-search" />
    <input pInputText placeholder="Buscar entidad..." />
  </p-iconfield>
  <div class="dataview-toolbar__actions">
    <p-button icon="pi pi-th-large"
      [outlined]="layout !== 'grid'"
      (onClick)="layout = 'grid'"
      severity="secondary" />
    <p-button icon="pi pi-list"
      [outlined]="layout !== 'list'"
      (onClick)="layout = 'list'"
      severity="secondary" />
  </div>
</div>

<!-- Vista Grid -->
@if (layout === 'grid') {
  <div class="dataview-grid">
    @for (ent of entidades; track ent.id) {
      <div class="dataview-card">
        <div class="dataview-card__header">
          <p-avatar [label]="ent.nombre.charAt(0)"
            shape="circle" [style]="{
              'background-color': '#0943B5',
              color: '#fff'
            }" />
          <p-tag [value]="ent.estado"
            [severity]="getStateSeverity(
              ent.estado)" />
        </div>
        <h4 class="dataview-card__title">
          {{ ent.nombre }}
        </h4>
        <div class="dataview-card__meta">
          <span>
            <i class="pi pi-building"></i>
            {{ ent.tipo }}
          </span>
          <span>
            <i class="pi pi-hashtag"></i>
            {{ ent.id }}
          </span>
        </div>
        <div class="dataview-card__footer">
          <span>{{ ent.reportes }} reportes</span>
          <p-button icon="pi pi-eye" [rounded]="true"
            [text]="true" pTooltip="Ver detalle" />
        </div>
      </div>
    }
  </div>
}

<!-- Vista Lista -->
@if (layout === 'list') {
  <div class="dataview-list">
    @for (ent of entidades; track ent.id) {
      <div class="dataview-list-item">
        <p-avatar [label]="ent.nombre.charAt(0)"
          shape="circle" [style]="{
            'background-color': '#0943B5',
            color: '#fff'
          }" />
        <div class="dataview-list-item__info">
          <strong>{{ ent.nombre }}</strong>
          <span>{{ ent.tipo }} · Código:
            {{ ent.id }}</span>
        </div>
        <div class="dataview-list-item__right">
          <p-tag [value]="ent.estado"
            [severity]="getStateSeverity(
              ent.estado)" />
          <span>{{ ent.reportes }} reportes</span>
          <p-button icon="pi pi-eye" [rounded]="true"
            [text]="true" pTooltip="Ver detalle" />
        </div>
      </div>
    }
  </div>
}`;

  codeChangePassword = `<div class="login-card">
  <img src="assets/logos/cobranding.svg" alt="CGN - CHIP" />
  <h1>Cambiar contraseña</h1>

  <div class="p-field">
    <label>Contraseña actual</label>
    <p-password [toggleMask]="true" [feedback]="false" />
  </div>

  <div class="p-field">
    <label>Nueva contraseña</label>
    <p-password [toggleMask]="true" [feedback]="true" />
  </div>

  <div class="p-field">
    <label>Confirmar contraseña</label>
    <p-password [toggleMask]="true" [feedback]="false" />
  </div>

  <div class="password-rules">
    <p>La contraseña debe cumplir:</p>
    <div class="password-rules__item--ok">
      <i class="pi pi-check-circle"></i> Mínimo 8 caracteres
    </div>
    <div class="password-rules__item">
      <i class="pi pi-circle"></i> Al menos un número
    </div>
  </div>

  <p-button label="Cambiar contraseña" icon="pi pi-lock"
    styleClass="w-full" />
</div>`;
}
