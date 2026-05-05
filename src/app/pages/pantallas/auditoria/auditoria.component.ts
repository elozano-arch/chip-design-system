import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { ChipModule } from 'primeng/chip';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';

interface LogEntry {
  id: number;
  fecha: string;
  hora: string;
  usuario: string;
  accion: string;
  modulo: string;
  detalle: string;
  tipo: string;
}

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, TableModule, TagModule,
    IconFieldModule, InputIconModule, SelectModule, ChipModule,
    AppBreadcrumbComponent,
  ],
  templateUrl: './auditoria.component.html',
  styleUrl: './auditoria.component.scss',
})
export class AuditoriaComponent {
  searchLog = '';
  filterTipo = '';
  filtersCollapsed = false;

  tipoOptions = [
    { label: 'Todos', value: '' },
    { label: 'Permisos', value: 'Permisos' },
    { label: 'Usuarios', value: 'Usuarios' },
    { label: 'Roles', value: 'Roles' },
    { label: 'Acceso', value: 'Acceso' },
  ];

  logs: LogEntry[] = [
    { id: 1, fecha: '15/04/2026', hora: '09:32', usuario: 'CPLS880704', accion: 'Modificación de permisos', modulo: 'Gestión de Roles', detalle: 'Se habilitó "Exportar" para perfil Operador de Entidad', tipo: 'Permisos' },
    { id: 2, fecha: '15/04/2026', hora: '09:15', usuario: 'CPLS880704', accion: 'Creación de perfil', modulo: 'Gestión de Roles', detalle: 'Se creó perfil "Analista Entidades"', tipo: 'Roles' },
    { id: 3, fecha: '14/04/2026', hora: '16:45', usuario: 'DILA710990', accion: 'Desactivación de usuario', modulo: 'Gestión de Usuarios', detalle: 'Se desactivó usuario LFHM900830', tipo: 'Usuarios' },
    { id: 4, fecha: '14/04/2026', hora: '14:20', usuario: 'CPLS880704', accion: 'Modificación de permisos', modulo: 'Gestión de Roles', detalle: 'Se deshabilitó "Eliminar" para perfil Consulta', tipo: 'Permisos' },
    { id: 5, fecha: '14/04/2026', hora: '11:05', usuario: 'JMGA850312', accion: 'Inicio de sesión', modulo: 'Acceso', detalle: 'Inicio de sesión exitoso desde 192.168.1.45', tipo: 'Acceso' },
    { id: 6, fecha: '13/04/2026', hora: '17:30', usuario: 'CPLS880704', accion: 'Creación de usuario', modulo: 'Gestión de Usuarios', detalle: 'Se registró usuario SMPG950210 con perfil Operador de Entidad', tipo: 'Usuarios' },
    { id: 7, fecha: '13/04/2026', hora: '10:12', usuario: 'DILA710990', accion: 'Modificación de permisos', modulo: 'Gestión de Roles', detalle: 'Se habilitaron 5 categorías para perfil Administrador Categorización', tipo: 'Permisos' },
    { id: 8, fecha: '12/04/2026', hora: '15:55', usuario: 'AMVR760521', accion: 'Intento de acceso denegado', modulo: 'Acceso', detalle: 'Intento de acceso al módulo de Seguridad sin permisos', tipo: 'Acceso' },
    { id: 9, fecha: '12/04/2026', hora: '09:00', usuario: 'CPLS880704', accion: 'Cambio de contraseña', modulo: 'Gestión de Usuarios', detalle: 'Se restableció contraseña de usuario RDTM830619', tipo: 'Usuarios' },
    { id: 10, fecha: '11/04/2026', hora: '14:40', usuario: 'CPLS880704', accion: 'Eliminación de perfil', modulo: 'Gestión de Roles', detalle: 'Se eliminó perfil "Soporte Técnico"', tipo: 'Roles' },
  ];

  get filteredLogs(): LogEntry[] {
    return this.logs.filter(l => {
      const matchSearch = !this.searchLog ||
        l.usuario.toLowerCase().includes(this.searchLog.toLowerCase()) ||
        l.accion.toLowerCase().includes(this.searchLog.toLowerCase()) ||
        l.detalle.toLowerCase().includes(this.searchLog.toLowerCase());
      const matchTipo = !this.filterTipo || l.tipo === this.filterTipo;
      return matchSearch && matchTipo;
    });
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.searchLog) count++;
    if (this.filterTipo) count++;
    return count;
  }

  get activeFilters(): { label: string; field: string }[] {
    const filters: { label: string; field: string }[] = [];
    if (this.searchLog) filters.push({ label: `Búsqueda: "${this.searchLog}"`, field: 'searchLog' });
    if (this.filterTipo) filters.push({ label: `Tipo: ${this.filterTipo}`, field: 'filterTipo' });
    return filters;
  }

  removeFilter(field: string) {
    (this as any)[field] = '';
  }

  clearFilters() {
    this.searchLog = '';
    this.filterTipo = '';
  }

  getTipoSeverity(tipo: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'info' | 'secondary'> = {
      'Permisos': 'info', 'Usuarios': 'success', 'Roles': 'warn', 'Acceso': 'secondary',
    };
    return map[tipo] || 'secondary';
  }
}
