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
    path: 'botones',
    data: {
      breadcrumb: [
        { label: 'Botones' },
      ],
    },
    loadComponent: () =>
      import('./pages/botones/botones.component').then(m => m.BotonesComponent),
  },
  {
    path: 'tree-tables',
    data: {
      breadcrumb: [
        { label: 'Tree-tables' },
      ],
    },
    loadComponent: () =>
      import('./pages/tree-tables/tree-tables.component').then(m => m.TreeTablesComponent),
  },
  {
    path: 'componentes/listas-desplegables',
    data: {
      breadcrumb: [
        { label: 'Componentes', icon: 'pi pi-box', routerLink: '/componentes/data-table' },
        { label: 'Listas desplegables' },
      ],
    },
    loadComponent: () =>
      import('./pages/componentes/listas-desplegables/listas-desplegables.component').then(m => m.ListasDesplegablesComponent),
  },
  {
    path: 'componentes/data-table',
    data: {
      breadcrumb: [
        { label: 'Componentes', icon: 'pi pi-box', routerLink: '/componentes/data-table' },
        { label: 'Data Table' },
      ],
    },
    loadComponent: () =>
      import('./pages/componentes/data-table/data-table.component').then(m => m.DataTableComponent),
  },
  {
    path: 'componentes/modales',
    data: {
      breadcrumb: [
        { label: 'Componentes', icon: 'pi pi-box', routerLink: '/componentes/data-table' },
        { label: 'Modales' },
      ],
    },
    loadComponent: () =>
      import('./pages/componentes/modales/modales.component').then(m => m.ModalesComponent),
  },
  {
    path: 'componentes/header-pagina',
    data: {
      breadcrumb: [
        { label: 'Componentes', icon: 'pi pi-box', routerLink: '/componentes/data-table' },
        { label: 'Header de página' },
      ],
    },
    loadComponent: () =>
      import('./pages/componentes/header-pagina/header-pagina.component').then(m => m.HeaderPaginaComponent),
  },
  {
    path: 'componentes/footer',
    data: {
      breadcrumb: [
        { label: 'Componentes', icon: 'pi pi-box', routerLink: '/componentes/data-table' },
        { label: 'Footer' },
      ],
    },
    loadComponent: () =>
      import('./pages/componentes/footer/footer.component').then(m => m.FooterComponent),
  },
  {
    path: 'componentes/badges',
    data: {
      breadcrumb: [
        { label: 'Componentes', icon: 'pi pi-box', routerLink: '/componentes/data-table' },
        { label: 'Badges y tags de estado' },
      ],
    },
    loadComponent: () =>
      import('./pages/componentes/badges/badges.component').then(m => m.BadgesComponent),
  },
  {
    path: 'componentes/empty-states',
    data: {
      breadcrumb: [
        { label: 'Componentes', icon: 'pi pi-box', routerLink: '/componentes/data-table' },
        { label: 'Empty states' },
      ],
    },
    loadComponent: () =>
      import('./pages/componentes/empty-states/empty-states.component').then(m => m.EmptyStatesComponent),
  },
  {
    path: 'componentes/filtros',
    data: {
      breadcrumb: [
        { label: 'Componentes', icon: 'pi pi-box', routerLink: '/componentes/data-table' },
        { label: 'Filtros colapsables' },
      ],
    },
    loadComponent: () =>
      import('./pages/componentes/filtros/filtros.component').then(m => m.FiltrosComponent),
  },
  {
    path: 'componentes/inputs',
    data: {
      breadcrumb: [
        { label: 'Componentes', icon: 'pi pi-box', routerLink: '/componentes/data-table' },
        { label: 'Inputs de formulario' },
      ],
    },
    loadComponent: () =>
      import('./pages/componentes/inputs/inputs.component').then(m => m.InputsComponent),
  },
  {
    path: 'componentes/panel-sesion',
    data: {
      breadcrumb: [
        { label: 'Componentes', icon: 'pi pi-box', routerLink: '/componentes/data-table' },
        { label: 'Avatar y panel desplegable' },
      ],
    },
    loadComponent: () =>
      import('./pages/componentes/panel-sesion/panel-sesion.component').then(m => m.PanelSesionComponent),
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
    path: 'pantallas/seguridad/perfil-usuario',
    data: {
      breadcrumb: [
        { label: 'Seguridad', icon: 'pi pi-shield', routerLink: '/pantallas/seguridad/usuarios' },
        { label: 'Perfil del Usuario' },
      ],
    },
    loadComponent: () =>
      import('./pages/pantallas/perfil-usuario/perfil-usuario.component').then(m => m.PerfilUsuarioComponent),
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
    path: 'pantallas/categorias/levantamiento-restricciones',
    data: {
      breadcrumb: [
        { label: 'Categorías', icon: 'pi pi-tags', routerLink: '/pantallas/categorias/levantamiento-restricciones' },
        { label: 'Levantamiento de Restricciones' },
      ],
    },
    loadComponent: () =>
      import('./pages/pantallas/levantamiento-restricciones/levantamiento-restricciones.component').then(m => m.LevantamientoRestriccionesComponent),
  },
  {
    path: 'pantallas/formularios/gestion',
    data: {
      breadcrumb: [
        { label: 'Formularios', icon: 'pi pi-file-edit', routerLink: '/pantallas/formularios/gestion' },
        { label: 'Gestión de Formularios' },
      ],
    },
    loadComponent: () =>
      import('./pages/pantallas/formularios/formularios.component').then(m => m.FormulariosComponent),
  },
  {
    path: 'pantallas/formularios/consultas/historico-envios',
    data: {
      breadcrumb: [
        { label: 'Formularios', icon: 'pi pi-file-edit', routerLink: '/pantallas/formularios/gestion' },
        { label: 'Consultas' },
        { label: 'Histórico de envíos' },
      ],
    },
    loadComponent: () =>
      import('./pages/pantallas/formularios/historico-envios/historico-envios.component').then(m => m.HistoricoEnviosComponent),
  },
  {
    path: 'pantallas/entidades/entidades-agregadas',
    data: {
      breadcrumb: [
        { label: 'Entidades', icon: 'pi pi-building', routerLink: '/pantallas/entidades/entidades-agregadas' },
        { label: 'Entidades agregadas' },
      ],
    },
    loadComponent: () =>
      import('./pages/pantallas/entidades-agregadas/entidades-agregadas.component').then(m => m.EntidadesAgregadasComponent),
  },
  {
    path: 'pantallas/flujo-envio',
    data: {
      breadcrumb: [
        { label: 'Pantallas', icon: 'pi pi-th-large', routerLink: '/pantallas/correos' },
        { label: 'Flujo de Envío' },
      ],
    },
    loadComponent: () =>
      import('./pages/pantallas/flujo-envio/flujo-envio.component').then(m => m.FlujoEnvioComponent),
  },
  {
    path: 'pantallas/tree-table-estandar',
    data: {
      breadcrumb: [
        { label: 'Pantallas', icon: 'pi pi-th-large', routerLink: '/pantallas/correos' },
        { label: 'Tree-table Estándar' },
      ],
    },
    loadComponent: () =>
      import('./pages/pantallas/tree-table-estandar/tree-table-estandar.component').then(m => m.TreeTableEstandarComponent),
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
  {
    path: 'pantallas/propuesta-diseno',
    data: {
      breadcrumb: [
        { label: 'Pantallas', icon: 'pi pi-th-large', routerLink: '/pantallas/correos' },
        { label: 'Propuesta de Diseño' },
      ],
    },
    loadComponent: () =>
      import('./pages/pantallas/propuesta-diseno/propuesta-diseno.component').then(m => m.PropuestaDisenoComponent),
  },
  {
    path: 'pantallas/propuesta-datos-usuario',
    data: {
      breadcrumb: [
        { label: 'Pantallas', icon: 'pi pi-th-large', routerLink: '/pantallas/correos' },
        { label: 'Datos de usuario en el cabezote' },
      ],
    },
    loadComponent: () =>
      import('./pages/pantallas/propuesta-datos-usuario/propuesta-datos-usuario.component').then(m => m.PropuestaDatosUsuarioComponent),
  },
  {
    path: 'pantallas/parametrizacion-listas',
    data: {
      breadcrumb: [
        { label: 'Parametrización de listas' },
      ],
    },
    loadComponent: () =>
      import('./pages/pantallas/parametrizacion-listas/parametrizacion-listas.component').then(m => m.ParametrizacionListasComponent),
  },
  {
    path: 'pantallas/entidades/gestion',
    data: {
      breadcrumb: [
        { label: 'Entidades', icon: 'pi pi-building', routerLink: '/pantallas/entidades/gestion' },
        { label: 'Gestión de entidades' },
      ],
    },
    loadComponent: () =>
      import('./pages/pantallas/entidades/entidades.component').then(m => m.EntidadesComponent),
  },
];
