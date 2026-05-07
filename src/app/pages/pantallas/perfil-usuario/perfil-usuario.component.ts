import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';

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
  /** Datos del usuario logueado (mock — vendría del token/sesión). */
  perfil = {
    nombreCompleto: 'Juan Luis Muñoz Martínez',
    primerNombre: 'Juan Luis',
    iniciales: 'JM',
    usuario: 'JLMUNOZ',
    correo: 'jlmunoz@contaduria.gov.co',
    rol: 'Administrador General',
    rolCodigo: 'ADM_CHIP',
    entidad: {
      codigo: '210111001',
      razonSocial: 'Contaduría General de la Nación',
      tipo: 'Central',
    },
    ultimoAcceso: '28/04/2026 — 09:42 a.m.',
    diasParaVencimiento: 73, // 90 días - 17 transcurridos
    diasTotalVigencia: 90,
  };

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
      routerLink: '/pantallas/formularios',
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
