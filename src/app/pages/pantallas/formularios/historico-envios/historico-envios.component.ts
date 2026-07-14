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
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageModule } from 'primeng/message';
import { ChipModule } from 'primeng/chip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AppBreadcrumbComponent } from '../../../../components/app-breadcrumb/app-breadcrumb.component';
import {
  DirectorioEntidadesComponent,
  Entidad,
} from '../../../../components/directorio-entidades/directorio-entidades.component';

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
    DialogModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    MessageModule,
    ChipModule,
    ToastModule,
    AppBreadcrumbComponent,
    DirectorioEntidadesComponent,
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

  periodoOptions = [
    { label: 'Seleccione periodo', value: '' },
    { label: 'Enero - Marzo (Trimestre 1)', value: 'T1' },
    { label: 'Abril - Junio (Trimestre 2)', value: 'T2' },
    { label: 'Julio - Septiembre (Trimestre 3)', value: 'T3' },
    { label: 'Octubre - Diciembre (Trimestre 4)', value: 'T4' },
    { label: 'Anual', value: 'ANUAL' },
  ];

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
  }

  // ══════════════════════════════════════════════════════════════════════
  // Histórico de envíos — tabla agrupada por ID_ENTRADA
  //
  // Cada ID_ENTRADA es un envío (una "entrada" de control_envio) que agrupa
  // la categoría y sus formularios para el contexto filtrado. Un mismo
  // contexto (categoría · año · periodo) acumula el historial de intentos:
  // los rechazados se reenvían hasta que uno queda Aceptado.
  //
  // Invariante de negocio (reflejada en el mock):
  //   • No pueden coexistir dos ID_ENTRADA "Abierto" (en proceso): máximo uno.
  //   • Siempre debe existir uno "Aceptado".
  //   • Sólo sobre el Aceptado se habilita "Ver detalle" desde el nombre del
  //     formulario.
  // ══════════════════════════════════════════════════════════════════════

  historicoRows: HistoricoRow[] = [];

  /** Formularios que componen la categoría (mismos en cada intento del contexto). */
  private readonly formulariosCategoria = [
    'Balance General',
    'Estado de Resultados',
    'Flujo de Efectivo',
  ];

  /** Recalcula el historial de envíos del contexto filtrado (mock de demostración). */
  private recomputarHistorico(): void {
    const anio = this.selectedAnio ? +this.selectedAnio : 2025;
    const categoria = this.categoriaLabel;
    // Si el usuario filtró por un periodo, todas las entradas comparten ese
    // periodo (reenvíos del mismo contexto); si no, cada intento trae el suyo.
    const periodoFijo = this.selectedPeriodo ? this.periodoLabel : null;

    // Intentos del contexto, del más antiguo al más reciente. Respeta la
    // invariante: sólo un "Abierto" y siempre un "Aceptado".
    const intentos: {
      id: number; estado: EstadoEnvio; periodo: string;
      envio: string; recepcion: string | null;
    }[] = [
      { id: 10355, estado: 'Rechazado', periodo: 'Enero - Marzo (Trimestre 1)', envio: '2025-03-12T09:14', recepcion: '2025-03-12T11:40' },
      { id: 10410, estado: 'Rechazado', periodo: 'Abril - Junio (Trimestre 2)', envio: '2025-04-02T15:22', recepcion: '2025-04-02T17:05' },
      { id: 10482, estado: 'Aceptado', periodo: 'Abril - Junio (Trimestre 2)', envio: '2025-04-21T08:47', recepcion: '2025-04-21T10:12' },
      { id: 10501, estado: 'Abierto', periodo: 'Julio - Septiembre (Trimestre 3)', envio: '2025-07-28T16:03', recepcion: null },
    ];

    // Se muestran del más reciente al más antiguo. Las fechas se materializan
    // como Date para ordenar cronológicamente y filtrar con el datepicker.
    const rows: HistoricoRow[] = [];
    for (const intento of [...intentos].reverse()) {
      for (const formulario of this.formulariosCategoria) {
        rows.push({
          idEntrada: intento.id,
          periodo: periodoFijo ?? intento.periodo,
          anio,
          estado: intento.estado,
          categoria,
          formulario,
          fechaEnvio: this.toDate(intento.envio)!,
          fechaRecepcion: this.toDate(intento.recepcion),
        });
      }
    }
    this.historicoRows = rows;
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

  /** Opciones del filtro de columna Estado (multiselección). */
  readonly estadoFilterOptions = [
    { label: 'Aceptado', value: 'Aceptado' },
    { label: 'Rechazado', value: 'Rechazado' },
    { label: 'Abierto', value: 'Abierto' },
  ];

  /** True cuando el envío (ID_ENTRADA) está Aceptado — habilita "Ver detalle". */
  esAceptado(row: HistoricoRow): boolean {
    return row.estado === 'Aceptado';
  }

  /** Severity del tag de estado (Kit UI: verde éxito · rojo error · azul info). */
  estadoSeverity(estado: EstadoEnvio): 'success' | 'danger' | 'info' {
    switch (estado) {
      case 'Aceptado': return 'success';
      case 'Rechazado': return 'danger';
      default: return 'info';
    }
  }

  estadoIcon(estado: EstadoEnvio): string {
    switch (estado) {
      case 'Aceptado': return 'pi pi-check-circle';
      case 'Rechazado': return 'pi pi-times-circle';
      default: return 'pi pi-clock';
    }
  }

  // ── Detalle del formulario (sólo envíos Aceptados) ──
  detalleRow: HistoricoRow | null = null;

  verDetalle(row: HistoricoRow): void {
    if (!this.esAceptado(row)) return;
    this.detalleRow = row;
  }

  cerrarDetalle(): void {
    this.detalleRow = null;
  }
}

/** Estado registrado en control_envio para el envío (ID_ENTRADA). */
type EstadoEnvio = 'Aceptado' | 'Rechazado' | 'Abierto';

/**
 * Una fila del histórico: un formulario dentro de un envío (ID_ENTRADA). Los
 * campos de envío (idEntrada, periodo, anio, estado, categoria) se repiten en
 * cada formulario del grupo para alimentar el encabezado de agrupación.
 */
interface HistoricoRow {
  idEntrada: number;
  periodo: string;
  anio: number;
  estado: EstadoEnvio;
  categoria: string;
  formulario: string;
  fechaEnvio: Date;
  fechaRecepcion: Date | null;
}
