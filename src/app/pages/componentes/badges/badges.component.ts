import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { ChipModule } from 'primeng/chip';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';

type Severity = 'success' | 'danger' | 'warn' | 'info' | 'secondary';

interface EstadoMap {
  estado: string;
  severity: Severity;
  uso: string;
}

@Component({
  selector: 'app-badges',
  standalone: true,
  imports: [
    CommonModule,
    TagModule,
    BadgeModule,
    ChipModule,
    AppBreadcrumbComponent,
    CodeBlockComponent,
  ],
  templateUrl: './badges.component.html',
  styleUrl: './badges.component.scss',
})
export class BadgesComponent {
  /* ─────────── Mapa canónico estado → severity ─────────── */
  readonly mapa: EstadoMap[] = [
    { estado: 'Activo', severity: 'success', uso: 'Habilitado, vigente, completado, aprobado' },
    { estado: 'Inactivo', severity: 'danger', uso: 'Deshabilitado, rechazado, eliminado, vencido' },
    { estado: 'Pendiente', severity: 'warn', uso: 'En espera, por validar, atención requerida' },
    { estado: 'En proceso', severity: 'info', uso: 'En curso, informativo, metadato (tipo/rol)' },
    { estado: 'Borrador', severity: 'secondary', uso: 'Sin publicar, neutro, categoría sin carga semántica' },
  ];

  readonly snTag = `<!-- Mapeo canónico: el color comunica el significado, no el texto -->
<p-tag value="Activo" severity="success" />
<p-tag value="Inactivo" severity="danger" />
<p-tag value="Pendiente" severity="warn" />
<p-tag value="En proceso" severity="info" />
<p-tag value="Borrador" severity="secondary" />`;

  readonly snTagDinamico = `<!-- En tabla: severity calculada desde el estado del registro -->
<p-tag [value]="row.estado" [severity]="estadoSeverity(row.estado)" />

// .ts
estadoSeverity(estado: string): 'success' | 'danger' | 'warn' {
  switch (estado) {
    case 'Activo':     return 'success';
    case 'Inactivo':   return 'danger';
    case 'Pendiente':  return 'warn';
    default:           return 'info';
  }
}`;

  readonly snBadge = `<!-- Contador numérico sobre un icono o junto a un texto -->
<i class="pi pi-bell" pBadge value="3"></i>
<span>Notificaciones <p-badge [value]="12" severity="danger" /></span>`;

  readonly snChip = `<!-- Filtro activo removible (panel de filtros colapsado) -->
<p-chip label="Estado: Activo" [removable]="true" (onRemove)="quitarFiltro('estado')" />
<p-chip label="Rol: Analista" [removable]="true" (onRemove)="quitarFiltro('rol')" />`;
}
