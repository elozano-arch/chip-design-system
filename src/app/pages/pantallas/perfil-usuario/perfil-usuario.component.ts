import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import { SesionService } from '../../../services/sesion.service';

interface ModuloAcceso {
  label: string;
  descripcion: string;
  icono: string;
  routerLink: string;
  color: 'cobalt' | 'success' | 'warning' | 'info';
}

/**
 * Pantalla "Perfil del Usuario" — landing post-login.
 *
 * Muestra el resumen de la sesión actual: nombre, entidad, rol,
 * último acceso, vigencia de contraseña, y un menú de accesos rápidos
 * filtrado por el rol del usuario.
 *
 * En producción el perfil vendría del token de sesión / un servicio de
 * autenticación. Aquí se simula con datos mock para demostrar el
 * comportamiento del Design System.
 */
@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    ButtonModule, TagModule, CardModule, TooltipModule, DividerModule,
    AppBreadcrumbComponent,
  ],
  templateUrl: './perfil-usuario.component.html',
  styleUrl: './perfil-usuario.component.scss',
})
export class PerfilUsuarioComponent {
  private readonly sesionService = inject(SesionService);
  private readonly router = inject(Router);

  /** La plantilla sólo se pinta con sesión activa; sin ella se vuelve al login
   *  (p. ej. al pulsar "atrás" después de cerrar sesión). */
  get haySesion(): boolean {
    return this.sesionService.usuario() !== null;
  }

  /** Datos del usuario en sesión, con los nombres que ya usa la plantilla
   *  (`rol`/`rolCodigo` en vez de `perfil`/`perfilCodigo`). */
  get perfil() {
    const u = this.sesionService.usuario()!;
    return { ...u, rol: u.perfil, rolCodigo: u.perfilCodigo };
  }

  /** Navega primero y limpia después, para que la plantilla nunca
   *  llegue a renderizarse sin sesión. */
  cerrarSesion(): void {
    this.router
      .navigate(['/pantallas/seguridad/login'])
      .then(() => this.sesionService.cerrarSesion());
  }

  /** Saludo según hora del día — sentence case (más cálido que mayúsculas). */
  get saludo(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  /** Toggle del panel "Mis datos" (colapsado por defecto — info secundaria). */
  misDatosExpanded = false;

  toggleMisDatos() {
    this.misDatosExpanded = !this.misDatosExpanded;
  }

  /** Severidad del tag de vigencia según días restantes. */
  get vigenciaSeverity(): 'success' | 'warn' | 'danger' {
    if (this.perfil.diasParaVencimiento <= 7) return 'danger';
    if (this.perfil.diasParaVencimiento <= 15) return 'warn';
    return 'success';
  }

  get vigenciaTexto(): string {
    const d = this.perfil.diasParaVencimiento;
    if (d <= 0) return 'Vencida';
    if (d === 1) return 'Vence mañana';
    return `Vence en ${d} días`;
  }

  /**
   * Accesos rápidos del usuario. Solo se listan pantallas que existen
   * en el proyecto — no se prometen módulos que no están implementados.
   * En producción este listado se filtraría por los permisos efectivos
   * asignados al rol en el árbol de permisos.
   */
  modulos: ModuloAcceso[] = [
    {
      label: 'Usuarios',
      descripcion: 'Gestione los usuarios registrados del sistema CHIP.',
      icono: 'pi pi-users',
      routerLink: '/pantallas/seguridad/usuarios',
      color: 'cobalt',
    },
    {
      label: 'Roles',
      descripcion: 'Administre los perfiles y permisos de seguridad.',
      icono: 'pi pi-shield',
      routerLink: '/pantallas/roles',
      color: 'cobalt',
    },
    {
      label: 'Formularios',
      descripcion: 'Cargue, valide y publique formularios contables.',
      icono: 'pi pi-file-edit',
      routerLink: '/pantallas/formularios/gestion',
      color: 'info',
    },
    {
      label: 'Auditoría',
      descripcion: 'Consulte la bitácora de eventos del sistema.',
      icono: 'pi pi-list-check',
      routerLink: '/pantallas/seguridad/auditoria',
      color: 'success',
    },
    {
      label: 'Plantillas de correo',
      descripcion: 'Revise las plantillas automáticas del sistema.',
      icono: 'pi pi-envelope',
      routerLink: '/pantallas/correos',
      color: 'warning',
    },
    {
      label: 'Cambiar contraseña',
      descripcion: 'Actualice su contraseña y revise dispositivos activos.',
      icono: 'pi pi-key',
      routerLink: '/pantallas/seguridad/cambiar-contrasena',
      color: 'info',
    },
  ];
}
