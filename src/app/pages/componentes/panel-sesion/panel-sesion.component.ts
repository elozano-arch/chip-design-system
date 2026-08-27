import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { PopoverModule } from 'primeng/popover';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';

/**
 * Catálogo del DS: avatar de iniciales + panel desplegable (p-popover).
 *
 * Los dos salieron de la propuesta de datos de usuario en el cabezote
 * (CH-1737). El avatar estaba duplicado en cinco lugares con los mismos
 * valores; el popover era la primera vez que se usaba en el proyecto.
 */
@Component({
  selector: 'app-panel-sesion',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DividerModule,
    PopoverModule,
    AppBreadcrumbComponent,
    CodeBlockComponent,
  ],
  templateUrl: './panel-sesion.component.html',
  styleUrl: './panel-sesion.component.scss',
})
export class PanelSesionComponent {
  /** Refleja el estado del popover en aria-expanded del botón que lo abre. */
  demoAbierto = false;

  readonly snAvatar = `<!-- 36px · por defecto — cabezote, filas de tabla, listas -->
<span class="chip-avatar" aria-hidden="true">JM</span>

<!-- 48px · cabecera de ficha o card de usuario -->
<span class="chip-avatar chip-avatar--lg" aria-hidden="true">JM</span>

<!-- 64px · foco de un panel o pantalla dedicada al usuario -->
<span class="chip-avatar chip-avatar--xl" aria-hidden="true">JM</span>`;

  readonly snPopover = `<!-- El botón que abre: aria-expanded refleja el estado real -->
<button type="button" class="mi-trigger" (click)="panel.toggle($event)"
  [attr.aria-expanded]="panelAbierto" aria-haspopup="dialog"
  [attr.aria-label]="'Sesión de ' + usuario.nombreCompleto + '. Abrir el menú de la cuenta'">
  <span class="chip-avatar" aria-hidden="true">{{ usuario.iniciales }}</span>
  <span class="mi-trigger__name">{{ usuario.primerNombre }}</span>
  <i class="pi pi-chevron-down" aria-hidden="true"></i>
</button>

<!-- La etiqueta va en ariaLabel del p-popover, NO en un div interno -->
<p-popover #panel ariaLabel="Detalle de la sesión"
  (onShow)="panelAbierto = true" (onHide)="panelAbierto = false">
  <div class="mi-panel">
    <span class="chip-avatar chip-avatar--xl" aria-hidden="true">{{ usuario.iniciales }}</span>
    <p class="mi-panel__name">{{ usuario.nombreCompleto }}</p>

    <p-divider />

    <dl class="mi-panel__datos">
      <dt>Perfil</dt>
      <dd>{{ usuario.perfil }}</dd>
      <dt>Entidad</dt>
      <dd>{{ usuario.entidad.razonSocial }}</dd>
    </dl>

    <p-divider />

    <p-button label="Mi perfil" icon="pi pi-user"
      [outlined]="true" severity="secondary" size="small" styleClass="mi-panel__accion" />
    <p-button label="Cerrar sesión" icon="pi pi-sign-out"
      [text]="true" severity="secondary" size="small" styleClass="mi-panel__accion" />
  </div>
</p-popover>`;

  readonly snTs = `import { PopoverModule } from 'primeng/popover';

@Component({
  imports: [PopoverModule, ButtonModule, DividerModule],
})
export class MiComponente {
  /** Sólo para reflejar aria-expanded en el botón que abre. */
  panelAbierto = false;
}`;

  readonly snEstilos = `/* p-popover se monta en <body>, fuera del árbol del componente:
   estas reglas NO pueden colgar de :host. Prefije la clase para
   que el alcance global no colisione con otra pantalla. */
::ng-deep .mi-panel-pop .p-popover-content { padding: 0; }

::ng-deep .mi-panel__accion {
  width: 100%;
  justify-content: flex-start;
  min-height: 44px;   /* WCAG 2.5.5 */
}`;
}
