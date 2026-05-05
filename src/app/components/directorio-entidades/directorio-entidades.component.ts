import { Component, EventEmitter, Input, Output } from '@angular/core';
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
import { RadioButtonModule } from 'primeng/radiobutton';
import { TooltipModule } from 'primeng/tooltip';

export interface Entidad {
  codigo: string;
  nit: string;
  razonSocial: string;
  departamento: string;
  municipio: string;
}

@Component({
  selector: 'app-directorio-entidades',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, IconFieldModule, InputIconModule,
    SelectModule, TableModule, DialogModule, TagModule, RadioButtonModule,
    TooltipModule,
  ],
  templateUrl: './directorio-entidades.component.html',
  styleUrl: './directorio-entidades.component.scss',
})
export class DirectorioEntidadesComponent {
  /** Visibilidad del modal (two-way binding). */
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** Listado de entidades (si no se pasa usa el mock interno). */
  @Input() entidades: Entidad[] | null = null;

  /** Emite la entidad seleccionada al hacer Aceptar. */
  @Output() seleccionar = new EventEmitter<Entidad>();

  // Filtros internos del modal
  fCodigo = '';
  fNit = '';
  fRazonSocial = '';
  fDepartamento = '';
  fMunicipio = '';

  // Estado de la búsqueda
  busquedaRealizada = false;
  resultados: Entidad[] = [];

  // Selección actual
  seleccion: Entidad | null = null;

  // Mock de entidades — usado si el padre no pasa una lista propia
  private readonly entidadesMock: Entidad[] = [
    { codigo: '210111001', nit: '800.123.456-1', razonSocial: 'Municipio de Leticia', departamento: 'Amazonas', municipio: 'Leticia' },
    { codigo: '210105001', nit: '800.234.567-2', razonSocial: 'Gobernación de Antioquia', departamento: 'Antioquia', municipio: 'Medellín' },
    { codigo: '210111076', nit: '800.345.678-3', razonSocial: 'Municipio de Puerto Nariño', departamento: 'Amazonas', municipio: 'Puerto Nariño' },
    { codigo: '210108001', nit: '800.456.789-4', razonSocial: 'Gobernación del Atlántico', departamento: 'Atlántico', municipio: 'Barranquilla' },
    { codigo: '210111002', nit: '800.567.890-5', razonSocial: 'Empresa de Servicios Públicos de Leticia', departamento: 'Amazonas', municipio: 'Leticia' },
    { codigo: '210105088', nit: '800.678.901-6', razonSocial: 'Municipio de Bello', departamento: 'Antioquia', municipio: 'Bello' },
    { codigo: '210105360', nit: '800.789.012-7', razonSocial: 'Municipio de Itagüí', departamento: 'Antioquia', municipio: 'Itagüí' },
    { codigo: '211511001', nit: '800.890.123-8', razonSocial: 'Alcaldía Mayor de Bogotá D.C.', departamento: 'Cundinamarca', municipio: 'Bogotá D.C.' },
    { codigo: '210176001', nit: '800.901.234-9', razonSocial: 'Gobernación del Valle del Cauca', departamento: 'Valle del Cauca', municipio: 'Cali' },
    { codigo: '210173001', nit: '801.012.345-0', razonSocial: 'Gobernación del Tolima', departamento: 'Tolima', municipio: 'Ibagué' },
    { codigo: '210168001', nit: '801.123.456-1', razonSocial: 'Gobernación de Santander', departamento: 'Santander', municipio: 'Bucaramanga' },
    { codigo: '210113001', nit: '801.234.567-2', razonSocial: 'Gobernación de Bolívar', departamento: 'Bolívar', municipio: 'Cartagena de Indias' },
  ];

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
              || this.fDepartamento || this.fMunicipio);
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
      return matchCodigo && matchNit && matchRazon && matchDpto && matchMun;
    });
    this.busquedaRealizada = true;
    this.seleccion = null;
  }

  limpiar() {
    this.fCodigo = '';
    this.fNit = '';
    this.fRazonSocial = '';
    this.fDepartamento = '';
    this.fMunicipio = '';
    this.resultados = [];
    this.busquedaRealizada = false;
    this.seleccion = null;
  }

  cancelar() {
    this.cerrar();
  }

  aceptar() {
    if (!this.seleccion) return;
    this.seleccionar.emit(this.seleccion);
    this.cerrar();
  }

  private cerrar() {
    this.visible = false;
    this.visibleChange.emit(false);
    // Reset interno al cerrar para próxima apertura
    this.limpiar();
  }

  /** Normaliza texto: lowercase + sin tildes. */
  private normaliza(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
}
