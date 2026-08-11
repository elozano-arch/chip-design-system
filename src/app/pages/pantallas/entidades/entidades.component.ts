import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { MenuModule, Menu } from 'primeng/menu';
import { ChipModule } from 'primeng/chip';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { StepperModule } from 'primeng/stepper';
import { MessageService, MenuItem } from 'primeng/api';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import { FormErrorBannerComponent } from '../../../components/form-error-banner/form-error-banner.component';

/* ════════════════ Modelo ════════════════ */

export type EstadoEntidad = 'Solicitud' | 'Activo' | 'Inactivo';

export interface AmbitoAsignado {
  id: number;
  categoria: string;
  ambito: string;
  anio: number;
  periodo: string;
}

export interface Entidad {
  id: number;
  codigo: string;        // Código Entidad (autogenerado)
  nit: string;
  dv: string;
  sigla: string;
  razonSocial: string;
  objeto: string;
  documentoCreacion: string;
  numeroDocumento: string;
  fecha: string | null;
  departamento: string;
  municipio: string;
  direccion: string;
  codigoPostal: string;
  telefono: string;
  email: string;
  paginaWeb: string;
  sector: string;
  naturaleza: string;
  territorialDepartamental: string;
  territorialMunicipal: string;
  agregadora: string;
  consolidadora: string;
  planeadora: string;
  nombreUsuario: string;
  estado: EstadoEntidad;
  subEstado: string | null;
  fechaEstado: string | null;
  actoAdministrativo: string;
  observaciones: string;
  ambitos: AmbitoAsignado[];
}

/** `crear` muestra sólo Información General; `editar` muestra el wizard de 7 pasos. */
type Vista = 'list' | 'crear' | 'editar';
type FormMode = 'crear' | 'editar';

/** Pesos del algoritmo de dígito de verificación del NIT (constante de módulo
 *  para no depender del orden de inicialización de campos de la clase). */
const PESOS_DV = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

@Component({
  selector: 'app-entidades',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, TableModule, TagModule,
    ToastModule, TooltipModule, IconFieldModule, InputIconModule,
    SelectModule, DialogModule, DividerModule, MenuModule, ChipModule,
    SelectButtonModule, DatePickerModule, BreadcrumbModule, StepperModule,
    AppBreadcrumbComponent, FormErrorBannerComponent,
  ],
  providers: [MessageService],
  templateUrl: './entidades.component.html',
  styleUrl: './entidades.component.scss',
})
export class EntidadesComponent {
  constructor(private messageService: MessageService) {}

  private readonly MIN_FILTRO = 3; // los campos de texto filtran desde el 3er carácter
  private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ───────────── Navegación ───────────── */
  vista: Vista = 'list';

  /** Deriva de `vista`: la creación y la edición ya son vistas distintas. */
  get formMode(): FormMode {
    return this.vista === 'crear' ? 'crear' : 'editar';
  }

  /* ───────────── Menú de acciones por fila ───────────── */
  @ViewChild('menuAcciones') menuAcciones!: Menu;
  selectedEntidad: Entidad | null = null;

  get menuAccionesItems(): MenuItem[] {
    const e = this.selectedEntidad;
    if (!e) return [];
    // El cambio de estado se hace en la pestaña "Estado" de la edición, no desde aquí.
    return [
      { label: 'Editar', icon: 'pi pi-pencil', command: () => { if (this.selectedEntidad) this.abrirEditar(this.selectedEntidad); } },
    ];
  }

  abrirMenuAcciones(event: Event, entidad: Entidad): void {
    this.selectedEntidad = entidad;
    this.menuAcciones.toggle(event);
  }

  /* ═══════════════ Opciones (mock) ═══════════════ */
  readonly estadoFilterOptions = [
    { label: 'Todos', value: 'todos' },
    { label: 'Solicitud', value: 'Solicitud' },
    { label: 'Activo', value: 'Activo' },
    { label: 'Inactivo', value: 'Inactivo' },
  ];

  readonly objetoOptions = [
    { label: 'Central', value: 'Central' },
    { label: 'Local', value: 'Local' },
  ];

  readonly departamentoOptions = [
    'Antioquia', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Cundinamarca', 'Santander', 'Valle del Cauca',
  ].map(d => ({ label: d, value: d }));

  readonly municipiosPorDepartamento: Record<string, string[]> = {
    'Antioquia': ['Medellín', 'Bello', 'Envigado', 'Itagüí', 'Rionegro'],
    'Atlántico': ['Barranquilla', 'Soledad', 'Malambo'],
    'Bogotá D.C.': ['Bogotá D.C.'],
    'Bolívar': ['Cartagena', 'Magangué', 'Turbaco'],
    'Cundinamarca': ['Soacha', 'Chía', 'Zipaquirá', 'Facatativá', 'Girardot'],
    'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Barrancabermeja'],
    'Valle del Cauca': ['Cali', 'Palmira', 'Buenaventura', 'Tuluá'],
  };

  readonly sectorOptions = [
    'Gobierno general', 'Sociedad pública financiera', 'Sociedad pública no financiera', 'Seguridad social',
  ].map(s => ({ label: s, value: s }));

  readonly naturalezaPorSector: Record<string, string[]> = {
    'Gobierno general': ['Gobierno central', 'Gobierno departamental', 'Gobierno municipal'],
    'Sociedad pública financiera': ['Banca de primer piso', 'Banca de segundo piso', 'Entidad aseguradora'],
    'Sociedad pública no financiera': ['Empresa industrial y comercial', 'Sociedad de economía mixta'],
    'Seguridad social': ['Régimen contributivo', 'Régimen subsidiado'],
  };

  readonly territorialOptions = ['No aplica', 'Departamental', 'Municipal', 'Distrital'].map(t => ({ label: t, value: t }));
  readonly siNoOptions = [{ label: 'Sí', value: 'Sí' }, { label: 'No', value: 'No' }];

  readonly nuevoEstadoOptions = [
    { label: 'Solicitud', value: 'Solicitud' },
    { label: 'Activo', value: 'Activo' },
  ];
  readonly subEstadoPorNuevoEstado: Record<string, string[]> = {
    'Solicitud': ['Ninguno'],
    'Activo': ['Activa', 'En escisión', 'Proyecto DECO', 'En fusión', 'En liquidación'],
  };

  /* Ámbitos: categoría → ámbito, año y periodo (la CGN maneja ~4 categorías). */
  readonly categoriaOptions = [
    { label: 'Contabilidad', value: 'Contabilidad' },
    { label: 'Presupuesto', value: 'Presupuesto' },
    { label: 'Tesorería', value: 'Tesorería' },
    { label: 'Regalías', value: 'Regalías' },
  ];
  readonly ambitosPorCategoria: Record<string, string[]> = {
    Contabilidad: ['CGN - Convergencia', 'CGN - Contable', 'BDME'],
    Presupuesto: ['CGR - Presupuestal', 'FUT - Ejecución'],
    Tesorería: ['CUN - Tesorería', 'Flujo de caja'],
    Regalías: ['SGR - Regalías', 'DNP - Inversión'],
  };
  readonly anioOptions = [2026, 2025, 2024, 2023].map(a => ({ label: String(a), value: a }));
  readonly periodoOptions = ['Anual', 'Trimestre I', 'Trimestre II', 'Trimestre III', 'Trimestre IV']
    .map(p => ({ label: p, value: p }));

  /* ═══════════════ Datos mock ═══════════════ */
  entidades: Entidad[] = [
    this.mockEntidad(1, 'E001', '899.999.001', 'CGN', 'Contaduría General de la Nación', 'Central', 'Gobierno general', 'Gobierno central', 'Activo', 'Activa', 'Bogotá D.C.', 'Bogotá D.C.'),
    this.mockEntidad(2, 'E002', '800.890.123', 'ALCBOG', 'Alcaldía Mayor de Bogotá D.C.', 'Local', 'Gobierno general', 'Gobierno municipal', 'Activo', 'Activa', 'Bogotá D.C.', 'Bogotá D.C.'),
    this.mockEntidad(3, 'E003', '890.905.211', 'GOBANT', 'Gobernación de Antioquia', 'Local', 'Gobierno general', 'Gobierno departamental', 'Solicitud', null, 'Antioquia', 'Medellín'),
    this.mockEntidad(4, 'E004', '899.999.055', 'MINHAC', 'Ministerio de Hacienda y Crédito Público', 'Central', 'Gobierno general', 'Gobierno central', 'Activo', 'Activa', 'Bogotá D.C.', 'Bogotá D.C.'),
    this.mockEntidad(5, 'E005', '890.399.010', 'EMCALI', 'Empresas Municipales de Cali E.I.C.E.', 'Local', 'Sociedad pública no financiera', 'Empresa industrial y comercial', 'Inactivo', 'En liquidación', 'Valle del Cauca', 'Cali'),
    this.mockEntidad(6, 'E006', '830.053.812', 'ETB', 'Empresa de Telecomunicaciones de Bogotá S.A. E.S.P.', 'Local', 'Sociedad pública no financiera', 'Sociedad de economía mixta', 'Solicitud', null, 'Bogotá D.C.', 'Bogotá D.C.'),
  ];

  private mockEntidad(
    id: number, codigo: string, nit: string, sigla: string, razon: string, objeto: string,
    sector: string, naturaleza: string, estado: EstadoEntidad, subEstado: string | null,
    departamento: string, municipio: string,
  ): Entidad {
    return {
      id, codigo, nit, dv: this.calcularDV(nit), sigla, razonSocial: razon, objeto,
      documentoCreacion: 'Ley', numeroDocumento: '1000', fecha: '01/01/2000',
      departamento, municipio, direccion: 'Calle 1 # 1-1', codigoPostal: '110001',
      telefono: '6011234567', email: `${sigla.toLowerCase()}@entidad.gov.co`, paginaWeb: '',
      sector, naturaleza, territorialDepartamental: 'No aplica', territorialMunicipal: 'No aplica',
      agregadora: 'No', consolidadora: 'No', planeadora: 'No', nombreUsuario: sigla.toLowerCase(),
      estado, subEstado, fechaEstado: estado === 'Solicitud' ? null : '01/01/2020',
      actoAdministrativo: '', observaciones: '',
      ambitos: id === 1
        ? [
            { id: 1, categoria: 'Contabilidad', ambito: 'CGN - Convergencia', anio: 2025, periodo: 'Anual' },
            { id: 2, categoria: 'Presupuesto', ambito: 'CGR - Presupuestal', anio: 2025, periodo: 'Trimestre IV' },
          ]
        : [],
    };
  }

  /* ═══════════════ Filtros (HU-01) ═══════════════ */
  filterRazon = '';
  filterNit = '';
  filterSigla = '';
  filterCodigo = '';
  filterDepartamento = '';
  filterMunicipio = '';
  filterEstado = 'todos';
  filtersCollapsed = false;

  busquedaRealizada = false;
  private filtrosAplicados: any = null;

  /** Municipios disponibles según el departamento del filtro. */
  get municipiosFiltroOptions(): { label: string; value: string }[] {
    return (this.municipiosPorDepartamento[this.filterDepartamento] ?? []).map(m => ({ label: m, value: m }));
  }
  onFilterDepartamentoChange(): void {
    this.filterMunicipio = '';
  }

  get activeFilterCount(): number {
    let c = 0;
    if (this.filterRazon) c++;
    if (this.filterNit) c++;
    if (this.filterSigla) c++;
    if (this.filterCodigo) c++;
    if (this.filterDepartamento) c++;
    if (this.filterMunicipio) c++;
    if (this.filterEstado !== 'todos') c++;
    return c;
  }

  get activeFilters(): { label: string; field: string }[] {
    const f: { label: string; field: string }[] = [];
    if (this.filterRazon) f.push({ label: `Razón social: "${this.filterRazon}"`, field: 'filterRazon' });
    if (this.filterNit) f.push({ label: `NIT: "${this.filterNit}"`, field: 'filterNit' });
    if (this.filterSigla) f.push({ label: `Sigla: "${this.filterSigla}"`, field: 'filterSigla' });
    if (this.filterCodigo) f.push({ label: `Código: "${this.filterCodigo}"`, field: 'filterCodigo' });
    if (this.filterDepartamento) f.push({ label: `Depto: ${this.filterDepartamento}`, field: 'filterDepartamento' });
    if (this.filterMunicipio) f.push({ label: `Municipio: ${this.filterMunicipio}`, field: 'filterMunicipio' });
    if (this.filterEstado !== 'todos') f.push({ label: `Estado: ${this.filterEstado}`, field: 'filterEstado' });
    return f;
  }

  removeFilter(field: string): void {
    if (field === 'filterEstado') this.filterEstado = 'todos';
    else if (field === 'filterDepartamento') { this.filterDepartamento = ''; this.filterMunicipio = ''; }
    else (this as any)[field] = '';
  }

  clearFilters(): void {
    this.filterRazon = this.filterNit = this.filterSigla = this.filterCodigo = '';
    this.filterDepartamento = this.filterMunicipio = '';
    this.filterEstado = 'todos';
    this.busquedaRealizada = false;
    this.filtrosAplicados = null;
  }

  onBuscar(): void {
    // Los campos de texto solo filtran a partir del 3er carácter (HU-01, criterio 5).
    const t = (v: string) => (v.trim().length >= this.MIN_FILTRO ? v.trim().toLowerCase() : '');
    this.filtrosAplicados = {
      razon: t(this.filterRazon), nit: t(this.filterNit), sigla: t(this.filterSigla),
      codigo: t(this.filterCodigo),
      departamento: this.filterDepartamento, municipio: this.filterMunicipio,
      estado: this.filterEstado,
    };
    this.busquedaRealizada = true;
  }

  get filteredEntidades(): Entidad[] {
    if (!this.busquedaRealizada || !this.filtrosAplicados) return [];
    const f = this.filtrosAplicados;
    return this.entidades.filter(e =>
      (!f.razon || e.razonSocial.toLowerCase().includes(f.razon)) &&
      (!f.nit || e.nit.toLowerCase().includes(f.nit)) &&
      (!f.sigla || e.sigla.toLowerCase().includes(f.sigla)) &&
      (!f.codigo || e.codigo.toLowerCase().includes(f.codigo)) &&
      (!f.departamento || e.departamento === f.departamento) &&
      (!f.municipio || e.municipio === f.municipio) &&
      (f.estado === 'todos' || e.estado === f.estado),
    );
  }

  severidadEstado(estado: EstadoEntidad): 'success' | 'warn' | 'secondary' {
    if (estado === 'Activo') return 'success';
    if (estado === 'Solicitud') return 'warn';
    return 'secondary';
  }

  /* ═══════════════ Dígito de verificación (NIT) ═══════════════ */
  calcularDV(nit: string): string {
    const digitos = (nit || '').replace(/\D/g, '');
    if (!digitos) return '';
    let suma = 0;
    const rev = digitos.split('').reverse();
    for (let i = 0; i < rev.length && i < PESOS_DV.length; i++) {
      suma += parseInt(rev[i], 10) * PESOS_DV[i];
    }
    const resto = suma % 11;
    return String(resto <= 1 ? resto : 11 - resto);
  }
  onNitChange(): void {
    this.form.dv = this.calcularDV(this.form.nit);
  }

  /* ═══════════════ Wizard: pasos (p-stepper) ═══════════════ */
  readonly tabs = [
    { key: 'general', label: 'Información General' },
    { key: 'estado', label: 'Estado' },
    { key: 'ambito', label: 'Ámbito' },
    { key: 'responsables', label: 'Responsables' },
    { key: 'atributos', label: 'Atributos extensibles' },
    { key: 'patrimonial', label: 'Composición Patrimonial' },
    { key: 'cuin', label: 'CUIN' },
  ];
  activePaso = 1;

  /** Pasos pendientes (4-7): placeholder hasta que llegue su historia de usuario. */
  get tabsPendientes(): { key: string; label: string; paso: number }[] {
    return this.tabs.slice(3).map((t, i) => ({ ...t, paso: i + 4 }));
  }

  /** Progreso del wizard: se habilita la siguiente sección al guardar la anterior. */
  infoGuardada = false;
  estadoGuardado = false;

  /* ═══════════════ Formulario de entidad ═══════════════ */
  editEntidadRef: Entidad | null = null;

  form = this.formVacio();

  private formVacio() {
    return {
      nit: '', dv: '', sigla: '', razonSocial: '', objeto: '',
      documentoCreacion: '', numeroDocumento: '', fecha: null as Date | null,
      departamento: '', municipio: '', direccion: '', codigoPostal: '',
      telefono: '', email: '', paginaWeb: '', sector: '', naturaleza: '',
      territorialDepartamental: 'No aplica', territorialMunicipal: 'No aplica',
      agregadora: 'No', consolidadora: 'No', planeadora: 'No', nombreUsuario: '',
    };
  }

  estadoForm = this.estadoFormVacio();
  private estadoFormVacio() {
    return {
      nuevoEstado: '', nuevoSubEstado: '', fechaInicial: null as Date | null,
      actoAdministrativo: '', observaciones: '',
    };
  }

  infoSubmitted = false;
  estadoSubmitted = false;

  /* Ámbitos (paso 3): lista de trabajo + formulario de alta */
  editAmbitos: AmbitoAsignado[] = [];
  ambCategoria = '';
  ambAmbito = '';
  ambAnio: number | null = null;
  ambPeriodo = '';
  ambTouched = false;

  /* Dependencias de selección */
  get municipiosFormOptions(): { label: string; value: string }[] {
    return (this.municipiosPorDepartamento[this.form.departamento] ?? []).map(m => ({ label: m, value: m }));
  }
  onFormDepartamentoChange(): void { this.form.municipio = ''; }

  get naturalezaFormOptions(): { label: string; value: string }[] {
    return (this.naturalezaPorSector[this.form.sector] ?? []).map(n => ({ label: n, value: n }));
  }
  onFormSectorChange(): void { this.form.naturaleza = ''; }

  get subEstadoFormOptions(): { label: string; value: string }[] {
    return (this.subEstadoPorNuevoEstado[this.estadoForm.nuevoEstado] ?? []).map(s => ({ label: s, value: s }));
  }
  onNuevoEstadoChange(): void { this.estadoForm.nuevoSubEstado = ''; }

  /* Ámbitos: ámbito depende de la categoría seleccionada. */
  get ambAmbitoOptions(): { label: string; value: string }[] {
    return (this.ambitosPorCategoria[this.ambCategoria] ?? []).map(a => ({ label: a, value: a }));
  }
  onAmbCategoriaChange(): void { this.ambAmbito = ''; }

  get ambitoFormValido(): boolean {
    return !!this.ambCategoria && !!this.ambAmbito && !!this.ambAnio && !!this.ambPeriodo;
  }

  agregarAmbito(): void {
    this.ambTouched = true;
    if (!this.ambitoFormValido) return;
    const dup = this.editAmbitos.some(a =>
      a.categoria === this.ambCategoria && a.ambito === this.ambAmbito &&
      a.anio === this.ambAnio && a.periodo === this.ambPeriodo);
    if (dup) {
      this.messageService.add({ severity: 'warn', summary: 'Ámbito duplicado', detail: 'Ese ámbito ya está agregado con el mismo año y periodo.' });
      return;
    }
    this.editAmbitos = [...this.editAmbitos, {
      id: Math.max(0, ...this.editAmbitos.map(a => a.id)) + 1,
      categoria: this.ambCategoria, ambito: this.ambAmbito,
      anio: this.ambAnio!, periodo: this.ambPeriodo,
    }];
    this.resetAmbitoForm();
  }

  eliminarAmbito(a: AmbitoAsignado): void {
    this.editAmbitos = this.editAmbitos.filter(x => x.id !== a.id);
  }

  private resetAmbitoForm(): void {
    this.ambCategoria = '';
    this.ambAmbito = '';
    this.ambAnio = null;
    this.ambPeriodo = '';
    this.ambTouched = false;
  }

  guardarAmbitos(): void {
    if (this.editEntidadRef) {
      this.editEntidadRef.ambitos = this.editAmbitos.map(a => ({ ...a }));
    }
    this.messageService.add({
      severity: 'success', summary: 'Ámbitos guardados',
      detail: `Se guardaron ${this.editAmbitos.length} ámbito(s) de la entidad.`,
    });
  }

  /* ═══════════════ Abrir crear / editar ═══════════════ */
  abrirCrear(): void {
    this.editEntidadRef = null;
    this.form = this.formVacio();
    this.estadoForm = this.estadoFormVacio();
    this.editAmbitos = [];
    this.resetAmbitoForm();
    this.infoGuardada = false;
    this.estadoGuardado = false;
    this.infoSubmitted = false;
    this.estadoSubmitted = false;
    this.activePaso = 1;
    this.vista = 'crear';
  }

  abrirEditar(e: Entidad): void {
    this.editEntidadRef = e;
    this.form = {
      nit: e.nit, dv: e.dv, sigla: e.sigla, razonSocial: e.razonSocial, objeto: e.objeto,
      documentoCreacion: e.documentoCreacion, numeroDocumento: e.numeroDocumento,
      fecha: e.fecha ? this.parseFecha(e.fecha) : null,
      departamento: e.departamento, municipio: e.municipio, direccion: e.direccion,
      codigoPostal: e.codigoPostal, telefono: e.telefono, email: e.email, paginaWeb: e.paginaWeb,
      sector: e.sector, naturaleza: e.naturaleza,
      territorialDepartamental: e.territorialDepartamental, territorialMunicipal: e.territorialMunicipal,
      agregadora: e.agregadora, consolidadora: e.consolidadora, planeadora: e.planeadora,
      nombreUsuario: e.nombreUsuario,
    };
    this.estadoForm = {
      nuevoEstado: '', nuevoSubEstado: '', fechaInicial: null,
      actoAdministrativo: e.actoAdministrativo, observaciones: e.observaciones,
    };
    this.editAmbitos = e.ambitos.map(a => ({ ...a }));
    this.resetAmbitoForm();
    // Al editar, las secciones ya están guardadas → desbloqueadas.
    this.infoGuardada = true;
    this.estadoGuardado = true;
    this.infoSubmitted = false;
    this.estadoSubmitted = false;
    this.activePaso = 1;
    this.vista = 'editar';
  }

  volverAListado(): void {
    this.vista = 'list';
    this.editEntidadRef = null;
  }

  /* ═══════════════ Validación · Información General ═══════════════ */
  private req(v: string): boolean { return !!v && !!v.trim(); }
  private len(v: string, min: number, max: number): boolean {
    const l = (v ?? '').trim().length; return l >= min && l <= max;
  }

  get infoErrors(): string[] {
    const e: string[] = [];
    if (!this.req(this.form.nit)) e.push('El NIT es obligatorio.');
    else if (!this.len(this.form.nit, 4, 20)) e.push('El NIT debe tener entre 4 y 20 caracteres.');
    if (!this.req(this.form.sigla)) e.push('La sigla es obligatoria.');
    else if (!this.len(this.form.sigla, 4, 20)) e.push('La sigla debe tener entre 4 y 20 caracteres.');
    if (!this.req(this.form.razonSocial)) e.push('La razón social es obligatoria.');
    else if (this.form.razonSocial.trim().length > 100) e.push('La razón social admite máximo 100 caracteres.');
    if (!this.req(this.form.objeto)) e.push('El objeto es obligatorio.');
    if (!this.req(this.form.documentoCreacion)) e.push('El documento de creación es obligatorio.');
    if (!this.req(this.form.numeroDocumento)) e.push('El número de documento es obligatorio.');
    if (!this.form.fecha) e.push('La fecha es obligatoria.');
    if (!this.req(this.form.departamento)) e.push('El departamento es obligatorio.');
    if (!this.req(this.form.municipio)) e.push('El municipio es obligatorio.');
    if (!this.req(this.form.direccion)) e.push('La dirección es obligatoria.');
    if (!this.req(this.form.codigoPostal)) e.push('El código postal es obligatorio.');
    if (!this.req(this.form.telefono)) e.push('El teléfono es obligatorio.');
    if (!this.req(this.form.email)) e.push('El correo electrónico es obligatorio.');
    else if (!this.EMAIL_REGEX.test(this.form.email.trim())) e.push('El correo electrónico no tiene un formato válido.');
    if (!this.req(this.form.sector)) e.push('El sector es obligatorio.');
    if (!this.req(this.form.naturaleza)) e.push('La naturaleza es obligatoria.');
    if (!this.req(this.form.nombreUsuario)) e.push('El nombre de usuario es obligatorio.');
    return e;
  }
  campoInvalido(v: string): boolean { return this.infoSubmitted && !this.req(v); }
  get emailInvalido(): boolean {
    return this.infoSubmitted && (!this.req(this.form.email) || !this.EMAIL_REGEX.test(this.form.email.trim()));
  }
  get fechaInvalida(): boolean { return this.infoSubmitted && !this.form.fecha; }

  /* Alertas no bloqueantes: NIT / razón social ya registrados (permiten continuar). */
  get nitDuplicadoAlerta(): boolean {
    const nit = this.form.nit.trim().replace(/\s/g, '');
    if (!nit) return false;
    return this.entidades.some(e => e.id !== this.editEntidadRef?.id && e.nit.replace(/\s/g, '') === nit);
  }
  get razonDuplicadaAlerta(): boolean {
    const r = this.form.razonSocial.trim().toLowerCase();
    if (!r) return false;
    return this.entidades.some(e => e.id !== this.editEntidadRef?.id && e.razonSocial.trim().toLowerCase() === r);
  }

  /* ═══════════════ Guardar Información General ═══════════════ */
  showConfirmInfo = false;
  intentarGuardarInfo(): void {
    this.infoSubmitted = true;
    if (this.infoErrors.length > 0) return;
    this.showConfirmInfo = true; // modal "¿Está seguro de guardar…?"
  }
  confirmarGuardarInfo(): void {
    this.showConfirmInfo = false;

    if (this.vista === 'crear') {
      // Crear la entidad en estado SOLICITADO / Subestado Ninguno (HU-02, criterio 17).
      const nueva: Entidad = {
        id: Math.max(0, ...this.entidades.map(e => e.id)) + 1,
        codigo: this.generarCodigo(),
        ...this.formToEntidad(),
        estado: 'Solicitud', subEstado: 'Ninguno',
        fechaEstado: null, actoAdministrativo: '', observaciones: '',
        ambitos: [],
      };
      this.entidades = [nueva, ...this.entidades];
      this.messageService.add({
        severity: 'success', summary: 'Entidad creada',
        detail: `"${nueva.razonSocial}" se creó en estado Solicitud. Ábrala desde el listado para completar el resto de secciones.`,
      });
      this.volverAListado();
      return;
    }

    if (this.editEntidadRef) {
      Object.assign(this.editEntidadRef, this.formToEntidad());
    }
    this.infoGuardada = true;
    this.messageService.add({
      severity: 'success', summary: 'Información General guardada',
      detail: 'La operación se ha ejecutado correctamente. Puede continuar con la sección Estado.',
    });
  }

  private formToEntidad() {
    return {
      nit: this.form.nit.trim(), dv: this.form.dv, sigla: this.form.sigla.trim(),
      razonSocial: this.form.razonSocial.trim(), objeto: this.form.objeto,
      documentoCreacion: this.form.documentoCreacion.trim(), numeroDocumento: this.form.numeroDocumento.trim(),
      fecha: this.form.fecha ? this.formatFecha(this.form.fecha) : null,
      departamento: this.form.departamento, municipio: this.form.municipio,
      direccion: this.form.direccion.trim(), codigoPostal: this.form.codigoPostal.trim(),
      telefono: this.form.telefono.trim(), email: this.form.email.trim(), paginaWeb: this.form.paginaWeb.trim(),
      sector: this.form.sector, naturaleza: this.form.naturaleza,
      territorialDepartamental: this.form.territorialDepartamental, territorialMunicipal: this.form.territorialMunicipal,
      agregadora: this.form.agregadora, consolidadora: this.form.consolidadora, planeadora: this.form.planeadora,
      nombreUsuario: this.form.nombreUsuario.trim(),
    };
  }

  private generarCodigo(): string {
    // Código autogenerado (HU-02, criterio 16). Determinístico sobre el máximo actual.
    const max = Math.max(0, ...this.entidades.map(e => parseInt(e.codigo.replace(/\D/g, ''), 10) || 0));
    return 'E' + String(max + 1).padStart(3, '0');
  }

  irSiguienteDesdeInfo(): void {
    if (!this.infoGuardada) {
      this.messageService.add({ severity: 'warn', summary: 'Cambios sin guardar', detail: 'No puede avanzar sin guardar los cambios.' });
      return;
    }
    this.activePaso = 2;
  }

  irSiguienteDesdeEstado(): void {
    if (!this.estadoGuardado) {
      this.messageService.add({ severity: 'warn', summary: 'Cambios sin guardar', detail: 'No puede avanzar sin guardar los cambios.' });
      return;
    }
    this.activePaso = 3;
  }

  /* ═══════════════ Validación · Estado ═══════════════ */
  get estadoErrors(): string[] {
    const e: string[] = [];
    if (!this.req(this.estadoForm.nuevoEstado)) e.push('El nuevo estado es obligatorio.');
    if (this.subEstadoFormOptions.length > 0 && !this.req(this.estadoForm.nuevoSubEstado)) e.push('El nuevo subestado es obligatorio.');
    if (!this.estadoForm.fechaInicial) e.push('La fecha inicial del nuevo estado es obligatoria.');
    if (!this.req(this.estadoForm.actoAdministrativo)) e.push('El acto administrativo es obligatorio.');
    else if (!this.len(this.estadoForm.actoAdministrativo, 4, 20)) e.push('El acto administrativo debe tener entre 4 y 20 caracteres.');
    return e;
  }
  estadoCampoInvalido(v: string): boolean { return this.estadoSubmitted && !this.req(v); }
  get fechaEstadoInvalida(): boolean { return this.estadoSubmitted && !this.estadoForm.fechaInicial; }

  showConfirmEstado = false;
  intentarGuardarEstado(): void {
    this.estadoSubmitted = true;
    if (this.estadoErrors.length > 0) return;
    this.showConfirmEstado = true;
  }
  confirmarGuardarEstado(): void {
    this.showConfirmEstado = false;
    const e = this.editEntidadRef;
    if (e) {
      e.estado = (this.estadoForm.nuevoEstado === 'Activo' ? 'Activo' : 'Solicitud');
      e.subEstado = this.estadoForm.nuevoSubEstado || null;
      e.fechaEstado = this.estadoForm.fechaInicial ? this.formatFecha(this.estadoForm.fechaInicial) : null;
      e.actoAdministrativo = this.estadoForm.actoAdministrativo.trim();
      e.observaciones = this.estadoForm.observaciones.trim();
    }
    this.estadoGuardado = true;
    this.messageService.add({
      severity: 'success', summary: 'Cambio de estado guardado',
      detail: 'La operación se ha ejecutado correctamente.',
    });
  }

  /* ═══════════════ Guardar entidad completa (cierra el wizard) ═══════════════ */
  finalizar(): void {
    this.messageService.add({
      severity: 'success', summary: this.formMode === 'crear' ? 'Entidad creada' : 'Entidad actualizada',
      detail: `"${this.editEntidadRef?.razonSocial ?? this.form.razonSocial}" se guardó correctamente.`,
    });
    this.volverAListado();
  }

  /* ───────────── Breadcrumb dinámico ───────────── */
  readonly breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/' };
  get breadcrumbModel(): MenuItem[] {
    return [
      { label: 'Entidades', command: () => this.volverAListado() },
      { label: 'Gestión de entidades', command: () => this.volverAListado() },
      { label: this.formMode === 'crear' ? 'Crear nueva entidad' : `Editar · ${this.editEntidadRef?.sigla || ''}` },
    ];
  }

  /* ═══════════════ Helpers de fecha ═══════════════ */
  private fechaHoy(): string { return this.formatFecha(new Date()); }
  private formatFecha(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }
  private parseFecha(s: string): Date | null {
    const [dd, mm, yyyy] = s.split('/').map(Number);
    if (!dd || !mm || !yyyy) return null;
    return new Date(yyyy, mm - 1, dd);
  }
}
