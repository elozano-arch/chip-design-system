import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'comenzar',
    loadComponent: () =>
      import('./pages/comenzar/comenzar.component').then(m => m.ComenzarComponent),
  },
  {
    path: 'ejemplos',
    loadComponent: () =>
      import('./pages/ejemplos/ejemplos.component').then(m => m.EjemplosComponent),
  },
  {
    path: 'autenticacion',
    loadComponent: () =>
      import('./pages/autenticacion/autenticacion.component').then(m => m.AutenticacionComponent),
  },
  {
    path: 'tokens',
    loadComponent: () =>
      import('./pages/tokens/tokens.component').then(m => m.TokensComponent),
  },
  {
    path: 'accesibilidad',
    loadComponent: () =>
      import('./pages/accesibilidad/accesibilidad.component').then(m => m.AccesibilidadComponent),
  },
  {
    path: 'responsive',
    loadComponent: () =>
      import('./pages/responsive/responsive.component').then(m => m.ResponsiveComponent),
  },
  {
    path: 'pantallas/roles',
    loadComponent: () =>
      import('./pages/pantallas/roles/roles.component').then(m => m.RolesComponent),
  },
  {
    path: 'pantallas/seguridad/usuarios',
    loadComponent: () =>
      import('./pages/pantallas/usuarios/usuarios.component').then(m => m.UsuariosComponent),
  },
  {
    path: 'pantallas/seguridad/auditoria',
    loadComponent: () =>
      import('./pages/pantallas/auditoria/auditoria.component').then(m => m.AuditoriaComponent),
  },
  {
    path: 'pantallas/formularios',
    loadComponent: () =>
      import('./pages/pantallas/formularios/formularios.component').then(m => m.FormulariosComponent),
  },
  {
    path: 'pantallas/filtros',
    loadComponent: () =>
      import('./pages/pantallas/filtros/filtros.component').then(m => m.FiltrosComponent),
  },
];
