import { Component, ViewChild, signal, computed } from '@angular/core';
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
import { StepperModule } from 'primeng/stepper';
import { TabsModule } from 'primeng/tabs';
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

/* ── Protocolo de Importación — sub-vista del Paso 2 ── */
type ProtocoloTipoDato = 'Numérico' | 'Texto' | 'Fecha' | 'Lista';
type ProtocoloTipoRegistro = 'Cabecera' | 'Detalle';

interface ProtocoloVariable {
  numero: number;
  tipoRegistro: ProtocoloTipoRegistro;
  nombre: string;
  tipoDato: ProtocoloTipoDato;
  longitud: number;
  decimales: number | null;
  unidad: string;
  observaciones: string;
  listaKey?: string;
}

interface ProtocoloValorLista {
  codigo: string;
  nombre: string;
}

interface ProtocoloLista {
  key: string;
  nombre: string;
  valores: ProtocoloValorLista[];
}

/** Formatos soportados por el botón estándar "Descargar". */
type DownloadFormatId = 'csv' | 'xlsx' | 'pdf' | 'txt';

interface DownloadFormat {
  label: string;
  icon: string;
  format: DownloadFormatId;
  /** Texto de tooltip con restricciones/características del formato. */
  info: string;
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
    StepperModule,
    TabsModule,
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

  /**
   * Paso actual del wizard — 3 pasos:
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
    this.cerrarProtocolo();
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
    this.modalEditar = null;
    // En el wizard de 3 pasos, el listado y el registro manual viven en
    // el mismo paso (Formularios). Cerrar el detalle sólo limpia el estado;
    // el step se mantiene en 1.
  }

  // ──────────────────────────────────────────────────────────────────────
  // Sub-vista "Generar protocolo de importación" — pertenece al Paso 2.
  // Se abre desde el menú ⋮ de cada fila (por formulario). El listado se
  // oculta y se vuelve con "Volver al listado". El contexto del wizard
  // (entidad/categoría/año/periodo) sigue visible en el context bar.
  // ──────────────────────────────────────────────────────────────────────
  protocoloAbierto: Formulario | null = null;

  abrirProtocolo(form: Formulario | null) {
    if (!form) return;
    this.cerrarDetalle();
    this.protocoloAbierto = form;
    queueMicrotask(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  cerrarProtocolo() {
    this.protocoloAbierto = null;
  }

  // ── Edición modal del registro ──
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
      icon: 'pi pi-file-export',
      command: () => this.abrirProtocolo(this.selectedFormularioForMenu),
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

  // ──────────────────────────────────────────────────────────────────────
  // Protocolo de Importación — datos, modal Ver Lista y descargas.
  // El contexto (entidad/categoría/año/periodo + formulario seleccionado)
  // proviene del Paso 1 del wizard — no hay selects propios.
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Tab "Registro de Encabezado" — estructura de la fila S (única por archivo).
   * Formato del legacy CHIP: ejemplo destacado + lista descriptiva de campos.
   */
  readonly ejemploCabecera =
    'S 210641006 10103 2025 CGN001_BALANCE_GENERAL Fecha de envío';

  readonly camposCabecera: Array<{ token: string; nombre: string; desc: string }> = [
    { token: 'S', nombre: 'Tipo de Registro',
      desc: 'Marca de inicio. Indica que la fila corresponde al registro de cabecera.' },
    { token: '210641006', nombre: 'Código de la Entidad',
      desc: 'Identificador DANE de la entidad reportante.' },
    { token: '10103', nombre: 'Periodo',
      desc: 'Periodo contable del reporte. Ej: 10103 = trimestre Ene–Mar (mes inicial 01, mes final 03).' },
    { token: '2025', nombre: 'Año',
      desc: 'Año al que pertenece el periodo reportado.' },
    { token: 'CGN001_BALANCE_GENERAL', nombre: 'Nombre del Formulario',
      desc: 'Identificador único del formulario que se está reportando.' },
    { token: 'Fecha de envío', nombre: 'Fecha de Envío',
      desc: 'Fecha de generación de la información en formato dd-mm-aaaa.' },
  ];

  /**
   * Tab "Registro de Detalle" — estructura de las filas D (una por concepto).
   * Las variables concretas (SLDO_INC, MOV_DB, ENT_RECIP, etc.) se documentan
   * en el tab "Variables".
   */
  readonly ejemploDetalle = 'D Concepto Variables';

  readonly camposDetalle: Array<{ token: string; nombre: string; desc: string }> = [
    { token: 'D', nombre: 'Tipo de Registro',
      desc: 'Marca de inicio. Indica que la fila corresponde al registro de detalle.' },
    { token: 'Concepto', nombre: 'Código del Concepto',
      desc: 'Código contable del concepto a reportar. Ver tab "Conceptos" para los valores válidos.' },
    { token: 'Variables', nombre: 'Valores de las Variables',
      desc: 'Valores de las variables específicas del formulario. Ver tab "Variables" para su definición.' },
  ];

  /**
   * Tab "Variables" — variables técnicas del registro de detalle.
   * No incluye "Tipo de Registro" (D) ni "Concepto" (ya documentados en el tab Detalle).
   */
  readonly variables: ProtocoloVariable[] = [
    { numero: 1, tipoRegistro: 'Detalle', nombre: 'SLDO_INC',
      tipoDato: 'Numérico', longitud: 25, decimales: 2, unidad: 'Pesos',
      observaciones: 'Saldo inicial del concepto.' },
    { numero: 2, tipoRegistro: 'Detalle', nombre: 'MOV_DB',
      tipoDato: 'Numérico', longitud: 25, decimales: 2, unidad: 'Pesos',
      observaciones: 'Movimiento débito del período.' },
    { numero: 3, tipoRegistro: 'Detalle', nombre: 'MOV_CR',
      tipoDato: 'Numérico', longitud: 25, decimales: 2, unidad: 'Pesos',
      observaciones: 'Movimiento crédito del período.' },
    { numero: 4, tipoRegistro: 'Detalle', nombre: 'ENT_RECIP',
      tipoDato: 'Lista', longitud: 14, decimales: null, unidad: '—',
      observaciones: 'Entidad recíproca asociada al movimiento.',
      listaKey: 'ENTIDADES_RECIPROCAS' },
    { numero: 5, tipoRegistro: 'Detalle', nombre: 'VR_CTE',
      tipoDato: 'Numérico', longitud: 25, decimales: 2, unidad: 'Pesos',
      observaciones: 'Valor corriente del movimiento.' },
  ];

  /** Conteo total de variables (para el chip del header del protocolo). */
  get totalVariables(): number {
    return this.camposCabecera.length + this.camposDetalle.length + this.variables.length;
  }

  /** Buscador del tab Conceptos (filtrado en memoria sobre listas.CONCEPTOS.valores). */
  busquedaConceptos = signal('');

  conceptosFiltrados = computed<ProtocoloValorLista[]>(() => {
    const q = this.busquedaConceptos().trim().toLowerCase();
    const todos = this.listas['CONCEPTOS'].valores;
    if (!q) return todos;
    return todos.filter(c =>
      c.codigo.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q),
    );
  });

  /**
   * Descarga el catálogo CONCEPTOS en el formato indicado.
   * CSV se genera en cliente (mock real). Excel/PDF/TXT muestran toast de simulación.
   */
  descargarConceptos(format: DownloadFormatId = 'csv'): void {
    if (format === 'csv') {
      const lista = this.listas['CONCEPTOS'];
      this.descargarValoresCSV(lista.nombre, lista.valores);
      return;
    }
    this.toastDescargaSimulada('CONCEPTOS', format);
  }

  /** Catálogos referenciados por las variables tipo Lista. */
  readonly listas: Record<string, ProtocoloLista> = {
    PERIODOS: {
      key: 'PERIODOS',
      nombre: 'PERIODOS',
      valores: [
        { codigo: '01', nombre: 'Ene-Mar' },
        { codigo: '02', nombre: 'Abr-Jun' },
        { codigo: '03', nombre: 'Jul-Sep' },
        { codigo: '04', nombre: 'Oct-Dic' },
      ],
    },
    CONCEPTOS: {
      key: 'CONCEPTOS',
      nombre: 'CONCEPTOS',
      valores: this.generarConceptosProtocolo(),
    },
    ENTIDADES_RECIPROCAS: {
      key: 'ENTIDADES_RECIPROCAS',
      nombre: 'ENTIDADES_RECIPROCAS',
      valores: this.generarEntidadesReciprocasProtocolo(),
    },
  };

  /** Modal "Ver Lista" — signal para reaccionar al filtro de búsqueda. */
  listaActiva = signal<ProtocoloLista | null>(null);
  busquedaLista = signal('');

  valoresFiltrados = computed<ProtocoloValorLista[]>(() => {
    const lista = this.listaActiva();
    if (!lista) return [];
    const q = this.busquedaLista().trim().toLowerCase();
    if (!q) return lista.valores;
    return lista.valores.filter(v =>
      v.codigo.toLowerCase().includes(q) || v.nombre.toLowerCase().includes(q),
    );
  });

  abrirLista(listaKey: string | undefined): void {
    if (!listaKey) return;
    const lista = this.listas[listaKey];
    if (!lista) return;
    this.busquedaLista.set('');
    this.listaActiva.set(lista);
  }

  cerrarLista(): void {
    this.listaActiva.set(null);
    this.busquedaLista.set('');
  }

  /** Descarga el catálogo activo del modal Ver Lista en el formato indicado. */
  descargarLista(format: DownloadFormatId = 'csv'): void {
    const lista = this.listaActiva();
    if (!lista) return;
    if (format === 'csv') {
      this.descargarValoresCSV(lista.nombre, lista.valores);
      return;
    }
    this.toastDescargaSimulada(lista.nombre, format);
  }

  /** Descarga el protocolo (archivo plano) en el formato indicado. */
  descargarProtocolo(format: DownloadFormatId = 'txt'): void {
    this.toastDescargaSimulada('PROTOCOLO', format);
  }

  // ── Helpers de descarga reutilizables ──

  /** Genera CSV con BOM UTF-8 (compatible Excel) y dispara la descarga. */
  private descargarValoresCSV(nombre: string, valores: ProtocoloValorLista[]): void {
    const filas = [['Código', 'Nombre'], ...valores.map(v => [v.codigo, v.nombre])];
    const csv = filas
      .map(fila => fila.map(c => `"${c.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombre}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.messageService.add({
      severity: 'success',
      summary: 'Archivo descargado',
      detail: `${nombre}.csv`,
      life: 3000,
    });
  }

  /** Toast informativo para formatos no implementados en cliente (XLSX/PDF/TXT). */
  private toastDescargaSimulada(nombre: string, format: DownloadFormatId): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Descarga en proceso',
      detail: `Generando ${nombre} en formato ${format.toUpperCase()}…`,
      life: 3000,
    });
  }

  // ── Botón "Descargar" estándar: formatos disponibles + menús por destino ──
  readonly downloadFormats: DownloadFormat[] = [
    { label: 'CSV — Valores separados por comas', icon: 'pi pi-file', format: 'csv',
      info: 'Sin límite de filas. Encoding UTF-8. Encabezados incluidos.' },
    { label: 'Excel (XLSX)', icon: 'pi pi-file-excel', format: 'xlsx',
      info: 'Máximo 50 MB por archivo. Hasta 1.048.576 filas por hoja. Múltiples hojas permitidas.' },
    { label: 'PDF', icon: 'pi pi-file-pdf', format: 'pdf',
      info: 'Máximo 10.000 líneas por archivo. División automática si excede el límite.' },
    { label: 'TXT', icon: 'pi pi-file', format: 'txt',
      info: 'Sin límite de filas. Encoding UTF-8. Formato de texto plano.' },
  ];

  // Para evitar que PrimeNG renderice un tooltip nativo sobre el item entero
  // y duplique al del icono `?`, el texto del info viaja en `data` (campo
  // libre del MenuItem) y se enlaza con [pTooltip] sólo sobre el icono.

  /** MenuItem[] para el botón "Descargar" del tab Conceptos. */
  readonly downloadItemsConceptos: MenuItem[] = this.downloadFormats.map(f => ({
    label: f.label,
    icon: f.icon,
    command: () => this.descargarConceptos(f.format),
    data: { info: f.info },
  }));

  /** MenuItem[] para el botón "Descargar" del modal Ver Lista. */
  readonly downloadItemsLista: MenuItem[] = this.downloadFormats.map(f => ({
    label: f.label,
    icon: f.icon,
    command: () => this.descargarLista(f.format),
    data: { info: f.info },
  }));

  /** MenuItem[] para el botón "Descargar protocolo" del header del protocolo. */
  readonly downloadItemsProtocolo: MenuItem[] = this.downloadFormats.map(f => ({
    label: f.label,
    icon: f.icon,
    command: () => this.descargarProtocolo(f.format),
    data: { info: f.info },
  }));

  private generarConceptosProtocolo(): ProtocoloValorLista[] {
    return [
      { codigo: '1.1.05', nombre: 'CAJA' },
      { codigo: '1.1.10', nombre: 'BANCOS' },
      { codigo: '1.1.20', nombre: 'INVERSIONES' },
      { codigo: '1.4.07', nombre: 'PRESTACIÓN DE SERVICIOS' },
      { codigo: '1.4.13', nombre: 'TRANSFERENCIAS POR COBRAR' },
      { codigo: '2.4.01', nombre: 'ADQUISICIÓN DE BIENES Y SERVICIOS' },
      { codigo: '2.4.36', nombre: 'RETENCIÓN EN LA FUENTE' },
      { codigo: '3.1.05', nombre: 'CAPITAL FISCAL' },
      { codigo: '3.1.10', nombre: 'RESULTADO DEL EJERCICIO' },
      { codigo: '4.4.08', nombre: 'INGRESOS FINANCIEROS' },
      { codigo: '5.1.01', nombre: 'SUELDOS Y SALARIOS' },
      { codigo: '5.1.11', nombre: 'GENERALES' },
    ];
  }

  private generarEntidadesReciprocasProtocolo(): ProtocoloValorLista[] {
    return [
      { codigo: '102000000', nombre: 'CONTRALORÍA GENERAL DE LA REPÚBLICA' },
      { codigo: '104500000', nombre: 'DEPARTAMENTO ADMINISTRATIVO NACIONAL DE ESTADÍSTICA' },
      { codigo: '105000000', nombre: 'DEPARTAMENTO NACIONAL DE PLANEACIÓN' },
      { codigo: '106000000', nombre: 'DEPARTAMENTO ADMINISTRATIVO DE LA PRESIDENCIA DE LA REPÚBLICA' },
      { codigo: '106500000', nombre: 'DEPARTAMENTO ADMINISTRATIVO DE LA FUNCIÓN PÚBLICA' },
      { codigo: '110000000', nombre: 'MINISTERIO DE AGRICULTURA Y DESARROLLO RURAL' },
      { codigo: '110500000', nombre: 'MINISTERIO DE TECNOLOGÍAS DE LA INFORMACIÓN Y LAS COMUNICACIONES' },
      { codigo: '111000000', nombre: 'MINISTERIO DE DEFENSA NACIONAL' },
      { codigo: '111500000', nombre: 'GOBERNACIÓN DE ANTIOQUIA' },
      { codigo: '111600000', nombre: 'GOBERNACIÓN DEL ATLÁNTICO' },
      { codigo: '111700000', nombre: 'GOBERNACIÓN DE BOLÍVAR' },
      { codigo: '111800000', nombre: 'GOBERNACIÓN DE BOYACÁ' },
      { codigo: '111900000', nombre: 'GOBERNACIÓN DE CALDAS' },
      { codigo: '112000000', nombre: 'GOBERNACIÓN DEL CAQUETÁ' },
      { codigo: '112100000', nombre: 'GOBERNACIÓN DEL CAUCA' },
      { codigo: '112200000', nombre: 'GOBERNACIÓN DEL CESAR' },
      { codigo: '112300000', nombre: 'GOBERNACIÓN DE CÓRDOBA' },
      { codigo: '112400000', nombre: 'GOBERNACIÓN DE CUNDINAMARCA' },
      { codigo: '112500000', nombre: 'GOBERNACIÓN DEL CHOCÓ' },
      { codigo: '112600000', nombre: 'GOBERNACIÓN DEL HUILA' },
      { codigo: '112700000', nombre: 'GOBERNACIÓN DE LA GUAJIRA' },
      { codigo: '112800000', nombre: 'GOBERNACIÓN DEL MAGDALENA' },
      { codigo: '112900000', nombre: 'GOBERNACIÓN DEL META' },
      { codigo: '113000000', nombre: 'GOBERNACIÓN DE NARIÑO' },
      { codigo: '113100000', nombre: 'GOBERNACIÓN DE NORTE DE SANTANDER' },
      { codigo: '113200000', nombre: 'GOBERNACIÓN DEL PUTUMAYO' },
      { codigo: '113300000', nombre: 'GOBERNACIÓN DEL QUINDÍO' },
      { codigo: '113400000', nombre: 'GOBERNACIÓN DE RISARALDA' },
      { codigo: '113500000', nombre: 'GOBERNACIÓN DE SANTANDER' },
      { codigo: '113600000', nombre: 'GOBERNACIÓN DE SUCRE' },
      { codigo: '113700000', nombre: 'GOBERNACIÓN DEL TOLIMA' },
      { codigo: '113800000', nombre: 'GOBERNACIÓN DEL VALLE DEL CAUCA' },
      { codigo: '113900000', nombre: 'GOBERNACIÓN DEL VAUPÉS' },
      { codigo: '114000000', nombre: 'GOBERNACIÓN DEL VICHADA' },
      { codigo: '114100000', nombre: 'ALCALDÍA MAYOR DE BOGOTÁ' },
      { codigo: '114200000', nombre: 'ALCALDÍA DE MEDELLÍN' },
      { codigo: '114300000', nombre: 'ALCALDÍA DE CALI' },
      { codigo: '114400000', nombre: 'ALCALDÍA DE BARRANQUILLA' },
      { codigo: '114500000', nombre: 'ALCALDÍA DE CARTAGENA' },
      { codigo: '114600000', nombre: 'ALCALDÍA DE BUCARAMANGA' },
    ];
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
