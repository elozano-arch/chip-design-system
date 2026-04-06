import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { AccordionModule } from 'primeng/accordion';
import { TabsModule } from 'primeng/tabs';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { DialogModule } from 'primeng/dialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService, MenuItem } from 'primeng/api';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { ChipModule } from 'primeng/chip';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { SkeletonModule } from 'primeng/skeleton';
import { TimelineModule } from 'primeng/timeline';
import { FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { MenuModule } from 'primeng/menu';
import { MenubarModule } from 'primeng/menubar';
import { SplitButtonModule } from 'primeng/splitbutton';
import { FieldsetModule } from 'primeng/fieldset';
import { SidebarModule } from 'primeng/sidebar';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    AccordionModule,
    TabsModule,
    CardModule,
    ToastModule,
    MessageModule,
    TagModule,
    BadgeModule,
    BreadcrumbModule,
    PaginatorModule,
    ProgressBarModule,
    TooltipModule,
    CheckboxModule,
    RadioButtonModule,
    TextareaModule,
    DividerModule,
    PanelModule,
    DialogModule,
    ToggleSwitchModule,
    FloatLabelModule,
    DatePickerModule,
    ChipModule,
    AvatarModule,
    AvatarGroupModule,
    SkeletonModule,
    TimelineModule,
    FileUploadModule,
    InputNumberModule,
    MultiSelectModule,
    MenuModule,
    MenubarModule,
    SplitButtonModule,
    FieldsetModule,
    SidebarModule,
    CodeBlockComponent,
  ],
  providers: [MessageService],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  breadcrumbItems: MenuItem[] = [
    { label: 'Reportes' },
    { label: 'Detalle' },
  ];
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  inputValue = '';
  textareaValue = '';
  selectedOption: any = null;
  checkboxValue = false;
  checkboxValues = [true, false, false];
  radioValue = 'nacional';
  switchValue = false;
  switchValues = [true, false, false];
  dateValue: Date | null = null;
  dateRange: Date[] | null = null;
  monthValue: Date | null = null;
  activeFilters = ['Nacional', 'Activo', '2026-I', 'Bogotá D.C.'];

  // Textarea
  textareaCounter = '';
  get textareaCount() { return this.textareaCounter.length; }

  // InputNumber
  numBasic: number | null = null;
  numButtons = 5;
  numCurrency = 1500000;
  numDecimal = 3.14;

  // MultiSelect
  departamentoOptions = [
    { label: 'Bogotá D.C.', value: 'bogota' },
    { label: 'Antioquia', value: 'antioquia' },
    { label: 'Valle del Cauca', value: 'valle' },
    { label: 'Cundinamarca', value: 'cundinamarca' },
    { label: 'Santander', value: 'santander' },
    { label: 'Atlántico', value: 'atlantico' },
  ];
  selectedDepartamentos: string[] = [];
  moduloOptions = [
    { label: 'Seguridad', value: 'seguridad' },
    { label: 'Entidades', value: 'entidades' },
    { label: 'Formularios', value: 'formularios' },
    { label: 'Reportes', value: 'reportes' },
  ];
  selectedModulos: string[] = [];

  // Menu
  menuItems: MenuItem[] = [
    { label: 'Ver detalle', icon: 'pi pi-eye' },
    { label: 'Editar', icon: 'pi pi-pencil' },
    { label: 'Duplicar', icon: 'pi pi-copy' },
    { separator: true },
    { label: 'Eliminar', icon: 'pi pi-trash' },
  ];
  splitMenuItems: MenuItem[] = [
    { label: 'Guardar como borrador', icon: 'pi pi-file' },
    { label: 'Guardar y enviar', icon: 'pi pi-send' },
  ];
  exportMenuItems: MenuItem[] = [
    { label: 'Exportar PDF', icon: 'pi pi-file-pdf' },
    { label: 'Exportar Excel', icon: 'pi pi-file-excel' },
    { label: 'Exportar CSV', icon: 'pi pi-file' },
  ];
  menubarItems: MenuItem[] = [
    { label: 'Inicio', icon: 'pi pi-home' },
    { label: 'Entidades', icon: 'pi pi-building', items: [
      { label: 'Listado', icon: 'pi pi-list' },
      { label: 'Nuevo registro', icon: 'pi pi-plus' },
    ]},
    { label: 'Reportes', icon: 'pi pi-chart-bar', items: [
      { label: 'Consolidados', icon: 'pi pi-file' },
      { label: 'Por entidad', icon: 'pi pi-building' },
    ]},
    { label: 'Configuración', icon: 'pi pi-cog' },
  ];

  // Sidebar component
  sidebarRight = false;
  sidebarLeft = false;

  // ConfirmDialog
  showConfirmDelete = false;
  showConfirmSend = false;

  selectOptions = [
    { label: 'Opcion 1', value: 'opt1' },
    { label: 'Opcion 2', value: 'opt2' },
    { label: 'Opcion 3', value: 'opt3' },
  ];

  tableData = [
    { id: '4598', nombre: 'Modulo de consolidacion', estado: 'Activo', tipo: 'Financiero' },
    { id: '4599', nombre: 'Modulo de reportes', estado: 'Activo', tipo: 'Operativo' },
    { id: '4600', nombre: 'Modulo de auditoria', estado: 'Inactivo', tipo: 'Control' },
    { id: '4601', nombre: 'Modulo de parametros', estado: 'Activo', tipo: 'Configuracion' },
    { id: '4602', nombre: 'Modulo de usuarios', estado: 'Pendiente', tipo: 'Administrativo' },
  ];

  showDialog = false;
  totalRecords = 120;
  rows = 10;

  cobaltColors = [
    { name: 'Cobalt 50', hex: '#E8EDF8', dark: false },
    { name: 'Cobalt 100', hex: '#C5D2EE', dark: false },
    { name: 'Cobalt 200', hex: '#9EB4E3', dark: false },
    { name: 'Cobalt 300', hex: '#7796D8', dark: false },
    { name: 'Cobalt 400', hex: '#5A80CF', dark: false },
    { name: 'Cobalt 500', hex: '#3D6AC6', dark: true },
    { name: 'Cobalt 600', hex: '#1E54B8', dark: true },
    { name: 'Cobalt 700', hex: '#0943B5', dark: true },
    { name: 'Cobalt 800', hex: '#073899', dark: true },
    { name: 'Cobalt 900', hex: '#052D7D', dark: true },
    { name: 'Cobalt 950', hex: '#031E54', dark: true },
  ];

  greyColors = [
    { name: 'Grey 50', hex: '#F5F5F5', dark: false },
    { name: 'Grey 100', hex: '#EBEBEB', dark: false },
    { name: 'Grey 200', hex: '#D6D6D6', dark: false },
    { name: 'Grey 300', hex: '#BDBDBD', dark: false },
    { name: 'Grey 400', hex: '#9E9E9E', dark: false },
    { name: 'Grey 500', hex: '#7A7A7A', dark: true },
    { name: 'Grey 600', hex: '#616161', dark: true },
    { name: 'Grey 700', hex: '#4C4C4C', dark: true },
    { name: 'Grey 800', hex: '#3B3B3B', dark: true },
    { name: 'Grey 900', hex: '#2B2B2B', dark: true },
    { name: 'Grey 950', hex: '#1A1A1A', dark: true },
  ];

  informativeColors = [
    { name: 'Success', hex: '#4CAF50', dark: true },
    { name: 'Warning', hex: '#FBC02D', dark: false },
    { name: 'Danger', hex: '#F44336', dark: true },
    { name: 'Info', hex: '#0943B5', dark: true },
  ];

  bgColors = [
    { name: 'White Smoke', hex: '#F5F5F5', dark: false },
    { name: 'Solitude', hex: '#EBF0FA', dark: false },
    { name: 'Corn Silk', hex: '#FFF8E1', dark: false },
  ];

  timelineEvents = [
    { title: 'Reporte CGN-001 enviado', description: 'Balance General periodo 2026-I enviado por Juan Pérez', date: '15 Mar 2026', icon: 'pi pi-send', color: '#0943B5' },
    { title: 'Datos actualizados', description: 'Información de contacto de la entidad actualizada por María García', date: '10 Mar 2026', icon: 'pi pi-pencil', color: '#4CAF50' },
    { title: 'Observación registrada', description: 'Revisar cuentas 1105 y 2405 antes de envío final', date: '8 Mar 2026', icon: 'pi pi-exclamation-triangle', color: '#FBC02D' },
    { title: 'Entidad activada', description: 'Entidad registrada y activada en el sistema CHIP', date: '1 Ene 2026', icon: 'pi pi-check-circle', color: '#4CAF50' },
  ];

  removeFilter(chip: string) {
    this.activeFilters = this.activeFilters.filter(f => f !== chip);
  }

  // Code snippets
  codeButtons = `<p-button label="Primario" />
<p-button label="Secundario" severity="secondary" />
<p-button label="Éxito" severity="success" />
<p-button label="Advertencia" severity="warn" />
<p-button label="Peligro" severity="danger" />
<p-button label="Deshabilitado" [disabled]="true" />

<!-- Con icono -->
<p-button label="Guardar" icon="pi pi-save" />
<p-button label="Eliminar" icon="pi pi-trash" severity="danger" />
<p-button icon="pi pi-search" [rounded]="true" />

<!-- Outlined -->
<p-button label="Primario" [outlined]="true" />

<!-- Texto -->
<p-button label="Enlace" [link]="true" />

<!-- Tamaños -->
<p-button label="Pequeño" size="small" />
<p-button label="Grande" size="large" />`;

  codeForm = `<!-- Input de texto -->
<label for="nombre">Nombre de la entidad *</label>
<input pInputText id="nombre" [(ngModel)]="valor"
  placeholder="Ingrese el nombre" class="w-full" />

<!-- Select -->
<label for="tipo">Tipo de entidad *</label>
<p-select id="tipo" [options]="opciones"
  [(ngModel)]="seleccionado"
  placeholder="Seleccione" class="w-full" />

<!-- Float Label -->
<p-floatlabel>
  <input pInputText id="campo" [(ngModel)]="valor" class="w-full" />
  <label for="campo">Dirección</label>
</p-floatlabel>`;

  codeTable = `<p-table [value]="datos" [stripedRows]="true">
  <ng-template #header>
    <tr>
      <th pSortableColumn="id">
        ID <p-sortIcon field="id" />
      </th>
      <th pSortableColumn="nombre">Nombre</th>
      <th>Estado</th>
      <th>Acciones</th>
    </tr>
  </ng-template>
  <ng-template #body let-row>
    <tr>
      <td>{{ row.id }}</td>
      <td>{{ row.nombre }}</td>
      <td>
        <p-tag [value]="row.estado"
          [severity]="getSeverity(row.estado)" />
      </td>
      <td>
        <p-button icon="pi pi-eye" [rounded]="true"
          [text]="true" pTooltip="Ver" />
        <p-button icon="pi pi-pencil" [rounded]="true"
          [text]="true" severity="success" />
      </td>
    </tr>
  </ng-template>
</p-table>

<p-paginator [rows]="10" [totalRecords]="120"
  [rowsPerPageOptions]="[5, 10, 25, 50]" />`;

  codeBreadcrumb = `<p-breadcrumb [model]="items" [home]="home" />

// En el componente:
items: MenuItem[] = [
  { label: 'Inicio', icon: 'pi pi-home' },
  { label: 'Reportes' },
  { label: 'Detalle' },
];
home: MenuItem = { icon: 'pi pi-home', routerLink: '/' };`;

  codeAccordion = `<p-accordion [multiple]="true">
  <p-accordion-panel value="0">
    <p-accordion-header>Título sección</p-accordion-header>
    <p-accordion-content>
      <p>Contenido del acordeón.</p>
    </p-accordion-content>
  </p-accordion-panel>
</p-accordion>`;

  codeTabs = `<p-tabs value="0">
  <p-tablist>
    <p-tab value="0">Información General</p-tab>
    <p-tab value="1">Reportes</p-tab>
    <p-tab value="2">Histórico</p-tab>
  </p-tablist>
  <p-tabpanels>
    <p-tabpanel value="0">
      <p>Contenido de la pestaña.</p>
    </p-tabpanel>
  </p-tabpanels>
</p-tabs>`;

  codeCards = `<p-card header="Título" subheader="Subtítulo">
  <p>Contenido de la tarjeta.</p>
  <ng-template #footer>
    <p-button label="Acción" icon="pi pi-arrow-right" />
  </ng-template>
</p-card>`;

  codeAlerts = `<!-- Mensajes inline -->
<p-message severity="info">Mensaje informativo.</p-message>
<p-message severity="success">Operación exitosa.</p-message>
<p-message severity="warn">Advertencia importante.</p-message>
<p-message severity="error">Error en la operación.</p-message>

<!-- Toast (notificación emergente) -->
<p-toast />
// En el componente:
this.messageService.add({
  severity: 'success',
  summary: 'Éxito',
  detail: 'Reporte guardado correctamente'
});`;

  codeTags = `<!-- Tags de estado -->
<p-tag value="Activo" severity="success" />
<p-tag value="Pendiente" severity="warn" />
<p-tag value="Inactivo" severity="danger" />
<p-tag value="En revisión" severity="info" />
<p-tag value="Borrador" severity="secondary" />

<!-- Badges -->
<p-badge value="4" />
<p-badge value="12" severity="success" />
<i class="pi pi-bell" pBadge value="8"></i>`;

  codeProgress = `<!-- Barra con valor -->
<p-progressbar [value]="60" />

<!-- Completado -->
<p-progressbar [value]="100" />

<!-- Indeterminado -->
<p-progressbar mode="indeterminate"
  [style]="{ height: '6px' }" />`;

  codeDialog = `<p-button label="Abrir modal"
  (onClick)="visible = true" />

<p-dialog header="Confirmar acción"
  [(visible)]="visible"
  [style]="{ width: '450px' }"
  [modal]="true">
  <p>¿Está seguro de realizar esta acción?</p>
  <ng-template #footer>
    <p-button label="Cancelar" severity="secondary"
      [text]="true" (onClick)="visible = false" />
    <p-button label="Confirmar" icon="pi pi-check"
      (onClick)="visible = false" />
  </ng-template>
</p-dialog>`;

  codeSpacing = `<!-- Cuadrícula de 12 columnas -->
<div class="grid">
  <div class="col-6">6 columnas</div>
  <div class="col-6">6 columnas</div>
</div>
<div class="grid">
  <div class="col-4">4</div>
  <div class="col-4">4</div>
  <div class="col-4">4</div>
</div>

<!-- Espaciado en múltiplos de 8px -->
<!-- gap: 8px, 16px, 24px, 32px, 40px -->`;

  codeInstall = `// 1. Copiar chip-preset.ts en src/app/theme/

// 2. Configurar en app.config.ts:
import { providePrimeNG } from 'primeng/config';
import { ChipPreset } from './theme/chip-preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: ChipPreset,
        options: {
          darkModeSelector: '.dark-mode',
        },
      },
    }),
  ],
};`;

  codeSidebar = `<!-- Layout: Sidebar + Contenido -->
<div class="app-layout">
  <aside class="app-sidebar">
    <nav class="app-sidebar__nav">
      <a routerLink="/" routerLinkActive="app-sidebar__link--active"
        [routerLinkActiveOptions]="{ exact: true }"
        class="app-sidebar__link">
        <i class="pi pi-home"></i> Inicio
      </a>
      <a routerLink="/comenzar"
        routerLinkActive="app-sidebar__link--active"
        class="app-sidebar__link">
        <i class="pi pi-play"></i> Comenzar
      </a>
      <a routerLink="/ejemplos"
        routerLinkActive="app-sidebar__link--active"
        class="app-sidebar__link">
        <i class="pi pi-th-large"></i> Ejemplos de Uso
      </a>
    </nav>
  </aside>

  <div class="app-content">
    <main>
      <router-outlet />
    </main>
  </div>
</div>

<!-- CSS del sidebar -->
<style>
.app-layout { display: flex; min-height: calc(100vh - 120px); }
.app-sidebar {
  width: 220px;
  background: #fff;
  border-right: 1px solid #D6D6D6;
  position: sticky;
  top: 0;
  height: calc(100vh - 120px);
  overflow-y: auto;
}
.app-sidebar__nav {
  display: flex;
  flex-direction: column;
  padding: 12px 8px;
  gap: 2px;
}
.app-sidebar__link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: #4C4C4C;
  text-decoration: none;
  border-radius: 4px;
}
.app-sidebar__link:hover {
  background: #E8EDF8;
  color: #0943B5;
}
.app-sidebar__link--active {
  background: #E8EDF8;
  color: #0943B5;
  font-weight: 600;
  border-left: 3px solid #0943B5;
}
.app-content { flex: 1; min-width: 0; background: #F5F5F5; }
</style>`;

  codeGovcoBar = `<!-- Barra GOV.CO (obligatoria Kit UI v9.2) -->
<header class="govco-topbar" role="banner">
  <a href="https://www.gov.co/home/" target="_blank"
    rel="noopener" aria-label="Ir a GOV.CO">
    <img src="assets/logos/govco-logo.png"
      alt="Logo GOV.CO" height="36" />
  </a>
  <nav aria-label="Enlaces institucionales">
    <a href="https://www.gov.co/home/"
      target="_blank" rel="noopener">
      Portal GOV.CO
    </a>
  </nav>
</header>

<!-- CSS -->
<style>
.govco-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  background-color: #0943B5;
  padding: 0 24px;
  color: #fff;
}
</style>`;

  codeHeader = `<!-- Header con cobranding y accesibilidad -->
<div class="app-header">
  <div class="app-header__logos">
    <a href="https://www.contaduria.gov.co"
      target="_blank" rel="noopener">
      <img src="assets/logos/cobranding.svg"
        alt="Logo CGN - CHIP"
        class="app-header__cobranding" />
    </a>
  </div>
  <div class="app-header__right">
    <!-- Barra de accesibilidad -->
    <div class="accessibility-bar" role="toolbar"
      aria-label="Opciones de accesibilidad">
      <button aria-label="Aumentar tamaño de letra">
        <i class="pi pi-plus"></i> A+
      </button>
      <button aria-label="Reducir tamaño de letra">
        <i class="pi pi-minus"></i> A-
      </button>
      <button aria-label="Cambiar contraste">
        <i class="pi pi-sun"></i> Contraste
      </button>
    </div>
    <!-- Hamburguesa (visible en móvil) -->
    <button class="app-header__toggle"
      (click)="menuOpen = !menuOpen">
      <i class="pi pi-bars"></i>
    </button>
  </div>
</div>`;

  codeFooter = `<!-- Footer institucional (Kit UI v9.2) -->
<footer class="app-footer">
  <div class="app-footer__main">
    <!-- Logos -->
    <div class="app-footer__logos-col">
      <img src="assets/logos/hacienda-blanco.svg"
        alt="Ministerio de Hacienda" />
      <img src="assets/logos/govco-logo.png"
        alt="Logo GOV.CO" />
    </div>

    <!-- Información -->
    <div class="app-footer__info-col">
      <h3>Contaduría General de la Nación</h3>
      <p>Cuentas Claras, Estado Transparente.</p>
      <p>Dirección: Calle 26 No 69 - 76</p>
      <p>Edificio Elemento, Torre 1, Piso 15</p>
      <p>Bogotá D.C., Colombia</p>
      <div class="app-footer__social">
        <a href="#"><i class="pi pi-linkedin"></i> Linkedin</a>
        <a href="#"><i class="pi pi-twitter"></i> X</a>
        <a href="#"><i class="pi pi-youtube"></i> YouTube</a>
        <a href="#"><i class="pi pi-facebook"></i> Facebook</a>
      </div>
    </div>

    <!-- Contacto -->
    <div class="app-footer__contact-col">
      <h3><i class="pi pi-phone"></i> Contacto</h3>
      <p>Línea: +57(601) 492 64 00</p>
      <p>Correo: contactenos&#64;contaduria.gov.co</p>
      <p><a href="#">Política de privacidad</a></p>
      <p><a href="#">Términos y condiciones</a></p>
    </div>
  </div>
</footer>

<!-- CSS: fondo Cobalt 700, grid 3 columnas -->`;

  codeFloating = `<!-- Panel flotante de accesibilidad -->
<div class="floating-panel">
  <button class="floating-btn floating-btn--accessibility"
    (click)="showPanel = !showPanel"
    aria-label="Accesibilidad y servicios">
    <img src="assets/logos/wheelchair.svg" alt="" />
  </button>

  @if (showPanel) {
    <div class="floating-services">
      <button class="floating-btn floating-btn--service"
        aria-label="Contraste">
        <i class="pi pi-eye-slash"></i>
      </button>
      <button class="floating-btn floating-btn--service"
        aria-label="Chat de ayuda">
        <i class="pi pi-comment"></i>
      </button>
      <button class="floating-btn floating-btn--service"
        aria-label="Correo">
        <i class="pi pi-envelope"></i>
      </button>
    </div>
  }
</div>

<!-- Botón volver arriba -->
<button class="back-to-top"
  [class.back-to-top--visible]="showBackToTop"
  (click)="scrollToTop()"
  aria-label="Volver arriba">
  <i class="pi pi-chevron-up"></i>
  <span>Volver arriba</span>
</button>

// En el componente:
showBackToTop = false;
showPanel = false;

&#64;HostListener('window:scroll')
onScroll() {
  this.showBackToTop = window.scrollY > 300;
}

scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}`;

  codeTooltip = `<!-- Posiciones -->
<p-button label="Arriba" pTooltip="Tooltip arriba"
  tooltipPosition="top" />
<p-button label="Abajo" pTooltip="Tooltip abajo"
  tooltipPosition="bottom" />

<!-- En iconos de acción -->
<p-button icon="pi pi-eye" [rounded]="true" [text]="true"
  pTooltip="Ver detalle" />`;

  codeCheckboxRadio = `<!-- Checkbox -->
<p-checkbox [(ngModel)]="aceptado" [binary]="true"
  inputId="cb1" />
<label for="cb1">Acepto los términos y condiciones</label>

<!-- Radio Button -->
<p-radiobutton name="tipo" value="nacional"
  [(ngModel)]="tipoSeleccionado" inputId="rb1" />
<label for="rb1">Nacional</label>

<p-radiobutton name="tipo" value="territorial"
  [(ngModel)]="tipoSeleccionado" inputId="rb2" />
<label for="rb2">Territorial</label>`;

  codeSwitch = `<p-toggleswitch [(ngModel)]="activo" />
<span>Notificaciones por correo</span>
<p-tag [value]="activo ? 'Activo' : 'Inactivo'"
  [severity]="activo ? 'success' : 'secondary'" />`;

  codeDatepicker = `<!-- Fecha única -->
<label for="fecha">Fecha</label>
<p-datepicker id="fecha" [(ngModel)]="fecha"
  [showIcon]="true" dateFormat="dd/mm/yy"
  placeholder="DD/MM/AAAA" class="w-full" />

<!-- Rango de fechas -->
<p-datepicker [(ngModel)]="rango" selectionMode="range"
  [showIcon]="true" dateFormat="dd/mm/yy"
  placeholder="Desde - Hasta" class="w-full" />

<!-- Mes y año -->
<p-datepicker [(ngModel)]="mes" view="month"
  dateFormat="mm/yy" [showIcon]="true"
  placeholder="MM/AAAA" class="w-full" />`;

  codeChip = `<!-- Chips básicos -->
<p-chip label="Angular" />
<p-chip label="PrimeNG" />

<!-- Con icono -->
<p-chip label="Seguridad" icon="pi pi-shield" />

<!-- Removibles -->
<p-chip label="Nacional" [removable]="true"
  (onRemove)="removeFilter('Nacional')" />`;

  codeAvatar = `<!-- Con iniciales -->
<p-avatar label="JP" shape="circle" size="large"
  [style]="{ 'background-color': '#0943B5', color: '#fff' }" />

<!-- Con icono -->
<p-avatar icon="pi pi-user" shape="circle"
  [style]="{ 'background-color': '#E8EDF8', color: '#0943B5' }" />

<!-- Grupo de avatares -->
<p-avatargroup>
  <p-avatar label="JP" shape="circle"
    [style]="{ 'background-color': '#0943B5', color: '#fff' }" />
  <p-avatar label="MG" shape="circle"
    [style]="{ 'background-color': '#4CAF50', color: '#fff' }" />
  <p-avatar label="+5" shape="circle"
    [style]="{ 'background-color': '#D6D6D6', color: '#4C4C4C' }" />
</p-avatargroup>`;

  codeSkeleton = `<!-- Elementos individuales -->
<p-skeleton width="100%" height="2rem" />
<p-skeleton width="75%" height="1rem" />
<p-skeleton shape="circle" size="3rem" />

<!-- Tabla con skeleton -->
<div class="skeleton-table__row">
  <p-skeleton width="60px" height="1rem" />
  <p-skeleton width="200px" height="1rem" />
  <p-skeleton width="80px" height="1.5rem"
    borderRadius="12px" />
</div>`;

  codeTimeline = `<p-timeline [value]="eventos" align="left">
  <ng-template #content let-event>
    <div>
      <strong>{{ event.title }}</strong>
      <p>{{ event.description }}</p>
      <small>{{ event.date }}</small>
    </div>
  </ng-template>
  <ng-template #marker let-event>
    <span class="timeline-marker"
      [style.background-color]="event.color">
      <i [class]="event.icon"></i>
    </span>
  </ng-template>
</p-timeline>

// En el componente:
eventos = [
  { title: 'Reporte enviado',
    description: 'Balance General 2026-I',
    date: '15 Mar 2026',
    icon: 'pi pi-send',
    color: '#0943B5' },
];`;

  codeTextarea = `<!-- Básico -->
<textarea pTextarea rows="3"
  placeholder="Escriba aquí..." class="w-full"></textarea>

<!-- Auto-resize -->
<textarea pTextarea [autoResize]="true" rows="3"
  placeholder="Se expande..." class="w-full"></textarea>

<!-- Con contador -->
<label>Observaciones ({{ count }}/200)</label>
<textarea pTextarea [(ngModel)]="texto"
  [maxlength]="200" rows="3" class="w-full"></textarea>`;

  codeInputNumber = `<!-- Básico -->
<p-inputnumber [(ngModel)]="cantidad"
  placeholder="Cantidad" class="w-full" />

<!-- Con botones -->
<p-inputnumber [(ngModel)]="valor"
  [showButtons]="true" [min]="0" [max]="100"
  class="w-full" />

<!-- Moneda COP -->
<p-inputnumber [(ngModel)]="monto"
  mode="currency" currency="COP" locale="es-CO"
  class="w-full" />

<!-- Decimales -->
<p-inputnumber [(ngModel)]="decimal"
  [minFractionDigits]="2" [maxFractionDigits]="4"
  class="w-full" />`;

  codeMultiSelect = `<p-multiselect [options]="departamentos"
  [(ngModel)]="seleccionados"
  placeholder="Seleccione departamentos"
  class="w-full" [display]="'chip'" />

// En el componente:
departamentos = [
  { label: 'Bogotá D.C.', value: 'bogota' },
  { label: 'Antioquia', value: 'antioquia' },
  { label: 'Valle del Cauca', value: 'valle' },
];`;

  codeMenu = `<!-- Menú popup con botón -->
<p-menu #menuRef [model]="items" [popup]="true" />
<p-button label="Acciones" icon="pi pi-ellipsis-v"
  (onClick)="menuRef.toggle($event)" />

<!-- Split Button -->
<p-splitbutton label="Guardar" icon="pi pi-save"
  [model]="opcionesGuardar" />

<!-- Menubar -->
<p-menubar [model]="menuItems" />

// En el componente:
items: MenuItem[] = [
  { label: 'Ver detalle', icon: 'pi pi-eye' },
  { label: 'Editar', icon: 'pi pi-pencil' },
  { separator: true },
  { label: 'Eliminar', icon: 'pi pi-trash' },
];`;

  codePanel = `<!-- Panel colapsable -->
<p-panel header="Información de la Entidad"
  [toggleable]="true">
  <div class="form-grid">
    <div class="form-group">
      <label>Código CHIP</label>
      <input pInputText value="11001000"
        class="w-full" readonly />
    </div>
  </div>
</p-panel>

<!-- Fieldset colapsable -->
<p-fieldset legend="Datos de Contacto"
  [toggleable]="true">
  <div class="form-grid">
    <div class="form-group">
      <label>Teléfono</label>
      <input pInputText value="+57(601) 492 64 00"
        class="w-full" readonly />
    </div>
  </div>
</p-fieldset>`;

  codeSidebarComponent = `<!-- Botón para abrir -->
<p-button label="Abrir panel"
  (onClick)="visible = true" />

<!-- Sidebar -->
<p-sidebar [(visible)]="visible" position="right"
  [style]="{ width: '400px' }">
  <ng-template #header>
    <h3>Editar Entidad</h3>
  </ng-template>
  <div>
    <label>Razón Social</label>
    <input pInputText class="w-full" />
    <label>NIT</label>
    <input pInputText class="w-full" />
  </div>
  <div class="sidebar-form__actions">
    <p-button label="Cancelar" severity="secondary"
      [outlined]="true" (onClick)="visible = false" />
    <p-button label="Guardar" icon="pi pi-save"
      (onClick)="visible = false" />
  </div>
</p-sidebar>`;

  codeConfirmDialog = `<!-- Botón que dispara confirmación -->
<p-button label="Eliminar" icon="pi pi-trash"
  severity="danger"
  (onClick)="showConfirm = true" />

<!-- Diálogo de confirmación -->
<p-dialog header="Confirmar eliminación"
  [(visible)]="showConfirm"
  [style]="{ width: '450px' }" [modal]="true">
  <div class="confirm-content">
    <i class="pi pi-exclamation-triangle
      confirm-content__icon--danger"></i>
    <div>
      <p><strong>¿Está seguro?</strong></p>
      <p>Esta acción no se puede deshacer.</p>
    </div>
  </div>
  <ng-template #footer>
    <p-button label="Cancelar" severity="secondary"
      [text]="true"
      (onClick)="showConfirm = false" />
    <p-button label="Eliminar" icon="pi pi-trash"
      severity="danger"
      (onClick)="showConfirm = false" />
  </ng-template>
</p-dialog>`;

  codeFileUpload = `<!-- Básico -->
<p-fileupload mode="basic" chooseLabel="Seleccionar"
  chooseIcon="pi pi-upload" />

<!-- Avanzado con drag & drop -->
<p-fileupload [multiple]="true"
  accept=".pdf,.xlsx,.csv" [maxFileSize]="5000000"
  chooseLabel="Seleccionar" chooseIcon="pi pi-upload"
  [showUploadButton]="false"
  [showCancelButton]="false">
  <ng-template #empty>
    <div class="fileupload-empty">
      <i class="pi pi-cloud-upload"></i>
      <p>Arrastre archivos aquí</p>
      <small>PDF, Excel, CSV. Máx 5MB.</small>
    </div>
  </ng-template>
</p-fileupload>`;

  themeSource = '';

  constructor(private messageService: MessageService) {
    // Load theme source for display
    this.themeSource = THEME_SOURCE;
  }

  downloadTheme() {
    const blob = new Blob([THEME_SOURCE], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chip-preset.ts';
    a.click();
    URL.revokeObjectURL(url);
    this.messageService.add({
      severity: 'success',
      summary: 'Descarga iniciada',
      detail: 'El archivo chip-preset.ts se está descargando.',
    });
  }

  copyTheme() {
    navigator.clipboard.writeText(THEME_SOURCE).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copiado',
        detail: 'El código del preset fue copiado al portapapeles.',
      });
    });
  }

  showToast(severity: string, summary: string, detail: string) {
    this.messageService.add({ severity, summary, detail });
  }

  getStateSeverity(estado: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' | 'contrast' | undefined {
    switch (estado) {
      case 'Activo': return 'success';
      case 'Inactivo': return 'danger';
      case 'Pendiente': return 'warn';
      default: return 'info';
    }
  }

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}

const THEME_SOURCE = `import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * CHIP 2.0 Design System Preset
 * Based on Kit UI v9.2 (GOV.CO)
 *
 * Primary: Cobalt Blue #0943B5
 * Informativos: Success #4CAF50, Warning #FBC02D, Danger #F44336, Info #0943B5
 * Fondos: White Smoke #F5F5F5, Solitude #EBF0FA, Corn Silk #FFF8E1
 */

export const ChipPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0', xs: '2px', sm: '4px', md: '6px', lg: '8px', xl: '12px',
    },
    cobalt: {
      50: '#E8EDF8', 100: '#C5D2EE', 200: '#9EB4E3', 300: '#7796D8',
      400: '#5A80CF', 500: '#3D6AC6', 600: '#1E54B8', 700: '#0943B5',
      800: '#073899', 900: '#052D7D', 950: '#031E54',
    },
    grey: {
      50: '#F5F5F5', 100: '#EBEBEB', 200: '#D6D6D6', 300: '#BDBDBD',
      400: '#9E9E9E', 500: '#7A7A7A', 600: '#616161', 700: '#4C4C4C',
      800: '#3B3B3B', 900: '#2B2B2B', 950: '#1A1A1A',
    },
    success: {
      50: '#E8F5E9', 100: '#C8E6C9', 200: '#A5D6A7', 300: '#81C784',
      400: '#66BB6A', 500: '#4CAF50', 600: '#43A047', 700: '#388E3C',
      800: '#2E7D32', 900: '#1B5E20', 950: '#0D3610',
    },
    warning: {
      50: '#FFFDE7', 100: '#FFF9C4', 200: '#FFF59D', 300: '#FFF176',
      400: '#FFEE58', 500: '#FFEB3B', 600: '#FDD835', 700: '#FBC02D',
      800: '#F9A825', 900: '#F57F17', 950: '#E65100',
    },
    danger: {
      50: '#FFEBEE', 100: '#FFCDD2', 200: '#EF9A9A', 300: '#E57373',
      400: '#EF5350', 500: '#F44336', 600: '#E53935', 700: '#D32F2F',
      800: '#C62828', 900: '#B71C1C', 950: '#7F0000',
    },
    solitude: '#EBF0FA',
    cornSilk: '#FFF8E1',
    whiteSmoke: '#F5F5F5',
  },
  semantic: {
    transitionDuration: '0.2s',
    primary: {
      50: '{cobalt.50}', 100: '{cobalt.100}', 200: '{cobalt.200}',
      300: '{cobalt.300}', 400: '{cobalt.400}', 500: '{cobalt.500}',
      600: '{cobalt.600}', 700: '{cobalt.700}', 800: '{cobalt.800}',
      900: '{cobalt.900}', 950: '{cobalt.950}',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{cobalt.700}',
          contrastColor: '#ffffff',
          hoverColor: '{cobalt.800}',
          activeColor: '{cobalt.900}',
        },
      },
    },
  },
  components: {
    button: {
      colorScheme: {
        light: {
          root: {
            primary: { background: '{cobalt.700}', color: '#ffffff' },
            success: { background: '{success.500}', color: '#ffffff' },
            warn: { background: '{warning.800}', color: '#ffffff' },
            danger: { background: '{danger.500}', color: '#ffffff' },
          },
        },
      },
    },
    tag: {
      colorScheme: {
        light: {
          success: { background: '{success.50}', color: '{success.700}' },
          warn: { background: '{warning.50}', color: '{warning.900}' },
          danger: { background: '{danger.50}', color: '{danger.700}' },
          info: { background: '{cobalt.50}', color: '{cobalt.700}' },
        },
      },
    },
  },
});`;
