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
import {
  DirectorioEntidadesComponent,
  Entidad,
} from '../../../components/directorio-entidades/directorio-entidades.component';

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

/**
 * Comportamiento del envío de una categoría respecto a las entidades agregadas.
 *   noAplica    → no gestiona entidades (botón inactivo, envío directo)
 *   obligatoria → exige ≥1 entidad (bloquea si no hay)
 *   agregadora  → entidad agregadora (confirma responsabilidad si no hay)
 */
type ModoEntidades = 'noAplica' | 'obligatoria' | 'agregadora';

/** Error de validación central, clasificado por tipo (Paso 3). */
interface ErrorValidacion {
  tipo: string;
  formulario: string;
  ubicacion: string;
  detalle: string;
  correccion: string;
}

/** Entidad disponible para asignar a la categoría desde el modal "Entidades Agregadas". */
interface EntidadAgregada {
  id: string;
  nombre: string;
  nit: string;
}

/**
 * Tipo de usuario que determina cómo se resuelve la entidad del contexto (Paso 1):
 *   • 'L' (Local)       → opera una sola entidad: se carga por defecto, sin elegir.
 *   • 'A' (Agregadora)  ┐
 *   • 'C' (Consolidadora)│→ operan sobre varias entidades: deben elegir una desde
 *   • 'E' (Estratégico) ┘  el modal "Directorio de entidades".
 * En producción este valor vendría de la sesión/backend; aquí se mockea con un
 * selector de demostración para poder mostrar los escenarios en la pantalla demo.
 *   • 'L'          → entidad local activa, cargada por defecto.
 *   • 'L_INACTIVA' → entidad local inactiva (sin categorías activas) → alerta.
 *   • 'ACE'        → A/C/E: elige la entidad desde el directorio.
 */
type TipoUsuario = 'L' | 'L_INACTIVA' | 'ACE';

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

/**
 * Tipo de dato de un campo (columna) de una lista — equivale a `tab_field.field_type`.
 *   S = texto · N = numérico · B = booleano · D = fecha · L = lista
 * Sólo se usa, por ahora, para alinear los numéricos a la derecha.
 */
type ProtocoloFieldType = 'S' | 'N' | 'B' | 'D' | 'L';

/**
 * Definición de una columna de la lista — simula una fila de `tab_field`.
 * `code`  → field_code   (encabezado de la columna; también la llave en cada registro)
 * `order` → orden de despliegue definido en tab_field
 * `type`  → field_type   (N alinea a la derecha)
 * `len`   → field_len    (de aquí sale el ancho proporcional de la columna)
 */
interface ProtocoloField {
  code: string;
  order: number;
  type: ProtocoloFieldType;
  len: number;
  decimals?: number;
}

/** Un registro de la lista — simula `result`: un valor por field_code. */
type ProtocoloRegistro = Record<string, string>;

interface ProtocoloLista {
  key: string;
  nombre: string;
  /** Columnas de la lista, en el orden de tab_field. */
  fields: ProtocoloField[];
  /** Valores: cada registro está llaveado por field_code. */
  valores: ProtocoloRegistro[];
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
    DirectorioEntidadesComponent,
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
    // Al volver al paso de filtros se CONSERVA el contexto aplicado (acordeón
    // colapsado con sus chips) para no bloquear Consultar envíos e Importar.
    // Solo se cierran los paneles inline que pudieran estar abiertos.
    if (step === 0) {
      this.cerrarPanelesPaso1();
      // Reinicia la verificación: una nueva pasada vuelve a detectar errores.
      this.verificado = false;
      this.erroresActivos = [];
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

  // ── Tipo de usuario (mock de demostración) ──
  // Dispara los dos eventos de resolución de entidad del Paso 1.
  readonly entidadLocalPorDefecto: Entidad = {
    codigo: '110100000', nit: '830.000.000-0',
    razonSocial: 'Contaduría General de la Nación',
    departamento: 'Bogotá D.C.', municipio: 'Bogotá D.C.', estado: 'Activo',
  };
  /** Entidad local inactiva (mock) — escenario "sin categorías activas". */
  readonly entidadLocalInactiva: Entidad = {
    codigo: '210111076', nit: '800.345.678-3',
    razonSocial: 'Municipio de Puerto Nariño',
    departamento: 'Amazonas', municipio: 'Puerto Nariño', estado: 'Inactivo',
  };
  tiposUsuarioOptions = [
    { label: 'Tipo L · Entidad local (carga automática)', value: 'L' },
    { label: 'Tipo L · Entidad inactiva (sin categorías activas)', value: 'L_INACTIVA' },
    { label: 'Tipo A, C y E · Selecciona del directorio', value: 'ACE' },
  ];
  tipoUsuario: TipoUsuario = 'L';

  get esTipoLocal(): boolean {
    return this.tipoUsuario === 'L' || this.tipoUsuario === 'L_INACTIVA';
  }

  /** True cuando la entidad seleccionada está inactiva (no opera ninguna categoría). */
  get entidadInactiva(): boolean {
    return this.filterEntidad?.estado === 'Inactivo';
  }

  // ── Filtros ──
  filterEntidad: Entidad | null = this.entidadLocalPorDefecto;
  selectedCategoria = '';
  selectedAnio = '';
  selectedPeriodo = '';
  filtersApplied = false;
  filtersCollapsed = false;

  /** Etiqueta visible de la entidad seleccionada (código - razón social). */
  get entidadLabel(): string {
    return this.filterEntidad
      ? `${this.filterEntidad.codigo} - ${this.filterEntidad.razonSocial}`
      : '';
  }

  // ──────────────────────────────────────────────────────────────────────
  // Directorio de entidades — selección ÚNICA mediante el componente
  // compartido `app-directorio-entidades` (mismo estándar que Levantamiento
  // de Restricciones). El usuario A/C/E lo abre desde el campo Entidad.
  // ──────────────────────────────────────────────────────────────────────
  mostrarDirectorioEntidades = false;

  /**
   * Resuelve la entidad según el tipo de usuario (mock de los dos eventos).
   * Cambiar de contexto de entidad invalida cualquier filtro ya aplicado.
   */
  onTipoUsuarioChange() {
    this.resetContextoEntidad();
    this.mostrarDirectorioEntidades = false;
    if (this.tipoUsuario === 'L') {
      // Evento 1 — Local: la entidad se carga por defecto, sin modal.
      this.filterEntidad = this.entidadLocalPorDefecto;
    } else if (this.tipoUsuario === 'L_INACTIVA') {
      // Escenario — Local con entidad inactiva: carga la entidad inactiva (dispara alerta).
      this.filterEntidad = this.entidadLocalInactiva;
    } else {
      // Evento 2 — A/C/E: el usuario abre el directorio desde el campo Entidad.
      this.filterEntidad = null;
    }
  }

  abrirDirectorioEntidades() {
    // El usuario local no elige entidad: la suya viene cargada por defecto.
    if (this.esTipoLocal) return;
    this.mostrarDirectorioEntidades = true;
  }

  onEntidadSeleccionada(e: Entidad) {
    this.filterEntidad = e;
    // Cambiar la entidad del contexto invalida los filtros aplicados.
    this.resetContextoEntidad();
    this.messageService.add({
      severity: 'success',
      summary: 'Entidad seleccionada',
      detail: this.entidadLabel,
      life: 3000,
    });
  }

  limpiarEntidad() {
    this.filterEntidad = null;
    this.resetContextoEntidad();
  }

  /** Reinicia el contexto dependiente cuando cambia la entidad. */
  private resetContextoEntidad() {
    this.filtersApplied = false;
    this.filtersCollapsed = false;
    this.cerrarPanelesPaso1();
  }

  /**
   * `modoEntidades` define cómo se comporta el envío de la categoría frente a
   * las entidades agregadas (3 escenarios):
   *   • 'noAplica'    → la categoría no gestiona entidades agregadas. El botón
   *                     "Entidades agregadas" queda inactivo y el envío procede
   *                     sin validar entidades.
   *   • 'obligatoria' → exige al menos una entidad. Si no hay, el envío se
   *                     bloquea con un mensaje (Alerta 1).
   *   • 'agregadora'  → entidad agregadora: si no hay entidades configuradas,
   *                     el envío se confirma con asunción de responsabilidad
   *                     (Alerta 2). Ver enviarCategoria().
   * Sin valor explícito se asume 'noAplica'.
   */
  categoriaOptions: { label: string; value: string; modoEntidades?: ModoEntidades }[] = [
    { label: 'Seleccione categoría', value: '' },
    { label: 'INFORMACIÓN CONTABLE PÚBLICA CONVERGENCIA', value: 'ICP', modoEntidades: 'agregadora' },
    { label: 'INFORMACIÓN PRESUPUESTAL', value: 'IP', modoEntidades: 'obligatoria' },
    { label: 'INFORMACIÓN FINANCIERA', value: 'IF', modoEntidades: 'noAplica' },
    { label: 'CONTROL INTERNO CONTABLE', value: 'CIC', modoEntidades: 'obligatoria' },
    { label: 'CGR PRESUPUESTAL', value: 'CGR', modoEntidades: 'agregadora' },
    { label: 'FUT GASTOS DE FUNCIONAMIENTO', value: 'FUT_GF', modoEntidades: 'noAplica' },
    { label: 'FUT GASTOS DE INVERSIÓN', value: 'FUT_GI', modoEntidades: 'noAplica' },
    { label: 'FUT INGRESOS', value: 'FUT_ING', modoEntidades: 'noAplica' },
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

  /* ═══════════════════════════════════════════════════════════════════
     Paso 3 — Tabla de errores por tipo (resultado de la verificación)
     La verificación corre al "Enviar Categoría": el primer intento detecta
     los errores y los muestra clasificados por tipo. El usuario corrige
     cada uno ("Ir al formulario") y, cuando la tabla queda vacía, el envío
     pasa. Datos de ejemplo (demo). Da claridad de QUÉ corregir en vez de
     mandar al usuario a "regresar al paso 2" sin información.
     ═══════════════════════════════════════════════════════════════════ */

  /** True una vez disparada la verificación central (primer "Enviar Categoría"). */
  verificado = false;

  /** Errores aún pendientes de corregir (se vacía a medida que se corrigen). */
  erroresActivos: ErrorValidacion[] = [];

  /** True mientras la verificación tenga errores pendientes. */
  get hayErrores(): boolean {
    return this.verificado && this.erroresActivos.length > 0;
  }

  /** Catálogo base de errores que arroja la verificación central (mock). */
  readonly erroresValidacion: ErrorValidacion[] = [
    {
      tipo: 'Inconsistencia',
      formulario: 'Saldos y Movimientos',
      ubicacion: 'Fila 14 · concepto 1.1.05',
      detalle: 'Débitos ($3.200.000) ≠ Créditos ($2.000.000).',
      correccion: 'Ajuste los valores del concepto para que el cuadre dé cero.',
    },
    {
      tipo: 'Dato obligatorio',
      formulario: 'Saldos y Movimientos',
      ubicacion: 'Concepto 2.1.03',
      detalle: 'El saldo final está vacío.',
      correccion: 'Diligencie el saldo final del concepto.',
    },
    {
      tipo: 'Formato inválido',
      formulario: 'Operaciones Recíprocas',
      ubicacion: 'Fila 7 · campo NIT',
      detalle: 'El NIT contiene letras.',
      correccion: 'Ingrese solo números, sin puntos ni guion.',
    },
    {
      tipo: 'Valor fuera de rango',
      formulario: 'Variaciones',
      ubicacion: 'Concepto 4.2.01',
      detalle: 'La variación de 320% supera el límite permitido.',
      correccion: 'Verifique el valor reportado o justifique la variación.',
    },
    {
      tipo: 'Código no válido',
      formulario: 'Saldos y Movimientos',
      ubicacion: 'Concepto 9999',
      detalle: 'La cuenta 9999 no existe en el catálogo CGN.',
      correccion: 'Use un código de cuenta válido del catálogo.',
    },
    {
      tipo: 'Registro duplicado',
      formulario: 'Operaciones Recíprocas',
      ubicacion: 'Concepto 1.2.03',
      detalle: 'El concepto aparece 2 veces.',
      correccion: 'Elimine el registro duplicado.',
    },
  ];

  /** Severity del tag según la gravedad del tipo de error. */
  tipoErrorSeverity(tipo: string): 'danger' | 'warn' | 'info' {
    switch (tipo) {
      case 'Inconsistencia':
      case 'Dato obligatorio':
        return 'danger';
      case 'Regla de negocio':
        return 'info';
      default:
        return 'warn';
    }
  }

  /** Resumen "N por tipo" para el encabezado de la tabla de errores (solo pendientes). */
  get resumenErrores(): { tipo: string; cantidad: number; severity: 'danger' | 'warn' | 'info' }[] {
    const conteo = new Map<string, number>();
    for (const e of this.erroresActivos) {
      conteo.set(e.tipo, (conteo.get(e.tipo) ?? 0) + 1);
    }
    return Array.from(conteo, ([tipo, cantidad]) => ({
      tipo,
      cantidad,
      severity: this.tipoErrorSeverity(tipo),
    }));
  }

  /** Lleva al usuario al formulario con error (Paso 2) y marca ese error como corregido. */
  irAFormularioConError(err: ErrorValidacion): void {
    // Se quita este error de la lista de pendientes (simula su corrección).
    this.erroresActivos = this.erroresActivos.filter(e => e !== err);

    if (this.erroresActivos.length === 0) {
      this.messageService.add({
        severity: 'success',
        summary: 'Errores corregidos',
        detail: 'No quedan errores pendientes. Ya puede enviar la categoría.',
        life: 4000,
      });
    } else {
      this.messageService.add({
        severity: 'info',
        summary: 'Ir al formulario',
        detail: `Corrigiendo "${err.formulario}" en ${err.ubicacion}. Quedan ${this.erroresActivos.length} errores.`,
        life: 3000,
      });
    }
    this.irAPaso(1);
  }

  /** Diálogo de confirmación "entidad agregadora sin entidades" (Alerta 2). */
  showAgregadoraDialog = false;

  /** Modo de entidades agregadas de la categoría seleccionada (default noAplica). */
  get modoEntidades(): ModoEntidades {
    return this.categoriaOptions.find(o => o.value === this.selectedCategoria)?.modoEntidades
      ?? 'noAplica';
  }

  /** True cuando la categoría gestiona entidades agregadas (habilita el botón). */
  get entidadesAgregadasHabilitado(): boolean {
    return this.modoEntidades !== 'noAplica';
  }

  /** True si la categoría seleccionada corresponde a una entidad agregadora. */
  get categoriaEsAgregadora(): boolean {
    return this.modoEntidades === 'agregadora';
  }

  /** Etiqueta legible de la categoría seleccionada (para mensajes/diálogos). */
  get categoriaLabel(): string {
    return this.categoriaOptions.find(o => o.value === this.selectedCategoria)?.label
      ?? 'la categoría';
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

    // La categoría gestiona entidades agregadas y no hay ninguna configurada →
    // dos escenarios según el modo. Las categorías 'noAplica' se saltan esta
    // validación y envían directo.
    if (this.entidadesAgregadasHabilitado && this.selectedEntidades.length === 0) {
      if (this.categoriaEsAgregadora) {
        // Alerta 2: entidad agregadora — confirma asunción de responsabilidad.
        this.showAgregadoraDialog = true;
      } else {
        // Alerta 1: bloqueo — es obligatorio seleccionar al menos una entidad.
        this.messageService.add({
          severity: 'warn',
          summary: 'Seleccione entidades agregadas',
          detail: 'Debe agregar al menos una entidad antes de enviar la categoría. Use el botón "Entidades agregadas" para configurarlas.',
          life: 6000,
        });
      }
      return;
    }

    this.procederEnvioCategoria();
  }

  /** Confirmación del diálogo de entidad agregadora (Alerta 2). */
  confirmarEnvioAgregadora() {
    this.showAgregadoraDialog = false;
    this.procederEnvioCategoria();
  }

  /** Cancela el diálogo de entidad agregadora sin enviar. */
  cancelarEnvioAgregadora() {
    this.showAgregadoraDialog = false;
  }

  /** Envío efectivo de la categoría — reutilizado por ambos caminos. */
  private procederEnvioCategoria() {
    // Verificación central: la primera vez carga los errores y muestra la
    // tabla por tipo. El usuario corrige cada uno ("Ir al formulario") hasta
    // vaciarla; recién ahí el envío pasa. (Demo del comportamiento real.)
    if (!this.verificado) {
      this.verificado = true;
      this.erroresActivos = [...this.erroresValidacion];
    }
    if (this.erroresActivos.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'La verificación encontró errores',
        detail: `Quedan ${this.erroresActivos.length} errores en la categoría. Corríjalos antes de enviar.`,
        life: 6000,
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
    return !!this.filterEntidad && !this.entidadInactiva
      && !!this.selectedCategoria && !!this.selectedAnio && !!this.selectedPeriodo;
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
      this.messageService.add({ severity: 'warn', summary: 'Filtros requeridos', detail: 'Debe seleccionar Entidad, Categoría, Año y Periodo.' });
      return;
    }
    this.recomputarFormulariosBase();
    this.filtersApplied = true;
    // Al aplicar, el acordeón de filtros se colapsa a su resumen de chips.
    this.filtersCollapsed = true;
  }

  /**
   * Al modificar cualquier filtro tras haberlos aplicado, el contexto deja de
   * ser válido: Consultar envíos, Importar y Siguiente vuelven a inactivarse
   * (gateados por `filtersApplied`) y se cierran los paneles abiertos.
   */
  onFiltroModificado() {
    if (this.filtersApplied) {
      this.filtersApplied = false;
      this.cerrarPanelesPaso1();
    }
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.filterEntidad) count++;
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
    this.filtersCollapsed = false;
    this.searchFormulario = '';
    this.cerrarPanelesPaso1();
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

    // ── Variables de ejemplo para validar los 4 casos del modal "Ver Lista".
    //    (En el mock el tab Variables comparte un solo array; cada una indica
    //     de qué formulario/variable colgaría en producción.)
    { numero: 6, tipoRegistro: 'Detalle', nombre: 'PERIODO_REP',
      tipoDato: 'Lista', longitud: 2, decimales: null, unidad: '—',
      observaciones: 'Periodo del reporte — caso lista simple (2 campos).',
      listaKey: 'PERIODOS' },                       // form. CGN001_BALANCE_GENERAL / var. PERIODO_REP
    { numero: 7, tipoRegistro: 'Detalle', nombre: 'TERCERO',
      tipoDato: 'Lista', longitud: 16, decimales: null, unidad: '—',
      observaciones: 'Tercero asociado — caso 8 campos (dispara paginador de columnas).',
      listaKey: 'TERCEROS' },                       // form. CGN015_OPERACIONES_RECIPROCAS / var. TERCERO
    { numero: 8, tipoRegistro: 'Detalle', nombre: 'CTA_CONTABLE',
      tipoDato: 'Lista', longitud: 12, decimales: null, unidad: '—',
      observaciones: 'Cuenta del plan contable — caso con campo Descripción largo (truncado).',
      listaKey: 'PLAN_CUENTAS' },                   // form. CGN001_BALANCE_GENERAL / var. CTA_CONTABLE
  ];

  /** Conteo total de variables (para el chip del header del protocolo). */
  get totalVariables(): number {
    return this.camposCabecera.length + this.camposDetalle.length + this.variables.length;
  }

  /** Buscador del tab Conceptos (filtrado en memoria sobre listas.CONCEPTOS.valores). */
  busquedaConceptos = signal('');

  conceptosFiltrados = computed<ProtocoloRegistro[]>(() => {
    const q = this.busquedaConceptos().trim().toLowerCase();
    const todos = this.listas['CONCEPTOS'].valores;
    if (!q) return todos;
    return todos.filter(r =>
      Object.values(r).some(v => v.toLowerCase().includes(q)),
    );
  });

  /**
   * Descarga el catálogo CONCEPTOS en el formato indicado.
   * CSV se genera en cliente (mock real). Excel/PDF/TXT muestran toast de simulación.
   */
  descargarConceptos(format: DownloadFormatId = 'csv'): void {
    if (format === 'csv') {
      this.descargarValoresCSV(this.listas['CONCEPTOS']);
      return;
    }
    this.toastDescargaSimulada('CONCEPTOS', format);
  }

  /**
   * Catálogos referenciados por las variables tipo Lista.
   * Cada lista define sus columnas en `fields` (simula tab_field) y sus
   * registros en `valores` (simula result, llaveados por field_code).
   */
  readonly listas: Record<string, ProtocoloLista> = {
    // Caso simple: 2 campos (código + nombre) → sin paginador de columnas.
    PERIODOS: {
      key: 'PERIODOS',
      nombre: 'PERIODOS',
      fields: [
        { code: 'Código', order: 1, type: 'S', len: 2 },
        { code: 'Nombre', order: 2, type: 'S', len: 20 },
      ],
      valores: [
        { 'Código': '01', 'Nombre': 'Ene-Mar' },
        { 'Código': '02', 'Nombre': 'Abr-Jun' },
        { 'Código': '03', 'Nombre': 'Jul-Sep' },
        { 'Código': '04', 'Nombre': 'Oct-Dic' },
      ],
    },
    CONCEPTOS: {
      key: 'CONCEPTOS',
      nombre: 'CONCEPTOS',
      fields: [
        { code: 'Código', order: 1, type: 'S', len: 8 },
        { code: 'Nombre', order: 2, type: 'S', len: 60 },
      ],
      valores: this.generarConceptosProtocolo(),
    },
    // Caso máximo actual: 6 campos → se muestra completo, sin paginador.
    ENTIDADES_RECIPROCAS: {
      key: 'ENTIDADES_RECIPROCAS',
      nombre: 'ENTIDADES_RECIPROCAS',
      fields: [
        { code: 'Código', order: 1, type: 'S', len: 9 },
        { code: 'NIT', order: 2, type: 'S', len: 11 },
        { code: 'Razón social', order: 3, type: 'S', len: 60 },
        { code: 'Tipo', order: 4, type: 'S', len: 12 },
        { code: 'Departamento', order: 5, type: 'S', len: 20 },
        { code: 'Estado', order: 6, type: 'S', len: 10 },
      ],
      valores: this.generarEntidadesReciprocasProtocolo(),
    },
    // Caso 8 campos → dispara el paginador de columnas (6 + 2).
    TERCEROS: {
      key: 'TERCEROS',
      nombre: 'TERCEROS',
      fields: [
        { code: 'Tipo doc.', order: 1, type: 'S', len: 4 },
        { code: 'Documento', order: 2, type: 'S', len: 12 },
        { code: 'DV', order: 3, type: 'N', len: 1 },
        { code: 'Razón social', order: 4, type: 'S', len: 60 },
        { code: 'Ciudad', order: 5, type: 'S', len: 20 },
        { code: 'Dirección', order: 6, type: 'S', len: 40 },
        { code: 'Teléfono', order: 7, type: 'S', len: 14 },
        { code: 'Estado', order: 8, type: 'S', len: 10 },
      ],
      valores: this.generarTercerosProtocolo(),
    },
    // Caso campo largo: 5 campos, uno de longitud 180 (Descripción) → truncado
    // con "…" + tooltip; las demás columnas se reajustan. Cabe en una página.
    PLAN_CUENTAS: {
      key: 'PLAN_CUENTAS',
      nombre: 'PLAN_CUENTAS',
      fields: [
        { code: 'Código', order: 1, type: 'S', len: 12 },
        { code: 'Nombre', order: 2, type: 'S', len: 40 },
        { code: 'Descripción', order: 3, type: 'S', len: 180 },
        { code: 'Naturaleza', order: 4, type: 'S', len: 8 },
        { code: 'Nivel', order: 5, type: 'N', len: 2 },
      ],
      valores: this.generarPlanCuentasProtocolo(),
    },
  };

  /** Modal "Ver Lista" — signal para reaccionar al filtro de búsqueda. */
  listaActiva = signal<ProtocoloLista | null>(null);
  busquedaLista = signal('');

  /** Filtra por CUALQUIER campo del registro (no sólo código/nombre). */
  valoresFiltrados = computed<ProtocoloRegistro[]>(() => {
    const lista = this.listaActiva();
    if (!lista) return [];
    const q = this.busquedaLista().trim().toLowerCase();
    if (!q) return lista.valores;
    return lista.valores.filter(r =>
      Object.values(r).some(v => v.toLowerCase().includes(q)),
    );
  });

  // ── Columnas dinámicas del modal "Ver Lista" ──────────────────────────────
  // El modal es estático (820px); quien se adapta es el datatable interno.
  // Cada columna toma el ancho necesario para que su NOMBRE (header) quepa sin
  // exprimirse, acotado por un techo (los textos largos se truncan con "…").
  // Las columnas se empacan por presupuesto de ancho (sin scroll horizontal) y
  // con un tope de 6; si sobran campos se habilita el paginador de columnas.
  private readonly LISTA_COLS_MAX = 6;        // tope para no recargar el modal
  private readonly LISTA_COL_BUDGET = 740;    // ancho útil del datatable (px)
  private readonly LISTA_COL_MIN = 56;        // piso de columna
  private readonly LISTA_COL_MAX = 220;       // techo: a partir de aquí trunca

  /** Página de columnas activa del modal (0-based), como el pager del treetable. */
  paginaColumnasLista = 0;

  /** Campos de la lista activa, ordenados por `order` (tab_field). */
  private get camposListaOrdenados(): ProtocoloField[] {
    const lista = this.listaActiva();
    return lista ? [...lista.fields].sort((a, b) => a.order - b.order) : [];
  }

  /**
   * Ancho (px) que necesita una columna: el mayor entre lo que ocupa su nombre
   * (header en mayúsculas) y lo sugerido por field_len, acotado por piso/techo.
   */
  anchoColumnaListaPx(field: ProtocoloField): number {
    const headerNeed = Math.round(field.code.length * 8.5) + 30;
    const contentNeed = Math.min(field.len, 28) * 8 + 24;
    return Math.min(this.LISTA_COL_MAX, Math.max(this.LISTA_COL_MIN, headerNeed, contentNeed));
  }

  /**
   * Campos repartidos en páginas: se acumulan columnas hasta llegar al tope (6)
   * o agotar el presupuesto de ancho, lo que ocurra primero.
   */
  get paginasColumnasLista(): ProtocoloField[][] {
    const campos = this.camposListaOrdenados;
    if (!campos.length) return [[]];
    const paginas: ProtocoloField[][] = [];
    let actual: ProtocoloField[] = [];
    let ancho = 0;
    for (const campo of campos) {
      const w = this.anchoColumnaListaPx(campo);
      const llena = actual.length >= this.LISTA_COLS_MAX;
      const excede = actual.length > 0 && ancho + w > this.LISTA_COL_BUDGET;
      if (llena || excede) {
        paginas.push(actual);
        actual = [];
        ancho = 0;
      }
      actual.push(campo);
      ancho += w;
    }
    if (actual.length) paginas.push(actual);
    return paginas.length ? paginas : [[]];
  }

  get totalPaginasColumnasLista(): number {
    return this.paginasColumnasLista.length;
  }

  /** Sólo se muestra el pager de columnas si hay más de una página. */
  get mostrarPagerColumnasLista(): boolean {
    return this.totalPaginasColumnasLista > 1;
  }

  get columnasVisiblesLista(): ProtocoloField[] {
    const paginas = this.paginasColumnasLista;
    const idx = Math.min(this.paginaColumnasLista, paginas.length - 1);
    return paginas[idx] ?? [];
  }

  /** Etiqueta del pager de columnas: "Columnas 1–6 de 8". */
  rangoColumnasListaTxt(): string {
    const campos = this.camposListaOrdenados;
    const vis = this.columnasVisiblesLista;
    if (!vis.length) return '';
    const desde = campos.indexOf(vis[0]) + 1;
    const hasta = campos.indexOf(vis[vis.length - 1]) + 1;
    return `Columnas ${desde}–${hasta} de ${campos.length}`;
  }

  paginaColumnasListaAnterior(): void {
    if (this.paginaColumnasLista > 0) this.paginaColumnasLista--;
  }
  paginaColumnasListaSiguiente(): void {
    if (this.paginaColumnasLista < this.totalPaginasColumnasLista - 1) this.paginaColumnasLista++;
  }

  // ── Paginador de registros del modal (recicla el look del treetable) ──────
  listaPagina = signal(0);
  listaTamPagina = signal(5);
  readonly opcionesTamPaginaLista = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '25', value: 25 },
  ];

  /** Filas de la página actual (paginación manual, igual que el treetable). */
  valoresPaginados = computed<ProtocoloRegistro[]>(() => {
    const filas = this.valoresFiltrados();
    const size = this.listaTamPagina();
    const totalPag = Math.max(1, Math.ceil(filas.length / size));
    const page = Math.min(this.listaPagina(), totalPag - 1);
    const start = page * size;
    return filas.slice(start, start + size);
  });

  get totalPaginasFilasLista(): number {
    return Math.max(1, Math.ceil(this.valoresFiltrados().length / this.listaTamPagina()));
  }

  /** Etiqueta "Mostrando X a Y de Z valores". */
  rangoFilasListaTxt(): string {
    const total = this.valoresFiltrados().length;
    if (!total) return 'Sin valores';
    const size = this.listaTamPagina();
    const page = Math.min(this.listaPagina(), this.totalPaginasFilasLista - 1);
    const desde = page * size + 1;
    const hasta = Math.min(total, desde + size - 1);
    return `Mostrando ${desde} a ${hasta} de ${total} valores`;
  }

  cambiarPaginaFilasLista(delta: number): void {
    const next = this.listaPagina() + delta;
    if (next >= 0 && next < this.totalPaginasFilasLista) this.listaPagina.set(next);
  }
  cambiarTamPaginaLista(size: number): void {
    this.listaTamPagina.set(size);
    this.listaPagina.set(0);
  }

  /** La búsqueda resetea la paginación de filas. */
  onBuscarLista(q: string): void {
    this.busquedaLista.set(q);
    this.listaPagina.set(0);
  }

  abrirLista(listaKey: string | undefined): void {
    if (!listaKey) return;
    const lista = this.listas[listaKey];
    if (!lista) return;
    this.busquedaLista.set('');
    this.paginaColumnasLista = 0;
    this.listaPagina.set(0);
    this.listaActiva.set(lista);
  }

  cerrarLista(): void {
    this.listaActiva.set(null);
    this.busquedaLista.set('');
    this.paginaColumnasLista = 0;
    this.listaPagina.set(0);
  }

  /** Descarga el catálogo activo del modal Ver Lista en el formato indicado. */
  descargarLista(format: DownloadFormatId = 'csv'): void {
    const lista = this.listaActiva();
    if (!lista) return;
    if (format === 'csv') {
      this.descargarValoresCSV(lista);
      return;
    }
    this.toastDescargaSimulada(lista.nombre, format);
  }

  /** Descarga el protocolo (archivo plano) en el formato indicado. */
  descargarProtocolo(format: DownloadFormatId = 'txt'): void {
    this.toastDescargaSimulada('PROTOCOLO', format);
  }

  // ── Helpers de descarga reutilizables ──

  /**
   * Genera CSV con BOM UTF-8 (compatible Excel) y dispara la descarga.
   * Las columnas y su orden salen de `lista.fields` (tab_field).
   */
  private descargarValoresCSV(lista: ProtocoloLista): void {
    const cols = [...lista.fields].sort((a, b) => a.order - b.order);
    const filas = [
      cols.map(c => c.code),
      ...lista.valores.map(r => cols.map(c => r[c.code] ?? '')),
    ];
    const csv = filas
      .map(fila => fila.map(c => `"${c.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lista.nombre}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.messageService.add({
      severity: 'success',
      summary: 'Archivo descargado',
      detail: `${lista.nombre}.csv`,
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

  private generarConceptosProtocolo(): ProtocoloRegistro[] {
    return [
      { 'Código': '1.1.05', 'Nombre': 'CAJA' },
      { 'Código': '1.1.10', 'Nombre': 'BANCOS' },
      { 'Código': '1.1.20', 'Nombre': 'INVERSIONES' },
      { 'Código': '1.4.07', 'Nombre': 'PRESTACIÓN DE SERVICIOS' },
      { 'Código': '1.4.13', 'Nombre': 'TRANSFERENCIAS POR COBRAR' },
      { 'Código': '2.4.01', 'Nombre': 'ADQUISICIÓN DE BIENES Y SERVICIOS' },
      { 'Código': '2.4.36', 'Nombre': 'RETENCIÓN EN LA FUENTE' },
      { 'Código': '3.1.05', 'Nombre': 'CAPITAL FISCAL' },
      { 'Código': '3.1.10', 'Nombre': 'RESULTADO DEL EJERCICIO' },
      { 'Código': '4.4.08', 'Nombre': 'INGRESOS FINANCIEROS' },
      { 'Código': '5.1.01', 'Nombre': 'SUELDOS Y SALARIOS' },
      { 'Código': '5.1.11', 'Nombre': 'GENERALES' },
    ];
  }

  /**
   * Caso 8 campos (dispara el paginador de columnas). Datos derivados a partir
   * de un set base de terceros para no escribir 8 valores por fila a mano.
   */
  private generarTercerosProtocolo(): ProtocoloRegistro[] {
    const base: Array<[string, string, string]> = [
      ['NIT', '830053105', 'EMPRESA DE ENERGÍA DE BOGOTÁ S.A. E.S.P.'],
      ['NIT', '899999068', 'EMPRESA DE ACUEDUCTO Y ALCANTARILLADO DE BOGOTÁ'],
      ['NIT', '860002503', 'ETB S.A. E.S.P.'],
      ['NIT', '800153993', 'COLPENSIONES'],
      ['CC', '79853012', 'GÓMEZ RAMÍREZ, ANDRÉS FELIPE'],
      ['CC', '52154879', 'TORRES MORENO, DIANA CAROLINA'],
      ['NIT', '901037916', 'AGENCIA NACIONAL DE CONTRATACIÓN PÚBLICA'],
      ['NIT', '830115226', 'POSITIVA COMPAÑÍA DE SEGUROS S.A.'],
      ['CC', '1018412339', 'RINCÓN VARGAS, JUAN SEBASTIÁN'],
      ['NIT', '800197268', 'FINDETER S.A.'],
      ['NIT', '899999063', 'INSTITUTO DE DESARROLLO URBANO — IDU'],
      ['CC', '41672901', 'CASTAÑO LÓPEZ, MARÍA FERNANDA'],
    ];
    const ciudades = ['Bogotá D.C.', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga'];
    return base.map(([tipoDoc, doc, razon], i) => ({
      'Tipo doc.': tipoDoc,
      'Documento': doc,
      'DV': String((i * 7 + 3) % 10),
      'Razón social': razon,
      'Ciudad': ciudades[i % ciudades.length],
      'Dirección': `Calle ${10 + i} # ${20 + i}-${30 + i}`,
      'Teléfono': `60(1) ${3000000 + i * 7531}`,
      'Estado': i % 6 === 0 ? 'Inactivo' : 'Activo',
    }));
  }

  /**
   * Caso con un campo de longitud grande (Descripción, field_len 180) junto a
   * campos cortos, para validar el truncado con "…" + tooltip.
   */
  private generarPlanCuentasProtocolo(): ProtocoloRegistro[] {
    return [
      { 'Código': '1.1.05.01', 'Nombre': 'CAJA PRINCIPAL', 'Naturaleza': 'Débito', 'Nivel': '4',
        'Descripción': 'Representa el efectivo en moneda nacional y extranjera disponible en la caja principal de la entidad para cubrir pagos menores y operaciones inmediatas de tesorería.' },
      { 'Código': '1.1.10.06', 'Nombre': 'CUENTA CORRIENTE BANCARIA', 'Naturaleza': 'Débito', 'Nivel': '4',
        'Descripción': 'Comprende los depósitos constituidos por la entidad en cuentas corrientes de establecimientos bancarios y demás entidades financieras vigiladas por la Superintendencia Financiera de Colombia.' },
      { 'Código': '1.4.07.01', 'Nombre': 'PRESTACIÓN DE SERVICIOS', 'Naturaleza': 'Débito', 'Nivel': '4',
        'Descripción': 'Valor de los derechos a favor de la entidad originados en la prestación de servicios, pendientes de recaudo al cierre del período contable que se reporta.' },
      { 'Código': '2.4.01.01', 'Nombre': 'BIENES Y SERVICIOS', 'Naturaleza': 'Crédito', 'Nivel': '4',
        'Descripción': 'Obligaciones contraídas por la entidad por concepto de adquisición de bienes y servicios pendientes de pago a proveedores y contratistas al corte del período.' },
      { 'Código': '3.1.10.01', 'Nombre': 'RESULTADO DEL EJERCICIO', 'Naturaleza': 'Crédito', 'Nivel': '4',
        'Descripción': 'Corresponde al valor del excedente o déficit obtenido por la entidad como resultado de la diferencia entre los ingresos y los gastos del período contable.' },
      { 'Código': '5.1.01.01', 'Nombre': 'SUELDOS Y SALARIOS', 'Naturaleza': 'Débito', 'Nivel': '4',
        'Descripción': 'Gastos asociados a la remuneración del personal vinculado mediante relación laboral, incluyendo asignación básica y demás factores salariales reconocidos.' },
    ];
  }

  private generarEntidadesReciprocasProtocolo(): ProtocoloRegistro[] {
    const base: Array<{ codigo: string; nombre: string }> = [
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
    // Enriquecemos cada entidad con los 6 campos de la lista (NIT, Tipo,
    // Departamento, Estado) derivados de forma determinística sobre el set base.
    const deptos = [
      'Bogotá D.C.', 'Antioquia', 'Atlántico', 'Bolívar', 'Boyacá', 'Caldas',
      'Cundinamarca', 'Santander', 'Valle del Cauca', 'Nariño', 'Tolima',
    ];
    return base.map(({ codigo, nombre }, i) => {
      const territorial = nombre.startsWith('GOBERNACIÓN') || nombre.startsWith('ALCALDÍA');
      return {
        'Código': codigo,
        'NIT': `${codigo.slice(0, 9)}-${(i % 9) + 1}`,
        'Razón social': nombre,
        'Tipo': territorial ? 'Territorial' : 'Nacional',
        'Departamento': deptos[i % deptos.length],
        'Estado': i % 7 === 0 ? 'Inactiva' : 'Activa',
      };
    });
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
