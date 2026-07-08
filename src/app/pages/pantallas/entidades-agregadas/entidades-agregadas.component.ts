import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ChipModule } from 'primeng/chip';
import { MessageService } from 'primeng/api';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import { DirectorioEntidadesComponent } from '../../../components/directorio-entidades/directorio-entidades.component';
import { DirectorioEntidadesMultipleComponent } from '../../../components/directorio-entidades-multiple/directorio-entidades-multiple.component';
import { Entidad } from '../../../components/directorio-entidades/directorio-entidades.component';

/**
 * Pantalla "Entidades agregadas".
 *
 * Flujo (gating Entidad → Categoría → Asignar):
 *   1. El usuario elige una Entidad principal (obligatorio, selección única).
 *   2. Al elegirla se habilita la Categoría (obligatorio).
 *   3. Con Entidad + Categoría se habilita "Asignar entidades agregadas", que
 *      abre el directorio de selección múltiple.
 *   4. La pantalla muestra el listado de entidades agregadas, con opción de
 *      quitarlas individualmente o todas.
 *
 * Reúso de modales (decisión: un solo componente por tipo + flags):
 *   - <app-directorio-entidades> (selección única) para la Entidad principal.
 *   - <app-directorio-entidades-multiple> (selección múltiple) para las
 *     entidades agregadas; al reabrir refleja lo ya seleccionado.
 *   Ambos directorios quedan intactos para el wizard de Formularios.
 *
 * Tipo de usuario (mock de demostración) — determina cómo se resuelve la Entidad:
 *   • 'L' (Local)            → opera una sola entidad: se carga por defecto (campo bloqueado).
 *   • 'C' (Consolidadora/    → operan sobre varias entidades: eligen una desde el
 *         Estratégico)          Directorio de Entidades. C y E comparten comportamiento,
 *                               por eso se unifican en una sola opción.
 * En producción vendría de la sesión/backend; aquí se mockea con un selector.
 * No se incluye el escenario de entidad inactiva (alerta).
 */
type TipoUsuario = 'L' | 'C';

@Component({
  selector: 'app-entidades-agregadas',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, DialogModule, SelectModule, TableModule, TagModule, ToastModule, TooltipModule,
    InputTextModule, IconFieldModule, InputIconModule, ChipModule,
    AppBreadcrumbComponent, DirectorioEntidadesComponent, DirectorioEntidadesMultipleComponent,
  ],
  providers: [MessageService],
  templateUrl: './entidades-agregadas.component.html',
  styleUrl: './entidades-agregadas.component.scss',
})
export class EntidadesAgregadasComponent {
  /** Catálogo de categorías (alineado con la pantalla de Gestión de Formularios). */
  readonly categoriaOptions = [
    { label: 'INFORMACIÓN CONTABLE PÚBLICA CONVERGENCIA', value: 'ICP' },
    { label: 'INFORMACIÓN PRESUPUESTAL', value: 'IP' },
    { label: 'INFORMACIÓN FINANCIERA', value: 'IF' },
    { label: 'CONTROL INTERNO CONTABLE', value: 'CIC' },
    { label: 'CGR PRESUPUESTAL', value: 'CGR' },
    { label: 'FUT GASTOS DE FUNCIONAMIENTO', value: 'FUT_GF' },
    { label: 'FUT GASTOS DE INVERSIÓN', value: 'FUT_GI' },
    { label: 'FUT INGRESOS', value: 'FUT_ING' },
  ];

  // ── Tipo de usuario (mock de demostración) ──
  /** Entidad local activa cargada por defecto para el tipo L. */
  readonly entidadLocalPorDefecto: Entidad = {
    codigo: '110100000', nit: '830.000.000-0',
    razonSocial: 'Contaduría General de la Nación',
    departamento: 'Bogotá D.C.', municipio: 'Bogotá D.C.', estado: 'Activo',
  };
  readonly tiposUsuarioOptions = [
    { label: 'Tipo L · Entidad local (carga automática)', value: 'L' },
    { label: 'Tipo C/E · Consolidadora o Estratégico (selecciona del directorio)', value: 'C' },
  ];
  tipoUsuario: TipoUsuario = 'L';

  /** True cuando el tipo carga su entidad por defecto (campo bloqueado). */
  get esTipoLocal(): boolean {
    return this.tipoUsuario === 'L';
  }

  // Paso 1 — Filtros (Entidad principal + Categoría)
  selectedEntidad: Entidad | null = this.entidadLocalPorDefecto;
  entidadDirectorioVisible = false;
  selectedCategoria = '';

  /** Estado del acordeón de filtros y de la búsqueda aplicada. */
  filtersCollapsed = false;
  busquedaAplicada = false;

  // Paso 2 — Entidades agregadas (selección múltiple)
  directorioVisible = false;
  entidadesSeleccionadas: Entidad[] = [];

  // Alerta de confirmación al quitar de la lista (acción destructiva)
  confirmQuitarVisible = false;
  /** Entidad puntual a quitar; null ⇒ se quitarán todas. */
  entidadAQuitar: Entidad | null = null;

  constructor(private readonly messages: MessageService) {}

  /** True cuando hay una Entidad principal elegida (habilita la Categoría). */
  get entidadSeleccionada(): boolean {
    return !!this.selectedEntidad;
  }

  /** True cuando hay una categoría elegida. */
  get categoriaSeleccionada(): boolean {
    return !!this.selectedCategoria;
  }

  /** Filtros obligatorios completos → habilita "Buscar". */
  get filtrosValidos(): boolean {
    return this.entidadSeleccionada && this.categoriaSeleccionada;
  }

  /** N.º de filtros con valor (para el resumen del toggle). */
  get activeFilterCount(): number {
    return (this.entidadSeleccionada ? 1 : 0) + (this.categoriaSeleccionada ? 1 : 0);
  }

  /** "Asignar entidades agregadas" se habilita tras una búsqueda aplicada. */
  get puedeAsignar(): boolean {
    return this.busquedaAplicada;
  }

  get categoriaLabel(): string {
    return this.categoriaOptions.find(o => o.value === this.selectedCategoria)?.label ?? '';
  }

  /** Texto del campo de Entidad: siempre «código · razón social» (vacío si no hay selección). */
  get entidadLabel(): string {
    return this.selectedEntidad
      ? `${this.selectedEntidad.codigo} · ${this.selectedEntidad.razonSocial}`
      : '';
  }

  /**
   * Resuelve la Entidad según el tipo de usuario (mock):
   *   L → carga la entidad local por defecto; C/E → la elige del directorio.
   * Cambiar de tipo reinicia categoría, búsqueda y listado.
   */
  onTipoUsuarioChange(): void {
    this.selectedCategoria = '';
    this.invalidarBusqueda();
    this.entidadDirectorioVisible = false;
    this.selectedEntidad = this.esTipoLocal ? this.entidadLocalPorDefecto : null;
  }

  abrirDirectorioEntidad(): void {
    // El usuario local no elige entidad: la suya viene cargada por defecto.
    if (this.esTipoLocal) return;
    this.entidadDirectorioVisible = true;
  }

  /** Al editar un filtro, la búsqueda previa deja de ser válida y se vacía la lista. */
  private invalidarBusqueda(): void {
    this.busquedaAplicada = false;
    this.entidadesSeleccionadas = [];
  }

  /** Limpia la Entidad principal y, en cascada, Categoría, búsqueda y listado. */
  limpiarEntidad(): void {
    this.selectedEntidad = null;
    this.selectedCategoria = '';
    this.invalidarBusqueda();
  }

  /** Al cambiar la Entidad se reinicia Categoría, búsqueda y lista (dependen de ella). */
  onEntidadSeleccionada(entidad: Entidad): void {
    this.selectedEntidad = entidad;
    this.selectedCategoria = '';
    this.invalidarBusqueda();
  }

  /** Al cambiar de categoría se invalida la búsqueda (las entidades aplican por categoría). */
  onCategoriaChange(): void {
    this.invalidarBusqueda();
  }

  /** Aplica los filtros: marca la búsqueda y colapsa el panel para dar alto a la tabla. */
  buscar(): void {
    if (!this.filtrosValidos) return;
    this.busquedaAplicada = true;
    this.filtersCollapsed = true;
  }

  /** Limpia los filtros y reabre el panel (tipo L conserva su entidad local). */
  limpiarFiltros(): void {
    this.selectedEntidad = this.esTipoLocal ? this.entidadLocalPorDefecto : null;
    this.selectedCategoria = '';
    this.invalidarBusqueda();
    this.filtersCollapsed = false;
  }

  abrirDirectorio(): void {
    if (!this.puedeAsignar) return;
    this.directorioVisible = true;
  }

  /** Recibe la selección múltiple del directorio y reemplaza la lista actual. */
  onEntidadesSeleccionadas(entidades: Entidad[]): void {
    this.entidadesSeleccionadas = [...entidades];
    this.messages.add({
      severity: 'success',
      summary: 'Selección actualizada',
      detail: entidades.length
        ? `${entidades.length} entidad${entidades.length === 1 ? '' : 'es'} en la lista.`
        : 'No hay entidades seleccionadas.',
      life: 4000,
    });
  }

  /** Abre la alerta de confirmación para quitar una entidad puntual. */
  pedirQuitarEntidad(entidad: Entidad): void {
    this.entidadAQuitar = entidad;
    this.confirmQuitarVisible = true;
  }

  /** Abre la alerta de confirmación para quitar todas las entidades. */
  pedirQuitarTodas(): void {
    if (!this.entidadesSeleccionadas.length) return;
    this.entidadAQuitar = null;
    this.confirmQuitarVisible = true;
  }

  /** Ejecuta la acción confirmada (puntual o todas) y cierra la alerta. */
  confirmarQuitar(): void {
    if (this.entidadAQuitar) {
      const codigo = this.entidadAQuitar.codigo;
      this.entidadesSeleccionadas = this.entidadesSeleccionadas.filter(e => e.codigo !== codigo);
    } else {
      this.entidadesSeleccionadas = [];
    }
    this.cancelarQuitar();
  }

  /** Cierra la alerta sin aplicar cambios. */
  cancelarQuitar(): void {
    this.confirmQuitarVisible = false;
    this.entidadAQuitar = null;
  }
}
