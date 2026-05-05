import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BehaviorSubject, filter } from 'rxjs';

/**
 * Servicio global de breadcrumbs.
 *
 * Lee la metadata `data.breadcrumb` definida en cada ruta de `app.routes.ts`
 * y la expone como un Observable que el componente <app-breadcrumb /> consume.
 *
 * Para registrar el breadcrumb de una pantalla, agregue en su Route:
 *
 *   {
 *     path: 'pantallas/seguridad/usuarios',
 *     data: {
 *       breadcrumb: [
 *         { label: 'Seguridad', icon: 'pi pi-shield', routerLink: '/pantallas/seguridad/usuarios' },
 *         { label: 'Usuarios' }   // último item = página actual (sin link)
 *       ]
 *     },
 *     loadComponent: () => import('...').then(m => m.UsuariosComponent),
 *   }
 */
@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Items del breadcrumb actual (excluye el icono Home, que es fijo). */
  private readonly _items$ = new BehaviorSubject<MenuItem[]>([]);
  readonly items$ = this._items$.asObservable();

  /** Item Home por defecto del breadcrumb (icono casa → /). */
  readonly home: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  constructor() {
    // Recalcula el breadcrumb cada vez que termina una navegación
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.refresh());
    // Primera carga
    this.refresh();
  }

  /** Recorre el árbol de rutas activas y arma el breadcrumb desde data.breadcrumb */
  private refresh() {
    const items = this.collectFromRoute(this.route.snapshot);
    this._items$.next(items);
  }

  private collectFromRoute(snapshot: any): MenuItem[] {
    let current = snapshot;
    while (current.firstChild) current = current.firstChild;
    const data = current?.data ?? {};
    const items = (data['breadcrumb'] as MenuItem[]) ?? [];
    // Defensa: si la ruta no declaró breadcrumb, devolvemos array vacío
    return Array.isArray(items) ? items : [];
  }
}
