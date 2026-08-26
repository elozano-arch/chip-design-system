import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageModule } from 'primeng/message';
import { ChipModule } from 'primeng/chip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AppBreadcrumbComponent } from '../../../../components/app-breadcrumb/app-breadcrumb.component';
import { PERIODOS_FILTRO } from '../../../../services/periodos';
import {
  DirectorioEntidadesComponent,
  Entidad,
} from '../../../../components/directorio-entidades/directorio-entidades.component';
import {
  TreeTableComponent,
  ColumnaConfig,
  NodoArbol,
} from '../../../../components/tree-table/tree-table.component';

/**
 * Tipo de usuario que determina cómo se resuelve la entidad del contexto:
 *   • 'L'          → entidad local activa, cargada por defecto.
 *   • 'L_INACTIVA' → entidad local inactiva (sin categorías activas) → alerta.
 *   • 'ACE'        → A/C/E: elige la entidad desde el directorio.
 * Réplica del contexto de "Gestión de Formularios" (mock de demostración).
 */
type TipoUsuario = 'L' | 'L_INACTIVA' | 'ACE';

/**
 * Consultas › Histórico de envíos.
 *
 * Pantalla de consulta que arranca reutilizando el MISMO panel de filtros de
 * "Gestión de Formularios" (Entidad + Directorio + switch demo de tipo de
 * usuario + Categoría/Año/Periodo). El resto de la pantalla (tabla del
 * histórico) se irá construyendo sobre este contexto.
 */
@Component({
  selector: 'app-historico-envios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    DatePickerModule,
    TableModule,
    TagModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    MessageModule,
    ChipModule,
    ToastModule,
    AppBreadcrumbComponent,
    DirectorioEntidadesComponent,
    TreeTableComponent,
  ],
  providers: [MessageService],
  templateUrl: './historico-envios.component.html',
  styleUrl: './historico-envios.component.scss',
})
export class HistoricoEnviosComponent {
  constructor(private messageService: MessageService) {}

  // ── Tipo de usuario (mock de demostración) ──
  // Dispara los dos eventos de resolución de entidad del contexto.
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
  // compartido `app-directorio-entidades` (mismo estándar que Gestión de
  // Formularios). El usuario A/C/E lo abre desde el campo Entidad.
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
  }

  categoriaOptions: { label: string; value: string }[] = [
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

  /** Catálogo compartido: la etiqueta es el rango de meses. Ver periodos.ts. */
  periodoOptions = PERIODOS_FILTRO;

  /** Etiqueta legible del periodo seleccionado (para el contexto). */
  get periodoLabel(): string {
    return this.periodoOptions.find(o => o.value === this.selectedPeriodo)?.label ?? '';
  }

  /** Etiqueta legible de la categoría seleccionada. */
  get categoriaLabel(): string {
    return this.categoriaOptions.find(o => o.value === this.selectedCategoria)?.label
      ?? 'la categoría';
  }

  get canApplyFilters(): boolean {
    // Periodo es opcional: sin él, el histórico abarca todos los periodos del año.
    return !!this.filterEntidad && !this.entidadInactiva
      && !!this.selectedCategoria && !!this.selectedAnio;
  }

  applyFilters() {
    if (!this.canApplyFilters) {
      this.messageService.add({ severity: 'warn', summary: 'Filtros requeridos', detail: 'Debe seleccionar Entidad, Categoría y Año.' });
      return;
    }
    this.recomputarHistorico();
    this.filtersApplied = true;
    // Al aplicar, el acordeón de filtros se colapsa a su resumen de chips.
    this.filtersCollapsed = true;
  }

  /**
   * Al modificar cualquier filtro tras haberlos aplicado, el contexto deja de
   * ser válido y la consulta del histórico se invalida.
   */
  onFiltroModificado() {
    if (this.filtersApplied) {
      this.filtersApplied = false;
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

  clearFilters() {
    this.selectedCategoria = '';
    this.selectedAnio = '';
    this.selectedPeriodo = '';
    this.filtersApplied = false;
    this.filtersCollapsed = false;
    this.historicoRows = [];
    this.entradasConDetalle = new Set();
  }

  // ══════════════════════════════════════════════════════════════════════
  // Histórico de envíos — grilla por ID_ENTRADA con historial por formulario
  //
  // Modelo de negocio:
  //   • Una CATEGORÍA tiene N formularios. Cada ID_ENTRADA es la llave que
  //     agrupa UN envío de esa categoría.
  //   • Importar y Validar operan POR FORMULARIO (tipo Formulario). Un
  //     "Rechazado deficiencia" en Validación afecta sólo a ese formulario.
  //   • Enviar opera sobre la CATEGORÍA COMPLETA (tipo Categoría):
  //       - Envío aceptado  → TODOS los formularios quedan "Aceptado".
  //       - Envío rechazado → los formularios quedan en "Validado", y el
  //         formulario que causó la deficiencia queda "Rechazado deficiencia"
  //         (tipo Categoría, porque el rechazo viene de la fase Envío).
  //
  // El `estado`/`fase` de la fila = paso ACTUAL; `historial` = la secuencia
  // completa que se muestra como timeline en "Ver flujo".
  //
  // Demo: el ID_ENTRADA "ejemplo" (el más reciente) es un envío RECHAZADO cuyo
  // recorrido cubre la batería; los demás son envíos ACEPTADOS (camino feliz),
  // con todos sus formularios en Aceptado.
  // ══════════════════════════════════════════════════════════════════════

  historicoRows: HistoricoRow[] = [];

  /** Formularios que componen la categoría. */
  private readonly formulariosCategoria = [
    'Balance General',
    'Estado de Resultados',
    'Flujo de Efectivo',
  ];

  /**
   * Camino feliz (envío ACEPTADO): importa, valida y el envío de la categoría
   * pasa → el formulario queda Aceptado. Lo comparten los N formularios, porque
   * el envío es de la categoría completa.
   */
  private readonly flujoFeliz: [Fase, string, EstadoEnvio][] = [
    ['Importar', 'Inicia proceso de importación', 'En proceso'],
    ['Validacion', 'Archivo que pasó la etapa de importación', 'Pendiente validar'],
    ['Validacion', 'Archivo que pasa las validaciones locales', 'Validado'],
    ['Envio', 'Archivo que pasa el envío de la categoría', 'Aceptado'],
  ];

  /**
   * ID_ENTRADA "ejemplo" — envío RECHAZADO por deficiencia. Los 3 formularios
   * llegaron a Validado (requisito para poder enviar la categoría); al rechazarse
   * el envío quedan en Validado, salvo el formulario deficiente, que queda en
   * "Rechazado deficiencia" (tipo Categoría). Entre los tres cubren la batería.
   */
  private readonly flujosEjemplo: [Fase, string, EstadoEnvio][][] = [
    // Formulario 1 — rechazo de estructura al importar; se recupera → Validado.
    [
      ['Importar', 'Inicia proceso de importación', 'En proceso'],
      ['Importar', 'Error en la importación: rechazo de estructura', 'Rechazo estructura'],
      ['Importar', 'Reinicia proceso de importación', 'En proceso'],
      ['Validacion', 'Archivo que pasó la etapa de importación', 'Pendiente validar'],
      ['Validacion', 'Archivo que pasa las validaciones locales', 'Validado'],
    ],
    // Formulario 2 — el DEFICIENTE: falla técnica y completitud al importar; se
    // valida, pero el envío de la categoría se rechaza por su deficiencia.
    [
      ['Importar', 'Inicia proceso de importación', 'En proceso'],
      ['Importar', 'Falla técnica en el proceso de importación', 'Rechazo tecnico'],
      ['Importar', 'Reinicia proceso de importación', 'En proceso'],
      ['Importar', 'Error en la importación: rechazo de completitud', 'Rechazo completitud'],
      ['Importar', 'Reinicia proceso de importación', 'En proceso'],
      ['Validacion', 'Archivo que pasó la etapa de importación', 'Pendiente validar'],
      ['Validacion', 'Archivo que pasa las validaciones locales', 'Validado'],
      ['Envio', 'Error en el envío de la categoría: rechazo por deficiencia', 'Rechazado deficiencia'],
    ],
    // Formulario 3 — rechazo de importación y deficiencia en validación; se
    // corrige → Validado (el envío se rechazó por el formulario 2).
    [
      ['Importar', 'Inicia proceso de importación', 'En proceso'],
      ['Importar', 'Error: no cumple los requisitos de la categoría', 'Rechazo importacion'],
      ['Importar', 'Reinicia proceso de importación', 'En proceso'],
      ['Validacion', 'Archivo que pasó la etapa de importación', 'Pendiente validar'],
      ['Validacion', 'Error en validación: rechazo por deficiencia', 'Rechazado deficiencia'],
      ['Validacion', 'Archivo que pasa las validaciones locales', 'Validado'],
    ],
  ];

  /** Recalcula el historial del contexto filtrado (mock de demostración). */
  private recomputarHistorico(): void {
    const anio = this.selectedAnio ? +this.selectedAnio : 2025;
    const categoria = this.categoriaLabel;
    // Si el usuario filtró por un periodo, todas las entradas lo comparten.
    const periodoFijo = this.selectedPeriodo ? this.periodoLabel : null;

    // Entradas del contexto, de la más antigua a la más reciente. La más
    // reciente (10501) es el "ejemplo" con el flujo completo.
    const entradas: { id: number; periodo: string; base: string; ejemplo: boolean }[] = [
      { id: 10355, periodo: 'Enero - Marzo', base: '2025-03-12T09:00', ejemplo: false },
      { id: 10410, periodo: 'Abril - Junio', base: '2025-04-02T15:00', ejemplo: false },
      { id: 10482, periodo: 'Abril - Junio', base: '2025-04-21T08:30', ejemplo: false },
      { id: 10501, periodo: 'Julio - Septiembre', base: '2025-07-28T16:00', ejemplo: true },
    ];

    const rows: HistoricoRow[] = [];
    // Se muestran de la más reciente a la más antigua.
    for (const entrada of [...entradas].reverse()) {
      this.formulariosCategoria.forEach((formulario, i) => {
        const plantilla = entrada.ejemplo ? this.flujosEjemplo[i] : this.flujoFeliz;
        // Cada formulario arranca unas horas después dentro del mismo envío.
        const baseFecha = this.addMinutes(this.toDate(entrada.base)!, i * 180);
        const historial: FlowStep[] = plantilla.map((s, k) => ({
          fase: s[0],
          descripcion: s[1],
          estado: s[2],
          tipo: this.tipoDeFase(s[0]),
          fecha: this.addMinutes(baseFecha, k * 25),
        }));
        const ultimo = historial[historial.length - 1];
        // Hay fecha de recepción cuando la validación ya finalizó; mientras esté
        // "En proceso" o "Pendiente validar" todavía no hay.
        const terminal = ultimo.estado !== 'En proceso' && ultimo.estado !== 'Pendiente validar';
        rows.push({
          idEntrada: entrada.id,
          periodo: periodoFijo ?? entrada.periodo,
          anio,
          categoria,
          formulario,
          estado: ultimo.estado,
          fase: ultimo.fase,
          tipo: this.tipoDeFase(ultimo.fase),
          fechaEnvio: historial[0].fecha,
          fechaRecepcion: terminal ? ultimo.fecha : null,
          historial,
        });
      });
    }
    this.historicoRows = rows;

    // El detalle sólo se habilita en los DOS envíos aceptados más recientes.
    const aceptadas = [...new Set(rows.filter(r => r.estado === 'Aceptado').map(r => r.idEntrada))]
      .sort((a, b) => b - a)
      .slice(0, 2);
    this.entradasConDetalle = new Set(aceptadas);
  }

  /**
   * ID_ENTRADA de los dos envíos aceptados más recientes. Fuera de esos, el
   * detalle no está disponible aunque el formulario esté Aceptado.
   */
  private entradasConDetalle = new Set<number>();

  /**
   * "Ver flujo" sólo está disponible para formularios en estado Aceptado y
   * únicamente dentro de los DOS envíos aceptados más recientes.
   */
  puedeVerDetalle(row: HistoricoRow): boolean {
    return row.estado === 'Aceptado' && this.entradasConDetalle.has(row.idEntrada);
  }

  /** Suma minutos a una fecha (helper del mock). */
  private addMinutes(d: Date, mins: number): Date {
    return new Date(d.getTime() + mins * 60000);
  }

  /** Parsea una fecha ISO (YYYY-MM-DDTHH:mm) a Date; null si no hay valor. */
  private toDate(iso: string | null): Date | null {
    if (!iso) return null;
    const [fecha, hora] = iso.split('T');
    const [y, m, d] = fecha.split('-').map(Number);
    const [hh, mm] = (hora ?? '00:00').split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm);
  }

  /** Formatea una fecha al despliegue dd/mm/yyyy HH:mm (— si es nula). */
  fmtFecha(d: Date | null): string {
    if (!d) return '—';
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  /** Opciones del filtro de columna Estado (multiselección) — batería completa. */
  readonly estadoFilterOptions = [
    { label: 'En proceso', value: 'En proceso' },
    { label: 'Pendiente validar', value: 'Pendiente validar' },
    { label: 'Validado', value: 'Validado' },
    { label: 'Aceptado', value: 'Aceptado' },
    { label: 'Rechazo técnico', value: 'Rechazo tecnico' },
    { label: 'Rechazo importación', value: 'Rechazo importacion' },
    { label: 'Rechazo completitud', value: 'Rechazo completitud' },
    { label: 'Rechazo estructura', value: 'Rechazo estructura' },
    { label: 'Rechazado deficiencia', value: 'Rechazado deficiencia' },
  ];

  /** Opciones del filtro de columna Tipo (ámbito del estado). */
  readonly tipoFilterOptions = [
    { label: 'Formulario', value: 'Formulario' },
    { label: 'Categoría', value: 'Categoría' },
  ];

  /** Severity del tag (Kit UI: verde éxito · rojo error · amarillo pendiente · gris/azul proceso). */
  estadoSeverity(estado: EstadoEnvio): 'success' | 'danger' | 'warn' | 'info' | 'secondary' {
    switch (estado) {
      case 'Aceptado': return 'success';
      case 'Validado': return 'info';
      case 'Pendiente validar': return 'warn';
      case 'En proceso': return 'secondary';
      default: return 'danger'; // todos los rechazos
    }
  }

  estadoIcon(estado: EstadoEnvio): string {
    switch (estado) {
      case 'Aceptado': return 'pi pi-verified';
      case 'Validado': return 'pi pi-check';
      case 'Pendiente validar': return 'pi pi-clock';
      case 'En proceso': return 'pi pi-sync';
      case 'Rechazo tecnico': return 'pi pi-exclamation-triangle';
      default: return 'pi pi-times-circle'; // importación/completitud/estructura/deficiencia
    }
  }

  /** Ámbito de un estado según su fase: Envío → Categoría; el resto → Formulario. */
  tipoDeFase(fase: Fase): TipoAmbito {
    return fase === 'Envio' ? 'Categoría' : 'Formulario';
  }

  // ══════════════════════════════════════════════════════════════════════
  // Detalle del formulario — sub-vista a PANTALLA COMPLETA (reemplaza la
  // grilla, se vuelve con "Volver a la grilla"), igual que las sub-vistas de
  // Gestión de Formularios. Usa el <app-tree-table> estándar del proyecto en
  // variante CONSULTA: sin edición y con paginador horizontal de columnas.
  // ══════════════════════════════════════════════════════════════════════

  detalleRow: HistoricoRow | null = null;

  /** Árbol de conceptos/variables del formulario abierto (mock determinístico). */
  arbolDetalle: NodoArbol[] = [];

  /**
   * Columnas fijas del tree-table (no se paginan). El ancho de "Código" debe ser
   * 180px: el componente congela (sticky) la 2ª columna fija en `left: 180px`,
   * así que otro ancho deja un hueco visible entre Código y Concepto.
   */
  readonly columnasFijasDetalle: ColumnaConfig[] = [
    { key: 'codigo', label: 'Código', editable: false, tipo: 'texto', ancho: '180px', fija: true },
    { key: 'nombre', label: 'Concepto', editable: false, tipo: 'texto', ancho: '260px', fija: true },
  ];

  /** Periodos del formulario: 12 columnas variables → el pager muestra 4 a la vez. */
  private readonly mesesDetalle = [
    { key: 'ene', label: 'Ene' }, { key: 'feb', label: 'Feb' }, { key: 'mar', label: 'Mar' },
    { key: 'abr', label: 'Abr' }, { key: 'may', label: 'May' }, { key: 'jun', label: 'Jun' },
    { key: 'jul', label: 'Jul' }, { key: 'ago', label: 'Ago' }, { key: 'sep', label: 'Sep' },
    { key: 'oct', label: 'Oct' }, { key: 'nov', label: 'Nov' }, { key: 'dic', label: 'Dic' },
  ];

  /** Columnas variables (periodos) del tree-table; se arman al abrir el detalle. */
  columnasPeriodos: ColumnaConfig[] = [];

  verDetalle(row: HistoricoRow): void {
    if (!this.puedeVerDetalle(row)) return;
    this.detalleRow = row;
    const anio = this.selectedAnio || '2025';
    this.columnasPeriodos = this.mesesDetalle.map(m => ({
      key: m.key,
      label: `${m.label} ${anio}`,
      editable: false,
      tipo: 'numero',
      alineacion: 'right',
    }));
    this.arbolDetalle = this.generarArbolDetalle(row);
    queueMicrotask(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  cerrarDetalle(): void {
    this.detalleRow = null;
    this.arbolDetalle = [];
    queueMicrotask(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ── Mock determinístico del árbol del formulario ── */

  private generarArbolDetalle(row: HistoricoRow): NodoArbol[] {
    const rng = this.crearRng(`${row.idEntrada}-${row.formulario}`);
    // >10 hijos en varios conceptos para que aparezca el paginador vertical
    // (por nodo padre; el tamaño de página por defecto del componente es 10).
    const conceptos = [
      { codigo: '1.1.05', nombre: 'Caja', hijos: 14 },
      { codigo: '1.1.10', nombre: 'Bancos y corporaciones de ahorro', hijos: 18 },
      { codigo: '1.1.20', nombre: 'Inversiones de administración de liquidez', hijos: 9 },
      { codigo: '2.1.01', nombre: 'Cuentas por pagar', hijos: 12 },
    ];
    return conceptos.map((c, i) => this.crearNodoDetalle(c.codigo, c.nombre, 1, c.hijos, `d${i}`, rng));
  }

  private crearNodoDetalle(
    codigo: string, nombre: string, nivel: number, cantHijos: number,
    idBase: string, rng: () => number,
  ): NodoArbol {
    const hijos: NodoArbol[] = [];
    if (nivel < 2 && cantHijos > 0) {
      for (let i = 1; i <= cantHijos; i++) {
        hijos.push(this.crearNodoDetalle(
          `${codigo}.${String(i).padStart(2, '0')}`, `Variable ${i}`,
          nivel + 1, 0, `${idBase}-${i}`, rng,
        ));
      }
    }
    return { id: idBase, codigo, nombre, nivel, hijos, valores: this.generarValoresDetalle(nivel, rng) };
  }

  private generarValoresDetalle(nivel: number, rng: () => number): Record<string, string | number> {
    const base = nivel === 1 ? 5_000_000 : 250_000;
    const valores: Record<string, string | number> = {};
    for (const m of this.mesesDetalle) {
      valores[m.key] = base + Math.floor(rng() * base);
    }
    return valores;
  }

  /** RNG determinístico por semilla: el mock no cambia entre renders. */
  private crearRng(seed: string): () => number {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h += 0x6d2b79f5;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
}

/** Fase del ciclo de vida del envío en control_envio. */
type Fase = 'Importar' | 'Validacion' | 'Envio';

/**
 * Ámbito de un estado: la fase de Envío opera sobre la CATEGORÍA completa;
 * Importar y Validación operan sobre el FORMULARIO.
 */
type TipoAmbito = 'Formulario' | 'Categoría';

/**
 * Estado registrado en control_envio — batería completa por fase:
 *   Importar:   En proceso · Rechazo técnico · Rechazo importación · Rechazo completitud · Rechazo estructura
 *   Validación: Pendiente validar · Rechazo técnico · Rechazado deficiencia · Validado
 *   Envío:      Rechazo técnico · Rechazado deficiencia · Aceptado
 */
type EstadoEnvio =
  | 'En proceso'
  | 'Rechazo tecnico'
  | 'Rechazo importacion'
  | 'Rechazo completitud'
  | 'Rechazo estructura'
  | 'Pendiente validar'
  | 'Rechazado deficiencia'
  | 'Validado'
  | 'Aceptado';

/** Un paso del flujo de un formulario (una fila de la batería con fecha). */
interface FlowStep {
  fase: Fase;
  descripcion: string;
  estado: EstadoEnvio;
  tipo: TipoAmbito;
  fecha: Date;
}

/**
 * Una fila del histórico: un formulario dentro de un envío (ID_ENTRADA).
 * `estado`/`fase` son el paso ACTUAL (último del flujo) y `historial` la
 * secuencia completa (timeline en "Ver detalle"). Los campos de envío se
 * repiten por fila para la grilla plana.
 */
interface HistoricoRow {
  idEntrada: number;
  periodo: string;
  anio: number;
  categoria: string;
  formulario: string;
  estado: EstadoEnvio;
  fase: Fase;
  tipo: TipoAmbito;
  fechaEnvio: Date;
  fechaRecepcion: Date | null;
  historial: FlowStep[];
}
