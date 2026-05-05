import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbModule } from 'primeng/breadcrumb';

import { BreadcrumbService } from '../../services/breadcrumb.service';

/**
 * Wrapper que renderiza el breadcrumb activo desde BreadcrumbService.
 *
 * Uso:
 *   <app-breadcrumb />
 *
 * El servicio lee automáticamente el `data.breadcrumb` de la ruta activa
 * de `app.routes.ts`. Sin necesidad de declarar `breadcrumbItems` en cada
 * componente.
 */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, BreadcrumbModule],
  template: `
    @if ((items$ | async); as items) {
      @if (items.length > 0) {
        <p-breadcrumb [model]="items" [home]="home" />
      }
    }
  `,
})
export class AppBreadcrumbComponent {
  private readonly svc = inject(BreadcrumbService);
  readonly items$ = this.svc.items$;
  readonly home = this.svc.home;
}
