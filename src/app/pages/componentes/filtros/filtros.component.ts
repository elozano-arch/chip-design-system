import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { InputTextModule } from 'primeng/inputtext';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';

@Component({
  selector: 'app-filtros-doc',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    ButtonModule,
    ChipModule,
    InputTextModule,
    AppBreadcrumbComponent,
    CodeBlockComponent,
  ],
  templateUrl: './filtros.component.html',
  styleUrl: './filtros.component.scss',
})
export class FiltrosComponent {
  /* ─────────── Demo interactiva ─────────── */
  expandido = signal(true);

  readonly estados = [
    { label: 'Activo', value: 'activo' },
    { label: 'Inactivo', value: 'inactivo' },
    { label: 'Pendiente', value: 'pendiente' },
  ];
  readonly roles = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Analista', value: 'analista' },
    { label: 'Auditor', value: 'auditor' },
  ];

  texto = '';
  estado: string | null = null;
  rol: string | null = null;

  get chips(): { key: string; label: string }[] {
    const c: { key: string; label: string }[] = [];
    if (this.texto.trim()) c.push({ key: 'texto', label: `Búsqueda: ${this.texto.trim()}` });
    if (this.estado) c.push({ key: 'estado', label: `Estado: ${this.labelDe(this.estados, this.estado)}` });
    if (this.rol) c.push({ key: 'rol', label: `Rol: ${this.labelDe(this.roles, this.rol)}` });
    return c;
  }

  private labelDe(opts: { label: string; value: string }[], v: string): string {
    return opts.find(o => o.value === v)?.label ?? v;
  }

  quitar(key: string): void {
    if (key === 'texto') this.texto = '';
    if (key === 'estado') this.estado = null;
    if (key === 'rol') this.rol = null;
  }

  limpiarTodo(): void {
    this.texto = '';
    this.estado = null;
    this.rol = null;
  }

  readonly snFiltros = `<div class="chip-filters">
  <!-- Header: toggle + chips (cuando está colapsado) + acciones -->
  <div class="chip-filters__header">
    <div class="chip-filters__header-left">
      <p-button [text]="true" severity="secondary"
        [icon]="expandido() ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
        label="Filtros"
        (onClick)="expandido.set(!expandido())"
        [attr.aria-expanded]="expandido()" aria-controls="filtros-body" />

      @if (!expandido() && chips.length) {
        <div class="chip-filters__chips" aria-live="polite">
          @for (c of chips; track c.key) {
            <p-chip [label]="c.label" [removable]="true" (onRemove)="quitar(c.key)" />
          }
        </div>
      }
    </div>

    <div class="chip-filters__header-right">
      @if (chips.length) {
        <p-button label="Limpiar todo" icon="pi pi-filter-slash"
          [text]="true" severity="secondary" (onClick)="limpiarTodo()" />
      }
    </div>
  </div>

  <!-- Body: grid de campos (2col / 3col / 4col) -->
  @if (expandido()) {
    <div class="chip-filters__body" id="filtros-body">
      <div class="chip-filters__fields chip-filters__fields--3col">
        <div class="chip-filters__field"> ... </div>
      </div>
    </div>
  }
</div>`;
}
