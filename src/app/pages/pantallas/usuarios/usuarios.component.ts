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
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { MenuModule } from 'primeng/menu';
import { ChipModule } from 'primeng/chip';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService, MenuItem } from 'primeng/api';

import { DirectorioEntidadesComponent, Entidad } from '../../../components/directorio-entidades/directorio-entidades.component';
import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import { FormErrorBannerComponent } from '../../../components/form-error-banner/form-error-banner.component';

interface Usuario {
  id: number;
  codigo: string;
  documento: string;
  nombre: string;
  correo: string;
  perfil: string;
  tipoUsuario: 'LOCAL' | 'CENTRAL' | 'ESTRATÉGICO';
  entidad: { codigo: string; nombre: string };
  activo: boolean;
  ultimoAcceso: string;
  /** Fecha de la última edición — se actualiza automáticamente al guardar cambios. */
  fechaUltimaModificacion?: string;
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
    ToastModule, TooltipModule,
    IconFieldModule, InputIconModule, SelectModule,
    DialogModule, DividerModule, MenuModule, ChipModule,
    AutoCompleteModule, RadioButtonModule, SelectButtonModule,
    DirectorioEntidadesComponent, AppBreadcrumbComponent, FormErrorBannerComponent,
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

  /** Formato del código mostrado en la tabla: USR-001, USR-002, ... */
  formatCodigoDisplay(id: number): string {
    return 'USR-' + String(id).padStart(3, '0');
  }

  /** Convierte 'LOCAL' / 'CENTRAL' / 'ESTRATÉGICO' a 'Local' / 'Central' / 'Estratégico'. */
  formatTipoUsuario(tipo: 'LOCAL' | 'CENTRAL' | 'ESTRATÉGICO'): string {
    if (!tipo) return '';
    return tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
  }

  /** Acción inline: Editar usuario desde la fila. */
  onEditarClick(usuario: Usuario) {
    this.selectedUsuario = usuario;
    this.openEditDialog(usuario);
  }

  /** Acción inline: Eliminar usuario desde la fila (abre diálogo de confirmación). */
  onEliminarClick(usuario: Usuario) {
    this.selectedUsuario = usuario;
    this.deleteConfirmText = '';
    this.showDeleteDialog = true;
  }

  /** Acción inline: Activar/Desactivar usuario desde la fila (abre diálogo de confirmación). */
  onToggleClick(usuario: Usuario) {
    this.selectedUsuario = usuario;
    this.showToggleDialog = true;
  }

  // ── Filtros (CH-1360 spec) ──
  filterUsuario = '';                                  // Alfanumérico 4-20
  filterDocumento = '';                                // Numérico 4-20
  filterEntidad: Entidad | null = null;                // Selección vía modal (input es trigger)
  filterNombre = '';                                   // Texto autocomplete 3-100
  filterPerfil = '';                                   // Selección
  filterTipoUsuario = '';                              // LOCAL/CENTRAL/ESTRATÉGICO
  filterEstado: 'true' | 'false' | 'todos' = 'true';   // Default Activo
  filtersCollapsed = false;

  // Estado de búsqueda — la tabla muestra resultados solo tras presionar "Buscar"
  busquedaRealizada = false;
  // Snapshot de los filtros aplicados al momento de buscar (para mostrar resultados estables)
  private filtrosAplicados: {
    usuario: string; documento: string;
    entidadCodigo: string;
    nombre: string; perfil: string;
    tipoUsuario: string; estado: string;
  } | null = null;

  // Modal Directorio de Entidades
  mostrarDirectorioEntidades = false;

  // Sugerencias autocomplete (solo del campo Nombre — Entidad usa modal)
  sugerenciasNombre: string[] = [];

  showNewDialog = false;
  showEditDialog = false;
  showToggleDialog = false;
  showDeleteDialog = false;

  // Modal: restablecer contraseña (acción admin desde Editar Usuario).
  // Replica el flujo de olvide-clave pero invocado desde el panel de admin.
  showRestablecerDialog = false;
  correosAutorizadosRestablecer: string[] = [];
  correoRestablecerSeleccionado = '';
  /** Datos de la mesa de servicio CGN — mismos que olvide-clave. */
  readonly MESA_SERVICIO_PBX = '4926400 Opción 2';
  readonly MESA_SERVICIO_EMAIL = 'mesadeservicio@contaduria.gov.co';
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
  nuevoDocumento = '';
  nuevoTipo: 'LOCAL' | 'CENTRAL' | 'ESTRATÉGICO' | '' = '';
  nuevoEntidad: Entidad | null = null;
  nuevoEstado = true;

  // Touched flags (validación visual)
  nuevoCodigoTouched = false;
  nuevoNombreTouched = false;
  nuevoCorreoTouched = false;
  nuevoPerfilTouched = false;
  nuevoDocumentoTouched = false;
  nuevoTipoTouched = false;
  nuevoEntidadTouched = false;

  // Submitted flag — controla cuándo se muestra el banner de errores
  nuevoFormSubmitted = false;

  // Modal Directorio para el formulario de creación (independiente del filtro)
  mostrarDirectorioEntidadesNuevo = false;

  // Editar usuario
  editNombre = '';
  editCorreo = '';
  editPerfil = '';
  editDocumento = '';
  editTipo: 'LOCAL' | 'CENTRAL' | 'ESTRATÉGICO' | '' = '';
  editEntidad: Entidad | null = null;
  editEstado = true;
  editFechaUltimaModificacion = '';
  editNombreTouched = false;
  editCorreoTouched = false;
  editDocumentoTouched = false;
  editTipoTouched = false;
  editEntidadTouched = false;

  // Submitted flags — controlan los banners de errores
  editFormSubmitted = false;
  deleteFormSubmitted = false;

  // Modal Directorio para el formulario de edición
  mostrarDirectorioEntidadesEdit = false;

  perfilOptions = [
    { label: 'Todos', value: '' },
    { label: 'Administrador General', value: 'Administrador General' },
    { label: 'Administrador Categorización', value: 'Administrador Categorización' },
    { label: 'Operador de Entidad', value: 'Operador de Entidad' },
    { label: 'Consulta', value: 'Consulta' },
    { label: 'Auditor', value: 'Auditor' },
  ];

  tipoUsuarioOptions = [
    { label: 'Todos', value: '' },
    { label: 'Local', value: 'LOCAL' },
    { label: 'Central', value: 'CENTRAL' },
    { label: 'Estratégico', value: 'ESTRATÉGICO' },
  ];

  /** Opciones de Tipo para el formulario de creación (sin "Todos"). */
  tipoUsuarioFormOptions = [
    { label: 'Local', value: 'LOCAL' },
    { label: 'Central', value: 'CENTRAL' },
    { label: 'Estratégico', value: 'ESTRATÉGICO' },
  ];

  /** Opciones de Estado para el formulario de creación. */
  estadoFormOptions = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ];

  /** Perfiles disponibles para el formulario (excluye "Todos"). */
  get perfilFormOptions() {
    return this.perfilOptions.filter(o => o.value !== '');
  }

  /**
   * Roles técnicos disponibles para asignar al crear un usuario.
   * Códigos de sistema (no nombres legibles) — convención CHIP/CGN.
   * Aplica al perfil "Admin Central" (sin restricciones).
   */
  rolesFormOptions = [
    { label: 'ADM_CATEGORIZACION', value: 'ADM_CATEGORIZACION' },
    { label: 'ADM_CAT_BDME', value: 'ADM_CAT_BDME' },
    { label: 'ADM_CAT_CGR', value: 'ADM_CAT_CGR' },
    { label: 'ADM_CAT_CINTERNO', value: 'ADM_CAT_CINTERNO' },
    { label: 'ADM_PARAMETRIZACION', value: 'ADM_PARAMETRIZACION' },
    { label: 'ADM_REPORTES', value: 'ADM_REPORTES' },
    { label: 'OPE_FORMULARIOS', value: 'OPE_FORMULARIOS' },
    { label: 'OPE_VALIDACION', value: 'OPE_VALIDACION' },
  ];

  /**
   * Roles disponibles para un Admin Local (entidad reportante: alcaldía,
   * hospital, etc.). Subset reducido — solo gestiona usuarios de su entidad.
   */
  rolesLocalesOptions = [
    { label: 'Administrador', value: 'Administrador' },
    { label: 'Registro', value: 'Registro' },
    { label: 'Registro y publicación', value: 'Registro y publicación' },
  ];

  // ── Vista de demostración (perfil del administrador) ──
  /**
   * Perfil del usuario que está viendo la pantalla. Toggle de demostración.
   * - 'central': Admin del CHIP central (Diana Cati, Sandrao). Sin restricciones.
   * - 'local': Admin de entidad reportante (alcaldía, hospital). Tipo + Entidad
   *   bloqueados al perfil del usuario logueado; subset de roles reducido.
   */
  vistaAdmin: 'central' | 'local' = 'central';

  vistaAdminOptions = [
    { label: 'Admin Central', value: 'central' },
    { label: 'Admin Local', value: 'local' },
  ];

  /**
   * Entidad "logueada" simulada cuando vistaAdmin === 'local'.
   * En producción vendría del token/sesión del usuario.
   */
  loggedEntidadLocal: Entidad = {
    codigo: '211511001',
    nit: '800.890.123-8',
    razonSocial: 'Alcaldía Mayor de Bogotá D.C.',
    departamento: 'Cundinamarca',
    municipio: 'Bogotá D.C.',
    estado: 'Activo',
  };

  /** True cuando el usuario está viendo como Admin Local. */
  get esVistaLocal(): boolean {
    return this.vistaAdmin === 'local';
  }

  /** Roles disponibles según la vista actual (central = todos, local = subset). */
  get rolesDisponibles() {
    return this.esVistaLocal ? this.rolesLocalesOptions : this.rolesFormOptions;
  }

  /** Opciones para el filtro de Rol — incluye "Todos" + el subset según vista. */
  get rolesFilterOptions() {
    if (this.esVistaLocal) {
      return [{ label: 'Todos', value: '' }, ...this.rolesLocalesOptions];
    }
    return this.perfilOptions;
  }

  /** Opciones para el SelectButton de Estado (segmented control). */
  estadoOptions = [
    { label: 'Activo', value: 'true' },
    { label: 'Inactivo', value: 'false' },
    { label: 'Todos', value: 'todos' },
  ];

  usuarios: Usuario[] = [
    { id: 1, codigo: 'DILA710990', documento: '52789012', nombre: 'Omaira Lozada Ladino', correo: 'olozada@cgn.gov.co', perfil: 'Administrador Categorización', tipoUsuario: 'CENTRAL', entidad: { codigo: '210105001', nombre: 'PROYECTO CHIP 2.0' }, activo: true, ultimoAcceso: '14/04/2024', fechaUltimaModificacion: '14/04/2024', vigencia: 90, intentos: 3 },
    { id: 2, codigo: 'JMGA850312', documento: '79456123', nombre: 'Juan Manuel García Arévalo', correo: 'jgarcia@minhacienda.gov.co', perfil: 'Operador de Entidad', tipoUsuario: 'CENTRAL', entidad: { codigo: '211511001', nombre: 'MINISTERIO DE HACIENDA' }, activo: true, ultimoAcceso: '20/03/2024', fechaUltimaModificacion: '18/03/2024', vigencia: 60, intentos: 5 },
    { id: 3, codigo: 'MCRP920115', documento: '52123456', nombre: 'María Cristina Rodríguez', correo: 'mrodriguez@cgn.gov.co', perfil: 'Consulta', tipoUsuario: 'CENTRAL', entidad: { codigo: '210111001', nombre: 'CGN - CONTADURÍA GENERAL' }, activo: true, ultimoAcceso: '10/04/2024', fechaUltimaModificacion: '02/04/2024', vigencia: null, intentos: null },
    { id: 4, codigo: 'CPLS880704', documento: '79987654', nombre: 'Carlos Pérez López', correo: 'cperez@cgn.gov.co', perfil: 'Administrador General', tipoUsuario: 'ESTRATÉGICO', entidad: { codigo: '210111001', nombre: 'CGN - CONTADURÍA GENERAL' }, activo: true, ultimoAcceso: '28/02/2024', fechaUltimaModificacion: '15/02/2024', vigencia: 90, intentos: 3 },
    { id: 5, codigo: 'AMVR760521', documento: '43654321', nombre: 'Ana María Vargas Restrepo', correo: 'avargas@contraloria.gov.co', perfil: 'Auditor', tipoUsuario: 'CENTRAL', entidad: { codigo: '210168001', nombre: 'CONTRALORÍA GENERAL' }, activo: true, ultimoAcceso: '05/04/2024', fechaUltimaModificacion: '01/04/2024', vigencia: 90, intentos: 3 },
    { id: 6, codigo: 'LFHM900830', documento: '80345678', nombre: 'Luis Fernando Hernández', correo: 'lhernandez@bogota.gov.co', perfil: 'Operador de Entidad', tipoUsuario: 'LOCAL', entidad: { codigo: '211511001', nombre: 'ALCALDÍA DE BOGOTÁ' }, activo: false, ultimoAcceso: '15/01/2024', fechaUltimaModificacion: '20/12/2023', vigencia: 60, intentos: 5 },
    { id: 7, codigo: 'SMPG950210', documento: '32678910', nombre: 'Sandra Milena Pinzón', correo: 'spinzon@antioquia.gov.co', perfil: 'Operador de Entidad', tipoUsuario: 'LOCAL', entidad: { codigo: '210105001', nombre: 'GOBERNACIÓN DE ANTIOQUIA' }, activo: true, ultimoAcceso: '12/04/2024', fechaUltimaModificacion: '08/04/2024', vigencia: null, intentos: null },
    { id: 8, codigo: 'RDTM830619', documento: '79234567', nombre: 'Ricardo Daniel Torres', correo: 'rtorres@dane.gov.co', perfil: 'Consulta', tipoUsuario: 'CENTRAL', entidad: { codigo: '211511001', nombre: 'DANE' }, activo: true, ultimoAcceso: '30/03/2024', fechaUltimaModificacion: '25/03/2024', vigencia: null, intentos: null },
  ];

  /** Resultados de la búsqueda — solo se calculan tras presionar "Buscar". */
  get filteredUsuarios(): Usuario[] {
    if (!this.busquedaRealizada || !this.filtrosAplicados) return [];
    const f = this.filtrosAplicados;
    return this.usuarios.filter(u => {
      const matchUsuario = !f.usuario || u.codigo.toLowerCase().includes(f.usuario);
      const matchDocumento = !f.documento || u.documento.includes(f.documento);
      const matchEntidad = !f.entidadCodigo || u.entidad.codigo === f.entidadCodigo;
      const matchNombre = !f.nombre || this.normaliza(u.nombre).includes(this.normaliza(f.nombre));
      const matchPerfil = !f.perfil || u.perfil === f.perfil;
      const matchTipo = !f.tipoUsuario || u.tipoUsuario === f.tipoUsuario;
      const matchEstado = f.estado === 'todos' || String(u.activo) === f.estado;
      return matchUsuario && matchDocumento && matchEntidad && matchNombre
          && matchPerfil && matchTipo && matchEstado;
    });
  }

  /** Cuenta de filtros con valor (para mostrar badge en header del bloque). */
  get activeFilterCount(): number {
    let count = 0;
    if (this.filterUsuario) count++;
    if (this.filterDocumento) count++;
    if (this.filterEntidad) count++;
    if (this.filterNombre) count++;
    if (this.filterPerfil) count++;
    if (this.filterTipoUsuario) count++;
    if (this.filterEstado !== 'true') count++;  // Activo es default, no cuenta
    return count;
  }

  get activeFilters(): { label: string; field: string }[] {
    const filters: { label: string; field: string }[] = [];
    if (this.filterUsuario) filters.push({ label: `Usuario: "${this.filterUsuario}"`, field: 'filterUsuario' });
    if (this.filterDocumento) filters.push({ label: `Documento: "${this.filterDocumento}"`, field: 'filterDocumento' });
    // Entidad y Tipo NO se muestran como chips removibles cuando el perfil es Local
    // (el usuario no puede modificarlos manualmente — están bloqueados).
    if (this.filterEntidad && !this.esVistaLocal) filters.push({ label: `Entidad: ${this.filterEntidad.codigo} · ${this.filterEntidad.razonSocial}`, field: 'filterEntidad' });
    if (this.filterNombre) filters.push({ label: `Nombre: "${this.filterNombre}"`, field: 'filterNombre' });
    if (this.filterPerfil) filters.push({ label: `Perfil: ${this.filterPerfil}`, field: 'filterPerfil' });
    if (this.filterTipoUsuario && !this.esVistaLocal) filters.push({ label: `Tipo: ${this.filterTipoUsuario}`, field: 'filterTipoUsuario' });
    if (this.filterEstado !== 'true') {
      const lbl = this.filterEstado === 'todos' ? 'Todos' : (this.filterEstado === 'false' ? 'Inactivo' : 'Activo');
      filters.push({ label: `Estado: ${lbl}`, field: 'filterEstado' });
    }
    return filters;
  }

  removeFilter(field: string) {
    if (field === 'filterEstado') {
      this.filterEstado = 'true'; // vuelve al default
    } else if (field === 'filterEntidad') {
      this.filterEntidad = null;
    } else {
      (this as any)[field] = '';
    }
  }

  clearFilters() {
    this.filterUsuario = '';
    this.filterDocumento = '';
    this.filterNombre = '';
    this.filterPerfil = '';
    this.filterEstado = 'true';
    if (this.esVistaLocal) {
      // Mantener los campos bloqueados — el Admin Local no puede liberarlos.
      this.filterTipoUsuario = 'LOCAL';
      this.filterEntidad = this.loggedEntidadLocal;
    } else {
      this.filterTipoUsuario = '';
      this.filterEntidad = null;
    }
    this.busquedaRealizada = false;
    this.filtrosAplicados = null;
  }

  /**
   * Aplica los bloqueos al cambiar el toggle de vista de demostración.
   * En modo Local: fija Tipo=LOCAL y Entidad=loggedEntidadLocal.
   * En modo Central: libera ambos campos a sus defaults.
   */
  onVistaAdminChange() {
    if (this.esVistaLocal) {
      this.filterTipoUsuario = 'LOCAL';
      this.filterEntidad = this.loggedEntidadLocal;
      // Si el filtro de Rol tiene un valor que no existe en el subset local, limpiarlo.
      if (this.filterPerfil && !this.rolesLocalesOptions.some(r => r.value === this.filterPerfil)) {
        this.filterPerfil = '';
      }
    } else {
      this.filterTipoUsuario = '';
      this.filterEntidad = null;
    }
    this.busquedaRealizada = false;
    this.filtrosAplicados = null;
  }

  /** Acción del botón "Buscar": congela los filtros actuales y dispara los resultados. */
  onBuscar() {
    this.filtrosAplicados = {
      usuario: this.filterUsuario.trim().toLowerCase(),
      documento: this.filterDocumento.trim(),
      entidadCodigo: this.filterEntidad?.codigo ?? '',
      nombre: this.filterNombre.trim(),
      perfil: this.filterPerfil,
      tipoUsuario: this.filterTipoUsuario,
      estado: this.filterEstado,
    };
    this.busquedaRealizada = true;
  }

  /** Autocomplete por nombre — sugerencias de los nombres existentes. */
  searchNombres(event: AutoCompleteCompleteEvent) {
    const q = event.query.trim();
    if (q.length < 3) {
      this.sugerenciasNombre = [];
      return;
    }
    const qn = this.normaliza(q);
    this.sugerenciasNombre = Array.from(
      new Set(this.usuarios.map(u => u.nombre).filter(n => this.normaliza(n).includes(qn))),
    ).slice(0, 8);
  }

  /** Abre el modal Directorio de Entidades (gatillo desde el input "Entidad"). */
  abrirDirectorioEntidades() {
    this.mostrarDirectorioEntidades = true;
  }

  /** Recibe la entidad seleccionada desde el modal. */
  onEntidadSeleccionada(entidad: Entidad) {
    this.filterEntidad = entidad;
  }

  /** Limpia solo el campo Entidad. */
  limpiarEntidad() {
    this.filterEntidad = null;
  }

  /** Normaliza texto: lowercase + sin tildes (para búsquedas insensibles). */
  private normaliza(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
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

  // Documento del nuevo usuario (4-20 dígitos)
  private readonly DOCUMENTO_REGEX = /^\d{4,20}$/;
  get nuevoDocumentoVacio(): boolean {
    return this.nuevoDocumentoTouched && !this.nuevoDocumento.trim();
  }
  get nuevoDocumentoFormatoInvalido(): boolean {
    if (!this.nuevoDocumentoTouched || !this.nuevoDocumento.trim()) return false;
    return !this.DOCUMENTO_REGEX.test(this.nuevoDocumento.trim());
  }
  get nuevoDocumentoInvalid(): boolean {
    return this.nuevoDocumentoVacio || this.nuevoDocumentoFormatoInvalido;
  }

  get nuevoTipoInvalid(): boolean {
    return this.nuevoTipoTouched && !this.nuevoTipo;
  }

  get nuevoEntidadInvalid(): boolean {
    return this.nuevoEntidadTouched && !this.nuevoEntidad;
  }

  /** Abre el directorio de entidades desde el formulario de creación. */
  abrirDirectorioEntidadesNuevo() {
    this.mostrarDirectorioEntidadesNuevo = true;
  }

  /** Recibe la entidad seleccionada desde el modal del formulario de creación. */
  onEntidadNuevoSeleccionada(entidad: Entidad) {
    this.nuevoEntidad = entidad;
    this.nuevoEntidadTouched = true;
  }

  /** Limpia la entidad del formulario de creación. */
  limpiarEntidadNuevo() {
    this.nuevoEntidad = null;
  }

  get nuevoFormValido(): boolean {
    return !!this.nuevoCodigo.trim()
      && this.CODIGO_REGEX.test(this.nuevoCodigo.trim().toUpperCase())
      && !this.usuarios.some(u => u.codigo.toUpperCase() === this.nuevoCodigo.trim().toUpperCase())
      && !!this.nuevoNombre.trim()
      && !!this.nuevoCorreo.trim()
      && this.EMAIL_REGEX.test(this.nuevoCorreo.trim())
      && !this.usuarios.some(u => u.correo.toLowerCase() === this.nuevoCorreo.trim().toLowerCase())
      && !!this.nuevoPerfil
      && !!this.nuevoDocumento.trim()
      && this.DOCUMENTO_REGEX.test(this.nuevoDocumento.trim())
      && !!this.nuevoTipo
      && !!this.nuevoEntidad;
  }

  /** Lista de errores actuales del formulario Crear Usuario (alimenta el banner). */
  get nuevoFormErrors(): string[] {
    const errors: string[] = [];
    // Usuario (código)
    if (!this.nuevoCodigo.trim()) {
      errors.push('El usuario es obligatorio.');
    } else if (!this.CODIGO_REGEX.test(this.nuevoCodigo.trim().toUpperCase())) {
      errors.push('El usuario debe tener 4 letras seguidas de 6 números.');
    } else if (this.usuarios.some(u => u.codigo.toUpperCase() === this.nuevoCodigo.trim().toUpperCase())) {
      errors.push('Este usuario ya está registrado. Use uno diferente.');
    }
    if (!this.nuevoNombre.trim()) errors.push('El nombre completo es obligatorio.');
    if (!this.nuevoCorreo.trim()) {
      errors.push('El correo es obligatorio.');
    } else if (!this.EMAIL_REGEX.test(this.nuevoCorreo.trim())) {
      errors.push('Ingrese un correo electrónico válido.');
    } else if (this.usuarios.some(u => u.correo.toLowerCase() === this.nuevoCorreo.trim().toLowerCase())) {
      errors.push('Este correo ya está registrado. Use uno diferente.');
    }
    if (!this.nuevoTipo) errors.push('Debe seleccionar un tipo de usuario.');
    if (!this.nuevoDocumento.trim()) {
      errors.push('El documento es obligatorio.');
    } else if (!this.DOCUMENTO_REGEX.test(this.nuevoDocumento.trim())) {
      errors.push('El documento debe ser numérico (4 a 20 dígitos).');
    }
    if (!this.nuevoEntidad) errors.push('Debe seleccionar una entidad.');
    if (!this.nuevoPerfil) errors.push('Debe seleccionar un rol/perfil.');
    return errors;
  }

  createUsuario() {
    this.nuevoFormSubmitted = true;
    this.nuevoCodigoTouched = true;
    this.nuevoNombreTouched = true;
    this.nuevoCorreoTouched = true;
    this.nuevoPerfilTouched = true;
    this.nuevoDocumentoTouched = true;
    this.nuevoTipoTouched = true;
    this.nuevoEntidadTouched = true;

    if (!this.nuevoFormValido) {
      // El banner de errores asume el rol del feedback (reemplaza el toast).
      return;
    }

    const nuevo: Usuario = {
      id: Math.max(...this.usuarios.map(u => u.id)) + 1,
      codigo: this.nuevoCodigo.trim().toUpperCase(),
      documento: this.nuevoDocumento.trim(),
      nombre: this.nuevoNombre.trim(),
      correo: this.nuevoCorreo.trim().toLowerCase(),
      perfil: this.nuevoPerfil,
      tipoUsuario: this.nuevoTipo as 'LOCAL' | 'CENTRAL' | 'ESTRATÉGICO',
      entidad: {
        codigo: this.nuevoEntidad!.codigo,
        nombre: this.nuevoEntidad!.razonSocial,
      },
      activo: this.nuevoEstado,
      ultimoAcceso: '—',
      fechaUltimaModificacion: this.fechaHoy(),
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
    this.nuevoDocumento = '';
    this.nuevoTipo = '';
    this.nuevoEntidad = null;
    this.nuevoEstado = true;
    this.nuevoFormSubmitted = false;
    this.nuevoCodigoTouched = false;
    this.nuevoNombreTouched = false;
    this.nuevoCorreoTouched = false;
    this.nuevoPerfilTouched = false;
    this.nuevoDocumentoTouched = false;
    this.nuevoTipoTouched = false;
    this.nuevoEntidadTouched = false;
  }

  /** Abrir diálogo Nuevo Usuario reseteando estado */
  openNewDialog() {
    this.resetNuevoForm();
    if (this.esVistaLocal) {
      // Admin Local: Tipo y Entidad se heredan de la sesión y quedan bloqueados.
      this.nuevoTipo = 'LOCAL';
      this.nuevoEntidad = this.loggedEntidadLocal;
    }
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
  /**
   * True si el correo ya está registrado en OTRO usuario (excluye al usuario
   * que se está editando para que pueda conservar su propio correo).
   */
  get editCorreoDuplicado(): boolean {
    if (!this.editCorreoTouched || !this.editCorreo.trim()) return false;
    const correoNormalizado = this.editCorreo.trim().toLowerCase();
    return this.usuarios.some(u =>
      u.id !== this.selectedUsuario?.id
      && u.correo.toLowerCase() === correoNormalizado,
    );
  }
  get editCorreoInvalid(): boolean {
    return this.editCorreoVacio || this.editCorreoFormatoInvalido || this.editCorreoDuplicado;
  }
  get editDocumentoVacio(): boolean {
    return this.editDocumentoTouched && !this.editDocumento.trim();
  }
  get editDocumentoFormatoInvalido(): boolean {
    if (!this.editDocumentoTouched || !this.editDocumento.trim()) return false;
    return !this.DOCUMENTO_REGEX.test(this.editDocumento.trim());
  }
  get editDocumentoInvalid(): boolean {
    return this.editDocumentoVacio || this.editDocumentoFormatoInvalido;
  }
  get editTipoInvalid(): boolean {
    return this.editTipoTouched && !this.editTipo;
  }
  get editEntidadInvalid(): boolean {
    return this.editEntidadTouched && !this.editEntidad;
  }
  get editFormValido(): boolean {
    const correo = this.editCorreo.trim().toLowerCase();
    const correoDuplicado = !!correo && this.usuarios.some(u =>
      u.id !== this.selectedUsuario?.id && u.correo.toLowerCase() === correo,
    );
    return !!this.editNombre.trim()
      && !!this.editCorreo.trim()
      && this.EMAIL_REGEX.test(this.editCorreo.trim())
      && !correoDuplicado
      && !!this.editDocumento.trim()
      && this.DOCUMENTO_REGEX.test(this.editDocumento.trim())
      && !!this.editTipo
      && !!this.editEntidad
      && !!this.editPerfil;
  }

  /** Lista de errores actuales del formulario Editar Usuario (alimenta el banner). */
  get editFormErrors(): string[] {
    const errors: string[] = [];
    if (!this.editNombre.trim()) errors.push('El nombre completo es obligatorio.');
    if (!this.editCorreo.trim()) {
      errors.push('El correo es obligatorio.');
    } else if (!this.EMAIL_REGEX.test(this.editCorreo.trim())) {
      errors.push('Ingrese un correo electrónico válido.');
    } else {
      const correoNormalizado = this.editCorreo.trim().toLowerCase();
      const duplicado = this.usuarios.some(u =>
        u.id !== this.selectedUsuario?.id && u.correo.toLowerCase() === correoNormalizado,
      );
      if (duplicado) errors.push('Este correo ya está registrado en otro usuario.');
    }
    if (!this.editTipo) errors.push('Debe seleccionar un tipo de usuario.');
    if (!this.editDocumento.trim()) {
      errors.push('El documento es obligatorio.');
    } else if (!this.DOCUMENTO_REGEX.test(this.editDocumento.trim())) {
      errors.push('El documento debe ser numérico (4 a 20 dígitos).');
    }
    if (!this.editEntidad) errors.push('Debe seleccionar una entidad.');
    if (!this.editPerfil) errors.push('Debe seleccionar un rol/perfil.');
    return errors;
  }

  /** Lista de errores del diálogo Eliminar Usuario (texto de confirmación). */
  get deleteFormErrors(): string[] {
    if (this.deleteConfirmValid) return [];
    return ['Debe escribir "ELIMINAR" en el campo para confirmar la acción.'];
  }

  /** Abre el directorio de entidades desde el formulario de edición. */
  abrirDirectorioEntidadesEdit() {
    this.mostrarDirectorioEntidadesEdit = true;
  }

  /** Recibe la entidad seleccionada en el formulario de edición. */
  onEntidadEditSeleccionada(entidad: Entidad) {
    this.editEntidad = entidad;
    this.editEntidadTouched = true;
  }

  /** Limpia la entidad del formulario de edición. */
  limpiarEntidadEdit() {
    this.editEntidad = null;
  }

  /** Devuelve la fecha de hoy en formato DD/MM/YYYY. */
  private fechaHoy(): string {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  toggleEstado(u: Usuario) {
    u.activo = !u.activo;
    this.messageService.add({ severity: 'info', summary: u.activo ? 'Activado' : 'Desactivado', detail: `Usuario ${u.codigo} fue ${u.activo ? 'activado' : 'desactivado'}.` });
  }

  openEditDialog(u: Usuario) {
    this.editNombre = u.nombre;
    this.editCorreo = u.correo;
    this.editPerfil = u.perfil;
    this.editDocumento = u.documento;
    this.editTipo = u.tipoUsuario;
    // Reconstruye un Entidad-like desde el snapshot guardado en el usuario
    this.editEntidad = u.entidad
      ? { codigo: u.entidad.codigo, nit: '', razonSocial: u.entidad.nombre, departamento: '', municipio: '', estado: 'Activo' }
      : null;
    this.editEstado = u.activo;
    this.editFechaUltimaModificacion = u.fechaUltimaModificacion ?? '—';
    this.editFormSubmitted = false;
    this.editNombreTouched = false;
    this.editCorreoTouched = false;
    this.editDocumentoTouched = false;
    this.editTipoTouched = false;
    this.editEntidadTouched = false;
    this.showEditDialog = true;
  }

  saveEditUsuario() {
    this.editFormSubmitted = true;
    this.editNombreTouched = true;
    this.editCorreoTouched = true;
    this.editDocumentoTouched = true;
    this.editTipoTouched = true;
    this.editEntidadTouched = true;
    if (!this.selectedUsuario || !this.editFormValido) {
      // Banner de errores asume el feedback (reemplaza el toast).
      return;
    }
    this.selectedUsuario.nombre = this.editNombre.trim();
    this.selectedUsuario.correo = this.editCorreo.trim().toLowerCase();
    this.selectedUsuario.perfil = this.editPerfil;
    this.selectedUsuario.documento = this.editDocumento.trim();
    this.selectedUsuario.tipoUsuario = this.editTipo as 'LOCAL' | 'CENTRAL' | 'ESTRATÉGICO';
    this.selectedUsuario.entidad = {
      codigo: this.editEntidad!.codigo,
      nombre: this.editEntidad!.razonSocial,
    };
    this.selectedUsuario.activo = this.editEstado;
    this.selectedUsuario.fechaUltimaModificacion = this.fechaHoy();
    this.messageService.add({
      severity: 'success',
      summary: 'Usuario actualizado',
      detail: `El usuario "${this.editNombre}" fue actualizado exitosamente.`,
    });
    this.editNombreTouched = false;
    this.editCorreoTouched = false;
    this.editDocumentoTouched = false;
    this.editTipoTouched = false;
    this.editEntidadTouched = false;
    this.showEditDialog = false;
  }

  /**
   * Abre el modal de restablecer contraseña para el usuario que se está
   * editando. Pre-carga los correos enmascarados autorizados (mock; en
   * producción vienen del backend del usuario seleccionado).
   */
  abrirRestablecerDialog() {
    if (!this.selectedUsuario) return;
    this.correosAutorizadosRestablecer = this.obtenerCorreosEnmascarados(this.selectedUsuario);
    this.correoRestablecerSeleccionado = '';
    this.showRestablecerDialog = true;
  }

  cancelarRestablecer() {
    this.showRestablecerDialog = false;
    this.correoRestablecerSeleccionado = '';
  }

  confirmarRestablecer() {
    if (!this.correoRestablecerSeleccionado) return;
    const correo = this.correoRestablecerSeleccionado;
    this.showRestablecerDialog = false;
    this.correoRestablecerSeleccionado = '';
    this.messageService.add({
      severity: 'success',
      summary: 'Solicitud enviada',
      detail: `Se envió el correo de restablecimiento a ${correo}.`,
    });
  }

  /** Genera correos enmascarados de prueba — misma lógica que olvide-clave. */
  private obtenerCorreosEnmascarados(u: Usuario): string[] {
    const prefijo = u.codigo.toLowerCase().slice(0, 3);
    return [`${prefijo}****@contaduria.gov.co`];
  }

  confirmToggleEstado() {
    if (this.selectedUsuario) {
      this.toggleEstado(this.selectedUsuario);
    }
    this.showToggleDialog = false;
  }

  confirmDeleteUsuario() {
    this.deleteFormSubmitted = true;
    if (!this.deleteConfirmValid) {
      // Banner de errores asume el feedback.
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
    this.deleteFormSubmitted = false;
    this.showDeleteDialog = false;
  }

  closeDeleteDialog() {
    this.deleteConfirmText = '';
    this.deleteFormSubmitted = false;
    this.showDeleteDialog = false;
  }
}
