import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

/**
 * Variable de un concepto en la vista Registro Manual.
 * `valores` es indexado por la clave de la columna (ej. 'ene', 'feb', etc.).
 */
interface Variable {
  id: string;
  nombre: string;
  unidad: string;
  valores: Record<string, number | null>;
}

/**
 * Cada "concepto padre" tiene sus propias variables y su propio paginador interno.
 * Esto refleja la POC de Wilmar: cada padre maneja su paginación de filas
 * independiente del resto.
 */
interface ConceptoPadre {
  id: string;
  codigo: string;
  nombre: string;
  variables: Variable[];
  /** Página actual del paginador interno (0-based). */
  pagina: number;
  /** Filas por página. */
  filasPorPagina: number;
}

/** Columna del registro manual (periodos). El paginador global decide cuáles son visibles. */
interface ColumnaRegistro {
  key: string;
  label: string;
}

/**
 * Lo que el registro manual necesita saber del formulario abierto. Es un
 * subconjunto de `Formulario`: la vista sólo lo usa para la cabecera.
 */
export interface RegistroManualFormulario {
  codigo: string;
  nombre: string;
  categoria: string;
  periodo: string;
  anio: number;
}

/**
 * Vista Registro Manual (detalle del formulario).
 * Refleja la POC de Wilmar: cada concepto padre maneja su propio paginador
 * de filas (variables), y arriba un paginador global de columnas (periodos)
 * — porque un formulario puede tener hasta 60+ variables y muchas columnas.
 *
 * Guardar sólo confirma con un toast (el dato vive aquí); volver y validar
 * son del listado, así que salen como eventos.
 */
@Component({
  selector: 'app-registro-manual',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputNumberModule,
    MessageModule,
    TooltipModule,
    DialogModule,
  ],
  // Sin providers: el MessageService lo provee la pantalla de formularios,
  // que es la que tiene el <p-toast>. Uno propio dejaría los toasts mudos.
  templateUrl: './registro-manual.component.html',
  styleUrl: './registro-manual.component.scss',
})
export class RegistroManualComponent implements OnDestroy {
  @Input({ required: true }) formulario!: RegistroManualFormulario;

  /** Volver al listado — el padre decide qué hacer con la sub-vista. */
  @Output() volver = new EventEmitter<void>();
  /** Validar el formulario abierto — cambia etapa/estado en el listado. */
  @Output() validar = new EventEmitter<void>();

  constructor(private messageService: MessageService) {
    this.setupColumnasResponsivas();
  }

  // ── Responsive: columnas visibles de la matriz de registro manual ──
  // En tablet/phone caben menos periodos; el paginador de columnas se ajusta
  // al viewport (4 desktop · 3 ≤992 · 2 ≤768) con matchMedia nativo (sin CDK).
  private mqlTablet?: MediaQueryList;
  private mqlPhone?: MediaQueryList;
  private readonly onViewportChange = () => this.ajustarColumnasPorViewport();

  private setupColumnasResponsivas(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    this.mqlTablet = window.matchMedia('(max-width: 992px)');
    this.mqlPhone = window.matchMedia('(max-width: 768px)');
    this.mqlTablet.addEventListener('change', this.onViewportChange);
    this.mqlPhone.addEventListener('change', this.onViewportChange);
    this.ajustarColumnasPorViewport();
  }

  private ajustarColumnasPorViewport(): void {
    this.columnasPorPagina = this.mqlPhone?.matches ? 2 : this.mqlTablet?.matches ? 3 : 4;
    const maxPagina = Math.max(0, this.totalPaginasColumnas - 1);
    if (this.paginaColumnas > maxPagina) this.paginaColumnas = maxPagina;
  }

  ngOnDestroy(): void {
    this.mqlTablet?.removeEventListener('change', this.onViewportChange);
    this.mqlPhone?.removeEventListener('change', this.onViewportChange);
  }

  /** 12 periodos mockeados (meses). En producción vendría del backend. */
  readonly columnasRegistro: ColumnaRegistro[] = [
    { key: 'ene', label: 'Ene 2024' }, { key: 'feb', label: 'Feb 2024' },
    { key: 'mar', label: 'Mar 2024' }, { key: 'abr', label: 'Abr 2024' },
    { key: 'may', label: 'May 2024' }, { key: 'jun', label: 'Jun 2024' },
    { key: 'jul', label: 'Jul 2024' }, { key: 'ago', label: 'Ago 2024' },
    { key: 'sep', label: 'Sep 2024' }, { key: 'oct', label: 'Oct 2024' },
    { key: 'nov', label: 'Nov 2024' }, { key: 'dic', label: 'Dic 2024' },
  ];

  /** Paginador global de columnas: cuántas columnas se muestran a la vez. */
  columnasPorPagina = 4;
  paginaColumnas = 0;

  get totalPaginasColumnas(): number {
    return Math.ceil(this.columnasRegistro.length / this.columnasPorPagina);
  }
  get columnasVisibles(): ColumnaRegistro[] {
    const inicio = this.paginaColumnas * this.columnasPorPagina;
    return this.columnasRegistro.slice(inicio, inicio + this.columnasPorPagina);
  }
  paginaColumnasAnterior() {
    if (this.paginaColumnas > 0) this.paginaColumnas--;
  }
  paginaColumnasSiguiente() {
    if (this.paginaColumnas < this.totalPaginasColumnas - 1) this.paginaColumnas++;
  }

  /** Mock de conceptos padre (cada uno con su tabla y paginador independiente). */
  conceptos: ConceptoPadre[] = [
    {
      id: 'c1',
      codigo: '1.1.05',
      nombre: 'Caja',
      pagina: 0,
      filasPorPagina: 5,
      variables: this.generarVariablesMock('CAJA', 8),
    },
    {
      id: 'c2',
      codigo: '1.1.10',
      nombre: 'Bancos y corporaciones de ahorro',
      pagina: 0,
      filasPorPagina: 5,
      variables: this.generarVariablesMock('BAN', 12),
    },
    {
      id: 'c3',
      codigo: '1.1.20',
      nombre: 'Inversiones administración de liquidez',
      pagina: 0,
      filasPorPagina: 5,
      variables: this.generarVariablesMock('INV', 6),
    },
  ];

  /** Genera N variables mockeadas con valores aleatorios por periodo. */
  private generarVariablesMock(prefijo: string, cantidad: number): Variable[] {
    const variables: Variable[] = [];
    for (let i = 1; i <= cantidad; i++) {
      const valores: Record<string, number | null> = {};
      this.columnasRegistro.forEach(col => {
        // Algunas celdas vacías para simular registros incompletos
        valores[col.key] = Math.random() < 0.15 ? null : Math.round(Math.random() * 9000000) + 100000;
      });
      variables.push({
        id: `${prefijo}-${String(i).padStart(3, '0')}`,
        nombre: `${prefijo} variable ${i}`,
        unidad: 'COP',
        valores,
      });
    }
    return variables;
  }

  variablesVisibles(concepto: ConceptoPadre): Variable[] {
    const inicio = concepto.pagina * concepto.filasPorPagina;
    return concepto.variables.slice(inicio, inicio + concepto.filasPorPagina);
  }
  totalPaginasConcepto(concepto: ConceptoPadre): number {
    return Math.ceil(concepto.variables.length / concepto.filasPorPagina);
  }
  paginaConceptoAnterior(concepto: ConceptoPadre) {
    if (concepto.pagina > 0) concepto.pagina--;
  }
  paginaConceptoSiguiente(concepto: ConceptoPadre) {
    if (concepto.pagina < this.totalPaginasConcepto(concepto) - 1) concepto.pagina++;
  }

  /**
   * Guarda cambios desde el detalle. Patrón UX: el usuario sigue editando
   * variables en otros conceptos, así que NO cerramos el detalle — solo
   * confirmamos con un toast no intrusivo.
   */
  guardarCambios() {
    this.messageService.add({
      severity: 'success',
      summary: 'Cambios guardados',
      detail: 'Los valores del formulario fueron guardados. Puede seguir editando o validar cuando termine.',
      life: 3500,
    });
  }

  // ── Edición modal del registro ──
  modalEditar: { concepto: ConceptoPadre; variable: Variable } | null = null;
  abrirModalEditar(concepto: ConceptoPadre, variable: Variable) {
    this.modalEditar = { concepto, variable };
  }
  cerrarModalEditar() {
    this.modalEditar = null;
  }
  guardarModalEditar() {
    this.modalEditar = null;
    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Registro actualizado correctamente.', life: 2500 });
  }
}
