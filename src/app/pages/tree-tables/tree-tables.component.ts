import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AppBreadcrumbComponent } from '../../components/app-breadcrumb/app-breadcrumb.component';
import {
  TreeTableComponent,
  ColumnaConfig,
  NodoArbol,
} from '../../components/tree-table/tree-table.component';

@Component({
  selector: 'app-tree-tables',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DividerModule,
    TagModule,
    ToastModule,
    AppBreadcrumbComponent,
    TreeTableComponent,
  ],
  providers: [MessageService],
  templateUrl: './tree-tables.component.html',
  styleUrl: './tree-tables.component.scss',
})
export class TreeTablesComponent {
  /* ─────────── Columnas fijas (comunes a las 3 variantes) ─────────── */
  readonly columnasFijas: ColumnaConfig[] = [
    { key: 'codigo', label: 'Código', editable: false, tipo: 'texto', ancho: '180px', fija: true },
    { key: 'nombre', label: 'Concepto', editable: false, tipo: 'texto', ancho: '220px', fija: true },
  ];

  /* ─────────── V1 · Consulta / Visualización (read-only) ─────────── */
  readonly columnasConsulta: ColumnaConfig[] = [
    { key: 'sldoInicial', label: 'Saldo Inicial', editable: false, tipo: 'numero', alineacion: 'right' },
    { key: 'movDebito', label: 'Mov. Débito', editable: false, tipo: 'numero', alineacion: 'right' },
    { key: 'movCredito', label: 'Mov. Crédito', editable: false, tipo: 'numero', alineacion: 'right' },
    { key: 'sldoFinal', label: 'Saldo Final', editable: false, tipo: 'numero', alineacion: 'right' },
    { key: 'estado', label: 'Estado', editable: false, tipo: 'seleccion', alineacion: 'center' },
  ];

  /* ─────────── V2 · Editable / Formularios ─────────── */
  readonly columnasEditable: ColumnaConfig[] = [
    { key: 'sldoInicial', label: 'Saldo Inicial', editable: true, tipo: 'numero', alineacion: 'right' },
    { key: 'movDebito', label: 'Mov. Débito', editable: true, tipo: 'numero', alineacion: 'right' },
    { key: 'sldoFinal', label: 'Saldo Final', editable: false, tipo: 'numero', alineacion: 'right' },
    { key: 'notaAnalista', label: 'Nota Analista', editable: true, tipo: 'texto', alineacion: 'left' },
    { key: 'estado', label: 'Estado', editable: true, tipo: 'seleccion',
      opciones: ['Activo', 'Inactivo', 'Pendiente'], alineacion: 'center' },
  ];

  /* ─────────── V3 · Completa (menús + paginador + column toggle) ─────────── */
  readonly columnasCompleta: ColumnaConfig[] = [
    { key: 'sldoInicial', label: 'Saldo Inicial', editable: true, tipo: 'numero', alineacion: 'right' },
    { key: 'movDebito', label: 'Mov. Débito', editable: true, tipo: 'numero', alineacion: 'right' },
    { key: 'movCredito', label: 'Mov. Crédito', editable: true, tipo: 'numero', alineacion: 'right' },
    { key: 'sldoFinal', label: 'Saldo Final', editable: false, tipo: 'numero', alineacion: 'right' },
    { key: 'ptoAsignado', label: 'Pto. Asignado', editable: true, tipo: 'numero', alineacion: 'right' },
    { key: 'ptoEjecutado', label: 'Pto. Ejecutado', editable: true, tipo: 'numero', alineacion: 'right' },
    { key: 'riesgoAlerta', label: 'Riesgo Alerta', editable: true, tipo: 'seleccion',
      opciones: ['Sí', 'No'], alineacion: 'center' },
    { key: 'puntajeCtrl', label: 'Puntaje Ctrl.', editable: true, tipo: 'numero', alineacion: 'right' },
    { key: 'estado', label: 'Estado', editable: true, tipo: 'seleccion',
      opciones: ['Activo', 'Inactivo', 'Pendiente'], alineacion: 'center' },
    { key: 'clasificacion', label: 'Clasificación', editable: true, tipo: 'seleccion',
      opciones: ['Alta', 'Media', 'Baja'], alineacion: 'center' },
  ];

  /* ─────────── Datos mock (mismo árbol contable para las 3 variantes) ─────────── */
  readonly arbol: NodoArbol[] = this.generarArbol();

  /* ─────────── Estándares aplicados (cards) ─────────── */
  readonly estandares = [
    {
      icon: 'pi pi-sitemap',
      titulo: 'Una sola rama abierta',
      texto: 'Al abrir otra rama del mismo nivel se cierra la anterior, evitando scroll vertical excesivo. Configurable.',
    },
    {
      icon: 'pi pi-bullseye',
      titulo: 'Nodo activo + miga de pan',
      texto: 'Barra cobalto a la izquierda del nodo activo y ruta jerárquica para no perder el contexto.',
    },
    {
      icon: 'pi pi-list',
      titulo: 'Paginador por nodo',
      texto: 'Paginación interna por nodo padre con tamaños 5 / 10 / 25 / 50 y etiqueta "Mostrando X a Y de Z".',
    },
    {
      icon: 'pi pi-arrows-h',
      titulo: 'Paginación de columnas',
      texto: 'Las columnas variables se paginan horizontalmente (4 a la vez) dejando código y concepto fijos.',
    },
    {
      icon: 'pi pi-pencil',
      titulo: 'Edición inline + sticky bar',
      texto: 'Click en celda editable y barra sticky con "N cambios pendientes" + Guardar / Descartar.',
    },
    {
      icon: 'pi pi-search',
      titulo: 'Búsqueda global',
      texto: 'Búsqueda por código o concepto en todo el árbol; se colapsa a las ramas con coincidencias.',
    },
  ];

  /* ─────────── Snippets copiables ─────────── */
  copied: Record<string, boolean> = {};

  readonly snippets: Record<string, string> = {
    V1: `<!-- Consulta / Visualización: solo lectura -->
<app-tree-table
  [nodos]="arbol"
  [columnasFijas]="columnasFijas"
  [columnasVariables]="columnasConsulta"
  [editable]="false"
  [searchable]="true"
  [pageable]="true" />`,

    V2: `<!-- Editable / Formularios: edición inline + sticky bar -->
<app-tree-table
  [nodos]="arbol"
  [columnasFijas]="columnasFijas"
  [columnasVariables]="columnasEditable"
  [editable]="true"
  [searchable]="true"
  [pageable]="true"
  destinoGuardado="CHIP local" />`,

    V3: `<!-- Completa: menús por fila + paginador + column toggle -->
<app-tree-table
  [nodos]="arbol"
  [columnasFijas]="columnasFijas"
  [columnasVariables]="columnasCompleta"
  [editable]="true"
  [searchable]="true"
  [pageable]="true"
  [columnPager]="true"
  [rowMenu]="true"
  [columnToggle]="true" />`,

    setup: `// El componente consumidor provee MessageService y un <p-toast />
@Component({
  imports: [TreeTableComponent, ToastModule],
  providers: [MessageService],
})
// En el template:
// <p-toast />`,
  };

  copySnippet(key: string): void {
    const text = this.snippets[key];
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copied[key] = true;
      setTimeout(() => (this.copied[key] = false), 2000);
    });
  }

  /* ═════════════ Datos mock determinísticos ═════════════ */
  private generarArbol(): NodoArbol[] {
    const conceptos = [
      { codigo: '1100', nombre: 'Activos corrientes', hijos: 14 },
      { codigo: '1200', nombre: 'Activos no corrientes', hijos: 10 },
      { codigo: '2100', nombre: 'Pasivos corrientes', hijos: 12 },
      { codigo: '3100', nombre: 'Patrimonio institucional', hijos: 6 },
      { codigo: '4100', nombre: 'Ingresos operacionales', hijos: 16 },
    ];
    return conceptos.map((c, i) => this.crearNodo(c.codigo, c.nombre, 1, c.hijos, `n${i}`));
  }

  private crearNodo(codigo: string, nombre: string, nivel: number, cantHijos: number, idBase: string): NodoArbol {
    const hijos: NodoArbol[] = [];
    if (nivel < 3 && cantHijos > 0) {
      for (let i = 1; i <= cantHijos; i++) {
        const subCod = `${codigo}-${String(i).padStart(2, '0')}`;
        const subId = `${idBase}-${i}`;
        const subHijos = nivel === 1 && i % 3 === 0 ? 4 : 0;
        hijos.push(this.crearNodo(subCod, `Subconcepto ${i}`, nivel + 1, subHijos, subId));
      }
    }
    return {
      id: idBase,
      codigo,
      nombre,
      nivel,
      hijos,
      valores: this.generarValores(nivel, idBase),
    };
  }

  private generarValores(nivel: number, semilla: string): Record<string, string | number> {
    const rng = this.crearRng(semilla);
    const base = nivel === 1 ? 2_000_000 : 120_000;
    const variacion = nivel === 1 ? 1_500_000 : 400_000;
    const sldoInicial = base + Math.floor(rng() * variacion);
    const movDebito = 10_000 + Math.floor(rng() * 280_000);
    const movCredito = 5_000 + Math.floor(rng() * 160_000);
    const sldoFinal = sldoInicial + movDebito - movCredito;
    const ptoAsignado = sldoFinal + Math.floor(rng() * 600_000);
    const ptoEjecutado = Math.floor(sldoFinal * (0.7 + rng() * 0.3));
    const estados = ['Activo', 'Inactivo', 'Pendiente'];
    const clases = ['Alta', 'Media', 'Baja'];
    const notas = ['Revisión técnica 1', 'Pendiente analista', 'Aprobado', 'Verificar soporte'];
    return {
      sldoInicial,
      movDebito,
      movCredito,
      sldoFinal,
      ptoAsignado,
      ptoEjecutado,
      riesgoAlerta: rng() > 0.65 ? 'Sí' : 'No',
      puntajeCtrl: 40 + Math.floor(rng() * 60),
      notaAnalista: nivel === 1 ? notas[Math.floor(rng() * notas.length)] : '',
      estado: estados[Math.floor(rng() * estados.length)],
      clasificacion: clases[Math.floor(rng() * clases.length)],
      observacion: '',
    };
  }

  /** PRNG determinístico (Mulberry32) sembrado por hash de la cadena. */
  private crearRng(semilla: string): () => number {
    let h = 1779033703 ^ semilla.length;
    for (let i = 0; i < semilla.length; i++) {
      h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    let state = h >>> 0;
    return () => {
      state = (state + 0x6D2B79F5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
}
