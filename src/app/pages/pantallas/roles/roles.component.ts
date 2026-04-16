import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TabsModule } from 'primeng/tabs';
import { DividerModule } from 'primeng/divider';
import { CheckboxModule } from 'primeng/checkbox';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageModule } from 'primeng/message';
import { MenuModule } from 'primeng/menu';
import { ChipModule } from 'primeng/chip';
import { MessageService, MenuItem } from 'primeng/api';

interface PermissionNode {
  id: number;
  label: string;
  icon?: string;
  checked: boolean;
  indeterminate?: boolean;
  expanded?: boolean;
  children?: PermissionNode[];
}

interface ActionPermission {
  id: number;
  label: string;
  icon: string;
  description: string;
  enabled: boolean;
}

interface Role {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: string;
  usuarios: number;
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
    TagModule,
    InputTextModule,
    ToastModule,
    TooltipModule,
    DialogModule,
    TabsModule,
    DividerModule,
    CheckboxModule,
    IconFieldModule,
    InputIconModule,
    BreadcrumbModule,
    ToggleSwitchModule,
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
  selectedRoleForMenu: Role | null = null;

  constructor(private messageService: MessageService, private cdr: ChangeDetectorRef) {}

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
    { label: 'Seguridad', icon: 'pi pi-shield', routerLink: '/pantallas/seguridad/usuarios' },
    { label: 'Roles' },
  ];
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/' };


  // ── Vista: 'list' = listado de roles, 'edit' = editar permisos ──
  currentView: 'list' | 'edit' = 'list';
  selectedRole: Role | null = null;

  // ── Tab activo en editor de permisos ──
  activePermissionTab: string = '0';

  // ── Búsqueda ──
  searchRoles = '';
  filtersCollapsed = false;
  searchMenu = '';
  searchActions = '';
  searchCategories = '';

  // ── Diálogos ──
  showNewRoleDialog = false;
  showEditRoleDialog = false;
  showDeleteDialog = false;
  roleToDelete: Role | null = null;
  editingRole: Role | null = null;
  editRoleName = '';
  editRoleDesc = '';
  newRoleCode = '';
  newRoleName = '';
  newRoleDesc = '';
  newRoleVigencia: number | null = null;
  newRoleIntentos: number | null = null;


  // ── Roles (perfiles reales del sistema CHIP) ──
  roles: Role[] = [
    { id: 1, codigo: 'ROL001', nombre: 'Administrador General', descripcion: 'Acceso completo a todos los módulos del sistema CHIP', estado: 'Activo', usuarios: 3, fechaModificacion: '2026-04-12' },
    { id: 2, codigo: 'ROL002', nombre: 'Administrador Categorización', descripcion: 'Administración de categorías, formularios y parametrización del sistema', estado: 'Activo', usuarios: 5, fechaModificacion: '2026-04-10' },
    { id: 3, codigo: 'ROL003', nombre: 'Operador de Entidad', descripcion: 'Carga de información, edición de formularios y exportación de datos', estado: 'Activo', usuarios: 48, fechaModificacion: '2026-04-08' },
    { id: 4, codigo: 'ROL004', nombre: 'Consulta', descripcion: 'Solo lectura de información, reportes y exportaciones', estado: 'Activo', usuarios: 120, fechaModificacion: '2026-03-25' },
    { id: 5, codigo: 'ROL005', nombre: 'Auditor', descripcion: 'Acceso a reportes, consistencias y log de auditoría', estado: 'Activo', usuarios: 8, fechaModificacion: '2026-04-01' },
    { id: 6, codigo: 'ROL006', nombre: 'Usuario Propietario', descripcion: 'Gestión de usuarios propietarios de la entidad', estado: 'Activo', usuarios: 15, fechaModificacion: '2026-03-18' },
    { id: 7, codigo: 'ROL007', nombre: 'Soporte Técnico', descripcion: 'Acceso a parámetros del sistema y gestión de incidencias', estado: 'Inactivo', usuarios: 0, fechaModificacion: '2026-02-14' },
  ];

  // ── Drill-down state ──
  menuBreadcrumb: { label: string; nodes: PermissionNode[] }[] = [];
  menuCurrentNodes: PermissionNode[] = [];
  menuCurrentParent: PermissionNode | null = null;

  // ── Snapshot del estado inicial para detectar cambios ──
  private initialMenuState: Map<number, boolean> = new Map();
  private initialActionState: Map<number, boolean> = new Map();
  private initialCatState: Map<number, boolean> = new Map();

  // ── Menú de aplicación — Opciones del Sistema (estructura real CHIP, 4-5 niveles) ──
  menuPermissions: PermissionNode[] = [
    {
      id: 1, label: 'Opciones Menú de Aplicación', icon: 'pi pi-desktop', checked: true, expanded: false,
      children: [
        { id: 11, label: 'Ingresar Opción Operaciones Generales', checked: true },
        {
          id: 12, label: 'Ingresar Opción Seguridad', icon: 'pi pi-shield', checked: true, expanded: false,
          children: [
            { id: 121, label: 'Administrar Módulo Menú de Archivo', checked: true },
          ]
        },
        {
          id: 13, label: 'Ingresar Opción Menú de Usuarios', icon: 'pi pi-users', checked: true, expanded: false,
          children: [
            { id: 131, label: 'Ingresar Opción Nuevo Usuario', checked: true },
            { id: 132, label: 'Ingresar Opción Buscar Usuario', checked: true },
          ]
        },
        { id: 14, label: 'Ingresar Opción Importar listado de correos', checked: false },
        { id: 15, label: 'Ingresar Opción Nuevo', checked: true },
        { id: 16, label: 'Ingresar Opción Guardar', checked: true },
        { id: 17, label: 'Ingresar Opción Imprimir', checked: true },
        {
          id: 18, label: 'Administrar Módulo Menú de Edición', icon: 'pi pi-pencil', checked: true, expanded: false,
          children: [
            { id: 181, label: 'Ingresar Opción Modo de Edición', checked: true },
            { id: 182, label: 'Ingresar Opción Modo de Consulta', checked: true },
          ]
        },
        { id: 19, label: 'Ingresar Opción Seleccionar Formularios', checked: true },
        { id: 110, label: 'Ingresar Opción Grabación Variables Fragmentación', checked: false },
        { id: 111, label: 'Ingresar Opción Exportar', checked: true },
        { id: 112, label: 'Ingresar Opción Exitosas Protocolos de Importación', checked: false },
        { id: 113, label: 'Ingresar Opción Importar Estado de correos', checked: false },
        {
          id: 114, label: 'Ingresar Opción Menú de Consulta', icon: 'pi pi-search', checked: true, expanded: false,
          children: [
            { id: 1141, label: 'Ingresar Opción Modo de Formularios', checked: true },
            { id: 1142, label: 'Ingresar Opción En-Consistencia', checked: true },
          ]
        },
        { id: 115, label: 'Ingresar Opción Entidades', checked: true },
        { id: 116, label: 'Ingresar Opción Encabezados', checked: false },
        {
          id: 117, label: 'Ingresar Opción Categorías', icon: 'pi pi-tags', checked: true, expanded: false,
          children: [
            { id: 1171, label: 'Ingresar Opción Categoría Territorial', checked: true },
            { id: 1172, label: 'Ingresar Opción Entidades Agregadas', checked: false },
          ]
        },
        { id: 118, label: 'Ingresar Opción Encuestas', checked: false },
        { id: 119, label: 'Ingresar Opción Eventos', checked: false },
        { id: 120, label: 'Ingresar Opción Documentos y Términos', checked: false },
        { id: 122, label: 'Ingresar Opción Requerimientos', checked: false },
        { id: 123, label: 'Ingresar Opción Mensajes', checked: true },
        { id: 124, label: 'Ingresar Opción Asistencia Técnica', checked: false },
        { id: 125, label: 'Ingresar Opción Consultas', checked: true },
        {
          id: 126, label: 'Ingresar Opción Consolidación', icon: 'pi pi-objects-column', checked: false, expanded: false,
          children: [
            { id: 1261, label: 'Ingresar Menú de carga de datos a consolidación', checked: false },
            { id: 1262, label: 'Ingresar Opción Autorización de periodo de reporte', checked: false },
            {
              id: 1263, label: 'Ingresar Opción Administrar', checked: false, expanded: false,
              children: [
                { id: 12631, label: 'Ingresar Opción Administrar II', checked: false },
                { id: 12632, label: 'Ingresar Opción Analista de II', checked: false },
                { id: 12633, label: 'Ingresar Entidad de II', checked: false },
                { id: 12634, label: 'Ingresar Opción Consulta de II', checked: false },
              ]
            },
          ]
        },
        {
          id: 127, label: 'Ingresar Opción Menú de Referencia', icon: 'pi pi-bookmark', checked: false, expanded: false,
          children: [
            { id: 1271, label: 'Ingresar Opción Modo de Archivo', checked: false },
          ]
        },
        { id: 128, label: 'Ingresar Opción Usuarios', checked: true },
      ]
    },
    {
      id: 8, label: 'Opciones Tablas de Parámetros', icon: 'pi pi-sliders-h', checked: true, expanded: false,
      children: [
        {
          id: 81, label: 'Administrar Módulo de Listas del Sistema', checked: false, expanded: false,
          children: [
            {
              id: 811, label: 'Administrar Grupo de Tablas GENERALES', checked: false, expanded: false,
              children: [
                { id: 8111, label: 'Ingresar Opción Regresar', checked: false },
              ]
            },
          ]
        },
        { id: 82, label: 'Administrar Tablas Básicas', checked: false },
      ]
    },
  ];

  // ── Acciones (botones) ──
  actionPermissions: ActionPermission[] = [
    { id: 1, label: 'Crear', icon: 'pi pi-plus', description: 'Permite crear nuevos registros, usuarios o formularios', enabled: true },
    { id: 2, label: 'Editar', icon: 'pi pi-pencil', description: 'Permite modificar registros existentes y formularios en modo de edición', enabled: true },
    { id: 3, label: 'Eliminar', icon: 'pi pi-trash', description: 'Permite eliminar registros del sistema', enabled: false },
    { id: 4, label: 'Importar', icon: 'pi pi-upload', description: 'Permite importar información mediante protocolos y archivos externos', enabled: true },
    { id: 5, label: 'Exportar', icon: 'pi pi-download', description: 'Permite exportar datos, reportes y formularios (Excel, PDF, CSV)', enabled: true },
    { id: 6, label: 'Aprobar', icon: 'pi pi-check-circle', description: 'Permite aprobar la información cargada y dar visto bueno', enabled: false },
    { id: 7, label: 'Rechazar', icon: 'pi pi-times-circle', description: 'Permite rechazar información y devolver para corrección', enabled: false },
    { id: 8, label: 'Imprimir', icon: 'pi pi-print', description: 'Permite imprimir reportes, formularios y documentos del sistema', enabled: true },
    { id: 9, label: 'Consultar', icon: 'pi pi-search', description: 'Permite consultar información en modo solo lectura', enabled: true },
    { id: 10, label: 'Consolidar', icon: 'pi pi-objects-column', description: 'Permite ejecutar procesos de consolidación de información', enabled: false },
  ];

  // ── Drill-down state para categorías ──
  catBreadcrumb: { label: string; nodes: PermissionNode[] }[] = [];
  catCurrentNodes: PermissionNode[] = [];
  catCurrentParent: PermissionNode | null = null;

  // ── Categorías (datos reales CHIP — Opciones Categorías) ──
  categoryPermissions: PermissionNode[] = [
    {
      id: 1, label: 'Opciones Menú de Aplicación', icon: 'pi pi-desktop', checked: true, expanded: false,
      children: [
        { id: 11, label: 'Opciones Tablas de Parámetros', checked: true },
        {
          id: 12, label: 'Opciones Categorías', icon: 'pi pi-tags', checked: true, expanded: false,
          children: [
            {
              id: 121, label: 'Administrar Módulo Categorías de Información', icon: 'pi pi-database', checked: true, expanded: false,
              children: [
                {
                  id: 1210, label: 'CATEGORÍA-RAZ (K1)', icon: 'pi pi-folder', checked: true, expanded: false,
                  children: [
                    {
                      id: 12101, label: 'INFORMACIÓN CONTABLE PUBLICA (Reportada)', icon: 'pi pi-book', checked: true, expanded: false,
                      children: [
                        { id: 121011, label: 'Administrar Artículo Rule', checked: true },
                        { id: 121012, label: 'Consultar Grupo', checked: true },
                        { id: 121013, label: 'Importar Publicación', checked: true },
                      ]
                    },
                    {
                      id: 12102, label: 'NOTAS GENERALES A LOS ESTADOS CONTABLES', icon: 'pi pi-book', checked: true, expanded: false,
                      children: [
                        { id: 121021, label: 'Administrar Artículo', checked: true },
                        { id: 121022, label: 'Consultar Grupo', checked: true },
                        { id: 121023, label: 'Importar Publicación', checked: false },
                      ]
                    },
                    {
                      id: 12103, label: 'CGR_PRESUPUESTAL (Reportada hasta dic)', icon: 'pi pi-wallet', checked: true, expanded: false,
                      children: [
                        { id: 121031, label: 'Administrar Artículo Rule', checked: true },
                        { id: 121032, label: 'Consultar Grupo', checked: true },
                        { id: 121033, label: 'Importar Publicación', checked: false },
                      ]
                    },
                    {
                      id: 12104, label: 'INGRESOS (K12)', icon: 'pi pi-wallet', checked: true, expanded: false,
                      children: [
                        { id: 121041, label: 'Administrar Artículo', checked: true },
                        { id: 121042, label: 'Consultar Grupo', checked: false },
                      ]
                    },
                    {
                      id: 12105, label: 'FUT_GASTOS_FUNCIONAMIENTO (Reportada)', icon: 'pi pi-chart-line', checked: false, expanded: false,
                      children: [
                        { id: 121051, label: 'Administrar Artículo Rule', checked: false },
                        { id: 121052, label: 'Consultar Grupo', checked: false },
                        { id: 121053, label: 'Importar Publicación', checked: false },
                      ]
                    },
                    {
                      id: 12106, label: 'FUT_GASTOS_DE_INVERSIÓN (Reportada)', icon: 'pi pi-chart-line', checked: false, expanded: false,
                      children: [
                        { id: 121061, label: 'Administrar Artículo Rule', checked: false },
                        { id: 121062, label: 'Consultar Grupo', checked: false },
                      ]
                    },
                    {
                      id: 12107, label: 'REGALÍAS - 1 (Reportada hasta dic 2018)', icon: 'pi pi-money-bill', checked: false, expanded: false,
                      children: [
                        { id: 121071, label: 'Administrar Artículo', checked: false },
                        { id: 121072, label: 'Consultar Grupo', checked: false },
                      ]
                    },
                    {
                      id: 12108, label: 'REGALÍAS - 2 (K23)', icon: 'pi pi-money-bill', checked: false, expanded: false,
                      children: [
                        { id: 121081, label: 'Administrar Artículo', checked: false },
                        { id: 121082, label: 'Consultar Grupo', checked: false },
                      ]
                    },
                    {
                      id: 12109, label: 'REGALÍAS - 3 (K24)', icon: 'pi pi-money-bill', checked: false, expanded: false,
                      children: [
                        { id: 121091, label: 'Administrar Artículo', checked: false },
                      ]
                    },
                    {
                      id: 12110, label: 'CONTROL INTERNO CONTABLE (Reportada)', icon: 'pi pi-verified', checked: true, expanded: false,
                      children: [
                        { id: 121101, label: 'Administrar Artículo Rule', checked: true },
                        { id: 121102, label: 'Consultar Grupo', checked: true },
                        { id: 121103, label: 'Importar Publicación', checked: false },
                      ]
                    },
                    {
                      id: 12111, label: 'FUT_INGRESOS (Reportada hasta dic 2021)', icon: 'pi pi-chart-line', checked: false, expanded: false,
                      children: [
                        { id: 121111, label: 'Administrar Artículo', checked: false },
                        { id: 121112, label: 'Consultar Grupo', checked: false },
                      ]
                    },
                    {
                      id: 12112, label: 'CGR SISTEMA GENERAL DE REGALÍAS', icon: 'pi pi-money-bill', checked: false, expanded: false,
                      children: [
                        { id: 121121, label: 'Administrar Artículo Rule', checked: false },
                        { id: 121122, label: 'Consultar Grupo', checked: false },
                      ]
                    },
                    {
                      id: 12113, label: 'FUT_SERVICIO_DEUDA (Reportada hasta dic)', icon: 'pi pi-chart-line', checked: false, expanded: false,
                      children: [
                        { id: 121131, label: 'Administrar Artículo', checked: false },
                        { id: 121132, label: 'Importar Publicación', checked: false },
                      ]
                    },
                    {
                      id: 12114, label: 'FUT_CIERRE_FISCAL (K29)', icon: 'pi pi-calendar', checked: true, expanded: false,
                      children: [
                        { id: 121141, label: 'Administrar Artículo Rule', checked: true },
                        { id: 121142, label: 'Consultar Grupo', checked: true },
                      ]
                    },
                    {
                      id: 12115, label: 'FUT_RESERVAS (Reportada hasta dic 2021)', icon: 'pi pi-chart-line', checked: false, expanded: false,
                      children: [
                        { id: 121151, label: 'Administrar Artículo', checked: false },
                      ]
                    },
                    {
                      id: 12116, label: 'BOLETÍN DE DEUDORES MOROSOS DEL ESTADO', icon: 'pi pi-file', checked: false, expanded: false,
                      children: [
                        { id: 121161, label: 'Administrar Artículo', checked: false },
                        { id: 121162, label: 'Consultar Grupo', checked: false },
                      ]
                    },
                    {
                      id: 12117, label: 'FUT_EXCEDENTES_LIQUIDEZ (Reportada)', icon: 'pi pi-chart-line', checked: false, expanded: false,
                      children: [
                        { id: 121171, label: 'Administrar Artículo', checked: false },
                      ]
                    },
                    {
                      id: 12118, label: 'SALDO_DEUDA (K33)', icon: 'pi pi-wallet', checked: false, expanded: false,
                      children: [
                        { id: 121181, label: 'Administrar Artículo', checked: false },
                        { id: 121182, label: 'Consultar Grupo', checked: false },
                      ]
                    },
                    {
                      id: 12119, label: 'FUT_CUENTAS_POR_PAGAR (Reportada)', icon: 'pi pi-chart-line', checked: true, expanded: false,
                      children: [
                        { id: 121191, label: 'Administrar Artículo Rule', checked: true },
                        { id: 121192, label: 'Consultar Grupo', checked: true },
                        { id: 121193, label: 'Importar Publicación', checked: false },
                      ]
                    },
                    {
                      id: 12120, label: 'FUT_VIGENCIAS_FUTURAS (K37)', icon: 'pi pi-calendar', checked: false, expanded: false,
                      children: [
                        { id: 121201, label: 'Administrar Artículo', checked: false },
                      ]
                    },
                    {
                      id: 12121, label: 'RESGUARDOS_1 (K40)', icon: 'pi pi-map', checked: false, expanded: false,
                      children: [
                        { id: 121211, label: 'Administrar Artículo', checked: false },
                        { id: 121212, label: 'Consultar Grupo', checked: false },
                      ]
                    },
                    {
                      id: 12122, label: 'RESGUARDOS_2 (K41)', icon: 'pi pi-map', checked: false, expanded: false,
                      children: [
                        { id: 121221, label: 'Administrar Artículo', checked: false },
                      ]
                    },
                    {
                      id: 12123, label: 'RESGUARDOS_3 (K42)', icon: 'pi pi-map', checked: false, expanded: false,
                      children: [
                        { id: 121231, label: 'Administrar Artículo', checked: false },
                      ]
                    },
                    {
                      id: 12124, label: 'ICBF - CONTRATOS PAE (Reportada)', icon: 'pi pi-file', checked: false, expanded: false,
                      children: [
                        { id: 121241, label: 'Administrar Artículo Rule', checked: false },
                        { id: 121242, label: 'Consultar Grupo', checked: false },
                        { id: 121243, label: 'Importar Publicación', checked: false },
                      ]
                    },
                  ]
                },
              ]
            },
          ]
        },
      ]
    },
  ];

  // ── Resumen de permisos ──
  get menuCount(): number {
    return this.countChecked(this.menuPermissions);
  }
  get menuTotal(): number {
    return this.countTotal(this.menuPermissions);
  }
  get actionCount(): number {
    return this.actionPermissions.filter(a => a.enabled).length;
  }
  get categoryCount(): number {
    return this.countChecked(this.categoryPermissions);
  }
  get categoryTotal(): number {
    return this.countTotal(this.categoryPermissions);
  }

  get activeFilterCount(): number {
    return this.searchRoles ? 1 : 0;
  }

  get activeFilters(): { label: string; field: string }[] {
    const filters: { label: string; field: string }[] = [];
    if (this.searchRoles) filters.push({ label: `Búsqueda: "${this.searchRoles}"`, field: 'searchRoles' });
    return filters;
  }

  removeFilter(field: string) {
    (this as any)[field] = '';
  }

  clearFilters() {
    this.searchRoles = '';
  }

  // ── Filtrado de roles ──
  get filteredRoles(): Role[] {
    if (!this.searchRoles) return this.roles;
    const q = this.searchRoles.toLowerCase();
    return this.roles.filter(r =>
      r.nombre.toLowerCase().includes(q) || r.descripcion.toLowerCase().includes(q)
    );
  }

  // ── Drill-down del menú ──
  initDrillDown() {
    this.menuCurrentNodes = this.menuPermissions;
    this.menuBreadcrumb = [{ label: 'Opciones del Sistema', nodes: this.menuPermissions }];
    this.menuCurrentParent = null;
  }

  drillInto(node: PermissionNode) {
    if (!node.children?.length) return;
    this.menuBreadcrumb.push({ label: node.label, nodes: node.children });
    this.menuCurrentNodes = node.children;
    this.menuCurrentParent = node;
    this.searchMenu = '';
  }

  drillTo(index: number) {
    this.menuBreadcrumb = this.menuBreadcrumb.slice(0, index + 1);
    const target = this.menuBreadcrumb[this.menuBreadcrumb.length - 1];
    this.menuCurrentNodes = target.nodes;
    this.menuCurrentParent = index === 0 ? null : this.findParent(target.nodes);
    this.searchMenu = '';
  }

  drillBack() {
    if (this.menuBreadcrumb.length <= 1) return;
    this.drillTo(this.menuBreadcrumb.length - 2);
  }

  private findParent(targetChildren: PermissionNode[]): PermissionNode | null {
    const find = (nodes: PermissionNode[]): PermissionNode | null => {
      for (const n of nodes) {
        if (n.children === targetChildren) return n;
        if (n.children) {
          const found = find(n.children);
          if (found) return found;
        }
      }
      return null;
    };
    return find(this.menuPermissions);
  }

  getCheckedCount(node: PermissionNode): number {
    return this.countChecked([node]);
  }

  getTotalCount(node: PermissionNode): number {
    return this.countTotal([node]);
  }

  get filteredCurrentNodes(): PermissionNode[] {
    if (!this.searchMenu) return this.menuCurrentNodes;
    const q = this.searchMenu.toLowerCase();
    return this.menuCurrentNodes.filter(n => n.label.toLowerCase().includes(q));
  }

  selectAllCurrent(checked: boolean) {
    for (const node of this.menuCurrentNodes) {
      node.checked = checked;
      node.indeterminate = false;
      this.setAllChildren(node, checked);
    }
    if (this.menuCurrentParent) {
      this.updateParentState(this.menuCurrentParent);
    }
    this.cdr.detectChanges();
    const action = checked ? 'seleccionados' : 'deseleccionados';
    this.messageService.add({ severity: 'info', summary: `Permisos ${action}`, detail: `Todos los permisos del nivel actual fueron ${action}.` });
  }

  // ── Drill-down categorías ──
  initCatDrillDown() {
    this.catCurrentNodes = this.categoryPermissions;
    this.catBreadcrumb = [{ label: 'Categorías', nodes: this.categoryPermissions }];
    this.catCurrentParent = null;
  }

  catDrillInto(node: PermissionNode) {
    if (!node.children?.length) return;
    this.catBreadcrumb.push({ label: node.label, nodes: node.children });
    this.catCurrentNodes = node.children;
    this.catCurrentParent = node;
    this.searchCategories = '';
  }

  catDrillTo(index: number) {
    this.catBreadcrumb = this.catBreadcrumb.slice(0, index + 1);
    const target = this.catBreadcrumb[this.catBreadcrumb.length - 1];
    this.catCurrentNodes = target.nodes;
    this.catCurrentParent = index === 0 ? null : this.findCatParent(target.nodes);
    this.searchCategories = '';
  }

  catDrillBack() {
    if (this.catBreadcrumb.length <= 1) return;
    this.catDrillTo(this.catBreadcrumb.length - 2);
  }

  private findCatParent(targetChildren: PermissionNode[]): PermissionNode | null {
    const find = (nodes: PermissionNode[]): PermissionNode | null => {
      for (const n of nodes) {
        if (n.children === targetChildren) return n;
        if (n.children) {
          const found = find(n.children);
          if (found) return found;
        }
      }
      return null;
    };
    return find(this.categoryPermissions);
  }

  get filteredCatNodes(): PermissionNode[] {
    if (!this.searchCategories) return this.catCurrentNodes;
    const q = this.searchCategories.toLowerCase();
    return this.catCurrentNodes.filter(n => n.label.toLowerCase().includes(q));
  }

  selectAllCatCurrent(checked: boolean) {
    for (const node of this.catCurrentNodes) {
      node.checked = checked;
      node.indeterminate = false;
      this.setAllChildren(node, checked);
    }
    if (this.catCurrentParent) {
      this.updateParentState(this.catCurrentParent);
    }
    this.cdr.detectChanges();
    const action = checked ? 'seleccionadas' : 'deseleccionadas';
    this.messageService.add({ severity: 'info', summary: `Categorías ${action}`, detail: `Todas las categorías del nivel actual fueron ${action}.` });
  }

  // ── Snapshot y cambios ──
  private snapshotTree(nodes: PermissionNode[], map: Map<number, boolean>) {
    for (const n of nodes) {
      if (!n.children) map.set(n.id, n.checked);
      if (n.children) this.snapshotTree(n.children, map);
    }
  }

  private diffTree(nodes: PermissionNode[], initial: Map<number, boolean>): { added: string[]; removed: string[] } {
    const added: string[] = [];
    const removed: string[] = [];
    const walk = (list: PermissionNode[]) => {
      for (const n of list) {
        if (!n.children) {
          const was = initial.get(n.id) ?? false;
          if (n.checked && !was) added.push(n.label);
          if (!n.checked && was) removed.push(n.label);
        }
        if (n.children) walk(n.children);
      }
    };
    walk(nodes);
    return { added, removed };
  }

  get menuChanges() { return this.diffTree(this.menuPermissions, this.initialMenuState); }
  get actionChanges() {
    const added: string[] = [];
    const removed: string[] = [];
    for (const a of this.actionPermissions) {
      const was = this.initialActionState.get(a.id) ?? false;
      if (a.enabled && !was) added.push(a.label);
      if (!a.enabled && was) removed.push(a.label);
    }
    return { added, removed };
  }
  get catChanges() { return this.diffTree(this.categoryPermissions, this.initialCatState); }
  get totalChanges() {
    const m = this.menuChanges;
    const a = this.actionChanges;
    const c = this.catChanges;
    return m.added.length + m.removed.length + a.added.length + a.removed.length + c.added.length + c.removed.length;
  }

  discardChanges() {
    // Restaurar menú
    const restoreTree = (nodes: PermissionNode[], initial: Map<number, boolean>) => {
      for (const n of nodes) {
        if (!n.children && initial.has(n.id)) n.checked = initial.get(n.id)!;
        if (n.children) restoreTree(n.children, initial);
      }
    };
    restoreTree(this.menuPermissions, this.initialMenuState);
    restoreTree(this.categoryPermissions, this.initialCatState);
    for (const a of this.actionPermissions) {
      if (this.initialActionState.has(a.id)) a.enabled = this.initialActionState.get(a.id)!;
    }
    this.cdr.detectChanges();
    this.messageService.add({ severity: 'info', summary: 'Cambios descartados', detail: 'Se restauraron los permisos al estado original.' });
  }

  // ── Acciones de roles ──
  editRole(role: Role) {
    this.selectedRole = role;
    this.currentView = 'edit';
    this.activePermissionTab = '0';
    this.initDrillDown();
    this.initCatDrillDown();
    // Snapshot del estado inicial
    this.initialMenuState.clear();
    this.initialActionState.clear();
    this.initialCatState.clear();
    this.snapshotTree(this.menuPermissions, this.initialMenuState);
    this.snapshotTree(this.categoryPermissions, this.initialCatState);
    for (const a of this.actionPermissions) this.initialActionState.set(a.id, a.enabled);
  }

  backToList() {
    this.currentView = 'list';
    this.selectedRole = null;
  }

  openEditDialog(role: Role) {
    this.editingRole = role;
    this.editRoleName = role.nombre;
    this.editRoleDesc = role.descripcion;
    this.showEditRoleDialog = true;
  }

  saveEditRole() {
    if (!this.editingRole || !this.editRoleName.trim()) return;
    this.editingRole.nombre = this.editRoleName;
    this.editingRole.descripcion = this.editRoleDesc;
    this.messageService.add({ severity: 'success', summary: 'Rol actualizado', detail: `El perfil "${this.editRoleName}" fue actualizado.` });
    this.showEditRoleDialog = false;
    this.editingRole = null;
  }

  confirmDelete(role: Role) {
    this.roleToDelete = role;
    this.showDeleteDialog = true;
  }

  deleteRole() {
    if (this.roleToDelete) {
      this.roles = this.roles.filter(r => r.id !== this.roleToDelete!.id);
      this.messageService.add({
        severity: 'success',
        summary: 'Rol eliminado',
        detail: `El rol "${this.roleToDelete.nombre}" fue eliminado correctamente.`
      });
      this.roleToDelete = null;
      this.showDeleteDialog = false;
    }
  }

  createRole() {
    if (!this.newRoleName.trim()) return;
    const nextId = Math.max(...this.roles.map(r => r.id)) + 1;
    const newRole: Role = {
      id: nextId,
      codigo: this.newRoleCode || `ROL${String(nextId).padStart(3, '0')}`,
      nombre: this.newRoleName,
      descripcion: this.newRoleDesc,
      estado: 'Activo',
      usuarios: 0,
      fechaModificacion: new Date().toLocaleDateString('es-CO'),
    };
    this.roles.unshift(newRole);
    this.messageService.add({
      severity: 'success',
      summary: 'Perfil creado',
      detail: `El perfil "${newRole.nombre}" fue creado exitosamente.`
    });
    this.newRoleCode = '';
    this.newRoleName = '';
    this.newRoleDesc = '';
    this.newRoleVigencia = null;
    this.newRoleIntentos = null;
    this.showNewRoleDialog = false;
  }

  savePermissions() {
    this.messageService.add({
      severity: 'success',
      summary: 'Permisos guardados',
      detail: `Los permisos del rol "${this.selectedRole?.nombre}" fueron actualizados.`
    });
    this.backToList();
  }

  // ── Árbol de permisos ──
  toggleNode(node: PermissionNode) {
    node.expanded = !node.expanded;
  }

  toggleCheck(node: PermissionNode, parent?: PermissionNode) {
    // ngModel ya actualizó node.checked, solo propagamos
    if (node.children) {
      this.setAllChildren(node, node.checked);
    }
    if (parent) {
      this.updateParentState(parent);
    }
    this.cdr.detectChanges();
  }

  private setAllChildren(node: PermissionNode, checked: boolean) {
    if (node.children) {
      for (const child of node.children) {
        child.checked = checked;
        this.setAllChildren(child, checked);
      }
    }
  }

  private updateParentState(parent: PermissionNode) {
    if (!parent.children) return;
    const allChecked = parent.children.every(c => c.checked);
    const someChecked = parent.children.some(c => c.checked || c.indeterminate);
    parent.checked = allChecked;
    parent.indeterminate = !allChecked && someChecked;
  }

  onActionToggle() {
    this.cdr.detectChanges();
  }

  selectAll(nodes: PermissionNode[], checked: boolean) {
    for (const node of nodes) {
      node.checked = checked;
      node.indeterminate = false;
      this.setAllChildren(node, checked);
    }
    const action = checked ? 'seleccionados' : 'deseleccionados';
    this.messageService.add({
      severity: 'info',
      summary: `Permisos ${action}`,
      detail: `Todos los permisos fueron ${action}.`
    });
  }

  expandAll(nodes: PermissionNode[], expanded: boolean) {
    for (const node of nodes) {
      node.expanded = expanded;
      if (node.children) {
        this.expandAll(node.children, expanded);
      }
    }
  }

  // Filtrado del árbol
  filterTree(nodes: PermissionNode[], search: string): PermissionNode[] {
    if (!search) return nodes;
    const q = search.toLowerCase();
    return nodes.filter(node => {
      const matchesSelf = node.label.toLowerCase().includes(q);
      const matchesChildren = node.children ? this.filterTree(node.children, search).length > 0 : false;
      return matchesSelf || matchesChildren;
    });
  }

  private countChecked(nodes: PermissionNode[]): number {
    let count = 0;
    for (const node of nodes) {
      if (!node.children && node.checked) count++;
      if (node.children) count += this.countChecked(node.children);
    }
    return count;
  }

  private countTotal(nodes: PermissionNode[]): number {
    let count = 0;
    for (const node of nodes) {
      if (!node.children) count++;
      if (node.children) count += this.countTotal(node.children);
    }
    return count;
  }

  getRoleSeverity(estado: string): 'success' | 'danger' {
    return estado === 'Activo' ? 'success' : 'danger';
  }
}
