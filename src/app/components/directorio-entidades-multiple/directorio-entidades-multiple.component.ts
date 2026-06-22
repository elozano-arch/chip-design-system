import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';

import { Entidad } from '../directorio-entidades/directorio-entidades.component';

export type { Entidad };

/**
 * Directorio de Entidades — versión de SELECCIÓN MÚLTIPLE (checkbox).
 *
 * Variante paralela a <app-directorio-entidades> (selección única), pensada
 * para pantallas que necesitan elegir varias entidades a la vez. El componente
 * original queda intacto para no afectar el wizard de Formularios.
 *
 * Persistencia: lo ya seleccionado vuelve a verse marcado al reabrir el modal.
 * Se logra sincronizando la selección interna desde [seleccionadas] cada vez
 * que el modal se abre (la tabla usa dataKey="codigo" para reflejar los checks)
 * y conservando filtros/resultados entre aperturas.
 */
@Component({
  selector: 'app-directorio-entidades-multiple',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, IconFieldModule, InputIconModule,
    SelectModule, TableModule, DialogModule, TagModule, CheckboxModule,
    TooltipModule,
  ],
  templateUrl: './directorio-entidades-multiple.component.html',
  styleUrl: './directorio-entidades-multiple.component.scss',
})
export class DirectorioEntidadesMultipleComponent implements OnChanges {
  /** Visibilidad del modal (two-way binding). */
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** Listado de entidades (si no se pasa usa el mock interno). */
  @Input() entidades: Entidad[] | null = null;

  /** Entidades ya seleccionadas — se reflejan marcadas al abrir el modal. */
  @Input() seleccionadas: Entidad[] = [];

  /** Muestra/oculta el filtro de Estado del modal. */
  @Input() showEstadoFilter = true;

  /**
   * Flag de scoping: habilita el acordeón colapsable de los filtros del modal.
   * Al consultar, los filtros se colapsan automáticamente para dar alto a la
   * tabla de resultados (clave en pantallas chicas, p. ej. portátiles de 14").
   */
  @Input() filtrosColapsables = false;
  filtrosColapsados = false;

  /** Emite la lista completa de entidades seleccionadas al hacer Aceptar. */
  @Output() seleccionar = new EventEmitter<Entidad[]>();

  // Filtros internos del modal
  fCodigo = '';
  fNit = '';
  fRazonSocial = '';
  fDepartamento = '';
  fMunicipio = '';
  fEstado = '';

  readonly estadoOptions = [
    { label: 'Todos', value: '' },
    { label: 'Activo', value: 'Activo' },
    { label: 'Inactivo', value: 'Inactivo' },
  ];

  // Estado de la búsqueda
  busquedaRealizada = false;
  resultados: Entidad[] = [];

  // Selección múltiple actual (vinculada a la tabla por dataKey="codigo")
  seleccion: Entidad[] = [];

  // Mock de entidades — usado si el padre no pasa una lista propia
  private readonly entidadesMock: Entidad[] = [
    { codigo: '210111001', nit: '800.123.456-1', razonSocial: 'Municipio de Leticia', departamento: 'Amazonas', municipio: 'Leticia', estado: 'Activo' },
    { codigo: '210105001', nit: '800.234.567-2', razonSocial: 'Gobernación de Antioquia', departamento: 'Antioquia', municipio: 'Medellín', estado: 'Activo' },
    { codigo: '210111076', nit: '800.345.678-3', razonSocial: 'Municipio de Puerto Nariño', departamento: 'Amazonas', municipio: 'Puerto Nariño', estado: 'Inactivo' },
    { codigo: '210108001', nit: '800.456.789-4', razonSocial: 'Gobernación del Atlántico', departamento: 'Atlántico', municipio: 'Barranquilla', estado: 'Activo' },
    { codigo: '210111002', nit: '800.567.890-5', razonSocial: 'Empresa de Servicios Públicos de Leticia', departamento: 'Amazonas', municipio: 'Leticia', estado: 'Activo' },
    { codigo: '210105088', nit: '800.678.901-6', razonSocial: 'Municipio de Bello', departamento: 'Antioquia', municipio: 'Bello', estado: 'Activo' },
    { codigo: '210105360', nit: '800.789.012-7', razonSocial: 'Municipio de Itagüí', departamento: 'Antioquia', municipio: 'Itagüí', estado: 'Inactivo' },
    { codigo: '211511001', nit: '800.890.123-8', razonSocial: 'Alcaldía Mayor de Bogotá D.C.', departamento: 'Cundinamarca', municipio: 'Bogotá D.C.', estado: 'Activo' },
    { codigo: '210176001', nit: '800.901.234-9', razonSocial: 'Gobernación del Valle del Cauca', departamento: 'Valle del Cauca', municipio: 'Cali', estado: 'Activo' },
    { codigo: '210173001', nit: '801.012.345-0', razonSocial: 'Gobernación del Tolima', departamento: 'Tolima', municipio: 'Ibagué', estado: 'Activo' },
    { codigo: '210168001', nit: '801.123.456-1', razonSocial: 'Gobernación de Santander', departamento: 'Santander', municipio: 'Bucaramanga', estado: 'Inactivo' },
    { codigo: '210113001', nit: '801.234.567-2', razonSocial: 'Gobernación de Bolívar', departamento: 'Bolívar', municipio: 'Cartagena de Indias', estado: 'Activo' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    // Al abrir el modal, sincroniza la selección interna con lo que el padre
    // tiene guardado (refleja también las entidades que el padre haya quitado).
    if (changes['visible'] && this.visible) {
      this.seleccion = [...this.seleccionadas];
    }
  }

  // Opciones de departamento/municipio derivadas del listado
  get departamentoOptions() {
    const data = this.entidades ?? this.entidadesMock;
    const set = new Set(data.map(e => e.departamento));
    return [
      { label: 'Todos', value: '' },
      ...Array.from(set).sort().map(d => ({ label: d, value: d })),
    ];
  }

  get municipioOptions() {
    const data = this.entidades ?? this.entidadesMock;
    const filtrados = this.fDepartamento
      ? data.filter(e => e.departamento === this.fDepartamento)
      : data;
    const set = new Set(filtrados.map(e => e.municipio));
    return [
      { label: 'Todos', value: '' },
      ...Array.from(set).sort().map(m => ({ label: m, value: m })),
    ];
  }

  /** Si cambia el departamento, reset municipio. */
  onDepartamentoChange() {
    this.fMunicipio = '';
  }

  /** Indica si hay al menos un filtro con valor (para habilitar Consultar/Limpiar). */
  get tieneAlgunFiltro(): boolean {
    return !!(this.fCodigo.trim() || this.fNit.trim() || this.fRazonSocial.trim()
              || this.fDepartamento || this.fMunicipio || this.fEstado);
  }

  consultar() {
    const data = this.entidades ?? this.entidadesMock;
    const qc = this.fCodigo.trim().toLowerCase();
    const qn = this.fNit.trim().toLowerCase();
    const qr = this.fRazonSocial.trim().toLowerCase();
    this.resultados = data.filter(e => {
      const matchCodigo = !qc || e.codigo.toLowerCase().includes(qc);
      const matchNit = !qn || e.nit.toLowerCase().includes(qn);
      const matchRazon = !qr || this.normaliza(e.razonSocial).includes(this.normaliza(qr));
      const matchDpto = !this.fDepartamento || e.departamento === this.fDepartamento;
      const matchMun = !this.fMunicipio || e.municipio === this.fMunicipio;
      const matchEstado = !this.fEstado || e.estado === this.fEstado;
      return matchCodigo && matchNit && matchRazon && matchDpto && matchMun && matchEstado;
    });
    this.busquedaRealizada = true;
    // Colapsa los filtros para dar alto a la tabla (pantallas chicas).
    if (this.filtrosColapsables) this.filtrosColapsados = true;
  }

  /** Limpia los filtros y resultados — conserva la selección acumulada. */
  limpiar() {
    this.fCodigo = '';
    this.fNit = '';
    this.fRazonSocial = '';
    this.fDepartamento = '';
    this.fMunicipio = '';
    this.fEstado = '';
    this.resultados = [];
    this.busquedaRealizada = false;
    this.filtrosColapsados = false;
  }

  /** True si la entidad está en la selección actual. */
  estaSeleccionada(e: Entidad): boolean {
    return this.seleccion.some(s => s.codigo === e.codigo);
  }

  cancelar() {
    this.cerrar();
  }

  aceptar() {
    this.seleccionar.emit([...this.seleccion]);
    this.cerrar();
  }

  private cerrar() {
    this.visible = false;
    this.visibleChange.emit(false);
    // No se resetean filtros/resultados: al reabrir se conserva el contexto
    // y la selección vuelve a verse marcada (se sincroniza en ngOnChanges).
  }

  /** Normaliza texto: lowercase + sin tildes. */
  private normaliza(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
}
