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
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import { SesionService } from '../../../services/sesion.service';
import {
  DirectorioEntidadesComponent,
  Entidad,
} from '../../../components/directorio-entidades/directorio-entidades.component';
import {
  OpcionPeriodo,
  Periodicidad,
  etiquetaPeriodo,
  periodosDe,
} from '../../../services/periodos';

interface Categoria {
  id: string;
  nombre: string;
  /** Cada categoría reporta con su propia periodicidad. */
  tipoPeriodo: Periodicidad;
}

interface Mensaje {
  id: string;
  codigo: string;
  descripcion: string;
}

type Tipo = 'local' | 'central';

/** Tipo de usuario CHIP: Central, Estratégico, Local, Analista. */
type TipoUsuario = 'C' | 'E' | 'L' | 'A';

/** Deriva el tipo de usuario del tipo de la entidad en sesión. */
function tipoUsuarioDe(tipoEntidad: string | undefined): TipoUsuario {
  const t = (tipoEntidad ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  switch (t) {
    case 'central': return 'C';
    case 'estrategico': return 'E';
    case 'local': return 'L';
    default: return 'A';
  }
}

/** Sólo los usuarios Central y Estratégico tienen categorías habilitadas. */
const TIPOS_USUARIO_CON_CATEGORIAS: readonly TipoUsuario[] = ['C', 'E'];

/** Niveles de la cascada: limpiar uno limpia todo lo que depende de él. */
type NivelFiltro = 'entidad' | 'categoria' | 'anio';

@Component({
  selector: 'app-levantamiento-restricciones',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, IconFieldModule, InputIconModule,
    SelectModule, ListboxModule, DialogModule, ChipModule, TooltipModule,
    TagModule, ToastModule, MessageModule,
    AppBreadcrumbComponent, DirectorioEntidadesComponent,
  ],
  providers: [MessageService],
  templateUrl: './levantamiento-restricciones.component.html',
  styleUrl: './levantamiento-restricciones.component.scss',
})
export class LevantamientoRestriccionesComponent {
  constructor(
    private messageService: MessageService,
    private sesion: SesionService,
  ) {}

  // ───────────────────────────────────────────────
  // Estado del panel de filtros
  // Orden y cascada (HU-ET-022):
  //   Entidad → Categoría → Año → Período → Tipo deficiencia
  //   Categoría        depende de Entidad
  //   Año              depende de Entidad + Categoría
  //   Período          depende de Entidad + Categoría + Año
  //   Tipo deficiencia depende sólo de Categoría
  // ───────────────────────────────────────────────
  filtersCollapsed = false;

  filterEntidad: Entidad | null = null;
  filterCategoria: string | null = null;
  filterAnio: string | null = null;
  filterPeriodo: string | null = null;
  filterTipo: Tipo | null = null;

  /** Snapshot de filtros aplicados en la última consulta (para chips y resumen). */
  filtrosAplicados: {
    entidad: Entidad;
    categoria: Categoria;
    anio: string;
    periodo: string;
    tipo: Tipo;
  } | null = null;

  mostrarDirectorioEntidades = false;

  /** Se activa al pulsar "Aplicar filtros" con obligatorios vacíos. */
  intentoAplicar = false;

  /** Mock: categorías configuradas, cada una con su periodicidad de reporte. */
  readonly categorias: Categoria[] = [
    { id: 'gob', nombre: 'Entidades de Gobierno', tipoPeriodo: 'trimestral' },
    { id: 'emp', nombre: 'Empresas Públicas', tipoPeriodo: 'trimestral' },
    { id: 'liq', nombre: 'Entidades en Liquidación', tipoPeriodo: 'semestral' },
    { id: 'uni', nombre: 'Entes Universitarios Autónomos', tipoPeriodo: 'mensual' },
    { id: 'cgr', nombre: 'CGR Personal y Costos', tipoPeriodo: 'anual' },
  ];

  private readonly TIPO_DEFICIENCIA_OPTIONS = [
    { label: 'Local', value: 'local' as Tipo },
    { label: 'Central', value: 'central' as Tipo },
  ];

  // Opciones de los filtros dependientes: vacías hasta que su(s) padre(s) tengan valor.
  categoriaOptions: { label: string; value: string }[] = [];
  anioOptions: { label: string; value: string }[] = [];
  periodoOptions: OpcionPeriodo[] = [];
  tipoOptions: { label: string; value: Tipo }[] = [];

  // ─── Perfil del usuario ───
  get tipoUsuario(): TipoUsuario {
    return tipoUsuarioDe(this.sesion.usuario()?.entidad.tipo);
  }

  /** Categorías habilitadas para el usuario en sesión (sólo Central y Estratégico). */
  get categoriasHabilitadas(): Categoria[] {
    return TIPOS_USUARIO_CON_CATEGORIAS.includes(this.tipoUsuario) ? this.categorias : [];
  }

  get sinCategoriasHabilitadas(): boolean {
    return this.categoriasHabilitadas.length === 0;
  }

  // ─── Habilitación por dependencias ───
  get categoriaHabilitada(): boolean {
    return !!this.filterEntidad;
  }

  get anioHabilitado(): boolean {
    return !!(this.filterEntidad && this.filterCategoria);
  }

  get periodoHabilitado(): boolean {
    return !!(this.filterEntidad && this.filterCategoria && this.filterAnio);
  }

  get tipoHabilitado(): boolean {
    return !!this.filterCategoria;
  }

  private get categoriaSeleccionada(): Categoria | undefined {
    return this.categorias.find(c => c.id === this.filterCategoria);
  }

  /** Placeholder del período: indica la periodicidad de la categoría. */
  get periodoPlaceholder(): string {
    const cat = this.categoriaSeleccionada;
    if (!this.periodoHabilitado || !cat) return 'Complete los filtros previos';
    return `Seleccione el período (${cat.tipoPeriodo})`;
  }

  /**
   * Limpia y deshabilita los filtros que dependen del nivel indicado.
   * entidad → categoría, año, período, tipo
   * categoría → año, período, tipo
   * año → período
   */
  private limpiarDependientesDe(nivel: NivelFiltro) {
    if (nivel === 'entidad') {
      this.filterCategoria = null;
      this.categoriaOptions = [];
    }
    if (nivel === 'entidad' || nivel === 'categoria') {
      this.filterAnio = null;
      this.anioOptions = [];
      this.filterTipo = null;
      this.tipoOptions = [];
    }
    this.filterPeriodo = null;
    this.periodoOptions = [];
  }

  // ─── Carga de opciones (sólo con el padre diligenciado) ───
  private cargarCategorias() {
    if (!this.filterEntidad) return;
    this.categoriaOptions = this.categoriasHabilitadas.map(c => ({ label: c.nombre, value: c.id }));
  }

  private cargarAnios() {
    const cat = this.categoriaSeleccionada;
    if (!this.filterEntidad || !cat) return;
    // Mock: en producción los años vienen del backend según entidad + categoría.
    // Los entes universitarios reportan en CHIP desde 2025.
    const anios = cat.id === 'uni' ? ['2025', '2026'] : ['2024', '2025', '2026'];
    this.anioOptions = anios.map(a => ({ label: a, value: a }));
  }

  private cargarPeriodos() {
    const cat = this.categoriaSeleccionada;
    if (!this.periodoHabilitado || !cat) return;
    this.periodoOptions = periodosDe(cat.tipoPeriodo);
  }

  private cargarTiposDeficiencia() {
    if (!this.filterCategoria) return;
    this.tipoOptions = [...this.TIPO_DEFICIENCIA_OPTIONS];
  }

  // ─── Cambios en los filtros ───
  onCategoriaChange() {
    this.limpiarDependientesDe('categoria');
    this.cargarAnios();
    this.cargarTiposDeficiencia();
  }

  onAnioChange() {
    this.limpiarDependientesDe('anio');
    this.cargarPeriodos();
  }

  // ─── Validación ───
  /** Obligatorios sin diligenciar, en el orden del panel. */
  get filtrosFaltantes(): string[] {
    const faltantes: string[] = [];
    if (!this.filterEntidad) faltantes.push('Entidad');
    if (!this.filterCategoria) faltantes.push('Categoría');
    if (!this.filterAnio) faltantes.push('Año');
    if (!this.filterPeriodo) faltantes.push('Período');
    if (!this.filterTipo) faltantes.push('Tipo deficiencia');
    return faltantes;
  }

  get filtrosValidos(): boolean {
    return this.filtrosFaltantes.length === 0;
  }

  get mostrarFaltantes(): boolean {
    return this.intentoAplicar && !this.filtrosValidos;
  }

  /** "Entidad, Año y Período" */
  get faltantesTexto(): string {
    const f = this.filtrosFaltantes;
    return f.length <= 1 ? f.join('') : `${f.slice(0, -1).join(', ')} y ${f[f.length - 1]}`;
  }

  campoInvalido(nombre: string): boolean {
    return this.intentoAplicar && this.filtrosFaltantes.includes(nombre);
  }

  get activeFilterCount(): number {
    return [this.filterEntidad, this.filterCategoria, this.filterAnio,
            this.filterPeriodo, this.filterTipo].filter(v => !!v).length;
  }

  // ───────────────────────────────────────────────
  // Directorio de entidades (HU-ET-024)
  // La entidad se elige siempre desde el modal; no hay carga automática.
  // ───────────────────────────────────────────────
  abrirDirectorioEntidades() {
    if (this.sinCategoriasHabilitadas) return;
    this.mostrarDirectorioEntidades = true;
  }

  onEntidadSeleccionada(e: Entidad) {
    if (this.filterEntidad?.codigo === e.codigo) return;
    this.filterEntidad = e;
    this.limpiarDependientesDe('entidad');
    this.cargarCategorias();
  }

  limpiarEntidad() {
    this.filterEntidad = null;
    this.limpiarDependientesDe('entidad');
  }

  // ───────────────────────────────────────────────
  // Aplicar / Limpiar filtros
  // ───────────────────────────────────────────────
  busquedaRealizada = false;

  aplicarFiltros() {
    if (!this.filtrosValidos) {
      this.intentoAplicar = true;
      return;
    }
    this.intentoAplicar = false;
    const cat = this.categoriaSeleccionada!;
    this.filtrosAplicados = {
      entidad: this.filterEntidad!,
      categoria: cat,
      anio: this.filterAnio!,
      periodo: this.filterPeriodo!,
      tipo: this.filterTipo!,
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
    // Nueva consulta = nuevo estado base: ningún mensaje se considera modificado.
    this.mensajesModificadosIds.clear();
  }

  limpiarFiltros() {
    this.filterEntidad = null;
    this.limpiarDependientesDe('entidad');
    this.intentoAplicar = false;
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
    return etiquetaPeriodo(
      this.filtrosAplicados.categoria.tipoPeriodo,
      this.filtrosAplicados.periodo,
    );
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

  /**
   * IDs de mensajes que han sido movidos desde la interfaz al menos una vez
   * durante la consulta actual. Alimenta el badge "Modificado" que se muestra
   * junto al código en cada tarjeta. Se vacía al aplicar nuevos filtros.
   */
  private mensajesModificadosIds = new Set<string>();

  esModificado(id: string): boolean {
    return this.mensajesModificadosIds.has(id);
  }

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
    ids.forEach(id => this.mensajesModificadosIds.add(id));
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
    ids.forEach(id => this.mensajesModificadosIds.add(id));
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
    this.mensajesNoPermisibles.forEach(m => this.mensajesModificadosIds.add(m.id));
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
    this.mensajesPermisibles.forEach(m => this.mensajesModificadosIds.add(m.id));
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
