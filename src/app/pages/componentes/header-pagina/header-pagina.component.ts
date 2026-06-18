import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';

@Component({
  selector: 'app-header-pagina',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    AppBreadcrumbComponent,
    CodeBlockComponent,
  ],
  templateUrl: './header-pagina.component.html',
  styleUrl: './header-pagina.component.scss',
})
export class HeaderPaginaComponent {
  readonly snConAccion = `<div class="chip-header">
  <h1 class="chip-header__title">Gestión de usuarios</h1>
  <div class="chip-header__row">
    <p class="chip-header__desc">Administra los usuarios del sistema y sus roles.</p>
    <p-button label="Crear usuario" icon="pi pi-plus" />
  </div>
</div>`;

  readonly snSinAccion = `<div class="chip-header">
  <h1 class="chip-header__title">Auditoría</h1>
  <div class="chip-header__row">
    <p class="chip-header__desc">Consulta la bitácora de eventos del sistema.</p>
  </div>
</div>`;
}
