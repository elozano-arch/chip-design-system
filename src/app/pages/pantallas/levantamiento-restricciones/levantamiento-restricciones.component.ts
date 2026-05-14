import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { ListboxModule } from 'primeng/listbox';
import { DialogModule } from 'primeng/dialog';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import {
  DirectorioEntidadesComponent,
  Entidad,
} from '../../../components/directorio-entidades/directorio-entidades.component';

type TipoPeriodo = 'mensual' | 'trimestral' | 'semestral';

interface Categoria {
  id: string;
  nombre: string;
  tipoPeriodo: TipoPeriodo;
}

interface Mensaje {
  id: string;
  codigo: string;
  descripcion: string;
}

type Tipo = 'local' | 'central';

@Component({
  selector: 'app-levantamiento-restricciones',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, IconFieldModule, InputIconModule,
    SelectModule, ListboxModule, DialogModule, ChipModule, TooltipModule,
    TagModule, ToastModule,
    AppBreadcrumbComponent, DirectorioEntidadesComponent,
  ],
  providers: [MessageService],
  templateUrl: './levantamiento-restricciones.component.html',
  styleUrl: './levantamiento-restricciones.component.scss',
})
export class LevantamientoRestriccionesComponent {
  constructor(private messageService: MessageService) {}

  // ───────────────────────────────────────────────
  // Estado del panel de filtros
  // ───────────────────────────────────────────────
  filtersCollapsed = false;

  filterTipo: Tipo | null = null;
  filterEntidad: Entidad | null = null;
  filterAnio: string | null = null;
  filterCategoria: string | null = null;
  filterPeriodo: string | null = null;

  /** Snapshot de filtros aplicados en la última consulta (para chips y resumen). */
  filtrosAplicados: {
    tipo: Tipo;
    entidad: Entidad;
    anio: string;
    categoria: Categoria;
    periodo: string;
  } | null = null;

  mostrarDirectorioEntidades = false;

  readonly tipoOptions = [
    { label: 'Local', value: 'local' as Tipo },
    { label: 'Central', value: 'central' as Tipo },
  ];

  readonly anioOptions = [
    { label: '2024', value: '2024' },
    { label: '2025', value: '2025' },
    { label: '2026', value: '2026' },
  ];

  readonly categorias: Categoria[] = [
    { id: 'gob', nombre: 'Entidades de Gobierno', tipoPeriodo: 'trimestral' },
    { id: 'emp', nombre: 'Empresas Públicas', tipoPeriodo: 'trimestral' },
    { id: 'liq', nombre: 'Entidades en Liquidación', tipoPeriodo: 'semestral' },
    { id: 'uni', nombre: 'Entes Universitarios Autónomos', tipoPeriodo: 'mensual' },
  ];

  readonly categoriaOptions = this.categorias.map(c => ({ label: c.nombre, value: c.id }));

  /** Períodos derivados del tipo de período de la categoría seleccionada. */
  get periodoOptions(): { label: string; value: string }[] {
    const cat = this.categorias.find(c => c.id === this.filterCategoria);
    if (!cat) return [];
    if (cat.tipoPeriodo === 'mensual') {
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      return meses.map((m, i) => ({ label: m, value: String(i + 1).padStart(2, '0') }));
    }
    if (cat.tipoPeriodo === 'trimestral') {
      return [
        { label: 'I Trimestre (Ene-Mar)', value: 'T1' },
        { label: 'II Trimestre (Abr-Jun)', value: 'T2' },
        { label: 'III Trimestre (Jul-Sep)', value: 'T3' },
        { label: 'IV Trimestre (Oct-Dic)', value: 'T4' },
      ];
    }
    return [
      { label: 'I Semestre (Ene-Jun)', value: 'S1' },
      { label: 'II Semestre (Jul-Dic)', value: 'S2' },
    ];
  }

  onCategoriaChange() {
    // Si cambia la categoría, reset período (tipo de período distinto) y tipo
    this.filterPeriodo = null;
    this.filterTipo = null;
  }

  /** Tipo se habilita sólo cuando los demás filtros están completos (depende de ellos). */
  get tipoHabilitado(): boolean {
    return !!(this.filterEntidad && this.filterAnio
      && this.filterCategoria && this.filterPeriodo);
  }

  /** Todos los filtros obligatorios completos. */
  get filtrosValidos(): boolean {
    return !!(this.filterTipo && this.filterEntidad && this.filterAnio
      && this.filterCategoria && this.filterPeriodo);
  }

  get activeFilterCount(): number {
    return [this.filterTipo, this.filterEntidad, this.filterAnio,
            this.filterCategoria, this.filterPeriodo].filter(v => !!v).length;
  }

  // ───────────────────────────────────────────────
  // Directorio de entidades
  // ───────────────────────────────────────────────
  abrirDirectorioEntidades() {
    this.mostrarDirectorioEntidades = true;
  }

  onEntidadSeleccionada(e: Entidad) {
    this.filterEntidad = e;
  }

  limpiarEntidad() {
    this.filterEntidad = null;
  }

  // ───────────────────────────────────────────────
  // Aplicar / Limpiar filtros
  // ───────────────────────────────────────────────
  busquedaRealizada = false;

  aplicarFiltros() {
    if (!this.filtrosValidos) return;
    const cat = this.categorias.find(c => c.id === this.filterCategoria)!;
    this.filtrosAplicados = {
      tipo: this.filterTipo!,
      entidad: this.filterEntidad!,
      anio: this.filterAnio!,
      categoria: cat,
      periodo: this.filterPeriodo!,
    };
    this.busquedaRealizada = true;
    this.filtersCollapsed = true;
    // Cargar mensajes mock (reset al estado inicial cada consulta)
    this.mensajesNoPermisibles = [...this.mensajesNoPermisiblesIniciales];
    this.mensajesPermisibles = [...this.mensajesPermisiblesIniciales];
    this.selectedNoPermisibles = [];
    this.selectedPermisibles = [];
    this.busquedaNoPermisibles = '';
    this.busquedaPermisibles = '';
  }

  limpiarFiltros() {
    this.filterTipo = null;
    this.filterEntidad = null;
    this.filterAnio = null;
    this.filterCategoria = null;
    this.filterPeriodo = null;
    this.filtrosAplicados = null;
    this.busquedaRealizada = false;
  }

  // Etiquetas de resumen (panel colapsado)
  get resumenEntidad(): string {
    if (!this.filtrosAplicados) return '';
    const e = this.filtrosAplicados.entidad;
    return `${e.codigo} - ${e.razonSocial}`;
  }

  get resumenPeriodoLabel(): string {
    if (!this.filtrosAplicados) return '';
    const cat = this.filtrosAplicados.categoria;
    const opts = (cat.tipoPeriodo === 'mensual'
      ? ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
          .map((m, i) => ({ label: m, value: String(i + 1).padStart(2, '0') }))
      : cat.tipoPeriodo === 'trimestral'
        ? [
            { label: 'I Trimestre', value: 'T1' },
            { label: 'II Trimestre', value: 'T2' },
            { label: 'III Trimestre', value: 'T3' },
            { label: 'IV Trimestre', value: 'T4' },
          ]
        : [
            { label: 'I Semestre', value: 'S1' },
            { label: 'II Semestre', value: 'S2' },
          ]);
    return opts.find(o => o.value === this.filtrosAplicados!.periodo)?.label ?? '';
  }

  // ───────────────────────────────────────────────
  // Mock de mensajes (carga inicial al consultar)
  // ───────────────────────────────────────────────
  private readonly mensajesNoPermisiblesIniciales: Mensaje[] = [
    { id: 'M-001', codigo: '1110-COD-01', descripcion: 'El saldo de Caja debe ser igual al reportado en el formulario CGN2020_001' },
    { id: 'M-002', codigo: '1110-COD-02', descripcion: 'La sumatoria de Bancos no puede superar el total de Efectivo y equivalentes' },
    { id: 'M-003', codigo: '1305-COD-03', descripcion: 'Las cuentas por cobrar deben tener vencimiento informado' },
    { id: 'M-004', codigo: '1305-COD-04', descripcion: 'El deudor relacionado debe existir en el catálogo central' },
    { id: 'M-005', codigo: '1605-COD-05', descripcion: 'La depreciación acumulada no puede exceder el valor del bien' },
    { id: 'M-006', codigo: '2401-COD-06', descripcion: 'Las retenciones practicadas deben coincidir con el formulario tributario' },
    { id: 'M-007', codigo: '3105-COD-07', descripcion: 'El capital fiscal debe estar conciliado con la contabilidad patrimonial' },
    { id: 'M-008', codigo: '4110-COD-08', descripcion: 'Los ingresos tributarios deben tener municipio de origen informado' },
    { id: 'M-009', codigo: '5101-COD-09', descripcion: 'Los gastos de personal deben estar respaldados por nómina cargada' },
    { id: 'M-010', codigo: '8120-COD-10', descripcion: 'Las cuentas de orden deudoras requieren detalle por tercero' },
  ];

  private readonly mensajesPermisiblesIniciales: Mensaje[] = [
    { id: 'M-101', codigo: '1110-COD-21', descripcion: 'Diferencia menor a $1.000 en arqueo de caja (tolerancia operativa)' },
    { id: 'M-102', codigo: '1305-COD-22', descripcion: 'Cuenta por cobrar sin tercero cuando es ingreso anónimo de tasas' },
    { id: 'M-103', codigo: '1605-COD-23', descripcion: 'Avalúo técnico vigente excede valor en libros menos del 5%' },
  ];

  mensajesNoPermisibles: Mensaje[] = [];
  mensajesPermisibles: Mensaje[] = [];

  selectedNoPermisibles: Mensaje[] = [];
  selectedPermisibles: Mensaje[] = [];

  busquedaNoPermisibles = '';
  busquedaPermisibles = '';

  get noPermisiblesFiltrados(): Mensaje[] {
    return this.filtrarMensajes(this.mensajesNoPermisibles, this.busquedaNoPermisibles);
  }

  get permisiblesFiltrados(): Mensaje[] {
    return this.filtrarMensajes(this.mensajesPermisibles, this.busquedaPermisibles);
  }

  private filtrarMensajes(lista: Mensaje[], q: string): Mensaje[] {
    const query = q.trim().toLowerCase();
    if (!query) return lista;
    return lista.filter(m =>
      m.codigo.toLowerCase().includes(query)
      || m.descripcion.toLowerCase().includes(query)
    );
  }

  // ───────────────────────────────────────────────
  // Transferencias entre listas
  // ───────────────────────────────────────────────
  moverSeleccionadosAPermisibles() {
    if (this.selectedNoPermisibles.length === 0) return;
    const cantidad = this.selectedNoPermisibles.length;
    this.mensajesPermisibles = [...this.mensajesPermisibles, ...this.selectedNoPermisibles];
    const ids = new Set(this.selectedNoPermisibles.map(m => m.id));
    this.mensajesNoPermisibles = this.mensajesNoPermisibles.filter(m => !ids.has(m.id));
    this.selectedNoPermisibles = [];
    this.messageService.add({
      severity: 'success',
      summary: 'Mensajes convertidos',
      detail: `${cantidad} mensaje${cantidad === 1 ? '' : 's'} ahora ${cantidad === 1 ? 'es permisible' : 'son permisibles'}.`,
      life: 4000,
    });
  }

  moverSeleccionadosANoPermisibles() {
    if (this.selectedPermisibles.length === 0) return;
    const cantidad = this.selectedPermisibles.length;
    this.mensajesNoPermisibles = [...this.mensajesNoPermisibles, ...this.selectedPermisibles];
    const ids = new Set(this.selectedPermisibles.map(m => m.id));
    this.mensajesPermisibles = this.mensajesPermisibles.filter(m => !ids.has(m.id));
    this.selectedPermisibles = [];
    this.messageService.add({
      severity: 'info',
      summary: 'Mensajes revertidos',
      detail: `${cantidad} mensaje${cantidad === 1 ? '' : 's'} ${cantidad === 1 ? 'volvió a No Permisible' : 'volvieron a No Permisibles'}.`,
      life: 4000,
    });
  }

  // Confirmaciones para "mover todos"
  showConfirmTodosAPermisibles = false;
  showConfirmTodosANoPermisibles = false;

  confirmarTodosAPermisibles() {
    if (this.mensajesNoPermisibles.length === 0) return;
    this.showConfirmTodosAPermisibles = true;
  }

  confirmarTodosANoPermisibles() {
    if (this.mensajesPermisibles.length === 0) return;
    this.showConfirmTodosANoPermisibles = true;
  }

  ejecutarTodosAPermisibles() {
    const cantidad = this.mensajesNoPermisibles.length;
    this.mensajesPermisibles = [...this.mensajesPermisibles, ...this.mensajesNoPermisibles];
    this.mensajesNoPermisibles = [];
    this.selectedNoPermisibles = [];
    this.showConfirmTodosAPermisibles = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Todos los mensajes convertidos',
      detail: `${cantidad} mensaje${cantidad === 1 ? '' : 's'} ${cantidad === 1 ? 'es ahora permisible' : 'son ahora permisibles'}.`,
      life: 4000,
    });
  }

  ejecutarTodosANoPermisibles() {
    const cantidad = this.mensajesPermisibles.length;
    this.mensajesNoPermisibles = [...this.mensajesNoPermisibles, ...this.mensajesPermisibles];
    this.mensajesPermisibles = [];
    this.selectedPermisibles = [];
    this.showConfirmTodosANoPermisibles = false;
    this.messageService.add({
      severity: 'warn',
      summary: 'Todos los mensajes revertidos',
      detail: `${cantidad} mensaje${cantidad === 1 ? '' : 's'} ${cantidad === 1 ? 'volvió a No Permisible' : 'volvieron a No Permisibles'}.`,
      life: 4000,
    });
  }
}
