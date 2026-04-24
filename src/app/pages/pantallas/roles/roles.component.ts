import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TreeTableModule } from 'primeng/treetable';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { CheckboxModule } from 'primeng/checkbox';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageModule } from 'primeng/message';
import { MenuModule } from 'primeng/menu';
import { ChipModule } from 'primeng/chip';
import { MessageService, MenuItem, TreeNode } from 'primeng/api';

/** Nodo de permiso del árbol unificado: cada nodo tiene código y nombre. */
interface PermisoData {
  codigo: string;
  nombre: string;
}

interface Role {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  usuarios: number;
  permisos: number;
  vigencia: number | null;
  intentos: number | null;
  fechaModificacion: string;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TableModule,
    TreeTableModule,
    TagModule,
    InputTextModule,
    ToastModule,
    TooltipModule,
    DialogModule,
    DividerModule,
    CheckboxModule,
    IconFieldModule,
    InputIconModule,
    BreadcrumbModule,
    MenuModule,
    MessageModule,
    ChipModule,
  ],
  providers: [MessageService],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesComponent {
  @ViewChild('menuRol') menuRol: any;
  @ViewChild('permTree') permTree: any;

  selectedRoleForMenu: Role | null = null;

  constructor(private messageService: MessageService, private cdr: ChangeDetectorRef) {
    this.initLeafIndex();
  }

  // ── Menú contextual de fila ──
  menuRolItems: MenuItem[] = [
    { label: 'Configurar permisos', icon: 'pi pi-cog', command: () => { if (this.selectedRoleForMenu) this.editRole(this.selectedRoleForMenu); } },
    { label: 'Editar', icon: 'pi pi-pencil', command: () => { if (this.selectedRoleForMenu) this.openEditDialog(this.selectedRoleForMenu); } },
    { separator: true },
    { label: 'Eliminar', icon: 'pi pi-trash', command: () => { if (this.selectedRoleForMenu) this.confirmDelete(this.selectedRoleForMenu); } },
  ];

  abrirMenuRol(event: Event, role: Role) {
    this.selectedRoleForMenu = role;
    this.menuRol.toggle(event);
  }

  // ── Breadcrumb ──
  breadcrumbItems: MenuItem[] = [
    { label: 'Administración', icon: 'pi pi-cog', routerLink: '/pantallas/seguridad/usuarios' },
    { label: 'Gestión de Roles' },
  ];
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  /** Breadcrumb del editor de permisos: el último ítem clickable regresa al listado. */
  get editBreadcrumbItems(): MenuItem[] {
    return [
      { label: 'Administración', icon: 'pi pi-cog' },
      { label: 'Gestión de Roles', command: () => this.backToList() },
      { label: 'Permisos' },
    ];
  }

  // ── Vista: 'list' = listado de roles, 'edit' = editar permisos ──
  currentView: 'list' | 'edit' = 'list';
  selectedRole: Role | null = null;

  // ── Búsqueda del listado de roles ──
  searchRolesNombre = '';
  searchRolesCodigo = '';
  filtersCollapsed = false;

  // ── Búsqueda del árbol de permisos (TreeTable) ──
  searchPermisos = '';
  changesExpanded = false;

  // ── Diálogos ──
  showNewRoleDialog = false;
  showEditRoleDialog = false;
  showDeleteDialog = false;
  roleToDelete: Role | null = null;
  // CH-1373: confirmación por escrito para eliminar rol
  deleteRoleConfirmText = '';
  readonly DELETE_ROLE_CONFIRM_WORD = 'ELIMINAR';
  get deleteRoleConfirmValid(): boolean {
    return this.deleteRoleConfirmText.trim().toUpperCase() === this.DELETE_ROLE_CONFIRM_WORD;
  }
  editingRole: Role | null = null;
  editRoleName = '';
  editRoleDesc = '';
  editRoleVigencia: number | null = null;
  editRoleIntentos: number | null = null;
  editRoleNameTouched = false;
  newRoleCode = '';
  newRoleName = '';
  newRoleDesc = '';
  newRoleVigencia: number | null = null;
  newRoleIntentos: number | null = null;
  newRoleCodeTouched = false;
  newRoleNameTouched = false;
  private readonly ROLE_CODE_REGEX = /^ROL[0-9]{3,4}$/;

  // ── Roles (perfiles reales del sistema CHIP) ──
  roles: Role[] = [
    { id: 1, codigo: 'ADM_CHIP', nombre: 'Administrador General', descripcion: 'Acceso completo a todos los módulos del sistema CHIP', usuarios: 3, permisos: 120, vigencia: 90, intentos: 3, fechaModificacion: '2026-04-12' },
    { id: 2, codigo: 'ROL002', nombre: 'Administrador Categorización', descripcion: 'Administración de categorías, formularios y parametrización del sistema', usuarios: 5, permisos: 48, vigencia: 90, intentos: 3, fechaModificacion: '2026-04-10' },
    { id: 3, codigo: 'ROL003', nombre: 'Operador de Entidad', descripcion: 'Carga de información, edición de formularios y exportación de datos', usuarios: 48, permisos: 32, vigencia: 60, intentos: 5, fechaModificacion: '2026-04-08' },
    { id: 4, codigo: 'ROL004', nombre: 'Consulta', descripcion: 'Solo lectura de información, reportes y exportaciones', usuarios: 120, permisos: 12, vigencia: 180, intentos: 5, fechaModificacion: '2026-03-25' },
    { id: 5, codigo: 'ROL005', nombre: 'Auditor', descripcion: 'Acceso a reportes, consistencias y log de auditoría', usuarios: 8, permisos: 18, vigencia: 90, intentos: 3, fechaModificacion: '2026-04-01' },
    { id: 6, codigo: 'ROL006', nombre: 'Usuario Propietario', descripcion: 'Gestión de usuarios propietarios de la entidad', usuarios: 0, permisos: 25, vigencia: 90, intentos: 3, fechaModificacion: '2026-03-18' },
    { id: 7, codigo: 'ROL007', nombre: 'Soporte Técnico', descripcion: 'Rol recién creado, pendiente de configuración', usuarios: 0, permisos: 0, vigencia: null, intentos: null, fechaModificacion: '2026-02-14' },
  ];

  // ============================================================
  // ÁRBOL UNIFICADO DE PERMISOS (Chip 2.0 — TreeTable)
  // ============================================================
  /** Árbol único de permisos con código y nombre. Códigos replican los del sistema CHIP real. */
  permissionsTree: TreeNode<PermisoData>[] = [
    {
      key: '1', data: { codigo: '1', nombre: 'Menú de Aplicación' },
      children: [
        { key: '11', data: { codigo: '11', nombre: 'Nuevo' } },
        { key: '12', data: { codigo: '12', nombre: 'Guardar' } },
        { key: '13', data: { codigo: '13', nombre: 'Imprimir' } },
        { key: '14', data: { codigo: '14', nombre: 'Seleccionar Formularios' } },
        { key: '15', data: { codigo: '15', nombre: 'Exportar' } },
        { key: '16', data: { codigo: '16', nombre: 'Importar listado de correos' } },
      ],
    },
    {
      key: '2', data: { codigo: '2', nombre: 'Tablas de Parámetros' },
      children: [
        {
          key: '21', data: { codigo: '21', nombre: 'Listas del Sistema' },
          children: [
            { key: '211', data: { codigo: '211', nombre: 'Tablas Generales' } },
            { key: '212', data: { codigo: '212', nombre: 'Tablas Específicas' } },
          ],
        },
        { key: '22', data: { codigo: '22', nombre: 'Tablas Básicas' } },
      ],
    },
    {
      key: '3', data: { codigo: '3', nombre: 'Categorías' },
      children: [
        {
          key: '31', data: { codigo: '31', nombre: 'Categorías de Información' },
          children: [
            { key: '311', data: { codigo: '311', nombre: 'INFORMACIÓN CONTABLE PÚBLICA (K1)' } },
            { key: '312', data: { codigo: '312', nombre: 'NOTAS GENERALES A ESTADOS CONTABLES' } },
            { key: '313', data: { codigo: '313', nombre: 'CGR_PRESUPUESTAL' } },
            { key: '314', data: { codigo: '314', nombre: 'INGRESOS (K12)' } },
            { key: '315', data: { codigo: '315', nombre: 'FUT_GASTOS_FUNCIONAMIENTO' } },
            { key: '316', data: { codigo: '316', nombre: 'REGALÍAS (K23)' } },
            { key: '317', data: { codigo: '317', nombre: 'CONTROL INTERNO CONTABLE' } },
            { key: '318', data: { codigo: '318', nombre: 'FUT_CIERRE_FISCAL (K29)' } },
          ],
        },
      ],
    },
    { key: '700', data: { codigo: '700', nombre: 'Ordenamiento Territorial' } },
    { key: '800', data: { codigo: '800', nombre: 'Requerimientos' } },
    { key: '890', data: { codigo: '890', nombre: 'Mensajes' } },
    { key: '900', data: { codigo: '900', nombre: 'Asistencia Técnica' } },
    { key: '901', data: { codigo: '901', nombre: 'Encuestas' } },
    { key: '902', data: { codigo: '902', nombre: 'Eventos' } },
    { key: '1800', data: { codigo: '1800', nombre: 'Documentos y Términos' } },
    {
      key: '1900', data: { codigo: '1900', nombre: 'Consultas' },
      children: [
        {
          key: '1901', data: { codigo: '1901', nombre: 'Menú de Archivo' },
          children: [
            { key: '1902', data: { codigo: '1902', nombre: 'Nuevo' } },
            { key: '1903', data: { codigo: '1903', nombre: 'Guardar' } },
            { key: '1904', data: { codigo: '1904', nombre: 'Imprimir' } },
          ],
        },
      ],
    },
    {
      key: '2100', data: { codigo: '2100', nombre: 'Consolidación' },
      children: [
        { key: '3639', data: { codigo: '3639', nombre: 'Menú de carga de datos a consolidación' } },
        { key: '3642', data: { codigo: '3642', nombre: 'Autorización de periodo de reporte' } },
        { key: '4892', data: { codigo: '4892', nombre: 'Administrar II' } },
        { key: '4893', data: { codigo: '4893', nombre: 'Analista de II' } },
        { key: '4894', data: { codigo: '4894', nombre: 'Entidad de II' } },
        { key: '4895', data: { codigo: '4895', nombre: 'Consulta de II' } },
      ],
    },
    {
      key: '7100', data: { codigo: '7100', nombre: 'Seguridad' },
      children: [
        {
          key: '7110', data: { codigo: '7110', nombre: 'Usuarios' },
          children: [
            { key: '7114', data: { codigo: '7114', nombre: 'Consultar Usuario' } },
            { key: '7115', data: { codigo: '7115', nombre: 'Crear Usuario' } },
            { key: '7116', data: { codigo: '7116', nombre: 'Modificar Usuario' } },
            { key: '7117', data: { codigo: '7117', nombre: 'Eliminar Usuario' } },
          ],
        },
        {
          key: '7120', data: { codigo: '7120', nombre: 'Roles' },
          children: [
            { key: '7121', data: { codigo: '7121', nombre: 'Consultar Rol' } },
            { key: '7122', data: { codigo: '7122', nombre: 'Crear Rol' } },
            { key: '7123', data: { codigo: '7123', nombre: 'Modificar Rol' } },
            { key: '7124', data: { codigo: '7124', nombre: 'Eliminar Rol' } },
            { key: '7125', data: { codigo: '7125', nombre: 'Configurar Permisos' } },
          ],
        },
      ],
    },
    { key: '7200', data: { codigo: '7200', nombre: 'Entidades' } },
  ];

  /**
   * Claves de permisos marcadas. Cada checkbox es independiente —
   * marcar un padre NO propaga a sus hijos (replicando comportamiento Chip 2.0 real).
   */
  checkedKeys = new Set<string>();

  /** Snapshot de claves marcadas al entrar a edición (para calcular el diff). */
  private initialCheckedKeys = new Set<string>();

  /** Índice key → nombre de cada nodo del árbol (precomputado). Incluye padres y hojas. */
  private nameByKey = new Map<string, string>();
  private totalNodeCount = 0;

  private initLeafIndex() {
    this.nameByKey.clear();
    this.totalNodeCount = 0;
    const walk = (nodes: TreeNode<PermisoData>[]) => {
      for (const n of nodes) {
        this.totalNodeCount++;
        if (n.key && n.data) this.nameByKey.set(n.key, n.data.nombre);
        if (n.children) walk(n.children as TreeNode<PermisoData>[]);
      }
    };
    walk(this.permissionsTree);
  }

  // ── Checkbox API (independiente por nodo, sin cascada) ──
  isChecked(key: string | undefined | null): boolean {
    return !!key && this.checkedKeys.has(key);
  }

  toggleCheck(key: string | undefined | null) {
    if (!key) return;
    if (this.checkedKeys.has(key)) {
      this.checkedKeys.delete(key);
    } else {
      this.checkedKeys.add(key);
    }
  }

  // ── Contadores del árbol ──
  get totalLeaves(): number { return this.totalNodeCount; }

  get selectedLeafCount(): number { return this.checkedKeys.size; }

  // ── Diff de cambios (comparando contra snapshot inicial) ──
  get addedLeafNames(): string[] {
    const out: string[] = [];
    for (const k of this.checkedKeys) {
      if (!this.initialCheckedKeys.has(k)) {
        out.push(this.nameByKey.get(k) || k);
      }
    }
    return out;
  }

  get removedLeafNames(): string[] {
    const out: string[] = [];
    for (const k of this.initialCheckedKeys) {
      if (!this.checkedKeys.has(k)) {
        out.push(this.nameByKey.get(k) || k);
      }
    }
    return out;
  }

  get totalChanges(): number {
    return this.addedLeafNames.length + this.removedLeafNames.length;
  }

  // ── Acciones del árbol ──
  /** Toggle de selección de todos los permisos (leaves + padres). */
  toggleSelectAll(checked: boolean) {
    if (checked) {
      this.checkedKeys = new Set(this.nameByKey.keys());
    } else {
      this.checkedKeys = new Set();
    }
    this.cdr.detectChanges();
    const action = checked ? 'seleccionados' : 'deseleccionados';
    this.messageService.add({
      severity: 'info',
      summary: `Permisos ${action}`,
      detail: `Todos los permisos fueron ${action}.`,
    });
  }

  onGlobalFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (this.permTree) {
      this.permTree.filterGlobal(value, 'contains');
    }
  }

  // ── Filtros del listado ──
  get activeFilterCount(): number {
    let count = 0;
    if (this.searchRolesNombre) count++;
    if (this.searchRolesCodigo) count++;
    return count;
  }

  get activeFilters(): { label: string; field: string }[] {
    const filters: { label: string; field: string }[] = [];
    if (this.searchRolesNombre) filters.push({ label: `Nombre: "${this.searchRolesNombre}"`, field: 'searchRolesNombre' });
    if (this.searchRolesCodigo) filters.push({ label: `Código: "${this.searchRolesCodigo}"`, field: 'searchRolesCodigo' });
    return filters;
  }

  removeFilter(field: string) {
    (this as any)[field] = '';
  }

  clearFilters() {
    this.searchRolesNombre = '';
    this.searchRolesCodigo = '';
  }

  get filteredRoles(): Role[] {
    const qn = this.searchRolesNombre.trim().toLowerCase();
    const qc = this.searchRolesCodigo.trim().toLowerCase();
    if (!qn && !qc) return this.roles;
    return this.roles.filter(r => {
      const matchNombre = !qn || r.nombre.toLowerCase().includes(qn);
      const matchCodigo = !qc || r.codigo.toLowerCase().includes(qc);
      return matchNombre && matchCodigo;
    });
  }

  // ── Acciones de roles ──
  editRole(role: Role) {
    this.selectedRole = role;
    this.currentView = 'edit';
    this.searchPermisos = '';
    this.changesExpanded = false;

    // Estado inicial vacío — replica comportamiento Chip 2.0 real donde cada rol
    // arranca sin permisos y el admin marca explícitamente cada uno.
    this.checkedKeys = new Set<string>();
    this.initialCheckedKeys = new Set<string>();
  }

  backToList() {
    this.currentView = 'list';
    this.selectedRole = null;
  }

  openEditDialog(role: Role) {
    this.editingRole = role;
    this.editRoleName = role.nombre;
    this.editRoleDesc = role.descripcion;
    this.editRoleVigencia = role.vigencia;
    this.editRoleIntentos = role.intentos;
    this.editRoleNameTouched = false;
    this.showEditRoleDialog = true;
  }

  openNewRoleDialog() {
    this.newRoleCode = '';
    this.newRoleName = '';
    this.newRoleDesc = '';
    this.newRoleVigencia = null;
    this.newRoleIntentos = null;
    this.newRoleCodeTouched = false;
    this.newRoleNameTouched = false;
    this.showNewRoleDialog = true;
  }

  saveEditRole() {
    this.editRoleNameTouched = true;
    if (!this.editingRole || !this.editRoleName.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'El nombre del perfil es obligatorio.',
      });
      return;
    }
    this.editingRole.nombre = this.editRoleName.trim();
    this.editingRole.descripcion = this.editRoleDesc.trim();
    this.editingRole.vigencia = this.editRoleVigencia;
    this.editingRole.intentos = this.editRoleIntentos;
    this.messageService.add({
      severity: 'success',
      summary: 'Rol actualizado',
      detail: `El perfil "${this.editRoleName}" fue actualizado exitosamente.`,
    });
    this.editRoleNameTouched = false;
    this.showEditRoleDialog = false;
    this.editingRole = null;
  }

  confirmDelete(role: Role) {
    this.roleToDelete = role;
    this.deleteRoleConfirmText = '';
    this.showDeleteDialog = true;
  }

  /** Razón por la que no se puede eliminar el rol (usuarios asociados o permisos asociados). */
  get deleteBlockReason(): 'users' | 'permissions' | null {
    if (!this.roleToDelete) return null;
    if (this.roleToDelete.usuarios > 0) return 'users';
    if (this.roleToDelete.permisos > 0) return 'permissions';
    return null;
  }

  get canDeleteRole(): boolean {
    return this.deleteBlockReason === null;
  }

  deleteRole() {
    if (!this.canDeleteRole) return;
    if (!this.deleteRoleConfirmValid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Confirmación incorrecta',
        detail: 'Debe escribir "ELIMINAR" para confirmar la acción.',
      });
      return;
    }
    if (this.roleToDelete) {
      const nombre = this.roleToDelete.nombre;
      this.roles = this.roles.filter(r => r.id !== this.roleToDelete!.id);
      this.messageService.add({
        severity: 'success',
        summary: 'Rol eliminado',
        detail: `El rol "${nombre}" fue eliminado correctamente.`,
        life: 5000,
      });
      this.roleToDelete = null;
      this.deleteRoleConfirmText = '';
      this.showDeleteDialog = false;
    }
  }

  closeDeleteRoleDialog() {
    this.deleteRoleConfirmText = '';
    this.roleToDelete = null;
    this.showDeleteDialog = false;
  }

  // ── Validaciones CH-1369 (Crear rol) ──
  get newRoleCodeVacio(): boolean {
    return this.newRoleCodeTouched && !this.newRoleCode.trim();
  }
  get newRoleCodeFormatoInvalido(): boolean {
    if (!this.newRoleCodeTouched || !this.newRoleCode.trim()) return false;
    return !this.ROLE_CODE_REGEX.test(this.newRoleCode.trim().toUpperCase());
  }
  get newRoleCodeDuplicado(): boolean {
    if (!this.newRoleCodeTouched || !this.newRoleCode.trim()) return false;
    return this.roles.some(r => r.codigo.toUpperCase() === this.newRoleCode.trim().toUpperCase());
  }
  get newRoleCodeInvalid(): boolean {
    return this.newRoleCodeVacio || this.newRoleCodeFormatoInvalido || this.newRoleCodeDuplicado;
  }
  get newRoleNameInvalid(): boolean {
    return this.newRoleNameTouched && !this.newRoleName.trim();
  }
  get newRoleNameDuplicado(): boolean {
    if (!this.newRoleNameTouched || !this.newRoleName.trim()) return false;
    return this.roles.some(r => r.nombre.toLowerCase() === this.newRoleName.trim().toLowerCase());
  }
  get newRoleFormValido(): boolean {
    return !!this.newRoleCode.trim()
      && this.ROLE_CODE_REGEX.test(this.newRoleCode.trim().toUpperCase())
      && !this.roles.some(r => r.codigo.toUpperCase() === this.newRoleCode.trim().toUpperCase())
      && !!this.newRoleName.trim()
      && !this.roles.some(r => r.nombre.toLowerCase() === this.newRoleName.trim().toLowerCase());
  }

  get editRoleNameInvalid(): boolean {
    return this.editRoleNameTouched && !this.editRoleName.trim();
  }

  createRole() {
    this.newRoleCodeTouched = true;
    this.newRoleNameTouched = true;

    if (!this.newRoleFormValido) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Revise los campos marcados en rojo y corrija los errores.',
      });
      return;
    }

    if (!this.newRoleName.trim()) return;
    const nextId = Math.max(...this.roles.map(r => r.id)) + 1;
    const newRole: Role = {
      id: nextId,
      codigo: this.newRoleCode || `ROL${String(nextId).padStart(3, '0')}`,
      nombre: this.newRoleName,
      descripcion: this.newRoleDesc,
      usuarios: 0,
      permisos: 0,
      vigencia: this.newRoleVigencia,
      intentos: this.newRoleIntentos,
      fechaModificacion: new Date().toLocaleDateString('es-CO'),
    };
    this.roles.unshift(newRole);
    this.messageService.add({
      severity: 'success',
      summary: 'Perfil creado',
      detail: `El perfil "${newRole.nombre}" fue creado exitosamente.`,
    });
    this.newRoleCode = '';
    this.newRoleName = '';
    this.newRoleDesc = '';
    this.newRoleVigencia = null;
    this.newRoleIntentos = null;
    this.newRoleCodeTouched = false;
    this.newRoleNameTouched = false;
    this.showNewRoleDialog = false;
  }

  // ── Guardar / descartar permisos ──
  savePermissions() {
    if (this.selectedRole) {
      this.selectedRole.permisos = this.selectedLeafCount;
    }
    const resumen = this.totalChanges > 0
      ? `${this.addedLeafNames.length} agregado(s) · ${this.removedLeafNames.length} removido(s).`
      : 'No hubo cambios por guardar.';
    this.messageService.add({
      severity: 'success',
      summary: 'Permisos guardados',
      detail: `Rol "${this.selectedRole?.nombre}". ${resumen}`,
      life: 4500,
    });
    this.backToList();
  }

  discardChanges() {
    this.checkedKeys = new Set(this.initialCheckedKeys);
    this.cdr.detectChanges();
    this.messageService.add({
      severity: 'info',
      summary: 'Cambios descartados',
      detail: 'Se restauraron los permisos al estado original.',
    });
  }
}
