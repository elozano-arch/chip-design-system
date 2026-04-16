import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { MenuModule } from 'primeng/menu';
import { ChipModule } from 'primeng/chip';
import { MessageService, MenuItem } from 'primeng/api';

interface Usuario {
  id: number;
  codigo: string;
  nombre: string;
  correo: string;
  perfil: string;
  entidad: string;
  activo: boolean;
  ultimoAcceso: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, InputTextModule, TableModule, TagModule,
    ToastModule, TooltipModule, BreadcrumbModule,
    IconFieldModule, InputIconModule, SelectModule,
    DialogModule, DividerModule, MenuModule, ChipModule,
  ],
  providers: [MessageService],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
})
export class UsuariosComponent {
  @ViewChild('menuAcciones') menuAcciones: any;
  selectedUsuario: Usuario | null = null;

  constructor(private messageService: MessageService) {}

  menuAccionesItems: MenuItem[] = [
    { label: 'Editar', icon: 'pi pi-pencil', command: () => { if (this.selectedUsuario) this.openEditDialog(this.selectedUsuario); } },
    { label: 'Activar / Desactivar', icon: 'pi pi-power-off', command: () => { if (this.selectedUsuario) this.showToggleDialog = true; } },
    { separator: true },
    { label: 'Eliminar', icon: 'pi pi-trash', command: () => { if (this.selectedUsuario) this.showDeleteDialog = true; } },
  ];

  abrirMenuAcciones(event: Event, usuario: Usuario) {
    this.selectedUsuario = usuario;
    this.menuAcciones.toggle(event);
  }

  breadcrumbItems: MenuItem[] = [
    { label: 'Seguridad', icon: 'pi pi-shield', routerLink: '/pantallas/seguridad/usuarios' },
    { label: 'Usuarios' },
  ];
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  searchUsuarios = '';
  filterPerfil = '';
  filterEstado = '';
  filtersCollapsed = false;
  showNewDialog = false;
  showEditDialog = false;
  showToggleDialog = false;
  showDeleteDialog = false;

  // Nuevo usuario
  nuevoNombre = '';
  nuevoCorreo = '';
  nuevoPerfil = '';

  // Editar usuario
  editNombre = '';
  editCorreo = '';
  editPerfil = '';

  perfilOptions = [
    { label: 'Todos', value: '' },
    { label: 'Administrador General', value: 'Administrador General' },
    { label: 'Administrador Categorización', value: 'Administrador Categorización' },
    { label: 'Operador de Entidad', value: 'Operador de Entidad' },
    { label: 'Consulta', value: 'Consulta' },
    { label: 'Auditor', value: 'Auditor' },
  ];

  estadoOptions = [
    { label: 'Todos', value: '' },
    { label: 'Activo', value: 'true' },
    { label: 'Inactivo', value: 'false' },
  ];

  usuarios: Usuario[] = [
    { id: 1, codigo: 'DILA710990', nombre: 'Omaira Lozada Ladino', correo: 'olozada@cgn.gov.co', perfil: 'Administrador Categorización', entidad: 'PROYECTO CHIP 2.0', activo: true, ultimoAcceso: '14/04/2024' },
    { id: 2, codigo: 'JMGA850312', nombre: 'Juan Manuel García Arévalo', correo: 'jgarcia@minhacienda.gov.co', perfil: 'Operador de Entidad', entidad: 'MINISTERIO DE HACIENDA', activo: true, ultimoAcceso: '20/03/2024' },
    { id: 3, codigo: 'MCRP920115', nombre: 'María Cristina Rodríguez', correo: 'mrodriguez@cgn.gov.co', perfil: 'Consulta', entidad: 'CGN - CONTADURÍA GENERAL', activo: true, ultimoAcceso: '10/04/2024' },
    { id: 4, codigo: 'CPLS880704', nombre: 'Carlos Pérez López', correo: 'cperez@cgn.gov.co', perfil: 'Administrador General', entidad: 'CGN - CONTADURÍA GENERAL', activo: true, ultimoAcceso: '28/02/2024' },
    { id: 5, codigo: 'AMVR760521', nombre: 'Ana María Vargas Restrepo', correo: 'avargas@contraloria.gov.co', perfil: 'Auditor', entidad: 'CONTRALORÍA GENERAL', activo: true, ultimoAcceso: '05/04/2024' },
    { id: 6, codigo: 'LFHM900830', nombre: 'Luis Fernando Hernández', correo: 'lhernandez@bogota.gov.co', perfil: 'Operador de Entidad', entidad: 'ALCALDÍA DE BOGOTÁ', activo: false, ultimoAcceso: '15/01/2024' },
    { id: 7, codigo: 'SMPG950210', nombre: 'Sandra Milena Pinzón', correo: 'spinzon@antioquia.gov.co', perfil: 'Operador de Entidad', entidad: 'GOBERNACIÓN DE ANTIOQUIA', activo: true, ultimoAcceso: '12/04/2024' },
    { id: 8, codigo: 'RDTM830619', nombre: 'Ricardo Daniel Torres', correo: 'rtorres@dane.gov.co', perfil: 'Consulta', entidad: 'DANE', activo: true, ultimoAcceso: '30/03/2024' },
  ];

  get filteredUsuarios(): Usuario[] {
    return this.usuarios.filter(u => {
      const matchSearch = !this.searchUsuarios ||
        u.nombre.toLowerCase().includes(this.searchUsuarios.toLowerCase()) ||
        u.codigo.toLowerCase().includes(this.searchUsuarios.toLowerCase()) ||
        u.entidad.toLowerCase().includes(this.searchUsuarios.toLowerCase());
      const matchPerfil = !this.filterPerfil || u.perfil === this.filterPerfil;
      const matchEstado = !this.filterEstado || String(u.activo) === this.filterEstado;
      return matchSearch && matchPerfil && matchEstado;
    });
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.searchUsuarios) count++;
    if (this.filterPerfil) count++;
    if (this.filterEstado) count++;
    return count;
  }

  get activeFilters(): { label: string; field: string }[] {
    const filters: { label: string; field: string }[] = [];
    if (this.searchUsuarios) filters.push({ label: `Búsqueda: "${this.searchUsuarios}"`, field: 'searchUsuarios' });
    if (this.filterPerfil) filters.push({ label: `Perfil: ${this.filterPerfil}`, field: 'filterPerfil' });
    if (this.filterEstado) filters.push({ label: `Estado: ${this.filterEstado === 'true' ? 'Activo' : 'Inactivo'}`, field: 'filterEstado' });
    return filters;
  }

  removeFilter(field: string) {
    (this as any)[field] = '';
  }

  clearFilters() {
    this.searchUsuarios = '';
    this.filterPerfil = '';
    this.filterEstado = '';
  }

  createUsuario() {
    if (!this.nuevoNombre.trim() || !this.nuevoCorreo.trim()) return;
    this.messageService.add({ severity: 'success', summary: 'Usuario creado', detail: `El usuario "${this.nuevoNombre}" fue registrado.` });
    this.nuevoNombre = '';
    this.nuevoCorreo = '';
    this.nuevoPerfil = '';
    this.showNewDialog = false;
  }

  toggleEstado(u: Usuario) {
    u.activo = !u.activo;
    this.messageService.add({ severity: 'info', summary: u.activo ? 'Activado' : 'Desactivado', detail: `Usuario ${u.codigo} fue ${u.activo ? 'activado' : 'desactivado'}.` });
  }

  openEditDialog(u: Usuario) {
    this.editNombre = u.nombre;
    this.editCorreo = u.correo;
    this.editPerfil = u.perfil;
    this.showEditDialog = true;
  }

  saveEditUsuario() {
    if (!this.selectedUsuario || !this.editNombre.trim()) return;
    this.selectedUsuario.nombre = this.editNombre;
    this.selectedUsuario.correo = this.editCorreo;
    this.selectedUsuario.perfil = this.editPerfil;
    this.messageService.add({ severity: 'success', summary: 'Usuario actualizado', detail: `El usuario "${this.editNombre}" fue actualizado.` });
    this.showEditDialog = false;
  }

  confirmToggleEstado() {
    if (this.selectedUsuario) {
      this.toggleEstado(this.selectedUsuario);
    }
    this.showToggleDialog = false;
  }

  confirmDeleteUsuario() {
    if (this.selectedUsuario) {
      this.usuarios = this.usuarios.filter(u => u.id !== this.selectedUsuario!.id);
      this.messageService.add({ severity: 'success', summary: 'Usuario eliminado', detail: `El usuario "${this.selectedUsuario.nombre}" fue eliminado.` });
    }
    this.showDeleteDialog = false;
  }
}
