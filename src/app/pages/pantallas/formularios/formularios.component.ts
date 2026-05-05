import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { CheckboxModule } from 'primeng/checkbox';
import { MenuModule } from 'primeng/menu';
import { ChipModule } from 'primeng/chip';
import { MessageService, MenuItem } from 'primeng/api';

interface Formulario {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  categoria: string;
  periodo: string;
  anio: number;
  estadoValidacion: string;
  ultimaModificacion: string;
}

interface AccionPermiso {
  key: string;
  label: string;
  icon: string;
  enabled: boolean;
}

@Component({
  selector: 'app-formularios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule,
    BreadcrumbModule,
    IconFieldModule,
    InputIconModule,
    DividerModule,
    MessageModule,
    ProgressBarModule,
    CheckboxModule,
    MenuModule,
    ChipModule,
  ],
  providers: [MessageService],
  templateUrl: './formularios.component.html',
  styleUrl: './formularios.component.scss',
})
export class FormulariosComponent {
  @ViewChild('menuFormulario') menuFormulario: any;
  selectedFormularioForMenu: Formulario | null = null;

  constructor(private messageService: MessageService) {}

  menuFormularioItems: MenuItem[] = [
    { label: 'Abrir', icon: 'pi pi-external-link', command: () => this.messageService.add({ severity: 'info', summary: 'Abrir Formulario', detail: `Abriendo "${this.selectedFormularioForMenu?.nombre}"` }) },
    { label: 'Exportar', icon: 'pi pi-download', command: () => this.messageService.add({ severity: 'info', summary: 'Exportar', detail: `Exportando "${this.selectedFormularioForMenu?.codigo}"` }) },
    { separator: true },
    { label: 'Validar', icon: 'pi pi-check-circle', command: () => this.messageService.add({ severity: 'success', summary: 'Validación', detail: `Formulario "${this.selectedFormularioForMenu?.codigo}" enviado a validación.` }) },
  ];

  abrirMenuFormulario(event: Event, form: Formulario) {
    this.selectedFormularioForMenu = form;
    this.menuFormulario.toggle(event);
  }

  // ── Breadcrumb ──
  breadcrumbItems: MenuItem[] = [
    { label: 'Pantallas', icon: 'pi pi-th-large', routerLink: '/pantallas/correos' },
    { label: 'Gestión de Formularios' },
  ];
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  // ── Filtros ──
  entidad = 'Contaduría General de la Nación';
  selectedCategoria = '';
  selectedAnio = '';
  selectedPeriodo = '';
  filtersApplied = false;
  filtersCollapsed = false;

  categoriaOptions = [
    { label: 'Seleccione categoría', value: '' },
    { label: 'INFORMACIÓN CONTABLE PÚBLICA CONVERGENCIA', value: 'ICP' },
    { label: 'INFORMACIÓN PRESUPUESTAL', value: 'IP' },
    { label: 'INFORMACIÓN FINANCIERA', value: 'IF' },
    { label: 'CONTROL INTERNO CONTABLE', value: 'CIC' },
    { label: 'CGR PRESUPUESTAL', value: 'CGR' },
    { label: 'FUT GASTOS DE FUNCIONAMIENTO', value: 'FUT_GF' },
    { label: 'FUT GASTOS DE INVERSIÓN', value: 'FUT_GI' },
    { label: 'FUT INGRESOS', value: 'FUT_ING' },
  ];

  anioOptions = [
    { label: 'Seleccione año', value: '' },
    { label: '2026', value: '2026' },
    { label: '2025', value: '2025' },
    { label: '2024', value: '2024' },
    { label: '2023', value: '2023' },
    { label: '2022', value: '2022' },
  ];

  periodoOptions = [
    { label: 'Seleccione periodo', value: '' },
    { label: 'Enero - Marzo (Trimestre 1)', value: 'T1' },
    { label: 'Abril - Junio (Trimestre 2)', value: 'T2' },
    { label: 'Julio - Septiembre (Trimestre 3)', value: 'T3' },
    { label: 'Octubre - Diciembre (Trimestre 4)', value: 'T4' },
    { label: 'Anual', value: 'ANUAL' },
  ];

  // ── Permisos del perfil actual (simula permisos otorgados al rol) ──
  acciones: AccionPermiso[] = [
    { key: 'importar', label: 'Importar', icon: 'pi pi-upload', enabled: true },
    { key: 'enviarAdjunto', label: 'Enviar Adjunto', icon: 'pi pi-paperclip', enabled: true },
    { key: 'consultarEnvios', label: 'Consultar Envíos', icon: 'pi pi-inbox', enabled: true },
    { key: 'validar', label: 'Validar', icon: 'pi pi-check-circle', enabled: false },
    { key: 'buscar', label: 'Buscar', icon: 'pi pi-search', enabled: true },
    { key: 'exportar', label: 'Exportar', icon: 'pi pi-download', enabled: true },
  ];

  // ── Panel contextual activo ──
  activePanel: string | null = null;
  selectedFormularios: Formulario[] = [];

  // ── Importar ──
  importFileName = '';

  // ── Exportar ──
  exportFormatOptions = [
    { label: 'Excel (.xlsx)', value: 'xlsx' },
    { label: 'PDF (.pdf)', value: 'pdf' },
    { label: 'CSV (.csv)', value: 'csv' },
  ];
  selectedExportFormat = 'xlsx';

  hasPermission(key: string): boolean {
    return this.acciones.find(a => a.key === key)?.enabled ?? false;
  }

  executeAction(key: string) {
    const accion = this.acciones.find(a => a.key === key);
    if (!accion) return;

    // Sin permisos → advertencia
    if (!accion.enabled) {
      this.messageService.add({
        severity: 'error',
        summary: 'CHIP - Acceso Denegado',
        detail: `No tiene permisos para "${accion.label}". Contacte al administrador de seguridad.`,
        life: 5000,
      });
      return;
    }

    // Validar requiere selección
    if (key === 'validar' && this.selectedFormularios.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Selección requerida', detail: 'Debe seleccionar al menos un formulario para validar.' });
      return;
    }

    // Toggle panel contextual
    if (['importar', 'exportar', 'consultarEnvios', 'validar'].includes(key)) {
      this.activePanel = this.activePanel === key ? null : key;
      return;
    }

    // Acciones directas
    if (key === 'buscar') {
      // Focus en el campo de búsqueda (ya visible)
      return;
    }
    if (key === 'enviarAdjunto') {
      if (this.selectedFormularios.length === 0) {
        this.messageService.add({ severity: 'warn', summary: 'Selección requerida', detail: 'Seleccione los formularios que desea enviar.' });
        return;
      }
      this.messageService.add({ severity: 'success', summary: 'Envío iniciado', detail: `Enviando ${this.selectedFormularios.length} formulario(s) como adjunto...` });
      return;
    }
  }

  closePanel() {
    this.activePanel = null;
  }

  confirmImport() {
    if (!this.importFileName) return;
    this.messageService.add({ severity: 'success', summary: 'Importación iniciada', detail: `Importando archivo "${this.importFileName}"...` });
    this.importFileName = '';
    this.activePanel = null;
  }

  confirmExport() {
    this.messageService.add({ severity: 'success', summary: 'Exportación iniciada', detail: `Exportando ${this.filteredFormularios.length} formulario(s) en formato ${this.selectedExportFormat.toUpperCase()}...` });
    this.activePanel = null;
  }

  confirmValidation() {
    const count = this.selectedFormularios.length;
    this.messageService.add({ severity: 'success', summary: 'Validación iniciada', detail: `Validando ${count} formulario(s) seleccionado(s)...` });
    this.selectedFormularios = [];
    this.activePanel = null;
  }

  get canValidate(): boolean {
    return this.hasPermission('validar') && this.selectedFormularios.length > 0;
  }

  // ── Formularios (datos reales CHIP) ──
  formularios: Formulario[] = [
    { id: 1, codigo: 'CGN-2025-01', nombre: 'Balance General', tipo: 'Formulario', categoria: 'ICP', periodo: 'T1', anio: 2024, estadoValidacion: 'Pendiente de validar', ultimaModificacion: '5/11/2024' },
    { id: 2, codigo: 'CGN-2025-02', nombre: 'Estado de Resultados', tipo: 'Formulario', categoria: 'ICP', periodo: 'T1', anio: 2024, estadoValidacion: 'Pendiente de validar', ultimaModificacion: '5/11/2024' },
    { id: 3, codigo: 'CGN-2025-03', nombre: 'Flujo de Efectivo', tipo: 'Formulario', categoria: 'ICP', periodo: 'T1', anio: 2024, estadoValidacion: 'Pendiente de validar', ultimaModificacion: '7/11/2024' },
    { id: 4, codigo: 'CGN-2025-04', nombre: 'Estado de Cambios en el Patrimonio', tipo: 'Formulario', categoria: 'ICP', periodo: 'T1', anio: 2024, estadoValidacion: 'Pendiente de validar', ultimaModificacion: '5/11/2024' },
    { id: 5, codigo: 'CGN-2025-05', nombre: 'Notas a los Estados Financieros', tipo: 'Formulario', categoria: 'ICP', periodo: 'T1', anio: 2024, estadoValidacion: 'Pendiente de validar', ultimaModificacion: '5/11/2024' },
    { id: 6, codigo: 'CGN-2025-06', nombre: 'Información Complementaria', tipo: 'Formulario', categoria: 'ICP', periodo: 'T1', anio: 2024, estadoValidacion: 'Rechazado por Deficiencia', ultimaModificacion: '4/11/2024' },
  ];

  searchFormulario = '';

  // ── Filtros ──
  get canApplyFilters(): boolean {
    return !!this.selectedCategoria && !!this.selectedAnio;
  }

  get filteredFormularios(): Formulario[] {
    if (!this.filtersApplied) return [];
    let results = this.formularios.filter(f => {
      const matchCat = !this.selectedCategoria || f.categoria === this.selectedCategoria;
      const matchAnio = !this.selectedAnio || f.anio === +this.selectedAnio;
      const matchPeriodo = !this.selectedPeriodo || f.periodo === this.selectedPeriodo;
      return matchCat && matchAnio && matchPeriodo;
    });
    if (this.searchFormulario) {
      const q = this.searchFormulario.toLowerCase();
      results = results.filter(f => f.nombre.toLowerCase().includes(q) || f.codigo.toLowerCase().includes(q));
    }
    return results;
  }

  applyFilters() {
    if (!this.canApplyFilters) {
      this.messageService.add({ severity: 'warn', summary: 'Filtros requeridos', detail: 'Debe seleccionar al menos Categoría y Año.' });
      return;
    }
    this.filtersApplied = true;
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.selectedCategoria) count++;
    if (this.selectedAnio) count++;
    if (this.selectedPeriodo) count++;
    return count;
  }

  get activeFilters(): { label: string; field: string }[] {
    const filters: { label: string; field: string }[] = [];
    if (this.selectedCategoria) {
      const cat = this.categoriaOptions.find(o => o.value === this.selectedCategoria);
      filters.push({ label: `Categoría: ${cat?.label || this.selectedCategoria}`, field: 'selectedCategoria' });
    }
    if (this.selectedAnio) filters.push({ label: `Año: ${this.selectedAnio}`, field: 'selectedAnio' });
    if (this.selectedPeriodo) {
      const per = this.periodoOptions.find(o => o.value === this.selectedPeriodo);
      filters.push({ label: `Periodo: ${per?.label || this.selectedPeriodo}`, field: 'selectedPeriodo' });
    }
    return filters;
  }

  removeFilter(field: string) {
    (this as any)[field] = '';
    this.filtersApplied = false;
  }

  clearFilters() {
    this.selectedCategoria = '';
    this.selectedAnio = '';
    this.selectedPeriodo = '';
    this.filtersApplied = false;
    this.searchFormulario = '';
  }

  getEstadoSeverity(estado: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'info' | 'secondary'> = {
      'Pendiente de validar': 'warn',
      'Rechazado por Deficiencia': 'danger',
      'Validado': 'success',
      'En proceso': 'info',
    };
    return map[estado] || 'secondary';
  }
}
