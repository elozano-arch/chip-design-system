import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';

interface Registro {
  codigo: string;
  nombre: string;
  rol: string;
  estado: 'Activo' | 'Inactivo' | 'Pendiente';
  observacion: string;
  fecha: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    AppBreadcrumbComponent,
    CodeBlockComponent,
  ],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent {
  /* ─────────── Datos mock ─────────── */
  readonly registros: Registro[] = [
    { codigo: 'U-001', nombre: 'María Fernanda Gómez', rol: 'Administrador', estado: 'Activo', observacion: 'Acceso total al módulo de seguridad y a la gestión de roles del sistema.', fecha: '2026-01-12' },
    { codigo: 'U-002', nombre: 'Carlos Andrés Rincón', rol: 'Analista', estado: 'Activo', observacion: 'Habilitado únicamente para consulta de formularios y exportación de reportes.', fecha: '2026-02-03' },
    { codigo: 'U-003', nombre: 'Lucía Martínez Peña', rol: 'Auditor', estado: 'Pendiente', observacion: 'Pendiente de validación de código de usuario por parte del administrador.', fecha: '2026-02-20' },
    { codigo: 'U-004', nombre: 'Jorge Esteban Ruiz', rol: 'Analista', estado: 'Inactivo', observacion: 'Cuenta desactivada por inactividad superior a 90 días.', fecha: '2025-11-08' },
    { codigo: 'U-005', nombre: 'Ana Sofía Cárdenas', rol: 'Administrador', estado: 'Activo', observacion: 'Responsable de la parametrización de plantillas de correo.', fecha: '2026-03-01' },
    { codigo: 'U-006', nombre: 'Diego Alejandro Mora', rol: 'Auditor', estado: 'Activo', observacion: 'Acceso de solo lectura a la auditoría de eventos del sistema.', fecha: '2026-03-15' },
    { codigo: 'U-007', nombre: 'Valentina Ospina León', rol: 'Analista', estado: 'Pendiente', observacion: 'Esperando asignación de entidad antes de activar el usuario.', fecha: '2026-04-02' },
    { codigo: 'U-008', nombre: 'Andrés Felipe Vargas', rol: 'Analista', estado: 'Inactivo', observacion: 'Suspendido temporalmente a solicitud de la entidad.', fecha: '2025-12-19' },
  ];

  // Lista corta para la variante "sin paginador"
  readonly registrosCortos: Registro[] = this.registros.slice(0, 4);

  // Lista vacía para la variante "empty state"
  readonly registrosVacios: Registro[] = [];

  estadoSeverity(estado: Registro['estado']): 'success' | 'danger' | 'warn' {
    switch (estado) {
      case 'Activo': return 'success';
      case 'Inactivo': return 'danger';
      case 'Pendiente': return 'warn';
    }
  }

  /* ─────────── Snippets ─────────── */
  readonly snBase = `<p-table
  [value]="registros"
  [stripedRows]="true"
  [rowHover]="true"
  [paginator]="true"
  [rows]="5"
  [rowsPerPageOptions]="[5, 10, 25]"
  currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
  [showCurrentPageReport]="true">

  <ng-template #caption>
    <span class="sr-only">Listado de usuarios del sistema</span>
  </ng-template>

  <ng-template #header>
    <tr>
      <th>Código</th>
      <th>Nombre</th>
      <th>Rol</th>
      <th>Estado</th>
      <th scope="col">Acciones</th>
    </tr>
  </ng-template>

  <ng-template #body let-row>
    <tr>
      <td>{{ row.codigo }}</td>
      <td>{{ row.nombre }}</td>
      <td>{{ row.rol }}</td>
      <td><p-tag [value]="row.estado" [severity]="estadoSeverity(row.estado)" /></td>
      <td><!-- acciones por fila (F7 / F8) --></td>
    </tr>
  </ng-template>
</p-table>`;

  readonly snSinPaginador = `<!-- Lista corta: sin paginador, sin reporte de página -->
<p-table [value]="registrosCortos" [stripedRows]="true" [rowHover]="true">
  <ng-template #caption>
    <span class="sr-only">Roles del sistema</span>
  </ng-template>
  <ng-template #header> ... </ng-template>
  <ng-template #body let-row> ... </ng-template>
</p-table>`;

  readonly snScroll = `<!-- Muchas columnas: scroll horizontal + 1ª columna congelada -->
<p-table
  [value]="registros"
  [scrollable]="true"
  scrollHeight="320px"
  [stripedRows]="true">

  <ng-template #header>
    <tr>
      <th pFrozenColumn style="min-width: 120px">Código</th>
      <th style="min-width: 220px">Nombre</th>
      <th style="min-width: 160px">Rol</th>
      <th style="min-width: 320px">Observación</th>
      <th style="min-width: 140px">Fecha</th>
    </tr>
  </ng-template>

  <ng-template #body let-row>
    <tr>
      <td pFrozenColumn>{{ row.codigo }}</td>
      ...
    </tr>
  </ng-template>
</p-table>`;

  readonly snTooltip = `<!-- Celda con texto largo: truncado + tooltip con el contenido completo -->
<td>
  <span class="dt-truncate" [pTooltip]="row.observacion"
    tooltipPosition="top" [showDelay]="200">
    {{ row.observacion }}
  </span>
</td>`;

  readonly snEmpty = `<ng-template #emptymessage>
  <tr>
    <td [attr.colspan]="5" class="dt-empty">
      <i class="pi pi-inbox" aria-hidden="true"></i>
      <p>No se encontraron resultados para los filtros aplicados.</p>
    </td>
  </tr>
</ng-template>`;
}
