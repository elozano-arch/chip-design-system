import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

import {
  BotonDescargarComponent,
  DownloadFormatId,
} from '../../../../components/boton-descargar/boton-descargar.component';

/* ── Protocolo de Importación — sub-vista del Paso 2 ── */
type ProtocoloTipoDato = 'Numérico' | 'Texto' | 'Fecha' | 'Lista';
type ProtocoloTipoRegistro = 'Cabecera' | 'Detalle';

interface ProtocoloVariable {
  numero: number;
  tipoRegistro: ProtocoloTipoRegistro;
  nombre: string;
  tipoDato: ProtocoloTipoDato;
  longitud: number;
  decimales: number | null;
  unidad: string;
  observaciones: string;
  listaKey?: string;
}

/**
 * Tipo de dato de un campo (columna) de una lista — equivale a `tab_field.field_type`.
 *   S = texto · N = numérico · B = booleano · D = fecha · L = lista
 * Sólo se usa, por ahora, para alinear los numéricos a la derecha.
 */
type ProtocoloFieldType = 'S' | 'N' | 'B' | 'D' | 'L';

/**
 * Definición de una columna de la lista — simula una fila de `tab_field`.
 * `code`  → field_code   (encabezado de la columna; también la llave en cada registro)
 * `order` → orden de despliegue definido en tab_field
 * `type`  → field_type   (N alinea a la derecha)
 * `len`   → field_len    (de aquí sale el ancho proporcional de la columna)
 */
interface ProtocoloField {
  code: string;
  order: number;
  type: ProtocoloFieldType;
  len: number;
  decimals?: number;
}

/** Un registro de la lista — simula `result`: un valor por field_code. */
type ProtocoloRegistro = Record<string, string>;

interface ProtocoloLista {
  key: string;
  nombre: string;
  /** Columnas de la lista, en el orden de tab_field. */
  fields: ProtocoloField[];
  /** Valores: cada registro está llaveado por field_code. */
  valores: ProtocoloRegistro[];
}

@Component({
  selector: 'app-protocolo-importacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    TabsModule,
    DialogModule,
    BotonDescargarComponent,
  ],
  // Sin providers: el MessageService lo provee la pantalla de formularios,
  // que es la que tiene el <p-toast>. Uno propio dejaría los toasts mudos.
  templateUrl: './protocolo-importacion.component.html',
  styleUrl: './protocolo-importacion.component.scss',
})
export class ProtocoloImportacionComponent {
  constructor(private messageService: MessageService) {}
  // ──────────────────────────────────────────────────────────────────────
  // Protocolo de Importación — datos, modal Ver Lista y descargas.
  // El contexto (entidad/categoría/año/periodo + formulario seleccionado)
  // proviene del Paso 1 del wizard — no hay selects propios.
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Tab "Registro de Encabezado" — estructura de la fila S (única por archivo).
   * Formato del legacy CHIP: ejemplo destacado + lista descriptiva de campos.
   */
  readonly ejemploCabecera =
    'S 210641006 10103 2025 CGN001_BALANCE_GENERAL Fecha de envío';

  readonly camposCabecera: Array<{ token: string; nombre: string; desc: string }> = [
    { token: 'S', nombre: 'Tipo de Registro',
      desc: 'Marca de inicio. Indica que la fila corresponde al registro de cabecera.' },
    { token: '210641006', nombre: 'Código de la Entidad',
      desc: 'Identificador DANE de la entidad reportante.' },
    { token: '10103', nombre: 'Periodo',
      desc: 'Periodo contable del reporte. Ej: 10103 = trimestre Ene–Mar (mes inicial 01, mes final 03).' },
    { token: '2025', nombre: 'Año',
      desc: 'Año al que pertenece el periodo reportado.' },
    { token: 'CGN001_BALANCE_GENERAL', nombre: 'Nombre del Formulario',
      desc: 'Identificador único del formulario que se está reportando.' },
    { token: 'Fecha de envío', nombre: 'Fecha de Envío',
      desc: 'Fecha de generación de la información en formato dd-mm-aaaa.' },
  ];

  /**
   * Tab "Registro de Detalle" — estructura de las filas D (una por concepto).
   * Las variables concretas (SLDO_INC, MOV_DB, ENT_RECIP, etc.) se documentan
   * en el tab "Variables".
   */
  readonly ejemploDetalle = 'D Concepto Variables';

  readonly camposDetalle: Array<{ token: string; nombre: string; desc: string }> = [
    { token: 'D', nombre: 'Tipo de Registro',
      desc: 'Marca de inicio. Indica que la fila corresponde al registro de detalle.' },
    { token: 'Concepto', nombre: 'Código del Concepto',
      desc: 'Código contable del concepto a reportar. Ver tab "Conceptos" para los valores válidos.' },
    { token: 'Variables', nombre: 'Valores de las Variables',
      desc: 'Valores de las variables específicas del formulario. Ver tab "Variables" para su definición.' },
  ];

  /**
   * Tab "Variables" — variables técnicas del registro de detalle.
   * No incluye "Tipo de Registro" (D) ni "Concepto" (ya documentados en el tab Detalle).
   */
  readonly variables: ProtocoloVariable[] = [
    { numero: 1, tipoRegistro: 'Detalle', nombre: 'SLDO_INC',
      tipoDato: 'Numérico', longitud: 25, decimales: 2, unidad: 'Pesos',
      observaciones: 'Saldo inicial del concepto.' },
    { numero: 2, tipoRegistro: 'Detalle', nombre: 'MOV_DB',
      tipoDato: 'Numérico', longitud: 25, decimales: 2, unidad: 'Pesos',
      observaciones: 'Movimiento débito del período.' },
    { numero: 3, tipoRegistro: 'Detalle', nombre: 'MOV_CR',
      tipoDato: 'Numérico', longitud: 25, decimales: 2, unidad: 'Pesos',
      observaciones: 'Movimiento crédito del período.' },
    { numero: 4, tipoRegistro: 'Detalle', nombre: 'ENT_RECIP',
      tipoDato: 'Lista', longitud: 14, decimales: null, unidad: '—',
      observaciones: 'Entidad recíproca asociada al movimiento.',
      listaKey: 'ENTIDADES_RECIPROCAS' },
    { numero: 5, tipoRegistro: 'Detalle', nombre: 'VR_CTE',
      tipoDato: 'Numérico', longitud: 25, decimales: 2, unidad: 'Pesos',
      observaciones: 'Valor corriente del movimiento.' },

    // ── Variables de ejemplo para validar los 4 casos del modal "Ver Lista".
    //    (En el mock el tab Variables comparte un solo array; cada una indica
    //     de qué formulario/variable colgaría en producción.)
    { numero: 6, tipoRegistro: 'Detalle', nombre: 'PERIODO_REP',
      tipoDato: 'Lista', longitud: 2, decimales: null, unidad: '—',
      observaciones: 'Periodo del reporte — caso lista simple (2 campos).',
      listaKey: 'PERIODOS' },                       // form. CGN001_BALANCE_GENERAL / var. PERIODO_REP
    { numero: 7, tipoRegistro: 'Detalle', nombre: 'TERCERO',
      tipoDato: 'Lista', longitud: 16, decimales: null, unidad: '—',
      observaciones: 'Tercero asociado — caso 8 campos (dispara paginador de columnas).',
      listaKey: 'TERCEROS' },                       // form. CGN015_OPERACIONES_RECIPROCAS / var. TERCERO
    { numero: 8, tipoRegistro: 'Detalle', nombre: 'CTA_CONTABLE',
      tipoDato: 'Lista', longitud: 12, decimales: null, unidad: '—',
      observaciones: 'Cuenta del plan contable — caso con campo Descripción largo (truncado).',
      listaKey: 'PLAN_CUENTAS' },                   // form. CGN001_BALANCE_GENERAL / var. CTA_CONTABLE
  ];

  /** Conteo total de variables (para el chip del header del protocolo). */
  get totalVariables(): number {
    return this.camposCabecera.length + this.camposDetalle.length + this.variables.length;
  }

  /** Buscador del tab Conceptos (filtrado en memoria sobre listas.CONCEPTOS.valores). */
  busquedaConceptos = signal('');

  conceptosFiltrados = computed<ProtocoloRegistro[]>(() => {
    const q = this.busquedaConceptos().trim().toLowerCase();
    const todos = this.listas['CONCEPTOS'].valores;
    if (!q) return todos;
    return todos.filter(r =>
      Object.values(r).some(v => v.toLowerCase().includes(q)),
    );
  });

  /**
   * Descarga el catálogo CONCEPTOS en el formato indicado.
   * CSV se genera en cliente (mock real). Excel/PDF/TXT muestran toast de simulación.
   */
  descargarConceptos(format: DownloadFormatId = 'csv'): void {
    if (format === 'csv') {
      this.descargarValoresCSV(this.listas['CONCEPTOS']);
      return;
    }
    this.toastDescargaSimulada('CONCEPTOS', format);
  }

  /**
   * Catálogos referenciados por las variables tipo Lista.
   * Cada lista define sus columnas en `fields` (simula tab_field) y sus
   * registros en `valores` (simula result, llaveados por field_code).
   */
  readonly listas: Record<string, ProtocoloLista> = {
    // Caso simple: 2 campos (código + nombre) → sin paginador de columnas.
    PERIODOS: {
      key: 'PERIODOS',
      nombre: 'PERIODOS',
      fields: [
        { code: 'Código', order: 1, type: 'S', len: 2 },
        { code: 'Nombre', order: 2, type: 'S', len: 20 },
      ],
      valores: [
        { 'Código': '01', 'Nombre': 'Ene-Mar' },
        { 'Código': '02', 'Nombre': 'Abr-Jun' },
        { 'Código': '03', 'Nombre': 'Jul-Sep' },
        { 'Código': '04', 'Nombre': 'Oct-Dic' },
      ],
    },
    CONCEPTOS: {
      key: 'CONCEPTOS',
      nombre: 'CONCEPTOS',
      fields: [
        { code: 'Código', order: 1, type: 'S', len: 8 },
        { code: 'Nombre', order: 2, type: 'S', len: 60 },
      ],
      valores: this.generarConceptosProtocolo(),
    },
    // Caso máximo actual: 6 campos → se muestra completo, sin paginador.
    ENTIDADES_RECIPROCAS: {
      key: 'ENTIDADES_RECIPROCAS',
      nombre: 'ENTIDADES_RECIPROCAS',
      fields: [
        { code: 'Código', order: 1, type: 'S', len: 9 },
        { code: 'NIT', order: 2, type: 'S', len: 11 },
        { code: 'Razón social', order: 3, type: 'S', len: 60 },
        { code: 'Tipo', order: 4, type: 'S', len: 12 },
        { code: 'Departamento', order: 5, type: 'S', len: 20 },
        { code: 'Estado', order: 6, type: 'S', len: 10 },
      ],
      valores: this.generarEntidadesReciprocasProtocolo(),
    },
    // Caso 8 campos → dispara el paginador de columnas (6 + 2).
    TERCEROS: {
      key: 'TERCEROS',
      nombre: 'TERCEROS',
      fields: [
        { code: 'Tipo doc.', order: 1, type: 'S', len: 4 },
        { code: 'Documento', order: 2, type: 'S', len: 12 },
        { code: 'DV', order: 3, type: 'N', len: 1 },
        { code: 'Razón social', order: 4, type: 'S', len: 60 },
        { code: 'Ciudad', order: 5, type: 'S', len: 20 },
        { code: 'Dirección', order: 6, type: 'S', len: 40 },
        { code: 'Teléfono', order: 7, type: 'S', len: 14 },
        { code: 'Estado', order: 8, type: 'S', len: 10 },
      ],
      valores: this.generarTercerosProtocolo(),
    },
    // Caso campo largo: 5 campos, uno de longitud 180 (Descripción) → truncado
    // con "…" + tooltip; las demás columnas se reajustan. Cabe en una página.
    PLAN_CUENTAS: {
      key: 'PLAN_CUENTAS',
      nombre: 'PLAN_CUENTAS',
      fields: [
        { code: 'Código', order: 1, type: 'S', len: 12 },
        { code: 'Nombre', order: 2, type: 'S', len: 40 },
        { code: 'Descripción', order: 3, type: 'S', len: 180 },
        { code: 'Naturaleza', order: 4, type: 'S', len: 8 },
        { code: 'Nivel', order: 5, type: 'N', len: 2 },
      ],
      valores: this.generarPlanCuentasProtocolo(),
    },
  };

  /** Modal "Ver Lista" — signal para reaccionar al filtro de búsqueda. */
  listaActiva = signal<ProtocoloLista | null>(null);
  busquedaLista = signal('');

  /** Filtra por CUALQUIER campo del registro (no sólo código/nombre). */
  valoresFiltrados = computed<ProtocoloRegistro[]>(() => {
    const lista = this.listaActiva();
    if (!lista) return [];
    const q = this.busquedaLista().trim().toLowerCase();
    if (!q) return lista.valores;
    return lista.valores.filter(r =>
      Object.values(r).some(v => v.toLowerCase().includes(q)),
    );
  });

  // ── Columnas dinámicas del modal "Ver Lista" ──────────────────────────────
  // El modal es estático (820px); quien se adapta es el datatable interno.
  // Cada columna toma el ancho necesario para que su NOMBRE (header) quepa sin
  // exprimirse, acotado por un techo (los textos largos se truncan con "…").
  // Las columnas se empacan por presupuesto de ancho (sin scroll horizontal) y
  // con un tope de 6; si sobran campos se habilita el paginador de columnas.
  private readonly LISTA_COLS_MAX = 6;        // tope para no recargar el modal
  private readonly LISTA_COL_BUDGET = 740;    // ancho útil del datatable (px)
  private readonly LISTA_COL_MIN = 56;        // piso de columna
  private readonly LISTA_COL_MAX = 220;       // techo: a partir de aquí trunca

  /** Página de columnas activa del modal (0-based), como el pager del treetable. */
  paginaColumnasLista = 0;

  /** Campos de la lista activa, ordenados por `order` (tab_field). */
  private get camposListaOrdenados(): ProtocoloField[] {
    const lista = this.listaActiva();
    return lista ? [...lista.fields].sort((a, b) => a.order - b.order) : [];
  }

  /**
   * Ancho (px) que necesita una columna: el mayor entre lo que ocupa su nombre
   * (header en mayúsculas) y lo sugerido por field_len, acotado por piso/techo.
   */
  anchoColumnaListaPx(field: ProtocoloField): number {
    const headerNeed = Math.round(field.code.length * 8.5) + 30;
    const contentNeed = Math.min(field.len, 28) * 8 + 24;
    return Math.min(this.LISTA_COL_MAX, Math.max(this.LISTA_COL_MIN, headerNeed, contentNeed));
  }

  /**
   * Campos repartidos en páginas: se acumulan columnas hasta llegar al tope (6)
   * o agotar el presupuesto de ancho, lo que ocurra primero.
   */
  get paginasColumnasLista(): ProtocoloField[][] {
    const campos = this.camposListaOrdenados;
    if (!campos.length) return [[]];
    const paginas: ProtocoloField[][] = [];
    let actual: ProtocoloField[] = [];
    let ancho = 0;
    for (const campo of campos) {
      const w = this.anchoColumnaListaPx(campo);
      const llena = actual.length >= this.LISTA_COLS_MAX;
      const excede = actual.length > 0 && ancho + w > this.LISTA_COL_BUDGET;
      if (llena || excede) {
        paginas.push(actual);
        actual = [];
        ancho = 0;
      }
      actual.push(campo);
      ancho += w;
    }
    if (actual.length) paginas.push(actual);
    return paginas.length ? paginas : [[]];
  }

  get totalPaginasColumnasLista(): number {
    return this.paginasColumnasLista.length;
  }

  /** Sólo se muestra el pager de columnas si hay más de una página. */
  get mostrarPagerColumnasLista(): boolean {
    return this.totalPaginasColumnasLista > 1;
  }

  get columnasVisiblesLista(): ProtocoloField[] {
    const paginas = this.paginasColumnasLista;
    const idx = Math.min(this.paginaColumnasLista, paginas.length - 1);
    return paginas[idx] ?? [];
  }

  /** Etiqueta del pager de columnas: "Columnas 1–6 de 8". */
  rangoColumnasListaTxt(): string {
    const campos = this.camposListaOrdenados;
    const vis = this.columnasVisiblesLista;
    if (!vis.length) return '';
    const desde = campos.indexOf(vis[0]) + 1;
    const hasta = campos.indexOf(vis[vis.length - 1]) + 1;
    return `Columnas ${desde}–${hasta} de ${campos.length}`;
  }

  paginaColumnasListaAnterior(): void {
    if (this.paginaColumnasLista > 0) this.paginaColumnasLista--;
  }
  paginaColumnasListaSiguiente(): void {
    if (this.paginaColumnasLista < this.totalPaginasColumnasLista - 1) this.paginaColumnasLista++;
  }

  // ── Paginador de registros del modal (recicla el look del treetable) ──────
  listaPagina = signal(0);
  listaTamPagina = signal(5);
  readonly opcionesTamPaginaLista = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '25', value: 25 },
  ];

  /** Filas de la página actual (paginación manual, igual que el treetable). */
  valoresPaginados = computed<ProtocoloRegistro[]>(() => {
    const filas = this.valoresFiltrados();
    const size = this.listaTamPagina();
    const totalPag = Math.max(1, Math.ceil(filas.length / size));
    const page = Math.min(this.listaPagina(), totalPag - 1);
    const start = page * size;
    return filas.slice(start, start + size);
  });

  get totalPaginasFilasLista(): number {
    return Math.max(1, Math.ceil(this.valoresFiltrados().length / this.listaTamPagina()));
  }

  /** Etiqueta "Mostrando X a Y de Z valores". */
  rangoFilasListaTxt(): string {
    const total = this.valoresFiltrados().length;
    if (!total) return 'Sin valores';
    const size = this.listaTamPagina();
    const page = Math.min(this.listaPagina(), this.totalPaginasFilasLista - 1);
    const desde = page * size + 1;
    const hasta = Math.min(total, desde + size - 1);
    return `Mostrando ${desde} a ${hasta} de ${total} valores`;
  }

  cambiarPaginaFilasLista(delta: number): void {
    const next = this.listaPagina() + delta;
    if (next >= 0 && next < this.totalPaginasFilasLista) this.listaPagina.set(next);
  }
  cambiarTamPaginaLista(size: number): void {
    this.listaTamPagina.set(size);
    this.listaPagina.set(0);
  }

  /** La búsqueda resetea la paginación de filas. */
  onBuscarLista(q: string): void {
    this.busquedaLista.set(q);
    this.listaPagina.set(0);
  }

  abrirLista(listaKey: string | undefined): void {
    if (!listaKey) return;
    const lista = this.listas[listaKey];
    if (!lista) return;
    this.busquedaLista.set('');
    this.paginaColumnasLista = 0;
    this.listaPagina.set(0);
    this.listaActiva.set(lista);
  }

  cerrarLista(): void {
    this.listaActiva.set(null);
    this.busquedaLista.set('');
    this.paginaColumnasLista = 0;
    this.listaPagina.set(0);
  }

  /** Descarga el catálogo activo del modal Ver Lista en el formato indicado. */
  descargarLista(format: DownloadFormatId = 'csv'): void {
    const lista = this.listaActiva();
    if (!lista) return;
    if (format === 'csv') {
      this.descargarValoresCSV(lista);
      return;
    }
    this.toastDescargaSimulada(lista.nombre, format);
  }

  /** Descarga el protocolo (archivo plano) en el formato indicado. */
  descargarProtocolo(format: DownloadFormatId = 'txt'): void {
    this.toastDescargaSimulada('PROTOCOLO', format);
  }

  // ── Helpers de descarga reutilizables ──

  /**
   * Genera CSV con BOM UTF-8 (compatible Excel) y dispara la descarga.
   * Las columnas y su orden salen de `lista.fields` (tab_field).
   */
  private descargarValoresCSV(lista: ProtocoloLista): void {
    const cols = [...lista.fields].sort((a, b) => a.order - b.order);
    const filas = [
      cols.map(c => c.code),
      ...lista.valores.map(r => cols.map(c => r[c.code] ?? '')),
    ];
    const csv = filas
      .map(fila => fila.map(c => `"${c.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lista.nombre}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.messageService.add({
      severity: 'success',
      summary: 'Archivo descargado',
      detail: `${lista.nombre}.csv`,
      life: 3000,
    });
  }

  /** Toast informativo para formatos no implementados en cliente (XLSX/PDF/TXT). */
  private toastDescargaSimulada(nombre: string, format: DownloadFormatId): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Descarga en proceso',
      detail: `Generando ${nombre} en formato ${format.toUpperCase()}…`,
      life: 3000,
    });
  }

  private generarConceptosProtocolo(): ProtocoloRegistro[] {
    return [
      { 'Código': '1.1.05', 'Nombre': 'CAJA' },
      { 'Código': '1.1.10', 'Nombre': 'BANCOS' },
      { 'Código': '1.1.20', 'Nombre': 'INVERSIONES' },
      { 'Código': '1.4.07', 'Nombre': 'PRESTACIÓN DE SERVICIOS' },
      { 'Código': '1.4.13', 'Nombre': 'TRANSFERENCIAS POR COBRAR' },
      { 'Código': '2.4.01', 'Nombre': 'ADQUISICIÓN DE BIENES Y SERVICIOS' },
      { 'Código': '2.4.36', 'Nombre': 'RETENCIÓN EN LA FUENTE' },
      { 'Código': '3.1.05', 'Nombre': 'CAPITAL FISCAL' },
      { 'Código': '3.1.10', 'Nombre': 'RESULTADO DEL EJERCICIO' },
      { 'Código': '4.4.08', 'Nombre': 'INGRESOS FINANCIEROS' },
      { 'Código': '5.1.01', 'Nombre': 'SUELDOS Y SALARIOS' },
      { 'Código': '5.1.11', 'Nombre': 'GENERALES' },
    ];
  }

  /**
   * Caso 8 campos (dispara el paginador de columnas). Datos derivados a partir
   * de un set base de terceros para no escribir 8 valores por fila a mano.
   */
  private generarTercerosProtocolo(): ProtocoloRegistro[] {
    const base: Array<[string, string, string]> = [
      ['NIT', '830053105', 'EMPRESA DE ENERGÍA DE BOGOTÁ S.A. E.S.P.'],
      ['NIT', '899999068', 'EMPRESA DE ACUEDUCTO Y ALCANTARILLADO DE BOGOTÁ'],
      ['NIT', '860002503', 'ETB S.A. E.S.P.'],
      ['NIT', '800153993', 'COLPENSIONES'],
      ['CC', '79853012', 'GÓMEZ RAMÍREZ, ANDRÉS FELIPE'],
      ['CC', '52154879', 'TORRES MORENO, DIANA CAROLINA'],
      ['NIT', '901037916', 'AGENCIA NACIONAL DE CONTRATACIÓN PÚBLICA'],
      ['NIT', '830115226', 'POSITIVA COMPAÑÍA DE SEGUROS S.A.'],
      ['CC', '1018412339', 'RINCÓN VARGAS, JUAN SEBASTIÁN'],
      ['NIT', '800197268', 'FINDETER S.A.'],
      ['NIT', '899999063', 'INSTITUTO DE DESARROLLO URBANO — IDU'],
      ['CC', '41672901', 'CASTAÑO LÓPEZ, MARÍA FERNANDA'],
    ];
    const ciudades = ['Bogotá D.C.', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga'];
    return base.map(([tipoDoc, doc, razon], i) => ({
      'Tipo doc.': tipoDoc,
      'Documento': doc,
      'DV': String((i * 7 + 3) % 10),
      'Razón social': razon,
      'Ciudad': ciudades[i % ciudades.length],
      'Dirección': `Calle ${10 + i} # ${20 + i}-${30 + i}`,
      'Teléfono': `60(1) ${3000000 + i * 7531}`,
      'Estado': i % 6 === 0 ? 'Inactivo' : 'Activo',
    }));
  }

  /**
   * Caso con un campo de longitud grande (Descripción, field_len 180) junto a
   * campos cortos, para validar el truncado con "…" + tooltip.
   */
  private generarPlanCuentasProtocolo(): ProtocoloRegistro[] {
    return [
      { 'Código': '1.1.05.01', 'Nombre': 'CAJA PRINCIPAL', 'Naturaleza': 'Débito', 'Nivel': '4',
        'Descripción': 'Representa el efectivo en moneda nacional y extranjera disponible en la caja principal de la entidad para cubrir pagos menores y operaciones inmediatas de tesorería.' },
      { 'Código': '1.1.10.06', 'Nombre': 'CUENTA CORRIENTE BANCARIA', 'Naturaleza': 'Débito', 'Nivel': '4',
        'Descripción': 'Comprende los depósitos constituidos por la entidad en cuentas corrientes de establecimientos bancarios y demás entidades financieras vigiladas por la Superintendencia Financiera de Colombia.' },
      { 'Código': '1.4.07.01', 'Nombre': 'PRESTACIÓN DE SERVICIOS', 'Naturaleza': 'Débito', 'Nivel': '4',
        'Descripción': 'Valor de los derechos a favor de la entidad originados en la prestación de servicios, pendientes de recaudo al cierre del período contable que se reporta.' },
      { 'Código': '2.4.01.01', 'Nombre': 'BIENES Y SERVICIOS', 'Naturaleza': 'Crédito', 'Nivel': '4',
        'Descripción': 'Obligaciones contraídas por la entidad por concepto de adquisición de bienes y servicios pendientes de pago a proveedores y contratistas al corte del período.' },
      { 'Código': '3.1.10.01', 'Nombre': 'RESULTADO DEL EJERCICIO', 'Naturaleza': 'Crédito', 'Nivel': '4',
        'Descripción': 'Corresponde al valor del excedente o déficit obtenido por la entidad como resultado de la diferencia entre los ingresos y los gastos del período contable.' },
      { 'Código': '5.1.01.01', 'Nombre': 'SUELDOS Y SALARIOS', 'Naturaleza': 'Débito', 'Nivel': '4',
        'Descripción': 'Gastos asociados a la remuneración del personal vinculado mediante relación laboral, incluyendo asignación básica y demás factores salariales reconocidos.' },
    ];
  }

  private generarEntidadesReciprocasProtocolo(): ProtocoloRegistro[] {
    const base: Array<{ codigo: string; nombre: string }> = [
      { codigo: '102000000', nombre: 'CONTRALORÍA GENERAL DE LA REPÚBLICA' },
      { codigo: '104500000', nombre: 'DEPARTAMENTO ADMINISTRATIVO NACIONAL DE ESTADÍSTICA' },
      { codigo: '105000000', nombre: 'DEPARTAMENTO NACIONAL DE PLANEACIÓN' },
      { codigo: '106000000', nombre: 'DEPARTAMENTO ADMINISTRATIVO DE LA PRESIDENCIA DE LA REPÚBLICA' },
      { codigo: '106500000', nombre: 'DEPARTAMENTO ADMINISTRATIVO DE LA FUNCIÓN PÚBLICA' },
      { codigo: '110000000', nombre: 'MINISTERIO DE AGRICULTURA Y DESARROLLO RURAL' },
      { codigo: '110500000', nombre: 'MINISTERIO DE TECNOLOGÍAS DE LA INFORMACIÓN Y LAS COMUNICACIONES' },
      { codigo: '111000000', nombre: 'MINISTERIO DE DEFENSA NACIONAL' },
      { codigo: '111500000', nombre: 'GOBERNACIÓN DE ANTIOQUIA' },
      { codigo: '111600000', nombre: 'GOBERNACIÓN DEL ATLÁNTICO' },
      { codigo: '111700000', nombre: 'GOBERNACIÓN DE BOLÍVAR' },
      { codigo: '111800000', nombre: 'GOBERNACIÓN DE BOYACÁ' },
      { codigo: '111900000', nombre: 'GOBERNACIÓN DE CALDAS' },
      { codigo: '112000000', nombre: 'GOBERNACIÓN DEL CAQUETÁ' },
      { codigo: '112100000', nombre: 'GOBERNACIÓN DEL CAUCA' },
      { codigo: '112200000', nombre: 'GOBERNACIÓN DEL CESAR' },
      { codigo: '112300000', nombre: 'GOBERNACIÓN DE CÓRDOBA' },
      { codigo: '112400000', nombre: 'GOBERNACIÓN DE CUNDINAMARCA' },
      { codigo: '112500000', nombre: 'GOBERNACIÓN DEL CHOCÓ' },
      { codigo: '112600000', nombre: 'GOBERNACIÓN DEL HUILA' },
      { codigo: '112700000', nombre: 'GOBERNACIÓN DE LA GUAJIRA' },
      { codigo: '112800000', nombre: 'GOBERNACIÓN DEL MAGDALENA' },
      { codigo: '112900000', nombre: 'GOBERNACIÓN DEL META' },
      { codigo: '113000000', nombre: 'GOBERNACIÓN DE NARIÑO' },
      { codigo: '113100000', nombre: 'GOBERNACIÓN DE NORTE DE SANTANDER' },
      { codigo: '113200000', nombre: 'GOBERNACIÓN DEL PUTUMAYO' },
      { codigo: '113300000', nombre: 'GOBERNACIÓN DEL QUINDÍO' },
      { codigo: '113400000', nombre: 'GOBERNACIÓN DE RISARALDA' },
      { codigo: '113500000', nombre: 'GOBERNACIÓN DE SANTANDER' },
      { codigo: '113600000', nombre: 'GOBERNACIÓN DE SUCRE' },
      { codigo: '113700000', nombre: 'GOBERNACIÓN DEL TOLIMA' },
      { codigo: '113800000', nombre: 'GOBERNACIÓN DEL VALLE DEL CAUCA' },
      { codigo: '113900000', nombre: 'GOBERNACIÓN DEL VAUPÉS' },
      { codigo: '114000000', nombre: 'GOBERNACIÓN DEL VICHADA' },
      { codigo: '114100000', nombre: 'ALCALDÍA MAYOR DE BOGOTÁ' },
      { codigo: '114200000', nombre: 'ALCALDÍA DE MEDELLÍN' },
      { codigo: '114300000', nombre: 'ALCALDÍA DE CALI' },
      { codigo: '114400000', nombre: 'ALCALDÍA DE BARRANQUILLA' },
      { codigo: '114500000', nombre: 'ALCALDÍA DE CARTAGENA' },
      { codigo: '114600000', nombre: 'ALCALDÍA DE BUCARAMANGA' },
    ];
    // Enriquecemos cada entidad con los 6 campos de la lista (NIT, Tipo,
    // Departamento, Estado) derivados de forma determinística sobre el set base.
    const deptos = [
      'Bogotá D.C.', 'Antioquia', 'Atlántico', 'Bolívar', 'Boyacá', 'Caldas',
      'Cundinamarca', 'Santander', 'Valle del Cauca', 'Nariño', 'Tolima',
    ];
    return base.map(({ codigo, nombre }, i) => {
      const territorial = nombre.startsWith('GOBERNACIÓN') || nombre.startsWith('ALCALDÍA');
      return {
        'Código': codigo,
        'NIT': `${codigo.slice(0, 9)}-${(i % 9) + 1}`,
        'Razón social': nombre,
        'Tipo': territorial ? 'Territorial' : 'Nacional',
        'Departamento': deptos[i % deptos.length],
        'Estado': i % 7 === 0 ? 'Inactiva' : 'Activa',
      };
    });
  }
}
