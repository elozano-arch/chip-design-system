import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { CheckboxModule } from 'primeng/checkbox';
import { MenuModule } from 'primeng/menu';
import { ChipModule } from 'primeng/chip';
import { SelectButtonModule } from 'primeng/selectbutton';
import { StepperModule } from 'primeng/stepper';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule } from 'primeng/paginator';
import { MessageService, MenuItem } from 'primeng/api';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';

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

/**
 * Variable de un concepto en la vista Registro Manual.
 * `valores` es indexado por la clave de la columna (ej. 'ene', 'feb', etc.).
 */
interface Variable {
  id: string;
  nombre: string;
  unidad: string;
  valores: Record<string, number | null>;
}

/**
 * Cada "concepto padre" tiene sus propias variables y su propio paginador interno.
 * Esto refleja la POC de Wilmar: cada padre maneja su paginación de filas
 * independiente del resto.
 */
interface ConceptoPadre {
  id: string;
  codigo: string;
  nombre: string;
  variables: Variable[];
  /** Página actual del paginador interno (0-based). */
  pagina: number;
  /** Filas por página. */
  filasPorPagina: number;
}

/** Columna del registro manual (periodos). El paginador global decide cuáles son visibles. */
interface ColumnaRegistro {
  key: string;
  label: string;
}

/** Entidad disponible para asignar a la categoría desde el modal "Entidades Agregadas". */
interface EntidadAgregada {
  id: string;
  nombre: string;
  nit: string;
}

@Component({
  selector: 'app-formularios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    DividerModule,
    MessageModule,
    ProgressBarModule,
    CheckboxModule,
    MenuModule,
    ChipModule,
    SelectButtonModule,
    StepperModule,
    DialogModule,
    PaginatorModule,
    AppBreadcrumbComponent,
  ],
  providers: [MessageService],
  templateUrl: './formularios.component.html',
  styleUrl: './formularios.component.scss',
})
export class FormulariosComponent {
  @ViewChild('menuFormulario') menuFormulario: any;
  selectedFormularioForMenu: Formulario | null = null;

  constructor(private messageService: MessageService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Selector "Opción 1 / Opción 2" — propuesta a aprobar por CRIS.
  // Opción 1: vista única + edición inline (como el video / POC actual).
  // Opción 2: paso a paso (wizard 3 pasos) + edición en modal.
  // ─────────────────────────────────────────────────────────────────────────
  vistaActiva: 'opcion-1' | 'opcion-2' = 'opcion-1';
  readonly vistaOptions = [
    { label: 'Opción 1 · Vista única', value: 'opcion-1' },
    { label: 'Opción 2 · Paso a paso', value: 'opcion-2' },
  ];

  /**
   * Paso actual del wizard de Opción 2 — 3 pasos:
   *   0: Filtros (contexto + Consultar Envíos previos)
   *   1: Formularios (importar, exportar, validar, acciones, editar manual,
   *      generar protocolo — y, al abrir un formulario, registro manual)
   *   2: Envíos (Enviar Categoría + Entidades Agregadas + Enviar Adjunto)
   */
  wizardStep = 0;

  /** Panel "Consultar envíos" desplegable en el paso 1 (Contexto). */
  wizardConsultarEnviosAbierto = false;

  /** Panel "Importar" desplegable en el paso 1 (Contexto). */
  wizardImportarAbierto = false;

  cambiarVista(v: 'opcion-1' | 'opcion-2') {
    this.vistaActiva = v;
    this.cerrarDetalle();
    this.wizardStep = 0;
    this.wizardConsultarEnviosAbierto = false;
    this.wizardImportarAbierto = false;
  }

  /**
   * Permite navegar a un paso anterior (o al actual) haciendo clic en el indicador.
   * Hacia adelante solo se avanza con los botones del flujo (Siguiente / Abrir).
   * Esto evita saltar pasos sin haber completado los requisitos.
   */
  irAPaso(step: number) {
    if (step < 0 || step > this.wizardStep) return;
    // Volver al paso de filtros desde cualquier punto reabre la edición de filtros.
    if (step === 0) {
      this.filtersApplied = false;
      this.cerrarPanelesPaso1();
    }
    this.cerrarDetalle();
    this.wizardStep = step;
  }

  pasoNavegable(step: number): boolean {
    return step <= this.wizardStep;
  }

  /**
   * Toggle del panel "Consultar envíos" en el paso 1.
   * Ambos paneles del paso 1 son mutuamente excluyentes para que el usuario
   * vea una sola pieza de información a la vez (UX: foco).
   */
  toggleConsultarEnviosWizard() {
    this.wizardConsultarEnviosAbierto = !this.wizardConsultarEnviosAbierto;
    if (this.wizardConsultarEnviosAbierto) this.wizardImportarAbierto = false;
  }

  /** Toggle del panel "Importar" en el paso 1. */
  toggleImportarWizard() {
    this.wizardImportarAbierto = !this.wizardImportarAbierto;
    if (this.wizardImportarAbierto) this.wizardConsultarEnviosAbierto = false;
  }

  /** Cierra ambos paneles (al cambiar de paso). */
  private cerrarPanelesPaso1() {
    this.wizardConsultarEnviosAbierto = false;
    this.wizardImportarAbierto = false;
  }

  // Mock de envíos previos — tabla del paso 1 "Consultar envíos".
  enviosPrevios: Array<{
    numero: string;
    fecha: string;
    formularios: number;
    usuario: string;
    estado: 'Aceptado' | 'Rechazado' | 'En proceso' | 'Pendiente';
  }> = [
    { numero: '2024-1105', fecha: '05/11/2024', formularios: 4, usuario: 'olozada@cgn.gov.co', estado: 'Aceptado' },
    { numero: '2024-1028', fecha: '28/10/2024', formularios: 6, usuario: 'olozada@cgn.gov.co', estado: 'Rechazado' },
    { numero: '2024-1015', fecha: '15/10/2024', formularios: 6, usuario: 'jmgallo@cgn.gov.co', estado: 'Aceptado' },
    { numero: '2024-0930', fecha: '30/09/2024', formularios: 5, usuario: 'olozada@cgn.gov.co', estado: 'En proceso' },
    { numero: '2024-0915', fecha: '15/09/2024', formularios: 4, usuario: 'cplascu@cgn.gov.co', estado: 'Aceptado' },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Vista Registro Manual (detalle del formulario)
  // Refleja la POC de Wilmar: cada concepto padre maneja su propio paginador
  // de filas (variables), y arriba un paginador global de columnas (periodos)
  // — porque un formulario puede tener hasta 60+ variables y muchas columnas.
  // ─────────────────────────────────────────────────────────────────────────
  detalleAbierto: Formulario | null = null;

  /** 12 periodos mockeados (meses). En producción vendría del backend. */
  readonly columnasRegistro: ColumnaRegistro[] = [
    { key: 'ene', label: 'Ene 2024' }, { key: 'feb', label: 'Feb 2024' },
    { key: 'mar', label: 'Mar 2024' }, { key: 'abr', label: 'Abr 2024' },
    { key: 'may', label: 'May 2024' }, { key: 'jun', label: 'Jun 2024' },
    { key: 'jul', label: 'Jul 2024' }, { key: 'ago', label: 'Ago 2024' },
    { key: 'sep', label: 'Sep 2024' }, { key: 'oct', label: 'Oct 2024' },
    { key: 'nov', label: 'Nov 2024' }, { key: 'dic', label: 'Dic 2024' },
  ];

  /** Paginador global de columnas: cuántas columnas se muestran a la vez. */
  columnasPorPagina = 4;
  paginaColumnas = 0;

  get totalPaginasColumnas(): number {
    return Math.ceil(this.columnasRegistro.length / this.columnasPorPagina);
  }
  get columnasVisibles(): ColumnaRegistro[] {
    const inicio = this.paginaColumnas * this.columnasPorPagina;
    return this.columnasRegistro.slice(inicio, inicio + this.columnasPorPagina);
  }
  paginaColumnasAnterior() {
    if (this.paginaColumnas > 0) this.paginaColumnas--;
  }
  paginaColumnasSiguiente() {
    if (this.paginaColumnas < this.totalPaginasColumnas - 1) this.paginaColumnas++;
  }

  /** Mock de conceptos padre (cada uno con su tabla y paginador independiente). */
  conceptos: ConceptoPadre[] = [
    {
      id: 'c1',
      codigo: '1.1.05',
      nombre: 'Caja',
      pagina: 0,
      filasPorPagina: 5,
      variables: this.generarVariablesMock('CAJA', 8),
    },
    {
      id: 'c2',
      codigo: '1.1.10',
      nombre: 'Bancos y corporaciones de ahorro',
      pagina: 0,
      filasPorPagina: 5,
      variables: this.generarVariablesMock('BAN', 12),
    },
    {
      id: 'c3',
      codigo: '1.1.20',
      nombre: 'Inversiones administración de liquidez',
      pagina: 0,
      filasPorPagina: 5,
      variables: this.generarVariablesMock('INV', 6),
    },
  ];

  /** Genera N variables mockeadas con valores aleatorios por periodo. */
  private generarVariablesMock(prefijo: string, cantidad: number): Variable[] {
    const variables: Variable[] = [];
    for (let i = 1; i <= cantidad; i++) {
      const valores: Record<string, number | null> = {};
      this.columnasRegistro.forEach(col => {
        // Algunas celdas vacías para simular registros incompletos
        valores[col.key] = Math.random() < 0.15 ? null : Math.round(Math.random() * 9000000) + 100000;
      });
      variables.push({
        id: `${prefijo}-${String(i).padStart(3, '0')}`,
        nombre: `${prefijo} variable ${i}`,
        unidad: 'COP',
        valores,
      });
    }
    return variables;
  }

  variablesVisibles(concepto: ConceptoPadre): Variable[] {
    const inicio = concepto.pagina * concepto.filasPorPagina;
    return concepto.variables.slice(inicio, inicio + concepto.filasPorPagina);
  }
  totalPaginasConcepto(concepto: ConceptoPadre): number {
    return Math.ceil(concepto.variables.length / concepto.filasPorPagina);
  }
  paginaConceptoAnterior(concepto: ConceptoPadre) {
    if (concepto.pagina > 0) concepto.pagina--;
  }
  paginaConceptoSiguiente(concepto: ConceptoPadre) {
    if (concepto.pagina < this.totalPaginasConcepto(concepto) - 1) concepto.pagina++;
  }

  abrirDetalle(form: Formulario) {
    this.detalleAbierto = form;
    this.paginaColumnas = 0;
    this.conceptos.forEach(c => c.pagina = 0);
    // En el wizard de 3 pasos, abrir un formulario NO cambia de paso:
    // el registro manual vive dentro del paso "Formularios" (step 1).
    queueMicrotask(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /**
   * Guarda cambios desde el detalle. Patrón UX: el usuario sigue editando
   * variables en otros conceptos, así que NO cerramos el detalle — solo
   * confirmamos con un toast no intrusivo.
   */
  guardarCambiosDetalle() {
    this.messageService.add({
      severity: 'success',
      summary: 'Cambios guardados',
      detail: 'Los valores del formulario fueron guardados. Puede seguir editando o validar cuando termine.',
      life: 3500,
    });
  }

  /**
   * Validar el formulario abierto desde el detalle. Patrón UX: al ser el
   * "cierre" del trabajo en este formulario, lo marcamos como Validado,
   * regresamos al listado (o al paso 2 en wizard) y mostramos toast para
   * que el usuario vea el estado actualizado y pueda elegir el siguiente.
   */
  validarFormularioActual() {
    if (!this.detalleAbierto) return;
    const id = this.detalleAbierto.id;
    const nombre = this.detalleAbierto.nombre;
    this._formulariosBase = this._formulariosBase.map(f =>
      f.id === id ? { ...f, estadoValidacion: 'Validado' } : f,
    );
    this.messageService.add({
      severity: 'success',
      summary: 'Formulario validado',
      detail: `"${nombre}" quedó en estado Validado. Continúe con los demás formularios o envíe la categoría.`,
      life: 4500,
    });
    this.cerrarDetalle();
  }
  cerrarDetalle() {
    this.detalleAbierto = null;
    this.editandoCelda = null;
    this.modalEditar = null;
    // En el wizard de 3 pasos, el listado y el registro manual viven en
    // el mismo paso (Formularios). Cerrar el detalle sólo limpia el estado;
    // el step se mantiene en 1.
  }

  // ── Edición inline (Opción 1) ──
  editandoCelda: { conceptoId: string; variableId: string; columna: string } | null = null;
  iniciarEdicionInline(concepto: ConceptoPadre, variable: Variable, columna: string) {
    this.editandoCelda = { conceptoId: concepto.id, variableId: variable.id, columna };
  }
  esEditandoCelda(concepto: ConceptoPadre, variable: Variable, columna: string): boolean {
    return !!this.editandoCelda
      && this.editandoCelda.conceptoId === concepto.id
      && this.editandoCelda.variableId === variable.id
      && this.editandoCelda.columna === columna;
  }
  guardarEdicionInline() {
    this.editandoCelda = null;
    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Valor actualizado correctamente.', life: 2000 });
  }

  // ── Edición modal (Opción 2) ──
  modalEditar: { concepto: ConceptoPadre; variable: Variable } | null = null;
  abrirModalEditar(concepto: ConceptoPadre, variable: Variable) {
    this.modalEditar = { concepto, variable };
  }
  cerrarModalEditar() {
    this.modalEditar = null;
  }
  guardarModalEditar() {
    this.modalEditar = null;
    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Registro actualizado correctamente.', life: 2500 });
  }

  /**
   * Menú ⋮ por fila — sólo acciones que NO se pueden aplicar masivamente desde
   * la toolbar (Exportar y Validar viven en la toolbar y operan sobre la selección).
   */
  menuFormularioItems: MenuItem[] = [
    {
      label: 'Registro manual',
      icon: 'pi pi-table',
      command: () => { if (this.selectedFormularioForMenu) this.abrirDetalle(this.selectedFormularioForMenu); },
    },
    { separator: true },
    {
      label: 'Generar protocolo de importación',
      icon: 'pi pi-file-pdf',
      command: () => this.messageService.add({ severity: 'info', summary: 'Protocolo', detail: `Generando protocolo de "${this.selectedFormularioForMenu?.codigo}"` }),
    },
  ];

  abrirMenuFormulario(event: Event, form: Formulario) {
    this.selectedFormularioForMenu = form;
    this.menuFormulario.toggle(event);
  }

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

  // ──────────────────────────────────────────────────────────────────────
  // Acciones — agrupadas según el modelo de CRIS:
  //  • Globales (sobre toda la categoría): Importar, Enviar Adjunto,
  //    Entidades Agregadas, Generar protocolo, Exportar, Consultar Envíos.
  //  • Sobre seleccionados (1+ formularios marcados): Validar.
  //  • Terminal: Enviar Categoría — habilitada solo cuando TODOS los
  //    formularios del listado están en estado "Validado".
  // ──────────────────────────────────────────────────────────────────────
  accionesGlobales: AccionPermiso[] = [
    { key: 'importar', label: 'Importar', icon: 'pi pi-upload', enabled: true },
    { key: 'enviarAdjunto', label: 'Enviar Adjunto', icon: 'pi pi-paperclip', enabled: true },
    { key: 'entidadesAgregadas', label: 'Entidades Agregadas', icon: 'pi pi-sitemap', enabled: true },
    { key: 'generarProtocolo', label: 'Generar protocolo', icon: 'pi pi-file-pdf', enabled: true },
    { key: 'exportar', label: 'Exportar', icon: 'pi pi-download', enabled: true },
    { key: 'consultarEnvios', label: 'Consultar Envíos', icon: 'pi pi-inbox', enabled: true },
  ];

  accionesSeleccion: AccionPermiso[] = [
    { key: 'validar', label: 'Validar selección', icon: 'pi pi-check-circle', enabled: true },
  ];

  /** Compatibilidad: lista plana usada en lugares que aún la consumen. */
  get acciones(): AccionPermiso[] {
    return [...this.accionesGlobales, ...this.accionesSeleccion];
  }

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

    // Entidades Agregadas — abre modal de selección múltiple
    if (key === 'entidadesAgregadas') {
      this.abrirEntidadesModal();
      return;
    }
    if (key === 'generarProtocolo') {
      this.messageService.add({ severity: 'info', summary: 'Protocolo de Importación', detail: 'Generando protocolo para la categoría seleccionada...' });
      return;
    }
    if (key === 'enviarAdjunto') {
      this.messageService.add({ severity: 'info', summary: 'Enviar Adjunto', detail: 'Adjunte el archivo correspondiente a la categoría.' });
      return;
    }
  }

  /**
   * Envío final de la categoría — solo habilitado cuando todos los
   * formularios del listado están en estado "Validado". Reflejo del
   * flujo descrito por CRIS: validación local → envío central.
   */
  get todosValidados(): boolean {
    const lista = this.filteredFormularios;
    return lista.length > 0 && lista.every(f => f.estadoValidacion === 'Validado');
  }

  enviarCategoria() {
    if (!this.todosValidados) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Categoría no enviable',
        detail: 'Todos los formularios deben estar en estado "Validado" antes de enviar la categoría.',
        life: 5000,
      });
      return;
    }
    // Simula el envío: pasan a "Enviado" — esperando respuesta central.
    this._formulariosBase = this._formulariosBase.map(f => ({ ...f, estadoValidacion: 'Enviado' }));
    this.messageService.add({
      severity: 'success',
      summary: 'Categoría enviada',
      detail: 'La categoría fue enviada para validación central. Recibirá el resultado en consulta de envíos.',
      life: 5000,
    });
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
    // Marca los seleccionados como Validado en el listado base.
    const seleccionadosIds = new Set(this.selectedFormularios.map(f => f.id));
    this._formulariosBase = this._formulariosBase.map(f =>
      seleccionadosIds.has(f.id) ? { ...f, estadoValidacion: 'Validado' } : f,
    );
    this.selectedFormularios = [];
    this.activePanel = null;

    // Mensaje contextual: si todos quedaron validados, el botón "Siguiente"
    // se habilita y se invita a continuar al paso Envíos.
    if (this.todosValidados) {
      this.messageService.add({
        severity: 'success',
        summary: 'Todos los formularios validados',
        detail: `${count} formulario(s) marcados como Validado. Puede continuar al paso Envíos.`,
        life: 5000,
      });
    } else {
      const pendientes = this.filteredFormularios.filter(f => f.estadoValidacion !== 'Validado').length;
      this.messageService.add({
        severity: 'success',
        summary: 'Validación exitosa',
        detail: `${count} formulario(s) validado(s). Quedan ${pendientes} pendiente(s) por validar antes de avanzar a Envíos.`,
        life: 4500,
      });
    }
  }

  get canValidate(): boolean {
    return this.hasPermission('validar') && this.selectedFormularios.length > 0;
  }

  /**
   * Plantillas de formularios — el listado real se genera dinámicamente en
   * `filteredFormularios` según los filtros aplicados. Esto evita que el demo
   * salga vacío para combinaciones que no estén "cableadas" en el mock.
   */
  private readonly plantillasFormulario: Array<{ nombre: string; estado: string }> = [
    { nombre: 'Balance General', estado: 'Pendiente de validar' },
    { nombre: 'Estado de Resultados', estado: 'Pendiente de validar' },
    { nombre: 'Flujo de Efectivo', estado: 'Pendiente de validar' },
    { nombre: 'Estado de Cambios en el Patrimonio', estado: 'Validado' },
    { nombre: 'Notas a los Estados Financieros', estado: 'Pendiente de validar' },
    { nombre: 'Información Complementaria', estado: 'Rechazado por Deficiencia' },
  ];

  searchFormulario = '';

  // ── Filtros ──
  get canApplyFilters(): boolean {
    return !!this.selectedCategoria && !!this.selectedAnio;
  }

  /**
   * Listado filtrado — backing field cacheado para evitar recomputar y
   * recrear arrays en cada ciclo de Angular (eso colgaba la UI al
   * cambiar filtros, porque cada CD veía un array "nuevo").
   */
  private _formulariosBase: Formulario[] = [];
  get filteredFormularios(): Formulario[] {
    if (!this.filtersApplied) return [];
    const q = this.searchFormulario.trim().toLowerCase();
    if (!q) return this._formulariosBase;
    return this._formulariosBase.filter(
      f => f.nombre.toLowerCase().includes(q) || f.codigo.toLowerCase().includes(q),
    );
  }

  /** Recalcula el listado base a partir de los filtros aplicados. */
  private recomputarFormulariosBase() {
    const periodoLabel = this.selectedPeriodo || 'T1';
    const anioNum = this.selectedAnio ? +this.selectedAnio : 2024;
    const catCode = this.selectedCategoria || 'ICP';

    this._formulariosBase = this.plantillasFormulario.map((plantilla, idx) => ({
      id: idx + 1,
      codigo: `CGN-${catCode}-${String(idx + 1).padStart(2, '0')}`,
      nombre: plantilla.nombre,
      tipo: 'Formulario',
      categoria: catCode,
      periodo: periodoLabel,
      anio: anioNum,
      estadoValidacion: plantilla.estado,
      ultimaModificacion: `0${(idx % 9) + 1}/${(idx % 12) + 1}/${anioNum}`,
    }));
  }

  applyFilters() {
    if (!this.canApplyFilters) {
      this.messageService.add({ severity: 'warn', summary: 'Filtros requeridos', detail: 'Debe seleccionar al menos Categoría y Año.' });
      return;
    }
    this.recomputarFormulariosBase();
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

  // ──────────────────────────────────────────────────────────────────────
  // Modal "Entidades Agregadas" — selección múltiple para asignar entidades
  // destino a la categoría. Lista virtualizada con buscador y select-all.
  // Ubicado en el paso "Envíos" del wizard. La selección persiste entre
  // aperturas dentro de la misma sesión del componente.
  // ──────────────────────────────────────────────────────────────────────
  showEntidadesModal = false;
  entidadesBusqueda = '';
  selectedEntidades: EntidadAgregada[] = [];

  /** Catálogo mock de entidades disponibles (~300, combinatorias tipo×municipio). */
  readonly entidadesDisponibles: EntidadAgregada[] = this.generarEntidadesMock();

  abrirEntidadesModal() {
    this.entidadesBusqueda = '';
    this.showEntidadesModal = true;
  }

  cerrarEntidadesModal() {
    this.entidadesBusqueda = '';
    this.showEntidadesModal = false;
  }

  /** Filtrado por código, NIT o razón social — los 3 campos visibles en la tabla. */
  get entidadesFiltradas(): EntidadAgregada[] {
    const q = this.entidadesBusqueda.trim().toLowerCase();
    if (!q) return this.entidadesDisponibles;
    return this.entidadesDisponibles.filter(e =>
      e.id.toLowerCase().includes(q)
      || e.nit.toLowerCase().includes(q)
      || e.nombre.toLowerCase().includes(q),
    );
  }

  /** True cuando todas las entidades filtradas están seleccionadas. */
  get allFilteredSelected(): boolean {
    const filtradas = this.entidadesFiltradas;
    if (filtradas.length === 0) return false;
    const seleccionadasIds = new Set(this.selectedEntidades.map(e => e.id));
    return filtradas.every(e => seleccionadasIds.has(e.id));
  }

  /** Toggle del checkbox "Seleccionar todas" — aplica sólo a las filtradas. */
  toggleAllEntidades() {
    const filtradas = this.entidadesFiltradas;
    if (filtradas.length === 0) return;
    if (this.allFilteredSelected) {
      const filtradasIds = new Set(filtradas.map(e => e.id));
      this.selectedEntidades = this.selectedEntidades.filter(e => !filtradasIds.has(e.id));
    } else {
      const seleccionadasIds = new Set(this.selectedEntidades.map(e => e.id));
      const nuevas = filtradas.filter(e => !seleccionadasIds.has(e.id));
      this.selectedEntidades = [...this.selectedEntidades, ...nuevas];
    }
  }

  confirmarAsignacionEntidades() {
    const count = this.selectedEntidades.length;
    this.showEntidadesModal = false;
    this.entidadesBusqueda = '';
    this.messageService.add({
      severity: 'success',
      summary: 'Entidades asignadas',
      detail: `${count} entidad${count === 1 ? '' : 'es'} asignada${count === 1 ? '' : 's'} a la categoría.`,
      life: 3500,
    });
  }

  /**
   * Genera el catálogo mock combinando tipos de entidad con municipios.
   * 15 tipos × 20 municipios ≈ 300 entidades — suficiente para demostrar
   * virtualización del listado sin inflar el bundle.
   */
  private generarEntidadesMock(): EntidadAgregada[] {
    const tipos = [
      'Alcaldía Municipal de',
      'Gobernación de',
      'Hospital Regional de',
      'Instituto de Desarrollo de',
      'Universidad Pública de',
      'Empresa de Servicios Públicos de',
      'Secretaría de Salud de',
      'Secretaría de Educación de',
      'Personería Municipal de',
      'Contraloría Departamental de',
      'Cámara de Comercio de',
      'Empresa Social del Estado de',
      'Corporación Autónoma Regional de',
      'Instituto de Cultura y Turismo de',
      'Caja de Compensación Familiar de',
    ];
    const municipios = [
      'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
      'Cúcuta', 'Bucaramanga', 'Pereira', 'Manizales', 'Ibagué',
      'Santa Marta', 'Villavicencio', 'Pasto', 'Neiva', 'Armenia',
      'Popayán', 'Tunja', 'Sincelejo', 'Riohacha', 'Quibdó',
    ];
    const lista: EntidadAgregada[] = [];
    let counter = 1;
    for (const tipo of tipos) {
      for (const muni of municipios) {
        lista.push({
          id: `ENT-${String(counter).padStart(4, '0')}`,
          nombre: `${tipo} ${muni}`,
          nit: this.generarNit(counter),
        });
        counter++;
      }
    }
    return lista;
  }

  /** NIT mock con formato 800.xxx.xxx-d, dígito de verificación pseudo-aleatorio. */
  private generarNit(seed: number): string {
    const base = 800000000 + seed * 13;
    const s = String(base);
    const dv = seed % 10;
    return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${dv}`;
  }

  getEstadoSeverity(estado: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    // Ciclo de vida descrito por CRIS:
    // Pendiente → Validado → Enviado → Aceptado / Rechazado
    const map: Record<string, 'success' | 'warn' | 'danger' | 'info' | 'secondary'> = {
      'Pendiente de validar': 'warn',
      'Rechazado por Deficiencia': 'danger',
      'Rechazado': 'danger',
      'Validado': 'success',
      'Enviado': 'info',
      'En validación central': 'info',
      'Aceptado': 'success',
      'En proceso': 'info',
    };
    return map[estado] || 'secondary';
  }
}
