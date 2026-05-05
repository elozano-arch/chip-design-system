import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { DatePickerModule } from 'primeng/datepicker';
import { MenuItem } from 'primeng/api';

interface Usuario {
  codigo: string;
  nombre: string;
  correo: string;
  perfil: string;
  entidad: string;
  departamento: string;
  activo: boolean;
  ultimoAcceso: string;
  fechaCreacion: string;
  tipoDocumento: string;
}

@Component({
  selector: 'app-filtros',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    SelectModule,
    InputTextModule,
    BreadcrumbModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    ChipModule,
    DatePickerModule,
  ],
  templateUrl: './filtros.component.html',
  styleUrl: './filtros.component.scss',
})
export class FiltrosComponent {
  breadcrumbItems: MenuItem[] = [
    { label: 'Pantallas', icon: 'pi pi-th-large', routerLink: '/pantallas/correos' },
    { label: 'Propuesta de Filtros' },
  ];
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  /* ══════════════════════════════════════════════ */
  /* 8 Filtros                                      */
  /* ══════════════════════════════════════════════ */
  searchText = '';
  filterPerfil = '';
  filterEstado = '';
  filterEntidad = '';
  filterDepartamento = '';
  filterTipoDoc = '';
  filterFechaDesde: Date | null = null;
  filterFechaHasta: Date | null = null;

  perfilOptions = [
    { label: 'Administrador', value: 'Administrador' },
    { label: 'Supervisor', value: 'Supervisor' },
    { label: 'Consultor', value: 'Consultor' },
    { label: 'Auditor', value: 'Auditor' },
    { label: 'Entidad', value: 'Entidad' },
  ];

  estadoOptions = [
    { label: 'Activo', value: 'Activo' },
    { label: 'Inactivo', value: 'Inactivo' },
  ];

  entidadOptions = [
    { label: 'Ministerio de Hacienda', value: 'Ministerio de Hacienda' },
    { label: 'DNP', value: 'DNP' },
    { label: 'Contraloría General', value: 'Contraloría General' },
    { label: 'DAFP', value: 'DAFP' },
    { label: 'Secretaría de Hacienda', value: 'Secretaría de Hacienda' },
    { label: 'DIAN', value: 'DIAN' },
  ];

  departamentoOptions = [
    { label: 'Cundinamarca', value: 'Cundinamarca' },
    { label: 'Antioquia', value: 'Antioquia' },
    { label: 'Valle del Cauca', value: 'Valle del Cauca' },
    { label: 'Atlántico', value: 'Atlántico' },
    { label: 'Santander', value: 'Santander' },
  ];

  tipoDocOptions = [
    { label: 'Cédula de ciudadanía', value: 'CC' },
    { label: 'Cédula de extranjería', value: 'CE' },
    { label: 'Pasaporte', value: 'PA' },
    { label: 'NIT', value: 'NIT' },
  ];

  /* ── Opción B: colapsable ── */
  filtersCollapsed = false;

  /* ── Data de ejemplo ── */
  usuarios: Usuario[] = [
    { codigo: 'USR-001', nombre: 'María García López', correo: 'maria.garcia@minhacienda.gov.co', perfil: 'Administrador', entidad: 'Ministerio de Hacienda', departamento: 'Cundinamarca', activo: true, ultimoAcceso: '2025-01-15', fechaCreacion: '2023-03-10', tipoDocumento: 'CC' },
    { codigo: 'USR-002', nombre: 'Carlos Rodríguez M.', correo: 'carlos.rodriguez@dnp.gov.co', perfil: 'Supervisor', entidad: 'DNP', departamento: 'Cundinamarca', activo: true, ultimoAcceso: '2025-01-14', fechaCreacion: '2023-06-22', tipoDocumento: 'CC' },
    { codigo: 'USR-003', nombre: 'Ana Martínez Ruiz', correo: 'ana.martinez@cgr.gov.co', perfil: 'Auditor', entidad: 'Contraloría General', departamento: 'Antioquia', activo: false, ultimoAcceso: '2024-12-20', fechaCreacion: '2022-11-05', tipoDocumento: 'CE' },
    { codigo: 'USR-004', nombre: 'Luis Fernández P.', correo: 'luis.fernandez@dafp.gov.co', perfil: 'Consultor', entidad: 'DAFP', departamento: 'Valle del Cauca', activo: true, ultimoAcceso: '2025-01-13', fechaCreacion: '2024-01-18', tipoDocumento: 'CC' },
    { codigo: 'USR-005', nombre: 'Sandra Gómez Torres', correo: 'sandra.gomez@shd.gov.co', perfil: 'Entidad', entidad: 'Secretaría de Hacienda', departamento: 'Atlántico', activo: true, ultimoAcceso: '2025-01-12', fechaCreacion: '2024-04-30', tipoDocumento: 'PA' },
    { codigo: 'USR-006', nombre: 'Jorge Pérez Castaño', correo: 'jorge.perez@dian.gov.co', perfil: 'Supervisor', entidad: 'DIAN', departamento: 'Santander', activo: true, ultimoAcceso: '2025-01-10', fechaCreacion: '2023-09-14', tipoDocumento: 'CC' },
    { codigo: 'USR-007', nombre: 'Laura Díaz Montoya', correo: 'laura.diaz@minhacienda.gov.co', perfil: 'Consultor', entidad: 'Ministerio de Hacienda', departamento: 'Cundinamarca', activo: false, ultimoAcceso: '2024-11-28', fechaCreacion: '2022-07-02', tipoDocumento: 'NIT' },
  ];

  get filteredUsuarios(): Usuario[] {
    return this.usuarios.filter(u => {
      const matchSearch = !this.searchText ||
        u.nombre.toLowerCase().includes(this.searchText.toLowerCase()) ||
        u.codigo.toLowerCase().includes(this.searchText.toLowerCase()) ||
        u.correo.toLowerCase().includes(this.searchText.toLowerCase());
      const matchPerfil = !this.filterPerfil || u.perfil === this.filterPerfil;
      const matchEstado = !this.filterEstado ||
        (this.filterEstado === 'Activo' ? u.activo : !u.activo);
      const matchEntidad = !this.filterEntidad || u.entidad === this.filterEntidad;
      const matchDepto = !this.filterDepartamento || u.departamento === this.filterDepartamento;
      const matchTipoDoc = !this.filterTipoDoc || u.tipoDocumento === this.filterTipoDoc;
      return matchSearch && matchPerfil && matchEstado && matchEntidad && matchDepto && matchTipoDoc;
    });
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.searchText) count++;
    if (this.filterPerfil) count++;
    if (this.filterEstado) count++;
    if (this.filterEntidad) count++;
    if (this.filterDepartamento) count++;
    if (this.filterTipoDoc) count++;
    if (this.filterFechaDesde) count++;
    if (this.filterFechaHasta) count++;
    return count;
  }

  get activeFilters(): { label: string; field: string }[] {
    const filters: { label: string; field: string }[] = [];
    if (this.searchText) filters.push({ label: `Búsqueda: "${this.searchText}"`, field: 'searchText' });
    if (this.filterPerfil) filters.push({ label: `Perfil: ${this.filterPerfil}`, field: 'filterPerfil' });
    if (this.filterEstado) filters.push({ label: `Estado: ${this.filterEstado}`, field: 'filterEstado' });
    if (this.filterEntidad) filters.push({ label: `Entidad: ${this.filterEntidad}`, field: 'filterEntidad' });
    if (this.filterDepartamento) filters.push({ label: `Depto: ${this.filterDepartamento}`, field: 'filterDepartamento' });
    if (this.filterTipoDoc) filters.push({ label: `Doc: ${this.filterTipoDoc}`, field: 'filterTipoDoc' });
    if (this.filterFechaDesde) filters.push({ label: `Desde: ${this.filterFechaDesde.toLocaleDateString()}`, field: 'filterFechaDesde' });
    if (this.filterFechaHasta) filters.push({ label: `Hasta: ${this.filterFechaHasta.toLocaleDateString()}`, field: 'filterFechaHasta' });
    return filters;
  }

  clearFilters() {
    this.searchText = '';
    this.filterPerfil = '';
    this.filterEstado = '';
    this.filterEntidad = '';
    this.filterDepartamento = '';
    this.filterTipoDoc = '';
    this.filterFechaDesde = null;
    this.filterFechaHasta = null;
  }

  removeFilter(field: string) {
    if (field === 'filterFechaDesde' || field === 'filterFechaHasta') {
      (this as any)[field] = null;
    } else {
      (this as any)[field] = '';
    }
  }
}
