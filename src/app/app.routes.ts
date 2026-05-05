import { Routes } from '@angular/router';

/**
 * Convención del proyecto para breadcrumbs:
 *
 * Cada ruta declara su breadcrumb en `data.breadcrumb` como un array de items
 * tipo PrimeNG MenuItem. El último item NO debe tener routerLink (es la página
 * actual). Los grupos intermedios deben apuntar a la pantalla principal del
 * grupo para que sean clickeables.
 *
 * Ejemplo:
 *   data: {
 *     breadcrumb: [
 *       { label: 'Seguridad', icon: 'pi pi-shield', routerLink: '/pantallas/seguridad/usuarios' },
 *       { label: 'Usuarios' }
 *     ]
 *   }
 *
 * El componente <app-breadcrumb /> consume esta metadata automáticamente.
 * Documentado en CLAUDE.md sección "Breadcrumbs".
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent),
    // Sin breadcrumb: es la home (icono Home solo)
  },
  {
    path: 'comenzar',
    data: {
      breadcrumb: [
        { label: 'Comenzar' },
      ],
    },
    loadComponent: () =>
      import('./pages/comenzar/comenzar.component').then(m => m.ComenzarComponent),
  },
  {
    path: 'ejemplos',
    data: {
      breadcrumb: [
        { label: 'Ejemplos de Uso' },
      ],
    },
    loadComponent: () =>
      import('./pages/ejemplos/ejemplos.component').then(m => m.EjemplosComponent),
  },
  {
    path: 'autenticacion',
    data: {
      breadcrumb: [
        { label: 'Autenticación' },
      ],
    },
    loadComponent: () =>
      import('./pages/autenticacion/autenticacion.component').then(m => m.AutenticacionComponent),
  },
  {
    path: 'tokens',
    data: {
      breadcrumb: [
        { label: 'Tokens' },
      ],
    },
    loadComponent: () =>
      import('./pages/tokens/tokens.component').then(m => m.TokensComponent),
  },
  {
    path: 'accesibilidad',
    data: {
      breadcrumb: [
        { label: 'Accesibilidad' },
      ],
    },
    loadComponent: () =>
      import('./pages/accesibilidad/accesibilidad.component').then(m => m.AccesibilidadComponent),
  },
  {
    path: 'responsive',
    data: {
      breadcrumb: [
        { label: 'Responsive' },
      ],
    },
    loadComponent: () =>
      import('./pages/responsive/responsive.component').then(m => m.ResponsiveComponent),
  },
  {
    path: 'pantallas/roles',
    data: {
      breadcrumb: [
        { label: 'Seguridad', icon: 'pi pi-shield', routerLink: '/pantallas/seguridad/usuarios' },
        { label: 'Roles' },
      ],
    },
    loadComponent: () =>
      import('./pages/pantallas/roles/roles.component').then(m => m.RolesComponent),
  },
  {
    path: 'pantallas/seguridad/login',
    // Login no tiene breadcrumb (pantalla pública sin navegación contextual)
    loadComponent: () =>
      import('./pages/pantallas/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'pantallas/seguridad/olvide-clave',
    // Olvidé clave tampoco tiene breadcrumb
    loadComponent: () =>
      import('./pages/pantallas/olvide-clave/olvide-clave.component').then(m => m.OlvideClaveComponent),
  },
  {
    path: 'pantallas/seguridad/cambiar-contrasena',
    data: {
      breadcrumb: [
        { label: 'Seguridad', icon: 'pi pi-shield', routerLink: '/pantallas/seguridad/usuarios' },
        { label: 'Cambiar contraseña' },
      ],
    },
    loadComponent: () =>
      import('./pages/pantallas/cambiar-contrasena/cambiar-contrasena.component').then(m => m.CambiarContrasenaComponent),
  },
  {
    path: 'pantallas/correos',
    data: {
      breadcrumb: [
        { label: 'Pantallas', icon: 'pi pi-th-large', routerLink: '/pantallas/correos' },
        { label: 'Plantillas de correo' },
      ],
    },
    loadComponent: () =>
      import('./pages/pantallas/correos/correos.component').then(m => m.CorreosComponent),
  },
  {
    path: 'pantallas/seguridad/usuarios',
    data: {
      breadcrumb: [
        { label: 'Seguridad', icon: 'pi pi-shield', routerLink: '/pantallas/seguridad/usuarios' },
        { label: 'Usuarios' },
      ],
    },
    loadComponent: () =>
      import('./pages/pantallas/usuarios/usuarios.component').then(m => m.UsuariosComponent),
  },
  {
    path: 'pantallas/seguridad/auditoria',
    data: {
      breadcrumb: [
        { label: 'Seguridad', icon: 'pi pi-shield', routerLink: '/pantallas/seguridad/usuarios' },
        { label: 'Auditoría' },
      ],
    },
    loadComponent: () =>
      import('./pages/pantallas/auditoria/auditoria.component').then(m => m.AuditoriaComponent),
  },
  {
    path: 'pantallas/formularios',
    data: {
      breadcrumb: [
        { label: 'Pantallas', icon: 'pi pi-th-large', routerLink: '/pantallas/correos' },
        { label: 'Gestión de Formularios' },
      ],
    },
    loadComponent: () =>
      import('./pages/pantallas/formularios/formularios.component').then(m => m.FormulariosComponent),
  },
  {
    path: 'pantallas/filtros',
    data: {
      breadcrumb: [
        { label: 'Pantallas', icon: 'pi pi-th-large', routerLink: '/pantallas/correos' },
        { label: 'Propuesta de Filtros' },
      ],
    },
    loadComponent: () =>
      import('./pages/pantallas/filtros/filtros.component').then(m => m.FiltrosComponent),
  },
];
