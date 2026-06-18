import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';

interface Opcion {
  label: string;
  value: string;
}

@Component({
  selector: 'app-listas-desplegables',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    MultiSelectModule,
    TagModule,
    AppBreadcrumbComponent,
    CodeBlockComponent,
  ],
  templateUrl: './listas-desplegables.component.html',
  styleUrl: './listas-desplegables.component.scss',
})
export class ListasDesplegablesComponent {
  /* ─────────── V1 · p-select simple (≤10 opciones) ─────────── */
  readonly estados: Opcion[] = [
    { label: 'Activo', value: 'activo' },
    { label: 'Inactivo', value: 'inactivo' },
    { label: 'Pendiente', value: 'pendiente' },
    { label: 'Bloqueado', value: 'bloqueado' },
  ];
  estadoSel: string | null = null;

  /* ─────────── V2 · p-select con buscador (>10 opciones) ─────────── */
  readonly entidades: Opcion[] = [
    'Alcaldía de Bogotá', 'Alcaldía de Medellín', 'Alcaldía de Cali',
    'Gobernación de Antioquia', 'Gobernación del Valle', 'Gobernación de Cundinamarca',
    'Ministerio de Hacienda', 'Ministerio de Salud', 'Ministerio de Educación',
    'Contaduría General de la Nación', 'DIAN', 'DANE',
    'Superintendencia Financiera', 'Banco de la República', 'ICBF',
  ].map(n => ({ label: n, value: n.toLowerCase().replace(/\s+/g, '-') }));
  entidadSel: string | null = null;

  /* ─────────── V3 · p-multiSelect (chips) ─────────── */
  readonly permisos: Opcion[] = [
    { label: 'Consultar', value: 'consultar' },
    { label: 'Crear', value: 'crear' },
    { label: 'Editar', value: 'editar' },
    { label: 'Eliminar', value: 'eliminar' },
    { label: 'Exportar', value: 'exportar' },
    { label: 'Aprobar', value: 'aprobar' },
  ];
  permisosSel: string[] = [];

  /* ─────────── V4 · p-multiSelect con buscador (>10 opciones) ─────────── */
  readonly municipios: Opcion[] = [
    'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta',
    'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué', 'Pasto', 'Manizales',
    'Neiva', 'Villavicencio', 'Armenia', 'Montería',
  ].map(n => ({ label: n, value: n.toLowerCase() }));
  municipiosSel: string[] = [];

  /* ─────────── Snippets ─────────── */
  readonly snVSimple = `<label for="estado">Estado</label>
<p-select
  inputId="estado"
  [options]="estados"
  [(ngModel)]="estadoSel"
  optionLabel="label"
  optionValue="value"
  placeholder="Selecciona un estado"
  [showClear]="true" />`;

  readonly snVFilter = `<label for="entidad">Entidad <span class="field-required">*</span></label>
<p-select
  inputId="entidad"
  [options]="entidades"
  [(ngModel)]="entidadSel"
  optionLabel="label"
  optionValue="value"
  placeholder="Selecciona una entidad"
  [filter]="true"
  filterBy="label"
  [resetFilterOnHide]="true"
  filterPlaceholder="Buscar entidad..."
  emptyFilterMessage="No se encontraron resultados"
  [showClear]="true"
  aria-required="true" />`;

  readonly snVMulti = `<label for="permisos">Permisos asignados</label>
<p-multiSelect
  inputId="permisos"
  [options]="permisos"
  [(ngModel)]="permisosSel"
  optionLabel="label"
  optionValue="value"
  placeholder="Selecciona permisos"
  display="chip"
  [maxSelectedLabels]="3"
  selectedItemsLabel="{0} permisos seleccionados" />`;

  readonly snVMultiFilter = `<label for="municipios">Municipios</label>
<p-multiSelect
  inputId="municipios"
  [options]="municipios"
  [(ngModel)]="municipiosSel"
  optionLabel="label"
  optionValue="value"
  placeholder="Selecciona municipios"
  [filter]="true"
  filterBy="label"
  [maxSelectedLabels]="2"
  selectedItemsLabel="{0} municipios seleccionados" />`;
}
