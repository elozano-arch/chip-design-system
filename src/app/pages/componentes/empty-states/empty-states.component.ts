import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';

@Component({
  selector: 'app-empty-states',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    AppBreadcrumbComponent,
    CodeBlockComponent,
  ],
  templateUrl: './empty-states.component.html',
  styleUrl: './empty-states.component.scss',
})
export class EmptyStatesComponent {
  readonly snDual = `<ng-template #emptymessage>
  <tr>
    <td [attr.colspan]="9" class="chip-empty">
      @if (!busquedaRealizada) {
        <i class="pi pi-search" aria-hidden="true"></i>
        <p>Use los filtros y presione <strong>Buscar</strong> para listar usuarios.</p>
      } @else {
        <i class="pi pi-inbox" aria-hidden="true"></i>
        <p>No se encontraron resultados para los filtros aplicados.</p>
      }
    </td>
  </tr>
</ng-template>`;

  readonly snSinResultados = `<ng-template #emptymessage>
  <tr>
    <td [attr.colspan]="N" class="chip-empty">
      <i class="pi pi-inbox" aria-hidden="true"></i>
      <p>No se encontraron resultados para los filtros aplicados.</p>
    </td>
  </tr>
</ng-template>`;

  readonly snSinDatos = `<!-- Lista que nunca ha tenido registros: invita a crear el primero -->
<ng-template #emptymessage>
  <tr>
    <td [attr.colspan]="N" class="chip-empty">
      <i class="pi pi-inbox" aria-hidden="true"></i>
      <p>Aún no hay registros.</p>
      <p-button label="Crear el primero" icon="pi pi-plus" size="small" />
    </td>
  </tr>
</ng-template>`;
}
