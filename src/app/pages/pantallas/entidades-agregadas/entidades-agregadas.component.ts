import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import { DirectorioEntidadesMultipleComponent } from '../../../components/directorio-entidades-multiple/directorio-entidades-multiple.component';
import { Entidad } from '../../../components/directorio-entidades/directorio-entidades.component';

/**
 * Pantalla "Entidades agregadas".
 *
 * Flujo:
 *   1. El usuario elige una categoría (obligatorio).
 *   2. Al elegirla se habilita el directorio de entidades.
 *   3. Desde el directorio selecciona una o varias entidades (checkbox).
 *   4. La pantalla muestra el listado de entidades seleccionadas, con opción
 *      de quitarlas individualmente o todas.
 *
 * Usa <app-directorio-entidades-multiple> (selección múltiple): al reabrir el
 * modal, lo ya seleccionado vuelve a verse marcado. El directorio de selección
 * única original queda intacto para el wizard de Formularios.
 */
@Component({
  selector: 'app-entidades-agregadas',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, SelectModule, TableModule, TagModule, ToastModule, TooltipModule,
    AppBreadcrumbComponent, DirectorioEntidadesMultipleComponent,
  ],
  providers: [MessageService],
  templateUrl: './entidades-agregadas.component.html',
  styleUrl: './entidades-agregadas.component.scss',
})
export class EntidadesAgregadasComponent {
  /** Catálogo de categorías (alineado con la pantalla de Gestión de Formularios). */
  readonly categoriaOptions = [
    { label: 'INFORMACIÓN CONTABLE PÚBLICA CONVERGENCIA', value: 'ICP' },
    { label: 'INFORMACIÓN PRESUPUESTAL', value: 'IP' },
    { label: 'INFORMACIÓN FINANCIERA', value: 'IF' },
    { label: 'CONTROL INTERNO CONTABLE', value: 'CIC' },
    { label: 'CGR PRESUPUESTAL', value: 'CGR' },
    { label: 'FUT GASTOS DE FUNCIONAMIENTO', value: 'FUT_GF' },
    { label: 'FUT GASTOS DE INVERSIÓN', value: 'FUT_GI' },
    { label: 'FUT INGRESOS', value: 'FUT_ING' },
  ];

  selectedCategoria = '';
  directorioVisible = false;
  entidadesSeleccionadas: Entidad[] = [];

  constructor(private readonly messages: MessageService) {}

  /** True cuando hay una categoría elegida (habilita el directorio). */
  get categoriaSeleccionada(): boolean {
    return !!this.selectedCategoria;
  }

  get categoriaLabel(): string {
    return this.categoriaOptions.find(o => o.value === this.selectedCategoria)?.label ?? '';
  }

  /** Al cambiar de categoría se reinicia la lista (las entidades aplican por categoría). */
  onCategoriaChange(): void {
    this.entidadesSeleccionadas = [];
  }

  abrirDirectorio(): void {
    if (!this.categoriaSeleccionada) return;
    this.directorioVisible = true;
  }

  /** Recibe la selección múltiple del directorio y reemplaza la lista actual. */
  onEntidadesSeleccionadas(entidades: Entidad[]): void {
    this.entidadesSeleccionadas = [...entidades];
    this.messages.add({
      severity: 'success',
      summary: 'Selección actualizada',
      detail: entidades.length
        ? `${entidades.length} entidad${entidades.length === 1 ? '' : 'es'} en la lista.`
        : 'No hay entidades seleccionadas.',
      life: 4000,
    });
  }

  quitarEntidad(entidad: Entidad): void {
    this.entidadesSeleccionadas = this.entidadesSeleccionadas.filter(e => e.codigo !== entidad.codigo);
  }

  quitarTodas(): void {
    this.entidadesSeleccionadas = [];
  }
}
