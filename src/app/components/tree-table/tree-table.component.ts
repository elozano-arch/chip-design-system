import { Component, Input, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Menu, MenuModule } from 'primeng/menu';
import { MenuItem, MessageService } from 'primeng/api';

export type TipoColumna = 'numero' | 'texto' | 'seleccion';
export type Severidad = 'success' | 'warn' | 'danger' | 'info' | 'secondary';

export interface ColumnaConfig {
  key: string;
  label: string;
  editable: boolean;
  tipo: TipoColumna;
  ancho?: string;
  alineacion?: 'right' | 'center' | 'left';
  opciones?: string[];
  fija?: boolean;
}

export interface NodoArbol {
  id: string;
  codigo: string;
  nombre: string;
  nivel: number;
  hijos: NodoArbol[];
  valores: Record<string, string | number>;
}

interface CambioPendiente {
  nodoId: string;
  campo: string;
  valorAnterior: string | number;
  valorNuevo: string | number;
  nombreNodo: string;
  labelCampo: string;
}

interface RutaNodo {
  id: string;
  codigo: string;
  nombre: string;
}

const TAMANOS_PAGINA = [5, 10, 25, 50] as const;
const COLUMNAS_VISIBLES = 4;

/**
 * Tree-table estándar del CHIP, reutilizable y config-driven.
 *
 * Encapsula el comportamiento acordado con el equipo (expansión de una sola rama,
 * paginador por nodo, paginación horizontal de columnas, edición inline + sticky bar,
 * búsqueda global, menú contextual por fila y selector de columnas). Cada feature se
 * activa con un flag, lo que permite las distintas variantes del Design System a partir
 * de una sola base.
 *
 * El consumidor debe proveer `MessageService` y renderizar un `<p-toast />` propio
 * (se comparte entre todas las instancias de la página).
 */
@Component({
  selector: 'app-tree-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    ToggleSwitchModule,
    TagModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    MenuModule,
  ],
  templateUrl: './tree-table.component.html',
  styleUrl: './tree-table.component.scss',
})
export class TreeTableComponent implements OnInit {
  /** Id único por instancia (evita colisión de IDs en el DOM con varias tablas). */
  private static seq = 0;
  readonly uid = `ttc-${++TreeTableComponent.seq}`;

  /* ─────────── Datos ─────────── */
  @Input({ required: true }) set nodos(v: NodoArbol[]) {
    this.arbol.set(structuredClone(v));
  }

  @Input() columnasFijas: ColumnaConfig[] = [
    { key: 'codigo', label: 'Código', editable: false, tipo: 'texto', ancho: '180px', fija: true },
    { key: 'nombre', label: 'Concepto', editable: false, tipo: 'texto', ancho: '220px', fija: true },
  ];

  @Input() columnasVariables: ColumnaConfig[] = [];

  /* ─────────── Flags de configuración (definen la variante) ─────────── */
  /** Habilita edición inline + barra sticky de cambios pendientes. */
  @Input() editable = false;
  /** Muestra la barra de búsqueda global del árbol. */
  @Input() searchable = true;
  /** Muestra el paginador interno por nodo padre. */
  @Input() pageable = true;
  /** Muestra el paginador horizontal de columnas variables (4 a la vez). */
  @Input() columnPager = false;
  /** Añade la columna "Acciones" con menú contextual por fila. */
  @Input() rowMenu = false;
  /** Muestra el selector de columnas variables visibles (column toggle). */
  @Input() columnToggle = false;
  /** Comportamiento inicial de expansión (una sola rama abierta). */
  @Input() unaRamaInicial = true;
  /** Permite al usuario alternar el modo de expansión desde la toolbar. */
  @Input() permitirCambioModo = true;
  /** Texto del destino al guardar (sticky bar). */
  @Input() destinoGuardado = 'CHIP local';

  readonly opcionesTamanoPagina = TAMANOS_PAGINA.map(n => ({ label: `${n}`, value: n }));

  /* ─────────── Estado de la tabla ─────────── */
  arbol = signal<NodoArbol[]>([]);

  modoUnaRama = signal(true);
  nodosExpandidos = signal<Set<string>>(new Set());
  nodoActivoId = signal<string | null>(null);

  paginasNodo = signal<Record<string, number>>({});
  tamanosPaginaNodo = signal<Record<string, number>>({});

  paginaColumnas = signal(0);

  /* Selector de columnas (column toggle): keys visibles */
  columnasVisiblesKeys = signal<string[]>([]);

  busqueda = signal('');

  edicionActiva = signal<{ nodoId: string; campo: string } | null>(null);
  valorEditando = signal<string | number>('');
  cambiosPendientes = signal<CambioPendiente[]>([]);

  /* Menú contextual por fila (compartido) */
  menuModel = signal<MenuItem[]>([]);
  @ViewChild('rowMenuRef') rowMenuRef?: Menu;

  private readonly message = inject(MessageService);

  ngOnInit(): void {
    this.modoUnaRama.set(this.unaRamaInicial);
    this.columnasVisiblesKeys.set(this.columnasVariables.map(c => c.key));
  }

  /* ═════════════ Columnas (toggle + paginación) ═════════════ */
  opcionesColumnas = computed(() =>
    this.columnasVariables.map(c => ({ label: c.label, value: c.key })),
  );

  columnasVariablesActivas = computed<ColumnaConfig[]>(() => {
    const keys = new Set(this.columnasVisiblesKeys());
    const activas = this.columnasVariables.filter(c => keys.has(c.key));
    return activas.length > 0 ? activas : this.columnasVariables;
  });

  totalPaginasColumnas = computed(() =>
    Math.max(1, Math.ceil(this.columnasVariablesActivas().length / COLUMNAS_VISIBLES)),
  );

  columnasMostradas = computed<ColumnaConfig[]>(() => {
    const activas = this.columnasVariablesActivas();
    if (!this.columnPager) return activas;
    const inicio = this.paginaColumnas() * COLUMNAS_VISIBLES;
    return activas.slice(inicio, inicio + COLUMNAS_VISIBLES);
  });

  rangoColumnasTxt = computed(() => {
    const total = this.columnasVariablesActivas().length;
    const inicio = this.paginaColumnas() * COLUMNAS_VISIBLES + 1;
    const fin = Math.min(inicio + COLUMNAS_VISIBLES - 1, total);
    return `${inicio}-${fin} de ${total} columnas variables`;
  });

  /** colspan total (fijas + variables mostradas + acciones). */
  colspanTotal = computed(() =>
    this.columnasFijas.length + this.columnasMostradas().length + (this.rowMenu ? 1 : 0),
  );

  cambiarColumnasVisibles(keys: string[]): void {
    this.columnasVisiblesKeys.set(keys);
    this.paginaColumnas.set(0);
  }

  /* ═════════════ Búsqueda ═════════════ */
  arbolFiltrado = computed<NodoArbol[]>(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) return this.arbol();
    return this.filtrarArbol(this.arbol(), q);
  });

  limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  private filtrarArbol(nodos: NodoArbol[], q: string): NodoArbol[] {
    const resultado: NodoArbol[] = [];
    for (const nodo of nodos) {
      const coincide = nodo.codigo.toLowerCase().includes(q) ||
                       nodo.nombre.toLowerCase().includes(q);
      const hijosFiltrados = this.filtrarArbol(nodo.hijos, q);
      if (coincide || hijosFiltrados.length > 0) {
        resultado.push({ ...nodo, hijos: hijosFiltrados });
      }
    }
    return resultado;
  }

  /* ═════════════ Expansión de nodos ═════════════ */
  toggleNodo(nodo: NodoArbol): void {
    if (nodo.hijos.length === 0) return;
    const set = new Set(this.nodosExpandidos());

    if (set.has(nodo.id)) {
      this.cerrarRamaCompleta(set, nodo);
      if (this.nodoActivoId() === nodo.id) {
        this.nodoActivoId.set(null);
      }
    } else {
      if (this.modoUnaRama()) {
        this.cerrarHermanos(set, nodo);
      }
      set.add(nodo.id);
      this.nodoActivoId.set(nodo.id);
    }
    this.nodosExpandidos.set(set);
  }

  private cerrarRamaCompleta(set: Set<string>, nodo: NodoArbol): void {
    set.delete(nodo.id);
    for (const h of nodo.hijos) this.cerrarRamaCompleta(set, h);
  }

  private cerrarHermanos(set: Set<string>, nodo: NodoArbol): void {
    const padre = this.buscarPadre(this.arbol(), nodo.id, null);
    const hermanos = padre ? padre.hijos : this.arbol();
    for (const h of hermanos) {
      if (h.id !== nodo.id) this.cerrarRamaCompleta(set, h);
    }
  }

  private buscarPadre(nodos: NodoArbol[], idHijo: string, padre: NodoArbol | null): NodoArbol | null {
    for (const n of nodos) {
      if (n.id === idHijo) return padre;
      const encontrado = this.buscarPadre(n.hijos, idHijo, n);
      if (encontrado !== null) return encontrado;
    }
    return null;
  }

  estaExpandido(nodo: NodoArbol): boolean {
    return this.nodosExpandidos().has(nodo.id);
  }

  esNodoActivo(nodo: NodoArbol): boolean {
    return this.nodoActivoId() === nodo.id;
  }

  cambiarModoExpansion(): void {
    if (this.modoUnaRama()) {
      this.message.add({
        severity: 'info',
        summary: 'Una sola rama abierta',
        detail: 'Al abrir una nueva rama se cerrarán las demás al mismo nivel.',
        life: 3000,
      });
      const activa = this.nodoActivoId();
      const set = new Set<string>();
      if (activa) set.add(activa);
      this.nodosExpandidos.set(set);
    } else {
      this.message.add({
        severity: 'info',
        summary: 'Múltiples ramas abiertas',
        detail: 'Podrás expandir varias ramas a la vez (puede generar scroll largo).',
        life: 3000,
      });
    }
  }

  /* ═════════════ Paginación interna por nodo ═════════════ */
  paginaActualNodo(nodo: NodoArbol): number {
    return this.paginasNodo()[nodo.id] ?? 0;
  }

  tamanoPaginaNodo(nodo: NodoArbol): number {
    return this.tamanosPaginaNodo()[nodo.id] ?? 10;
  }

  filasVisiblesNodo(nodo: NodoArbol): NodoArbol[] {
    if (!this.pageable) return nodo.hijos;
    const tamano = this.tamanoPaginaNodo(nodo);
    const pagina = this.paginaActualNodo(nodo);
    return nodo.hijos.slice(pagina * tamano, (pagina + 1) * tamano);
  }

  totalPaginasNodo(nodo: NodoArbol): number {
    return Math.max(1, Math.ceil(nodo.hijos.length / this.tamanoPaginaNodo(nodo)));
  }

  cambiarPaginaNodo(nodo: NodoArbol, delta: number): void {
    const actual = this.paginaActualNodo(nodo);
    const nueva = Math.max(0, Math.min(this.totalPaginasNodo(nodo) - 1, actual + delta));
    this.paginasNodo.update(m => ({ ...m, [nodo.id]: nueva }));
  }

  cambiarTamanoPaginaNodo(nodo: NodoArbol, tamano: number): void {
    this.tamanosPaginaNodo.update(m => ({ ...m, [nodo.id]: tamano }));
    this.paginasNodo.update(m => ({ ...m, [nodo.id]: 0 }));
  }

  /** El nodo padre necesita paginador propio si tiene más hijos que el tamaño de página. */
  necesitaPaginador(nodo: NodoArbol): boolean {
    return this.pageable && nodo.hijos.length > this.tamanoPaginaNodo(nodo);
  }

  rangoRegistrosNodo(nodo: NodoArbol): string {
    const total = nodo.hijos.length;
    if (total === 0) return 'Sin registros';
    const tamano = this.tamanoPaginaNodo(nodo);
    const pagina = this.paginaActualNodo(nodo);
    const inicio = pagina * tamano + 1;
    const fin = Math.min(inicio + tamano - 1, total);
    return `Mostrando ${inicio} a ${fin} de ${total} registros`;
  }

  /* ═════════════ Paginación horizontal de columnas ═════════════ */
  cambiarPaginaColumnas(delta: number): void {
    const nueva = Math.max(0, Math.min(this.totalPaginasColumnas() - 1, this.paginaColumnas() + delta));
    this.paginaColumnas.set(nueva);
  }

  /* ═════════════ Edición inline ═════════════ */
  iniciarEdicion(nodo: NodoArbol, col: ColumnaConfig): void {
    if (!this.editable || !col.editable) return;
    this.edicionActiva.set({ nodoId: nodo.id, campo: col.key });
    this.valorEditando.set(nodo.valores[col.key] ?? '');
  }

  esEditableCelda(col: ColumnaConfig): boolean {
    return this.editable && col.editable;
  }

  estaEditando(nodo: NodoArbol, col: ColumnaConfig): boolean {
    const e = this.edicionActiva();
    return !!e && e.nodoId === nodo.id && e.campo === col.key;
  }

  confirmarEdicion(nodo: NodoArbol, col: ColumnaConfig): void {
    const valorAnterior = nodo.valores[col.key];
    const valorNuevo = this.valorEditando();
    if (valorAnterior === valorNuevo || valorNuevo === '' || valorNuevo === null) {
      this.cancelarEdicion();
      return;
    }
    this.arbol.update(arb => this.actualizarValor(arb, nodo.id, col.key, valorNuevo));

    this.cambiosPendientes.update(arr => {
      const otros = arr.filter(c => !(c.nodoId === nodo.id && c.campo === col.key));
      return [...otros, {
        nodoId: nodo.id,
        campo: col.key,
        valorAnterior,
        valorNuevo,
        nombreNodo: `${nodo.codigo} · ${nodo.nombre}`,
        labelCampo: col.label,
      }];
    });
    this.cancelarEdicion();
  }

  cancelarEdicion(): void {
    this.edicionActiva.set(null);
    this.valorEditando.set('');
  }

  private actualizarValor(nodos: NodoArbol[], id: string, campo: string, valor: string | number): NodoArbol[] {
    return nodos.map(n => {
      if (n.id === id) {
        return { ...n, valores: { ...n.valores, [campo]: valor } };
      }
      if (n.hijos.length > 0) {
        return { ...n, hijos: this.actualizarValor(n.hijos, id, campo, valor) };
      }
      return n;
    });
  }

  guardarCambios(): void {
    const total = this.cambiosPendientes().length;
    if (total === 0) return;
    this.cambiosPendientes.set([]);
    this.message.add({
      severity: 'success',
      summary: 'Cambios guardados',
      detail: `${total} ${total === 1 ? 'cambio enviado' : 'cambios enviados'} al ${this.destinoGuardado}.`,
      life: 3500,
    });
  }

  descartarCambios(): void {
    const total = this.cambiosPendientes().length;
    if (total === 0) return;
    this.arbol.update(arb => {
      let actualizado = arb;
      for (const c of this.cambiosPendientes()) {
        actualizado = this.actualizarValor(actualizado, c.nodoId, c.campo, c.valorAnterior);
      }
      return actualizado;
    });
    this.cambiosPendientes.set([]);
    this.message.add({
      severity: 'info',
      summary: 'Cambios descartados',
      detail: `Se revirtieron ${total} ${total === 1 ? 'cambio' : 'cambios'} pendientes.`,
      life: 3000,
    });
  }

  hayCambioEn(nodoId: string, campo: string): boolean {
    return this.cambiosPendientes().some(c => c.nodoId === nodoId && c.campo === campo);
  }

  /* ═════════════ Menú contextual por fila ═════════════ */
  onRowMenu(nodo: NodoArbol, event: Event): void {
    this.abrirMenuFila(nodo);
    this.rowMenuRef?.toggle(event);
  }

  private abrirMenuFila(nodo: NodoArbol): void {
    this.menuModel.set([
      {
        label: 'Ver detalle',
        icon: 'pi pi-eye',
        command: () => this.accionFila('Ver detalle', nodo),
      },
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => this.accionFila('Editar', nodo),
      },
      {
        label: 'Duplicar',
        icon: 'pi pi-copy',
        command: () => this.accionFila('Duplicar', nodo),
      },
      { separator: true },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        command: () => this.accionFila('Eliminar', nodo),
      },
    ]);
  }

  private accionFila(accion: string, nodo: NodoArbol): void {
    this.message.add({
      severity: accion === 'Eliminar' ? 'warn' : 'info',
      summary: accion,
      detail: `${accion} sobre ${nodo.codigo} · ${nodo.nombre}.`,
      life: 2800,
    });
  }

  /* ═════════════ Ruta (miga de pan del árbol) ═════════════ */
  rutaActiva = computed<RutaNodo[]>(() => {
    const id = this.nodoActivoId();
    if (!id) return [];
    return this.buscarRuta(this.arbol(), id, []) ?? [];
  });

  private buscarRuta(nodos: NodoArbol[], id: string, padres: RutaNodo[]): RutaNodo[] | null {
    for (const n of nodos) {
      const conN = [...padres, { id: n.id, codigo: n.codigo, nombre: n.nombre }];
      if (n.id === id) return conN;
      const r = this.buscarRuta(n.hijos, id, conN);
      if (r) return r;
    }
    return null;
  }

  irANodo(idNodo: string): void {
    this.nodoActivoId.set(idNodo);
  }

  /* ═════════════ Helpers de presentación ═════════════ */
  formatearValor(valor: string | number | undefined, col: ColumnaConfig): string {
    if (valor === undefined || valor === null || valor === '') return '—';
    if (col.tipo === 'numero' && typeof valor === 'number') {
      return valor.toLocaleString('es-CO');
    }
    return String(valor);
  }

  severidadValor(valor: string | number | undefined, col: ColumnaConfig): Severidad {
    if (col.key === 'estado') {
      if (valor === 'Activo') return 'success';
      if (valor === 'Inactivo') return 'secondary';
      if (valor === 'Pendiente') return 'warn';
    }
    if (col.key === 'clasificacion' || col.key === 'prioridad') {
      if (valor === 'Alta') return 'danger';
      if (valor === 'Media') return 'warn';
      if (valor === 'Baja') return 'info';
    }
    if (col.key === 'riesgoAlerta') {
      if (valor === 'Sí') return 'danger';
      if (valor === 'No') return 'success';
    }
    return 'secondary';
  }

  esColumnaConTag(col: ColumnaConfig): boolean {
    return col.tipo === 'seleccion';
  }
}
