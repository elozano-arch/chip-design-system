import { Component, ViewChild, OnDestroy, signal, computed } from '@angular/core';
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
import { CheckboxModule } from 'primeng/checkbox';
import { MenuModule } from 'primeng/menu';
import { ChipModule } from 'primeng/chip';
import { StepperModule } from 'primeng/stepper';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule } from 'primeng/paginator';
import { TextareaModule } from 'primeng/textarea';
import { MessageService, MenuItem } from 'primeng/api';

import { SesionService } from '../../../services/sesion.service';

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
  /** Etapa del proceso en que está el formulario — `tab_etapa_proceso`. */
  etapa: EtapaId;
  /**
   * Estado dentro de esa etapa — `tab_estado`, válido según `ESTADOS_POR_ETAPA`.
   * `null` = el formulario todavía no tiene registro (no se ha importado). No es
   * un estado del catálogo: la UI lo presenta como "Sin registro".
   */
  estado: EstadoId | null;
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

/** Severity admitida por los `p-tag` del panel de estado. */
type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

/* ═══════════════════════════════════════════════════════════════════════
   Etapa y estado del proceso — espejo del modelo de datos del backend.
   Tres tablas replicadas aquí como catálogo del demo:
     • tab_etapa_proceso  → id_etapa_proceso 1..4 (fase del flujo)
     • tab_estado         → id_estado (char) + nombre + descripción
     • cruce etapa↔estado → qué estados son válidos en cada etapa
   El listado de formularios muestra el par: la etapa dice en qué fase del
   flujo va el formulario y el estado qué pasó dentro de esa fase.
   ═══════════════════════════════════════════════════════════════════════ */

/** `tab_etapa_proceso.id_etapa_proceso`. */
type EtapaId = 1 | 2 | 3 | 4;

/** `tab_estado.id_estado`. */
type EstadoId = 'V' | 'M' | 'D' | 'A' | 'E' | 'G' | 'W' | 'S' | 'N';

interface EtapaProceso {
  id: EtapaId;
  /** `tab_etapa_proceso.nombre`, tal cual está en BD. */
  nombre: string;
  /** Etiqueta legible para la UI (la de BD viene en snake_case). */
  label: string;
  icon: string;
}

interface EstadoProceso {
  id: EstadoId;
  /** `tab_estado.nombre`, tal cual está en BD. */
  nombre: string;
  /** `tab_estado.descripcion`, tal cual está en BD. */
  descripcion: string;
  /** Etiqueta legible para el `p-tag` (la de BD viene en mayúsculas). */
  label: string;
  severity: TagSeverity;
}

const ETAPAS_PROCESO: readonly EtapaProceso[] = [
  { id: 1, nombre: 'Importacion',        label: 'Importación',        icon: 'pi pi-file-import' },
  { id: 2, nombre: 'Validacion_Local',   label: 'Validación local',   icon: 'pi pi-check-square' },
  { id: 3, nombre: 'Validacion_Central', label: 'Validación central', icon: 'pi pi-building' },
  { id: 4, nombre: 'Envio',              label: 'Envío',              icon: 'pi pi-send' },
];

const ESTADOS_PROCESO: readonly EstadoProceso[] = [
  { id: 'V', nombre: 'VALIDACION',          descripcion: 'PROCESO EN VALIDACION',           label: 'En validación',       severity: 'info' },
  { id: 'M', nombre: 'REQUIERE_COMENTARIO', descripcion: 'DEFICIENCIA REQUIERE COMENTARIO', label: 'Requiere comentario', severity: 'warn' },
  { id: 'D', nombre: 'DEFICIENCIA',         descripcion: 'ERROR DE DEFICIENCIA',            label: 'Deficiencia',         severity: 'danger' },
  { id: 'A', nombre: 'ACEPTADO',            descripcion: 'ACEPTADO',                        label: 'Aceptado',            severity: 'success' },
  { id: 'E', nombre: 'ERROR_TECNICO',       descripcion: 'ERROR TECNICO',                   label: 'Error técnico',       severity: 'danger' },
  { id: 'G', nombre: 'CARGA_ARCHIVO',       descripcion: 'CARGANDO ARCHIVO',                label: 'Importando',          severity: 'info' },
  { id: 'W', nombre: 'EN ESPERA',           descripcion: 'PROCESO EN ESPERA',               label: 'En espera',           severity: 'warn' },
  { id: 'S', nombre: 'ENVIADO',             descripcion: 'PROCESO ENVIADO A CENTRAL',       label: 'Enviado',             severity: 'info' },
  { id: 'N', nombre: 'REIMPORTANDO',        descripcion: 'REIMPORTACION DE INFORMACION',    label: 'Reimportando',        severity: 'warn' },
];

/**
 * "Sin registro" NO es un estado del catálogo: es una presentación. Se muestra
 * cuando el formulario no tiene registro en el detalle, para comunicar que está
 * en la etapa 1 (Importación) sin haberse importado todavía. Por eso se pinta
 * como texto neutro y no como `p-tag` — un tag lo haría parecer un estado más.
 *
 * IMPORTANTE — un formulario sin registro SÍ se puede seleccionar y validar:
 * cuando la categoría no exige archivo, pasa a validado y la entidad lo
 * presenta vacío. No bloquear su checkbox ni el botón "Validar formulario".
 */
const SIN_REGISTRO_LABEL = 'Sin registro';
const SIN_REGISTRO_AYUDA =
  'El formulario aún no se ha importado. Si la categoría no exige archivo, '
  + 'puede validarse y presentarse vacío.';

/**
 * Estados válidos en cada etapa — cruce etapa↔estado del modelo. Ningún
 * formulario puede quedar en un par (etapa, estado) fuera de esta matriz.
 */
const ESTADOS_POR_ETAPA: Readonly<Record<EtapaId, readonly EstadoId[]>> = {
  1: ['A', 'D', 'E', 'G', 'N', 'V', 'W'],
  2: ['A', 'D', 'M', 'N', 'V', 'W'],
  3: ['A', 'D', 'M', 'N', 'V', 'W'],
  4: ['E', 'S', 'W'],
};

/**
 * Resultado de la validación central de la categoría (simulación demo).
 *   ninguna    → aún no enviado / sin respuesta
 *   enProceso  → enviado, en validación central
 *   aceptado   → aceptado por la CGN
 *   rechazado  → rechazado por deficiencia
 */
type RespuestaCentral = 'ninguna' | 'enProceso' | 'aceptado' | 'rechazado';

/**
 * Naturaleza del error con el que cierra un proceso de importación. Cada tipo
 * tiene su propia familia de códigos de mensaje, y un mismo proceso no mezcla
 * las dos: o el archivo está mal formado (estructura) o le falta información
 * exigida por la categoría (completitud).
 *   • estructura  → `EST-###`  (longitud, tipo de dato, concepto inexistente…)
 *   • completitud → `COMP-###` (concepto obligatorio ausente, periodo incompleto…)
 */
type TipoDeficiencia = 'estructura' | 'completitud';

const TIPOS_DEFICIENCIA: Readonly<
  Record<TipoDeficiencia, { label: string; severity: TagSeverity }>
> = {
  estructura: { label: 'Estructura', severity: 'danger' },
  completitud: { label: 'Completitud', severity: 'warn' },
};

/**
 * Deficiencia listada en el control de envío. Cada una se produce dentro de una
 * etapa del proceso y cuelga de un registro del detalle del proceso:
 *   • `etapa`            → en qué etapa se generó (`tab_etapa_proceso`)
 *   • `idDetalleProceso` → registro del detalle del proceso al que pertenece
 *   • `id`               → consecutivo DENTRO de esa etapa, no global: dos
 *                          etapas distintas pueden tener ambas un id 1
 *   • `tipo`             → sólo en las deficiencias de importación: qué familia
 *                          de códigos las produjo. Las de validación local y
 *                          central no lo llevan.
 * `permisible` indica que la categoría se puede enviar aun con la deficiencia
 * presente; `requiereComentario` obliga a justificarla y es lo único que
 * habilita la caja de comentario de esa fila.
 */
interface DeficienciaEnvio {
  etapa: EtapaId;
  idDetalleProceso: number;
  id: number;
  tipo?: TipoDeficiencia;
  codMensaje: string;
  mensaje: string;
  permisible: boolean;
  requiereComentario: boolean;
  /** Texto en edición. */
  comentario: string;
  /** Último texto guardado; comparado con `comentario` revela cambios sin guardar. */
  comentarioGuardado: string;
  /** Mensaje de validación bajo la caja (vacío = sin error). */
  comentarioError: string;
}

/** Deficiencia tal como llega del proceso, antes de abrirle caja de comentario. */
type PlantillaDeficiencia = Omit<
  DeficienciaEnvio, 'comentario' | 'comentarioGuardado' | 'comentarioError'
>;


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
    CheckboxModule,
    MenuModule,
    ChipModule,
    StepperModule,
    TabsModule,
    DialogModule,
    PaginatorModule,
    TextareaModule,
    AppBreadcrumbComponent,
    DirectorioEntidadesComponent,
  ],
  providers: [MessageService],
  templateUrl: './formularios.component.html',
  styleUrl: './formularios.component.scss',
})
export class FormulariosComponent implements OnDestroy {
  @ViewChild('menuFormulario') menuFormulario: any;
  selectedFormularioForMenu: Formulario | null = null;

  constructor(
    private messageService: MessageService,
    private sesion: SesionService,
  ) {
    this.setupColumnasResponsivas();
  }

  /** Correo del usuario en sesión — es a donde llega el resultado de la importación. */
  get correoUsuario(): string {
    return this.sesion.usuario()?.correo ?? 'su correo registrado';
  }

  // ── Responsive: columnas visibles de la matriz de registro manual ──
  // En tablet/phone caben menos periodos; el paginador de columnas se ajusta
  // al viewport (4 desktop · 3 ≤992 · 2 ≤768) con matchMedia nativo (sin CDK).
  private mqlTablet?: MediaQueryList;
  private mqlPhone?: MediaQueryList;
  private readonly onViewportChange = () => this.ajustarColumnasPorViewport();

  private setupColumnasResponsivas(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    this.mqlTablet = window.matchMedia('(max-width: 992px)');
    this.mqlPhone = window.matchMedia('(max-width: 768px)');
    this.mqlTablet.addEventListener('change', this.onViewportChange);
    this.mqlPhone.addEventListener('change', this.onViewportChange);
    this.ajustarColumnasPorViewport();
  }

  private ajustarColumnasPorViewport(): void {
    this.columnasPorPagina = this.mqlPhone?.matches ? 2 : this.mqlTablet?.matches ? 3 : 4;
    const maxPagina = Math.max(0, this.totalPaginasColumnas - 1);
    if (this.paginaColumnas > maxPagina) this.paginaColumnas = maxPagina;
  }

  ngOnDestroy(): void {
    this.mqlTablet?.removeEventListener('change', this.onViewportChange);
    this.mqlPhone?.removeEventListener('change', this.onViewportChange);
    this.cancelarAvanceProceso();
  }

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
    this.controlEnvioAbierto = false;
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
   * "cierre" del trabajo en este formulario, lo pasamos a Validación local,
   * regresamos al listado (o al paso 2 en wizard) y mostramos toast para
   * que el usuario vea el estado actualizado y pueda elegir el siguiente.
   */
  validarFormularioActual() {
    if (!this.detalleAbierto) return;
    const id = this.detalleAbierto.id;
    const nombre = this.detalleAbierto.nombre;
    this._formulariosBase = this._formulariosBase.map(f =>
      f.id === id ? { ...f, etapa: 2 as EtapaId, estado: 'A' as EstadoId } : f,
    );
    // Al re-validar tras un rechazo, el resultado del envío anterior deja de aplicar.
    this.categoriaEnviada = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Formulario validado',
      detail: `"${nombre}" pasó a Validación local · Aceptado. Continúe con los demás formularios o envíe la categoría.`,
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
  // Resultado del último envío a validación central (simulación de demostración).
  // En producción este estado llega del backend tras "Enviar Categoría"; aquí se
  // elige desde "Control de envío" con un switch demo qué responderá la validación
  // central. Al pulsar "Enviar Categoría" se APLICA ese resultado:
  //   • rechazado → marca un formulario como "Rechazado por Deficiencia" (su motivo
  //                 se consulta en el listado, Sección 2 → "Ver motivo") y la
  //                 Sección 3 muestra el envío rechazado.
  //   • aceptado  → todos los formularios pasan a "Enviado" (aceptado por la CGN).
  //   • enProceso → todos "Enviado", en validación central.
  // El resultado en el banner solo aparece TRAS enviar (ver `resultadoEnvio`).
  // ──────────────────────────────────────────────────────────────────────
  respuestaCentral: RespuestaCentral = 'rechazado';

  /** True una vez que se pulsó "Enviar Categoría" (para mostrar el resultado). */
  categoriaEnviada = false;

  readonly respuestaCentralOptions = [
    { label: 'En proceso', value: 'enProceso' },
    { label: 'Aceptado', value: 'aceptado' },
    { label: 'Rechazado por deficiencia', value: 'rechazado' },
  ];

  /**
   * Resultado del envío a mostrar en el banner. Solo tras "Enviar Categoría"
   * (`categoriaEnviada`); antes de enviar devuelve null (banner de preparación).
   */
  get resultadoEnvio(): { clase: string; icon: string; titulo: string; detalle: string } | null {
    return this.categoriaEnviada ? this.respuestaCentralInfo : null;
  }

  /**
   * Presentación del resultado de validación central para el banner del Paso 3.
   */
  get respuestaCentralInfo(): { clase: string; icon: string; titulo: string; detalle: string } | null {
    switch (this.respuestaCentral) {
      case 'enProceso':
        return {
          clase: 'form-send-bar--proceso', icon: 'pi-hourglass',
          titulo: 'Envío en proceso de validación central',
          detalle: 'El resultado llegará en Consultar envíos.',
        };
      case 'aceptado':
        return {
          clase: 'form-send-bar--aceptado', icon: 'pi-check-circle',
          titulo: 'Categoría aceptada por validación central',
          detalle: 'No se requieren correcciones.',
        };
      case 'rechazado':
        return {
          clase: 'form-send-bar--rechazado', icon: 'pi-times-circle',
          titulo: 'Envío rechazado por deficiencia',
          detalle: 'Revise los formularios rechazados en el listado y corrija el motivo.',
        };
      default:
        return null;
    }
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
    this.controlEnvioAbierto = false;
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
    {
      label: 'Ver control de envío',
      icon: 'pi pi-send',
      command: () => this.verControlEnvio(this.selectedFormularioForMenu),
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

  /**
   * Control de envío como PANTALLA dedicada (no toggle lateral): se abre desde
   * la acción ⋮ de una fila y reemplaza el listado, igual que las sub-vistas de
   * Registro manual / Protocolo. Se vuelve con "Volver al listado".
   */
  controlEnvioAbierto = false;

  /**
   * Formulario cuyas deficiencias se están viendo. Las dos entradas al control
   * de envío llevan aquí: la acción ⋮ de la fila y el tag "Deficiencia" de la
   * columna Estado. Su nombre encabeza el contexto de la pantalla.
   */
  controlEnvioFormulario: Formulario | null = null;

  /**
   * Abre el control de envío. El alcance depende de por dónde se entre: desde
   * el tag "Deficiencia" del listado interesa el último proceso; desde la
   * acción ⋮, el histórico completo del formulario.
   */
  verControlEnvio(
    form: Formulario | null = null,
    alcance: 'ultimo' | 'historico' = 'historico',
  ): void {
    if (!this.filtersApplied) return;
    this.controlEnvioFormulario = form ?? this.selectedFormularioForMenu;
    this.alcanceDeficiencias = alcance;
    this.refrescarDeficienciasVisibles();
    this.cerrarDetalle();
    this.cerrarProtocolo();
    this.controlEnvioAbierto = true;
    queueMicrotask(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  cerrarControlEnvio(): void {
    this.controlEnvioAbierto = false;
    this.controlEnvioFormulario = null;
    this.deficienciasVisibles = [];
  }

  /**
   * Deficiencias del ÚLTIMO proceso de importación, por tipo de error. Un
   * proceso cierra con una sola familia de códigos —o el archivo está mal
   * formado (estructura) o le falta información exigida por la categoría
   * (completitud)—, y cada familia cuelga de su propio detalle de proceso.
   * En producción esto llega del backend por formulario.
   */
  private readonly deficienciasUltimoProceso: Readonly<
    Record<TipoDeficiencia, readonly PlantillaDeficiencia[]>
  > = {
    // Etapa 1 · Importación — detalle de proceso 4831. Errores de ESTRUCTURA:
    // el archivo no cumple el protocolo de importación.
    estructura: [
      { etapa: 1, idDetalleProceso: 4831, id: 1, tipo: 'estructura', codMensaje: 'EST-004', mensaje: 'Longitud de registro distinta a la declarada en el protocolo de importación.', permisible: false, requiereComentario: false },
      { etapa: 1, idDetalleProceso: 4831, id: 2, tipo: 'estructura', codMensaje: 'EST-011', mensaje: 'Campo numérico con caracteres no válidos.', permisible: false, requiereComentario: false },
      { etapa: 1, idDetalleProceso: 4831, id: 3, tipo: 'estructura', codMensaje: 'EST-019', mensaje: 'Código de concepto inexistente en la lista de la categoría.', permisible: false, requiereComentario: false },
      { etapa: 1, idDetalleProceso: 4831, id: 4, tipo: 'estructura', codMensaje: 'EST-023', mensaje: 'Registro duplicado para el mismo concepto y tercero.', permisible: true, requiereComentario: true },
    ],
    // Etapa 1 · Importación — detalle de proceso 4832. Errores de COMPLETITUD:
    // el archivo está bien formado, pero no trae todo lo que la categoría exige.
    completitud: [
      { etapa: 1, idDetalleProceso: 4832, id: 1, tipo: 'completitud', codMensaje: 'COMP-002', mensaje: 'Concepto obligatorio de la categoría sin registro en el archivo.', permisible: false, requiereComentario: false },
      { etapa: 1, idDetalleProceso: 4832, id: 2, tipo: 'completitud', codMensaje: 'COMP-014', mensaje: 'El archivo no incluye todos los periodos exigidos por la categoría.', permisible: false, requiereComentario: false },
      { etapa: 1, idDetalleProceso: 4832, id: 3, tipo: 'completitud', codMensaje: 'COMP-021', mensaje: 'Registro sin el tercero obligatorio para el concepto reportado.', permisible: false, requiereComentario: false },
      { etapa: 1, idDetalleProceso: 4832, id: 4, tipo: 'completitud', codMensaje: 'COMP-036', mensaje: 'Concepto informado sin la nota explicativa que exige la categoría.', permisible: true, requiereComentario: true },
    ],
  };

  /**
   * Procesos ANTERIORES del formulario (histórico). Son las deficiencias de
   * validación local y central: no llevan tipo, porque el tipo describe cómo
   * cerró una importación, no una validación.
   */
  private readonly historialDeficiencias: readonly PlantillaDeficiencia[] = [
    // Etapa 2 · Validación local — detalle de proceso 4822. El consecutivo
    // vuelve a empezar en 1: es por etapa, no global.
    { etapa: 2, idDetalleProceso: 4822, id: 1, codMensaje: 'VAL-001', mensaje: 'El total de débitos no coincide con el total de créditos del formulario.', permisible: false, requiereComentario: false },
    { etapa: 2, idDetalleProceso: 4822, id: 2, codMensaje: 'VAL-032', mensaje: 'Concepto obligatorio sin valor diligenciado.', permisible: false, requiereComentario: false },
    { etapa: 2, idDetalleProceso: 4822, id: 3, codMensaje: 'VAL-045', mensaje: 'Saldo negativo en una cuenta que no admite naturaleza contraria.', permisible: true, requiereComentario: false },
    { etapa: 2, idDetalleProceso: 4822, id: 4, codMensaje: 'VAL-051', mensaje: 'El saldo inicial no coincide con el saldo final del periodo anterior.', permisible: false, requiereComentario: false },

    // Etapa 3 · Validación central — detalle de proceso 4823.
    { etapa: 3, idDetalleProceso: 4823, id: 1, codMensaje: 'CEN-014', mensaje: 'Variación superior al 50% frente al periodo anterior.', permisible: true, requiereComentario: true },
    { etapa: 3, idDetalleProceso: 4823, id: 2, codMensaje: 'CEN-027', mensaje: 'Operación recíproca sin contraparte reportada por la entidad par.', permisible: true, requiereComentario: true },
    { etapa: 3, idDetalleProceso: 4823, id: 3, codMensaje: 'CEN-063', mensaje: 'Valor reportado en cero en un concepto con movimiento en el periodo anterior.', permisible: true, requiereComentario: true },
    { etapa: 3, idDetalleProceso: 4823, id: 4, codMensaje: 'CEN-078', mensaje: 'Tercero reportado sin identificación válida.', permisible: true, requiereComentario: true },
    { etapa: 3, idDetalleProceso: 4823, id: 5, codMensaje: 'CEN-084', mensaje: 'Cuenta reportada que no aplica para la naturaleza jurídica de la entidad.', permisible: true, requiereComentario: true },
    { etapa: 3, idDetalleProceso: 4823, id: 6, codMensaje: 'CEN-092', mensaje: 'Depreciación acumulada mayor al valor bruto del activo.', permisible: false, requiereComentario: false },
    { etapa: 3, idDetalleProceso: 4823, id: 7, codMensaje: 'CEN-105', mensaje: 'Concepto informado sin nota explicativa asociada.', permisible: true, requiereComentario: true },
  ];

  /**
   * Deficiencias por formulario (id → filas). Se crean la primera vez que se
   * abre el control de envío de ese formulario y se conservan, de modo que el
   * getter devuelve SIEMPRE el mismo array: si recreara la lista en cada ciclo
   * de detección de cambios, la tabla y los comentarios se reiniciarían solos.
   */
  private readonly deficienciasPorFormulario = new Map<number, DeficienciaEnvio[]>();

  /**
   * Tipo de error con el que cerró el último proceso de importación de cada
   * formulario. Lo asigna el resultado de la importación; sin entrada aquí, el
   * formulario no tiene deficiencias de importación.
   */
  private readonly tipoDeficienciaPorFormulario = new Map<number, TipoDeficiencia>();

  /** Deficiencias del formulario abierto en el control de envío. */
  get deficienciasEnvio(): DeficienciaEnvio[] {
    const form = this.controlEnvioFormulario;
    if (!form) return [];
    const existentes = this.deficienciasPorFormulario.get(form.id);
    if (existentes) return existentes;
    const filas = this.construirDeficiencias(form).map(d => ({
      ...d, comentario: '', comentarioGuardado: '', comentarioError: '',
    }));
    this.deficienciasPorFormulario.set(form.id, filas);
    return filas;
  }

  /**
   * Arma el expediente de un formulario: primero el último proceso (la
   * importación que acaba de cerrar, con su familia de códigos) y detrás los
   * procesos anteriores. Un formulario sin deficiencias devuelve lista vacía —
   * no todos los formularios de la categoría tienen por qué tener errores.
   */
  private construirDeficiencias(form: Formulario): readonly PlantillaDeficiencia[] {
    const tipo = this.tipoDeficienciaPorFormulario.get(form.id);
    if (tipo) return [...this.deficienciasUltimoProceso[tipo], ...this.historialDeficiencias];
    // Rechazado por la validación central (sin importación fallida detrás):
    // sólo tiene el expediente de validaciones.
    if (form.estado === 'D') return this.historialDeficiencias;
    return [];
  }

  // ── Alcance de la tabla de deficiencias ───────────────────────────────────
  // El mismo control de envío se abre desde dos sitios y no muestran lo mismo:
  //   • tag "Deficiencia" del listado → las del ÚLTIMO proceso, que es lo que
  //     el usuario acaba de ver fallar;
  //   • acción ⋮ "Ver control de envío" → el histórico completo del formulario.
  // El selector deja pasar de una vista a la otra sin salir de la pantalla.

  /** Alcance activo de la tabla de deficiencias. */
  alcanceDeficiencias: 'ultimo' | 'historico' = 'historico';

  /** Filas que ve la tabla — recalculadas al abrir o al cambiar de alcance. */
  deficienciasVisibles: DeficienciaEnvio[] = [];

  /** Id del detalle de proceso más reciente del formulario abierto (0 = ninguno). */
  get ultimoProcesoId(): number {
    return this.deficienciasEnvio.reduce((max, d) => Math.max(max, d.idDetalleProceso), 0);
  }

  /** Tipo de error del último proceso del formulario abierto, si lo tuvo. */
  get tipoUltimoProceso(): TipoDeficiencia | null {
    const form = this.controlEnvioFormulario;
    return (form && this.tipoDeficienciaPorFormulario.get(form.id)) || null;
  }

  /** Presentación (label + severity) de un tipo de deficiencia. */
  tipoDeficienciaDe(tipo: TipoDeficiencia): { label: string; severity: TagSeverity } {
    return TIPOS_DEFICIENCIA[tipo];
  }

  cambiarAlcanceDeficiencias(alcance: 'ultimo' | 'historico'): void {
    this.alcanceDeficiencias = alcance;
    this.refrescarDeficienciasVisibles();
  }

  /** Aplica el alcance activo sobre el expediente del formulario abierto. */
  private refrescarDeficienciasVisibles(): void {
    const todas = this.deficienciasEnvio;
    this.deficienciasVisibles =
      this.alcanceDeficiencias === 'ultimo'
        ? todas.filter(d => d.idDetalleProceso === this.ultimoProcesoId)
        : todas;
  }

  /** Resumen del alcance activo, para el encabezado de la tabla. */
  get resumenDeficiencias(): string {
    const total = this.deficienciasVisibles.length;
    const plural = total === 1 ? 'deficiencia' : 'deficiencias';
    if (this.alcanceDeficiencias === 'ultimo') {
      const tipo = this.tipoUltimoProceso;
      const detalle = tipo ? ` de ${TIPOS_DEFICIENCIA[tipo].label.toLowerCase()}` : '';
      return `Proceso ${this.ultimoProcesoId} · ${total} ${plural}${detalle}`;
    }
    const procesos = new Set(this.deficienciasEnvio.map(d => d.idDetalleProceso)).size;
    return `${procesos} proceso(s) · ${total} ${plural}`;
  }

  /** Longitud mínima exigida al comentario de una deficiencia. */
  readonly COMENTARIO_MIN = 30;

  /** True si el texto en edición difiere de lo último guardado. */
  comentarioPendiente(d: DeficienciaEnvio): boolean {
    return d.comentario.trim() !== d.comentarioGuardado;
  }

  /** Limpia el error mientras el usuario corrige, para no regañarlo al escribir. */
  onComentarioInput(d: DeficienciaEnvio): void {
    d.comentarioError = '';
  }

  /**
   * Guarda el comentario de una deficiencia. Exige `COMENTARIO_MIN` caracteres:
   * la justificación viaja a la CGN, y un "ok" de tres letras no justifica nada.
   */
  guardarComentario(d: DeficienciaEnvio): void {
    const texto = d.comentario.trim();
    if (texto.length < this.COMENTARIO_MIN) {
      d.comentarioError =
        `Escriba al menos ${this.COMENTARIO_MIN} caracteres: lleva ${texto.length}.`;
      this.messageService.add({
        severity: 'warn',
        summary: 'Comentario demasiado corto',
        detail: `${d.codMensaje}: la justificación debe tener mínimo ${this.COMENTARIO_MIN} caracteres.`,
        life: 4500,
      });
      return;
    }
    d.comentario = texto;
    d.comentarioGuardado = texto;
    d.comentarioError = '';
    this.messageService.add({
      severity: 'success',
      summary: 'Comentario guardado',
      detail: `Se guardó la justificación del mensaje ${d.codMensaje}.`,
      life: 3500,
    });
  }

  // ── Rechazo por deficiencia ───────────────────────────────────────────────
  // Desde la columna Estado, las filas con estado Deficiencia (D) abren el
  // control de envío de ESE formulario, que es donde vive el detalle de las
  // deficiencias (mismo destino que la acción ⋮ "Ver control de envío").

  /** True si el formulario fue rechazado por deficiencia (hace clicable el tag). */
  esRechazado(form: Formulario): boolean {
    return form.estado === 'D';
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
    this.cerrarControlEnvio();
    this.showImportDialog = false;
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
  //    formularios del listado están validados localmente (etapa 2 / estado A).
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

  // ── Importar (acción transversal de los 3 pasos) ──
  //
  // La importación sólo admite TXT (plano, según el protocolo de importación) y
  // es asíncrona: al confirmar, el archivo entra a la cola de proceso y el
  // resultado se notifica por correo. El diálogo recorre hasta tres momentos:
  //   1. 'seleccion'    → se elige el archivo y se valida la extensión
  //   2. 'confirmacion' → SÓLO si el contexto ya tiene información importada:
  //                       avisa qué formularios se reemplazan y pide confirmar
  //   3. 'iniciado'     → alerta de proceso (o reproceso) iniciado + correo
  /** Única extensión admitida por la importación. */
  private readonly EXTENSION_IMPORT = '.txt';

  importFileName = '';
  /** Mensaje de rechazo del archivo elegido (extensión no admitida). */
  importFileError = '';
  /** Momento del diálogo de importación. */
  importPaso: 'seleccion' | 'confirmacion' | 'iniciado' = 'seleccion';
  /** True cuando lo iniciado reemplaza información ya importada. */
  esReimportacion = false;

  /** Diálogo de importación, accesible desde el botón transversal. */
  showImportDialog = false;

  /** Abre el diálogo de importación (gateado por el contexto del Paso 1). */
  abrirImportDialog() {
    if (!this.filtersApplied) return;
    this.resetImportDialog();
    this.showImportDialog = true;
  }

  cerrarImportDialog() {
    this.showImportDialog = false;
    this.resetImportDialog();
  }

  private resetImportDialog() {
    this.importFileName = '';
    this.importFileError = '';
    this.importPaso = 'seleccion';
    this.esReimportacion = false;
  }

  /**
   * Escenario de importación (SÓLO demostración). En producción esto no existe:
   * que haya o no información previa lo decide el estado del contexto. Como el
   * demo arranca con formularios ya importados, sin este switch nunca se vería
   * el mensaje de importación limpia.
   *   'auto'   → según los datos (lo que hará el sistema real)
   *   'limpio' → fuerza "sin información previa": importación de primera vez
   */
  escenarioImport: 'auto' | 'limpio' = 'auto';
  readonly escenarioImportOptions = [
    { label: 'Con información previa · reimportación', value: 'auto' },
    { label: 'Sin información previa · importación limpia', value: 'limpio' },
  ];

  /**
   * Formularios del contexto que ya tienen información y, por tanto, serían
   * reemplazados por el archivo. Si hay al menos uno, la importación es una
   * reimportación y el diálogo exige confirmación antes de arrancar.
   */
  get formulariosAReimportar(): Formulario[] {
    if (this.escenarioImport === 'limpio') return [];
    return this.filteredFormularios.filter(f => f.estado !== null);
  }

  /**
   * Validación de la extensión en el momento de elegir el archivo: si no es
   * .txt no se acepta, se explica por qué y se limpia el input para que el
   * usuario pueda volver a elegir (incluso el mismo archivo).
   */
  seleccionarArchivoImport(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    this.importFileName = '';
    this.importFileError = '';
    if (!archivo) return;

    if (!archivo.name.toLowerCase().endsWith(this.EXTENSION_IMPORT)) {
      this.importFileError =
        `"${archivo.name}" no es un archivo .txt. La importación sólo admite archivos de texto plano (.txt).`;
      input.value = '';
      this.messageService.add({
        severity: 'error',
        summary: 'Archivo no admitido',
        detail: 'Seleccione un archivo con extensión .txt.',
        life: 5000,
      });
      return;
    }
    this.importFileName = archivo.name;
  }

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
   * formularios del listado están validados localmente. Reflejo del
   * flujo descrito por CRIS: validación local → envío central.
   */
  get todosValidados(): boolean {
    const lista = this.filteredFormularios;
    return lista.length > 0 && lista.every(f => this.esValidadoLocal(f));
  }

  /** Validado localmente: etapa Validación local (2) + estado Aceptado (A). */
  private esValidadoLocal(form: Formulario): boolean {
    return form.etapa === 2 && form.estado === 'A';
  }

  /** Enviado a validación central: etapa Envío (4) + estado Enviado (S). */
  private esEnviado(form: Formulario): boolean {
    return form.etapa === 4 && form.estado === 'S';
  }

  /** Etiqueta legible del periodo seleccionado (para el contexto de la pantalla). */
  get periodoLabel(): string {
    return this.periodoOptions.find(o => o.value === this.selectedPeriodo)?.label ?? '';
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
        detail: 'Todos los formularios deben estar en Validación local · Aceptado antes de enviar la categoría.',
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

  /** Envío efectivo de la categoría — aplica el resultado simulado (switch demo). */
  private procederEnvioCategoria() {
    this.categoriaEnviada = true;

    if (this.respuestaCentral === 'rechazado') {
      // Rechazo por deficiencia: UN formulario vuelve con etapa Validación
      // central (3) y estado Deficiencia (D); los demás quedan como estaban,
      // para poder reenviar tras corregirlo. El motivo se consulta en ese
      // formulario desde el listado (Sección 2 → "Ver motivo").
      let marcado = false;
      this._formulariosBase = this._formulariosBase.map(f => {
        if (!marcado) {
          marcado = true;
          return { ...f, etapa: 3 as EtapaId, estado: 'D' as EstadoId };
        }
        return f;
      });
      this.messageService.add({
        severity: 'error',
        summary: 'Envío rechazado por deficiencia',
        detail: 'Revise los formularios rechazados en el listado y corrija el motivo.',
        life: 6000,
      });
      return;
    }

    // Aceptado / En proceso: todos pasan a etapa Envío (4) / estado Enviado (S).
    this._formulariosBase = this._formulariosBase.map(f => ({
      ...f, etapa: 4 as EtapaId, estado: 'S' as EstadoId,
    }));
    this.messageService.add({
      severity: this.respuestaCentral === 'aceptado' ? 'success' : 'info',
      summary: this.respuestaCentral === 'aceptado' ? 'Categoría aceptada' : 'Categoría enviada',
      detail: this.respuestaCentral === 'aceptado'
        ? 'La validación central aceptó la categoría. No se requieren correcciones.'
        : 'La categoría fue enviada y está en validación central. Recibirá el resultado en Consultar envíos.',
      life: 5000,
    });
  }

  closePanel() {
    this.activePanel = null;
  }

  /**
   * Botón "Importar". Si el contexto ya tiene información importada, no arranca
   * nada todavía: primero pasa por el aviso de reemplazo. Si no hay nada que
   * reemplazar, arranca directo.
   */
  confirmImport() {
    if (!this.importFileName || this.importPaso === 'iniciado') return;
    if (this.importPaso === 'seleccion' && this.formulariosAReimportar.length > 0) {
      this.importPaso = 'confirmacion';
      return;
    }
    this.iniciarProcesoImportacion();
  }

  /** Vuelve del aviso de reemplazo a la selección de archivo, sin arrancar nada. */
  cancelarReimportacion() {
    this.importPaso = 'seleccion';
  }

  /**
   * Arranca el proceso. No se cierra el diálogo — se reemplaza su cuerpo por la
   * alerta, porque el usuario tiene que enterarse de que el proceso ya arrancó
   * y de que el resultado NO llega a esta pantalla sino a su correo.
   */
  private iniciarProcesoImportacion() {
    // Se calcula ANTES de tocar los estados: después, todos tienen registro.
    this.esReimportacion = this.formulariosAReimportar.length > 0;

    // Todo el contexto vuelve a la etapa Importación. Sólo una reimportación
    // arranca en Reimportando (N), y sólo para lo que ya tenía información; en
    // una importación limpia todo el contexto arranca en Importando (G).
    this._formulariosBase = this._formulariosBase.map(f => ({
      ...f,
      etapa: 1 as EtapaId,
      estado: (this.esReimportacion && f.estado !== null ? 'N' : 'G') as EstadoId,
    }));
    this.selectedFormularios = [];
    this.categoriaEnviada = false;
    this.programarAvanceProceso();

    this.importPaso = 'iniciado';
    this.activePanel = null;
    this.messageService.add({
      severity: 'info',
      summary: this.esReimportacion ? 'Reimportación iniciada' : 'Importación iniciada',
      detail: this.esReimportacion
        ? `"${this.importFileName}" inició su proceso de reimportación. El resultado se notificará a ${this.correoUsuario}.`
        : `"${this.importFileName}" inició su proceso de importación. El resultado se notificará a ${this.correoUsuario}.`,
      life: 6000,
    });
  }

  // ── Avance del proceso de importación (simulación de demostración) ────────
  // En producción el proceso corre en el servidor y el resultado llega por
  // correo; aquí se anima la secuencia real de estados para que la pantalla
  // muestre por dónde va cada formulario:
  //   limpia        →  Importando → En espera → Validando → Aceptado/Deficiencia
  //   reimportación →  Reimportando → Importando → En espera → Validando → …
  // Todo ocurre dentro de la etapa 1 (Importación).

  /** Duración de cada paso de la secuencia, en ms. */
  private readonly PASO_PROCESO_MS = 2200;

  /** Temporizadores en curso: se cancelan al reimportar, al filtrar y al destruir. */
  private timersProceso: number[] = [];

  /**
   * Con qué cierra el archivo demo cada formulario (id → tipo de error). Los
   * que no aparecen aquí terminan Aceptados. Se deja uno de cada familia para
   * poder comparar los dos juegos de códigos en el control de envío.
   */
  private readonly RESULTADO_IMPORTACION: Readonly<Record<number, TipoDeficiencia>> = {
    2: 'estructura',   // Balance General
    3: 'completitud',  // Estado de Resultados
  };

  /** Encadena los pasos restantes de la secuencia a partir del estado inicial. */
  private programarAvanceProceso(): void {
    this.cancelarAvanceProceso();
    const pasos: Array<() => void> = [];
    // La reimportación gasta un paso extra: primero Reimportando, luego ya
    // entra al mismo carril que una importación limpia.
    if (this.esReimportacion) pasos.push(() => this.aplicarEstadoATodos('G'));
    pasos.push(() => this.aplicarEstadoATodos('W'));
    pasos.push(() => this.aplicarEstadoATodos('V'));
    pasos.push(() => this.aplicarResultadoImportacion());

    pasos.forEach((paso, i) => {
      this.timersProceso.push(
        window.setTimeout(paso, this.PASO_PROCESO_MS * (i + 1)),
      );
    });
  }

  private cancelarAvanceProceso(): void {
    this.timersProceso.forEach(id => window.clearTimeout(id));
    this.timersProceso = [];
  }

  /** Mueve todo el contexto al mismo estado dentro de la etapa Importación. */
  private aplicarEstadoATodos(estado: EstadoId): void {
    this._formulariosBase = this._formulariosBase.map(f => ({
      ...f, etapa: 1 as EtapaId, estado,
    }));
  }

  /**
   * Cierra el proceso: reparte Aceptado / Deficiencia y deja registrado con qué
   * familia de códigos falló cada formulario. Las deficiencias cacheadas se
   * descartan: son de un proceso que ya no es el último.
   */
  private aplicarResultadoImportacion(): void {
    let conDeficiencia = 0;
    this._formulariosBase = this._formulariosBase.map(f => {
      const tipo = this.RESULTADO_IMPORTACION[f.id];
      this.deficienciasPorFormulario.delete(f.id);
      if (tipo) {
        this.tipoDeficienciaPorFormulario.set(f.id, tipo);
        conDeficiencia++;
        return { ...f, etapa: 1 as EtapaId, estado: 'D' as EstadoId };
      }
      this.tipoDeficienciaPorFormulario.delete(f.id);
      return { ...f, etapa: 1 as EtapaId, estado: 'A' as EstadoId };
    });
    // Si el control de envío está abierto, que muestre ya el proceso nuevo.
    this.refrescarDeficienciasVisibles();

    const aceptados = this._formulariosBase.length - conDeficiencia;
    this.messageService.add({
      severity: conDeficiencia ? 'warn' : 'success',
      summary: 'Proceso de importación finalizado',
      detail: `${aceptados} formulario(s) aceptados y ${conDeficiencia} con deficiencias. `
        + 'Abra el estado "Deficiencia" para ver los mensajes del proceso.',
      life: 7000,
    });
  }

  confirmExport() {
    this.messageService.add({ severity: 'success', summary: 'Exportación iniciada', detail: `Exportando ${this.filteredFormularios.length} formulario(s) en formato ${this.selectedExportFormat.toUpperCase()}...` });
    this.activePanel = null;
  }

  confirmValidation() {
    const count = this.selectedFormularios.length;
    // Los seleccionados avanzan a etapa Validación local (2) / estado Aceptado (A).
    // Incluye los que están "Sin registro": si la categoría no exige archivo,
    // se validan igual y la entidad los presenta vacíos.
    const seleccionadosIds = new Set(this.selectedFormularios.map(f => f.id));
    this._formulariosBase = this._formulariosBase.map(f =>
      seleccionadosIds.has(f.id) ? { ...f, etapa: 2 as EtapaId, estado: 'A' as EstadoId } : f,
    );
    this.selectedFormularios = [];
    this.activePanel = null;
    // Al re-validar tras un rechazo, el resultado del envío anterior deja de aplicar.
    this.categoriaEnviada = false;

    // Mensaje contextual: si todos quedaron validados, el botón "Siguiente"
    // se habilita y se invita a continuar al paso Envíos.
    if (this.todosValidados) {
      this.messageService.add({
        severity: 'success',
        summary: 'Todos los formularios validados',
        detail: `${count} formulario(s) pasaron a Validación local · Aceptado. Puede continuar al paso Envíos.`,
        life: 5000,
      });
    } else {
      const pendientes = this.filteredFormularios.filter(f => !this.esValidadoLocal(f)).length;
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
  private readonly plantillasFormulario: Array<{
    nombre: string; etapa: EtapaId; estado: EstadoId | null;
  }> = [
    // El orden sigue el ciclo de vida, para que el listado del demo muestre de
    // arriba a abajo todos los casos que la columna Estado sabe representar.
    //
    // Sin registro: está en la etapa 1 pero todavía no se ha importado. Puede
    // validarse igual si la categoría no exige archivo (se presenta vacío).
    { nombre: 'Notas a los Estados Financieros', etapa: 1, estado: null },
    // Importados sin validar: la importación quedó Aceptada, falta validar local.
    { nombre: 'Balance General', etapa: 1, estado: 'A' },
    { nombre: 'Estado de Resultados', etapa: 1, estado: 'A' },
    { nombre: 'Flujo de Efectivo', etapa: 1, estado: 'A' },
    // Ya validado localmente.
    { nombre: 'Estado de Cambios en el Patrimonio', etapa: 2, estado: 'A' },
    // Devuelto por la validación central con deficiencia.
    { nombre: 'Información Complementaria', etapa: 3, estado: 'D' },
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
    // Contexto nuevo: se abandona el proceso en curso y su expediente.
    this.cancelarAvanceProceso();
    this.deficienciasPorFormulario.clear();
    this.tipoDeficienciaPorFormulario.clear();
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
      etapa: plantilla.etapa,
      estado: plantilla.estado,
      ultimaModificacion: `0${(idx % 9) + 1}/${(idx % 12) + 1}/${anioNum}`,
    }));
    // Contexto nuevo: aún no se ha enviado.
    this.categoriaEnviada = false;
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
      this.cerrarControlEnvio();
      this.showImportDialog = false;
      this.categoriaEnviada = false;
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
    this.cerrarControlEnvio();
    this.showImportDialog = false;
    this.categoriaEnviada = false;
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

  /* ── Catálogo etapa/estado — accesores para el listado ────────────────── */

  /** Presentación (no estado) de un formulario todavía sin registro. */
  readonly sinRegistroLabel = SIN_REGISTRO_LABEL;
  readonly sinRegistroAyuda = SIN_REGISTRO_AYUDA;

  /** Fila de `tab_etapa_proceso` que corresponde a la etapa del formulario. */
  etapaDe(id: EtapaId): EtapaProceso {
    return ETAPAS_PROCESO.find(e => e.id === id) ?? ETAPAS_PROCESO[0];
  }

  /** Fila de `tab_estado` que corresponde al estado del formulario. */
  estadoDe(id: EstadoId): EstadoProceso {
    return ESTADOS_PROCESO.find(e => e.id === id) ?? ESTADOS_PROCESO[0];
  }

  /**
   * Tooltip del tag de estado: código y nombre exactos del catálogo, más la
   * descripción cuando aporta algo distinto al nombre. El dato esencial ya
   * está visible en el tag; esto es sólo la referencia al modelo de datos.
   */
  estadoTooltip(id: EstadoId): string {
    const estado = this.estadoDe(id);
    const base = `${estado.id} · ${estado.nombre}`;
    return estado.descripcion === estado.nombre
      ? base
      : `${base} — ${estado.descripcion}`;
  }
}
