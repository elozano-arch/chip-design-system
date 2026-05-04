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
  /** Override a la política del rol (null = hereda del rol asignado). */
  vigencia: number | null;
  intentos: number | null;
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

  /**
   * Menú dinámico: un usuario inactivo solo permite Activar o Eliminar.
   * Editar y Desactivar quedan bloqueados hasta que se active, siguiendo la regla
   * "si no está activo no se puede hacer nada sobre él".
   */
  get menuAccionesItems(): MenuItem[] {
    if (!this.selectedUsuario) return [];
    if (this.selectedUsuario.activo) {
      return [
        { label: 'Editar', icon: 'pi pi-pencil', command: () => { if (this.selectedUsuario) this.openEditDialog(this.selectedUsuario); } },
        { label: 'Desactivar', icon: 'pi pi-ban', command: () => { if (this.selectedUsuario) this.showToggleDialog = true; } },
        { separator: true },
        { label: 'Eliminar', icon: 'pi pi-trash', command: () => { if (this.selectedUsuario) { this.deleteConfirmText = ''; this.showDeleteDialog = true; } } },
      ];
    }
    return [
      { label: 'Activar', icon: 'pi pi-check', command: () => { if (this.selectedUsuario) this.showToggleDialog = true; } },
      { separator: true },
      { label: 'Eliminar', icon: 'pi pi-trash', command: () => { if (this.selectedUsuario) { this.deleteConfirmText = ''; this.showDeleteDialog = true; } } },
    ];
  }

  abrirMenuAcciones(event: Event, usuario: Usuario) {
    this.selectedUsuario = usuario;
    this.menuAcciones.toggle(event);
  }

  breadcrumbItems: MenuItem[] = [
    { label: 'Seguridad', icon: 'pi pi-shield', routerLink: '/pantallas/seguridad/usuarios' },
    { label: 'Usuarios' },
  ];
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  searchUsuariosNombre = '';
  searchUsuariosCodigo = '';
  filterPerfil = '';
  filterEstado = '';
  filtersCollapsed = false;
  showNewDialog = false;
  showEditDialog = false;
  showToggleDialog = false;
  showDeleteDialog = false;
  // CH-1371: confirmación por escrito para eliminar
  deleteConfirmText = '';
  readonly DELETE_CONFIRM_WORD = 'ELIMINAR';
  get deleteConfirmValid(): boolean {
    return this.deleteConfirmText.trim().toUpperCase() === this.DELETE_CONFIRM_WORD;
  }

  // Nuevo usuario
  nuevoCodigo = '';
  nuevoNombre = '';
  nuevoCorreo = '';
  nuevoPerfil = '';

  // Touched flags (validación visual)
  nuevoCodigoTouched = false;
  nuevoNombreTouched = false;
  nuevoCorreoTouched = false;
  nuevoPerfilTouched = false;

  // Editar usuario
  editNombre = '';
  editCorreo = '';
  editPerfil = '';
  editVigencia: number | null = null;
  editIntentos: number | null = null;
  editNombreTouched = false;
  editCorreoTouched = false;

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
    { id: 1, codigo: 'DILA710990', nombre: 'Omaira Lozada Ladino', correo: 'olozada@cgn.gov.co', perfil: 'Administrador Categorización', entidad: 'PROYECTO CHIP 2.0', activo: true, ultimoAcceso: '14/04/2024', vigencia: 90, intentos: 3 },
    { id: 2, codigo: 'JMGA850312', nombre: 'Juan Manuel García Arévalo', correo: 'jgarcia@minhacienda.gov.co', perfil: 'Operador de Entidad', entidad: 'MINISTERIO DE HACIENDA', activo: true, ultimoAcceso: '20/03/2024', vigencia: 60, intentos: 5 },
    { id: 3, codigo: 'MCRP920115', nombre: 'María Cristina Rodríguez', correo: 'mrodriguez@cgn.gov.co', perfil: 'Consulta', entidad: 'CGN - CONTADURÍA GENERAL', activo: true, ultimoAcceso: '10/04/2024', vigencia: null, intentos: null },
    { id: 4, codigo: 'CPLS880704', nombre: 'Carlos Pérez López', correo: 'cperez@cgn.gov.co', perfil: 'Administrador General', entidad: 'CGN - CONTADURÍA GENERAL', activo: true, ultimoAcceso: '28/02/2024', vigencia: 90, intentos: 3 },
    { id: 5, codigo: 'AMVR760521', nombre: 'Ana María Vargas Restrepo', correo: 'avargas@contraloria.gov.co', perfil: 'Auditor', entidad: 'CONTRALORÍA GENERAL', activo: true, ultimoAcceso: '05/04/2024', vigencia: 90, intentos: 3 },
    { id: 6, codigo: 'LFHM900830', nombre: 'Luis Fernando Hernández', correo: 'lhernandez@bogota.gov.co', perfil: 'Operador de Entidad', entidad: 'ALCALDÍA DE BOGOTÁ', activo: false, ultimoAcceso: '15/01/2024', vigencia: 60, intentos: 5 },
    { id: 7, codigo: 'SMPG950210', nombre: 'Sandra Milena Pinzón', correo: 'spinzon@antioquia.gov.co', perfil: 'Operador de Entidad', entidad: 'GOBERNACIÓN DE ANTIOQUIA', activo: true, ultimoAcceso: '12/04/2024', vigencia: null, intentos: null },
    { id: 8, codigo: 'RDTM830619', nombre: 'Ricardo Daniel Torres', correo: 'rtorres@dane.gov.co', perfil: 'Consulta', entidad: 'DANE', activo: true, ultimoAcceso: '30/03/2024', vigencia: null, intentos: null },
  ];

  get filteredUsuarios(): Usuario[] {
    // Mostrar resultados solo cuando haya al menos un filtro activo
    if (this.activeFilterCount === 0) return [];
    const qn = this.searchUsuariosNombre.trim().toLowerCase();
    const qc = this.searchUsuariosCodigo.trim().toLowerCase();
    return this.usuarios.filter(u => {
      const matchNombre = !qn || u.nombre.toLowerCase().includes(qn);
      const matchCodigo = !qc || u.codigo.toLowerCase().includes(qc);
      const matchPerfil = !this.filterPerfil || u.perfil === this.filterPerfil;
      const matchEstado = !this.filterEstado || String(u.activo) === this.filterEstado;
      return matchNombre && matchCodigo && matchPerfil && matchEstado;
    });
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.searchUsuariosNombre) count++;
    if (this.searchUsuariosCodigo) count++;
    if (this.filterPerfil) count++;
    if (this.filterEstado) count++;
    return count;
  }

  get activeFilters(): { label: string; field: string }[] {
    const filters: { label: string; field: string }[] = [];
    if (this.searchUsuariosNombre) filters.push({ label: `Nombre: "${this.searchUsuariosNombre}"`, field: 'searchUsuariosNombre' });
    if (this.searchUsuariosCodigo) filters.push({ label: `Código: "${this.searchUsuariosCodigo}"`, field: 'searchUsuariosCodigo' });
    if (this.filterPerfil) filters.push({ label: `Perfil: ${this.filterPerfil}`, field: 'filterPerfil' });
    if (this.filterEstado) filters.push({ label: `Estado: ${this.filterEstado === 'true' ? 'Activo' : 'Inactivo'}`, field: 'filterEstado' });
    return filters;
  }

  removeFilter(field: string) {
    (this as any)[field] = '';
  }

  clearFilters() {
    this.searchUsuariosNombre = '';
    this.searchUsuariosCodigo = '';
    this.filterPerfil = '';
    this.filterEstado = '';
  }

  // ── Validaciones CH-1368 (Crear usuario) ──
  private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly CODIGO_REGEX = /^[A-Z]{4}[0-9]{6}$/;

  get nuevoCodigoVacio(): boolean {
    return this.nuevoCodigoTouched && !this.nuevoCodigo.trim();
  }
  get nuevoCodigoFormatoInvalido(): boolean {
    if (!this.nuevoCodigoTouched || !this.nuevoCodigo.trim()) return false;
    return !this.CODIGO_REGEX.test(this.nuevoCodigo.trim().toUpperCase());
  }
  get nuevoCodigoDuplicado(): boolean {
    if (!this.nuevoCodigoTouched || !this.nuevoCodigo.trim()) return false;
    return this.usuarios.some(u => u.codigo.toUpperCase() === this.nuevoCodigo.trim().toUpperCase());
  }
  get nuevoCodigoInvalid(): boolean {
    return this.nuevoCodigoVacio || this.nuevoCodigoFormatoInvalido || this.nuevoCodigoDuplicado;
  }

  get nuevoNombreInvalid(): boolean {
    return this.nuevoNombreTouched && !this.nuevoNombre.trim();
  }

  get nuevoCorreoVacio(): boolean {
    return this.nuevoCorreoTouched && !this.nuevoCorreo.trim();
  }
  get nuevoCorreoFormatoInvalido(): boolean {
    if (!this.nuevoCorreoTouched || !this.nuevoCorreo.trim()) return false;
    return !this.EMAIL_REGEX.test(this.nuevoCorreo.trim());
  }
  get nuevoCorreoDuplicado(): boolean {
    if (!this.nuevoCorreoTouched || !this.nuevoCorreo.trim()) return false;
    return this.usuarios.some(u => u.correo.toLowerCase() === this.nuevoCorreo.trim().toLowerCase());
  }
  get nuevoCorreoInvalid(): boolean {
    return this.nuevoCorreoVacio || this.nuevoCorreoFormatoInvalido || this.nuevoCorreoDuplicado;
  }

  get nuevoPerfilInvalid(): boolean {
    return this.nuevoPerfilTouched && !this.nuevoPerfil;
  }

  get nuevoFormValido(): boolean {
    return !!this.nuevoCodigo.trim()
      && this.CODIGO_REGEX.test(this.nuevoCodigo.trim().toUpperCase())
      && !this.usuarios.some(u => u.codigo.toUpperCase() === this.nuevoCodigo.trim().toUpperCase())
      && !!this.nuevoNombre.trim()
      && !!this.nuevoCorreo.trim()
      && this.EMAIL_REGEX.test(this.nuevoCorreo.trim())
      && !this.usuarios.some(u => u.correo.toLowerCase() === this.nuevoCorreo.trim().toLowerCase())
      && !!this.nuevoPerfil;
  }

  createUsuario() {
    this.nuevoCodigoTouched = true;
    this.nuevoNombreTouched = true;
    this.nuevoCorreoTouched = true;
    this.nuevoPerfilTouched = true;

    if (!this.nuevoFormValido) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Revise los campos marcados en rojo y corrija los errores indicados.',
      });
      return;
    }

    const nuevo: Usuario = {
      id: Math.max(...this.usuarios.map(u => u.id)) + 1,
      codigo: this.nuevoCodigo.trim().toUpperCase(),
      nombre: this.nuevoNombre.trim(),
      correo: this.nuevoCorreo.trim().toLowerCase(),
      perfil: this.nuevoPerfil,
      entidad: 'PROYECTO CHIP 2.0',
      activo: true,
      ultimoAcceso: '—',
      vigencia: null,
      intentos: null,
    };
    this.usuarios = [nuevo, ...this.usuarios];

    this.messageService.add({
      severity: 'success',
      summary: 'Usuario creado',
      detail: `El usuario "${nuevo.nombre}" (${nuevo.codigo}) fue registrado exitosamente.`,
    });
    this.resetNuevoForm();
    this.showNewDialog = false;
  }

  private resetNuevoForm() {
    this.nuevoCodigo = '';
    this.nuevoNombre = '';
    this.nuevoCorreo = '';
    this.nuevoPerfil = '';
    this.nuevoCodigoTouched = false;
    this.nuevoNombreTouched = false;
    this.nuevoCorreoTouched = false;
    this.nuevoPerfilTouched = false;
  }

  /** Abrir diálogo Nuevo Usuario reseteando estado */
  openNewDialog() {
    this.resetNuevoForm();
    this.showNewDialog = true;
  }

  // ── Validaciones edición ──
  get editNombreInvalid(): boolean {
    return this.editNombreTouched && !this.editNombre.trim();
  }
  get editCorreoVacio(): boolean {
    return this.editCorreoTouched && !this.editCorreo.trim();
  }
  get editCorreoFormatoInvalido(): boolean {
    if (!this.editCorreoTouched || !this.editCorreo.trim()) return false;
    return !this.EMAIL_REGEX.test(this.editCorreo.trim());
  }
  get editCorreoInvalid(): boolean {
    return this.editCorreoVacio || this.editCorreoFormatoInvalido;
  }
  get editFormValido(): boolean {
    return !!this.editNombre.trim()
      && !!this.editCorreo.trim()
      && this.EMAIL_REGEX.test(this.editCorreo.trim());
  }

  toggleEstado(u: Usuario) {
    u.activo = !u.activo;
    this.messageService.add({ severity: 'info', summary: u.activo ? 'Activado' : 'Desactivado', detail: `Usuario ${u.codigo} fue ${u.activo ? 'activado' : 'desactivado'}.` });
  }

  openEditDialog(u: Usuario) {
    this.editNombre = u.nombre;
    this.editCorreo = u.correo;
    this.editPerfil = u.perfil;
    this.editVigencia = u.vigencia;
    this.editIntentos = u.intentos;
    this.editNombreTouched = false;
    this.editCorreoTouched = false;
    this.showEditDialog = true;
  }

  saveEditUsuario() {
    this.editNombreTouched = true;
    this.editCorreoTouched = true;
    if (!this.selectedUsuario || !this.editFormValido) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Revise los campos marcados en rojo y corrija los errores.',
      });
      return;
    }
    this.selectedUsuario.nombre = this.editNombre.trim();
    this.selectedUsuario.correo = this.editCorreo.trim().toLowerCase();
    this.selectedUsuario.perfil = this.editPerfil;
    this.selectedUsuario.vigencia = this.editVigencia;
    this.selectedUsuario.intentos = this.editIntentos;
    this.messageService.add({
      severity: 'success',
      summary: 'Usuario actualizado',
      detail: `El usuario "${this.editNombre}" fue actualizado exitosamente.`,
    });
    this.editNombreTouched = false;
    this.editCorreoTouched = false;
    this.showEditDialog = false;
  }

  confirmToggleEstado() {
    if (this.selectedUsuario) {
      this.toggleEstado(this.selectedUsuario);
    }
    this.showToggleDialog = false;
  }

  confirmDeleteUsuario() {
    if (!this.deleteConfirmValid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Confirmación incorrecta',
        detail: 'Debe escribir "ELIMINAR" para confirmar la acción.',
      });
      return;
    }
    if (this.selectedUsuario) {
      this.usuarios = this.usuarios.filter(u => u.id !== this.selectedUsuario!.id);
      this.messageService.add({
        severity: 'success',
        summary: 'Usuario eliminado',
        detail: `El usuario "${this.selectedUsuario.nombre}" fue eliminado del sistema.`,
      });
    }
    this.deleteConfirmText = '';
    this.showDeleteDialog = false;
  }

  closeDeleteDialog() {
    this.deleteConfirmText = '';
    this.showDeleteDialog = false;
  }
}
