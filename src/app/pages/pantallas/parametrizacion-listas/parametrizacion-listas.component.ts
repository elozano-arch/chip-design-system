import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { Menu, MenuModule } from 'primeng/menu';
import { MenuItem, MessageService } from 'primeng/api';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';

/* ════════════════ Modelo de dominio ════════════════ */

/** Uno de los 6 grupos de tablas (group_code). */
export interface GrupoTablas {
  id: string;
  codigo: string; // group_code
  nombre: string;
  icon: string;
  descripcion: string;
  totalTablas: number; // conteo real declarado
}

/** Una tabla paramétrica dentro de un grupo (registro de la tabla `tab`). */
export interface TablaParametrica {
  id: string;
  grupoId: string;
  tabCode: string;
  nombre: string; // tab_name
  descripcion: string;
  jerarquica: boolean; // tab_type
  /** Nombre de cada nivel jerárquico. La longitud = profundidad máxima (fija). */
  niveles: string[];
  activa: boolean;
  arbol: NodoLista[];
}

export type EstadoNodo = 'activo' | 'inactivo';

/** Un nodo del árbol de una tabla. */
export interface NodoLista {
  id: string;
  code: string;
  nivel: number; // 1-based; nivel === niveles.length ⇒ nodo final
  valor: string;
  estado: EstadoNodo;
  hijos: NodoLista[];
}

/** Fila aplanada para render con indentación (evita recursión en el template). */
interface FilaVisible {
  nodo: NodoLista;
  profundidad: number;
  expandido: boolean;
  tieneHijos: boolean;
  esFinal: boolean;
}

type Vista = 'grupos' | 'tablas' | 'arbol';
type FiltroEstado = 'todos' | 'activos' | 'inactivos';

@Component({
  selector: 'app-parametrizacion-listas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    DialogModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    BreadcrumbModule,
    SelectButtonModule,
    ToastModule,
    MenuModule,
    AppBreadcrumbComponent,
  ],
  providers: [MessageService],
  templateUrl: './parametrizacion-listas.component.html',
  styleUrl: './parametrizacion-listas.component.scss',
})
export class ParametrizacionListasComponent {
  private readonly message = inject(MessageService);
  private seqNodo = 1000;

  /* ───────────── Navegación entre vistas ───────────── */
  vista = signal<Vista>('grupos');
  grupoActivo = signal<GrupoTablas | null>(null);
  tablaActiva = signal<TablaParametrica | null>(null);

  /* ───────────── Estado del árbol ───────────── */
  arbol = signal<NodoLista[]>([]);
  expandidos = signal<Set<string>>(new Set());
  nodoSeleccionadoId = signal<string | null>(null);

  /* ───────────── Búsquedas / filtros ───────────── */
  busquedaTablas = signal('');
  busquedaNodos = signal('');
  filtroEstado = signal<FiltroEstado>('todos');

  readonly opcionesFiltroEstado = [
    { label: 'Todos', value: 'todos' as FiltroEstado },
    { label: 'Activos', value: 'activos' as FiltroEstado },
    { label: 'Inactivos', value: 'inactivos' as FiltroEstado },
  ];

  /* ───────────── Diálogo agregar/editar nodo ───────────── */
  dialogoNodoVisible = signal(false);
  dialogoModo = signal<'agregar' | 'editar'>('agregar');
  nodoPadre = signal<NodoLista | null>(null); // null = nodo raíz
  nodoEnEdicion = signal<NodoLista | null>(null);
  valorNodo = signal('');
  valorTocado = signal(false);
  codeNodo = signal('');

  /* ───────────── Menú de acciones de la tabla ("…") ───────────── */
  @ViewChild('menuTabla') menuTabla?: Menu;

  /* ───────────── Diálogo editar datos de la tabla ───────────── */
  dialogoTablaVisible = signal(false);
  editTablaNombre = signal('');
  editTablaDesc = signal('');
  editTablaNombreTocado = signal(false);

  get dialogoTablaVisibleProxy(): boolean { return this.dialogoTablaVisible(); }
  set dialogoTablaVisibleProxy(v: boolean) { this.dialogoTablaVisible.set(v); }

  /* ───────────── Diálogo eliminar ───────────── */
  dialogoEliminarVisible = signal(false);
  nodoAEliminar = signal<NodoLista | null>(null);

  /* Proxies para [(visible)] de p-dialog (no liga directo a signals). */
  get dialogoNodoVisibleProxy(): boolean { return this.dialogoNodoVisible(); }
  set dialogoNodoVisibleProxy(v: boolean) { this.dialogoNodoVisible.set(v); }
  get dialogoEliminarVisibleProxy(): boolean { return this.dialogoEliminarVisible(); }
  set dialogoEliminarVisibleProxy(v: boolean) { this.dialogoEliminarVisible.set(v); }

  /* ───────────── Datos mock ───────────── */
  readonly grupos: GrupoTablas[] = [
    { id: 'identificacion', codigo: 'IDENTIFICACION', nombre: 'Identificación', icon: 'pi pi-id-card', descripcion: 'Tablas fijas de entidades: reportes, CUIN, documentos, muestras y naturaleza.', totalTablas: 7 },
    { id: 'generales', codigo: 'GENERALES', nombre: 'Generales', icon: 'pi pi-globe', descripcion: 'Listas generales transversales usadas por múltiples módulos del sistema.', totalTablas: 456 },
    { id: 'gestion', codigo: 'GESTION', nombre: 'Gestión', icon: 'pi pi-briefcase', descripcion: 'Tablas de gestión y operación de los procesos del sistema.', totalTablas: 6 },
    { id: 'normalizacion', codigo: 'NORMALIZACION', nombre: 'Normalización', icon: 'pi pi-sliders-h', descripcion: 'Tablas fijas de categorías para la normalización de la información.', totalTablas: 3 },
    { id: 'sistema', codigo: 'SISTEMA', nombre: 'Sistema', icon: 'pi pi-cog', descripcion: 'Tablas del sistema: configuraciones y parámetros internos de la plataforma.', totalTablas: 2 },
    { id: 'detalle', codigo: 'DETALLE', nombre: 'Detalle', icon: 'pi pi-list', descripcion: 'Tabla de detalle del sistema.', totalTablas: 1 },
  ];

  readonly tablas: TablaParametrica[] = this.crearTablas();

  /* ═══════════════ Computados: listado de tablas ═══════════════ */
  tablasDelGrupo = computed<TablaParametrica[]>(() => {
    const grupo = this.grupoActivo();
    if (!grupo) return [];
    const q = this.busquedaTablas().trim().toLowerCase();
    return this.tablas
      .filter(t => t.grupoId === grupo.id)
      .filter(t => !q || t.nombre.toLowerCase().includes(q) || t.tabCode.toLowerCase().includes(q));
  });

  totalParametros(tabla: TablaParametrica): number {
    return this.contar(tabla.arbol, () => true);
  }

  /* ═══════════════ Computados: estadísticas de la tabla ═══════════════ */
  maxNivel = computed<number>(() => this.tablaActiva()?.niveles.length ?? 1);

  nodosTotales = computed(() => this.contar(this.arbol(), () => true));
  nodosActivos = computed(() => this.contar(this.arbol(), n => n.estado === 'activo'));
  nodosRaiz = computed(() => this.arbol().length);
  nodosFinales = computed(() => this.contar(this.arbol(), n => n.nivel >= this.maxNivel()));

  /* ═══════════════ Árbol filtrado + aplanado ═══════════════ */
  private hayFiltro = computed(() =>
    this.busquedaNodos().trim().length > 0 || this.filtroEstado() !== 'todos',
  );

  private arbolFiltrado = computed<NodoLista[]>(() => {
    const q = this.busquedaNodos().trim().toLowerCase();
    const estado = this.filtroEstado();
    if (!q && estado === 'todos') return this.arbol();

    const coincide = (n: NodoLista): boolean => {
      const okTexto = !q || n.valor.toLowerCase().includes(q) || n.code.toLowerCase().includes(q);
      const okEstado = estado === 'todos' ||
        (estado === 'activos' && n.estado === 'activo') ||
        (estado === 'inactivos' && n.estado === 'inactivo');
      return okTexto && okEstado;
    };
    const filtrar = (nodos: NodoLista[]): NodoLista[] => {
      const res: NodoLista[] = [];
      for (const n of nodos) {
        const hijos = filtrar(n.hijos);
        if (coincide(n) || hijos.length > 0) res.push({ ...n, hijos });
      }
      return res;
    };
    return filtrar(this.arbol());
  });

  filasVisibles = computed<FilaVisible[]>(() => {
    const tabla = this.tablaActiva();
    if (!tabla) return [];
    const maxNivel = tabla.niveles.length;
    const expandirTodo = this.hayFiltro();
    const expandidos = this.expandidos();
    const filas: FilaVisible[] = [];

    const recorrer = (nodos: NodoLista[], profundidad: number) => {
      for (const nodo of nodos) {
        const tieneHijos = nodo.hijos.length > 0;
        const expandido = expandirTodo || expandidos.has(nodo.id);
        filas.push({ nodo, profundidad, expandido, tieneHijos, esFinal: nodo.nivel >= maxNivel });
        if (tieneHijos && expandido) recorrer(nodo.hijos, profundidad + 1);
      }
    };
    recorrer(this.arbolFiltrado(), 0);
    return filas;
  });

  /* ═══════════════ Nodo seleccionado (panel de detalle) ═══════════════ */
  nodoSeleccionado = computed<NodoLista | null>(() => {
    const id = this.nodoSeleccionadoId();
    if (!id) return null;
    return this.buscarNodo(this.arbol(), id);
  });

  detalleTipo = computed<string>(() => {
    const n = this.nodoSeleccionado();
    if (!n) return '';
    if (n.nivel === 1) return 'Nodo raíz';
    if (n.nivel >= this.maxNivel()) return 'Nodo final';
    return 'Nodo intermedio';
  });

  detalleHijosDirectos = computed(() => this.nodoSeleccionado()?.hijos.length ?? 0);
  detalleDescTotales = computed(() => {
    const n = this.nodoSeleccionado();
    return n ? this.contar(n.hijos, () => true) : 0;
  });
  detalleOrden = computed(() => {
    const n = this.nodoSeleccionado();
    if (!n) return 0;
    const hermanos = this.hermanosDe(this.arbol(), n.id) ?? this.arbol();
    return hermanos.findIndex(h => h.id === n.id) + 1;
  });
  detalleRuta = computed<string[]>(() => {
    const n = this.nodoSeleccionado();
    if (!n) return [];
    return this.rutaDe(this.arbol(), n.id, []).map(x => x.valor);
  });
  detalleEsFinal = computed(() => {
    const n = this.nodoSeleccionado();
    return n ? n.nivel >= this.maxNivel() : false;
  });

  /* ───────────── Breadcrumb dinámico ───────────── */
  readonly breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/' };
  breadcrumbModel = computed<MenuItem[]>(() => {
    const items: MenuItem[] = [
      { label: 'Parametrización de listas', command: () => this.volverAGrupos() },
    ];
    const grupo = this.grupoActivo();
    if (grupo) items.push({ label: grupo.nombre, command: () => this.volverATablas() });
    const tabla = this.tablaActiva();
    if (tabla && this.vista() === 'arbol') items.push({ label: tabla.nombre });
    return items;
  });

  /* ═══════════════ Navegación ═══════════════ */
  seleccionarGrupo(grupo: GrupoTablas): void {
    this.grupoActivo.set(grupo);
    this.busquedaTablas.set('');
    this.vista.set('tablas');
  }

  volverAGrupos(): void {
    this.vista.set('grupos');
    this.grupoActivo.set(null);
    this.tablaActiva.set(null);
  }

  gestionarTabla(tabla: TablaParametrica): void {
    this.tablaActiva.set(tabla);
    this.arbol.set(structuredClone(tabla.arbol));
    this.expandidos.set(new Set(tabla.arbol.map(n => n.id)));
    this.nodoSeleccionadoId.set(null);
    this.busquedaNodos.set('');
    this.filtroEstado.set('todos');
    this.vista.set('arbol');
  }

  volverATablas(): void {
    this.vista.set('tablas');
    this.tablaActiva.set(null);
  }

  /* ═══════════════ Árbol: expansión / selección ═══════════════ */
  toggleNodo(nodo: NodoLista, event?: Event): void {
    event?.stopPropagation();
    if (nodo.hijos.length === 0) return;
    const set = new Set(this.expandidos());
    set.has(nodo.id) ? set.delete(nodo.id) : set.add(nodo.id);
    this.expandidos.set(set);
  }

  seleccionarNodo(nodo: NodoLista): void {
    this.nodoSeleccionadoId.set(nodo.id);
  }

  esNodoSeleccionado(nodo: NodoLista): boolean {
    return this.nodoSeleccionadoId() === nodo.id;
  }

  expandirTodo(): void {
    const ids = new Set<string>();
    const walk = (nodos: NodoLista[]) => nodos.forEach(n => { if (n.hijos.length) { ids.add(n.id); walk(n.hijos); } });
    walk(this.arbol());
    this.expandidos.set(ids);
  }

  colapsarTodo(): void {
    this.expandidos.set(new Set());
  }

  nombreNivel(nivel: number): string {
    return this.tablaActiva()?.niveles[nivel - 1] ?? `Nivel ${nivel}`;
  }

  limpiarBusquedaNodos(): void {
    this.busquedaNodos.set('');
    this.filtroEstado.set('todos');
  }

  /* ═══════════════ Árbol: agregar / editar ═══════════════ */
  abrirAgregarRaiz(): void {
    this.abrirDialogo('agregar', null, null);
  }

  abrirAgregarHijo(nodo: NodoLista, event?: Event): void {
    event?.stopPropagation();
    this.abrirDialogo('agregar', nodo, null);
  }

  abrirEditar(nodo: NodoLista, event?: Event): void {
    event?.stopPropagation();
    this.abrirDialogo('editar', null, nodo);
  }

  private abrirDialogo(modo: 'agregar' | 'editar', padre: NodoLista | null, edicion: NodoLista | null): void {
    this.dialogoModo.set(modo);
    this.nodoPadre.set(padre);
    this.nodoEnEdicion.set(edicion);
    this.valorNodo.set(edicion?.valor ?? '');
    // Sugerencia de código editable: el existente al editar, o uno generado al agregar.
    this.codeNodo.set(edicion?.code ?? this.generarCode(padre));
    this.valorTocado.set(false);
    this.dialogoNodoVisible.set(true);
  }

  nivelDestino = computed<number>(() => {
    if (this.dialogoModo() === 'editar') return this.nodoEnEdicion()?.nivel ?? 1;
    const padre = this.nodoPadre();
    return padre ? padre.nivel + 1 : 1;
  });

  get valorInvalido(): boolean {
    return this.valorNodo().trim().length === 0;
  }

  guardarNodo(): void {
    this.valorTocado.set(true);
    if (this.valorInvalido) return;
    const valor = this.valorNodo().trim();

    if (this.dialogoModo() === 'editar') {
      const nodo = this.nodoEnEdicion();
      if (!nodo) return;
      const code = this.codeNodo().trim() || nodo.code;
      this.arbol.update(arb => this.mapearNodo(arb, nodo.id, n => ({ ...n, valor, code })));
      this.toast('success', 'Registro actualizado', `Se actualizó "${valor}".`);
    } else {
      const padre = this.nodoPadre();
      const nivel = padre ? padre.nivel + 1 : 1;
      const code = this.codeNodo().trim() || this.generarCode(padre);
      const nuevo: NodoLista = { id: `nodo-${this.seqNodo++}`, code, nivel, valor, estado: 'activo', hijos: [] };
      if (padre) {
        this.arbol.update(arb => this.mapearNodo(arb, padre.id, n => ({ ...n, hijos: [...n.hijos, nuevo] })));
        this.expandidos.update(s => new Set(s).add(padre.id));
      } else {
        this.arbol.update(arb => [...arb, nuevo]);
      }
      this.nodoSeleccionadoId.set(nuevo.id);
      this.toast('success', 'Registro agregado', `Se agregó "${valor}" en el nivel ${this.nombreNivel(nivel)}.`);
    }
    this.dialogoNodoVisible.set(false);
  }

  /* ═══════════════ Árbol: activar / desactivar ═══════════════ */
  toggleEstado(nodo: NodoLista, event?: Event): void {
    event?.stopPropagation();
    const nuevoEstado: EstadoNodo = nodo.estado === 'activo' ? 'inactivo' : 'activo';
    this.arbol.update(arb => this.mapearNodo(arb, nodo.id, n => ({ ...n, estado: nuevoEstado })));
    this.toast('info', nuevoEstado === 'activo' ? 'Registro activado' : 'Registro desactivado',
      `"${nodo.valor}" ahora está ${nuevoEstado}.`);
  }

  /* ═══════════════ Árbol: eliminar ═══════════════ */
  confirmarEliminar(nodo: NodoLista, event?: Event): void {
    event?.stopPropagation();
    this.nodoAEliminar.set(nodo);
    this.dialogoEliminarVisible.set(true);
  }

  get totalDescendientes(): number {
    const nodo = this.nodoAEliminar();
    return nodo ? this.contar(nodo.hijos, () => true) : 0;
  }

  eliminarNodo(): void {
    const nodo = this.nodoAEliminar();
    if (!nodo) return;
    this.arbol.update(arb => this.removerNodo(arb, nodo.id));
    this.expandidos.update(s => { const ns = new Set(s); ns.delete(nodo.id); return ns; });
    if (this.nodoSeleccionadoId() === nodo.id) this.nodoSeleccionadoId.set(null);
    this.toast('warn', 'Registro eliminado', `Se eliminó "${nodo.valor}".`);
    this.dialogoEliminarVisible.set(false);
    this.nodoAEliminar.set(null);
  }

  /* ═══════════════ Persistencia simulada ═══════════════ */
  guardarTabla(): void {
    const tabla = this.tablaActiva();
    if (!tabla) return;
    tabla.arbol = structuredClone(this.arbol());
    this.toast('success', 'Cambios guardados', `La tabla "${tabla.nombre}" se guardó correctamente.`);
  }

  /* ═══════════════ Menú de acciones de la tabla ("…") ═══════════════ */
  menuTablaItems = computed<MenuItem[]>(() => {
    const tabla = this.tablaActiva();
    return [
      { label: 'Editar datos de la tabla', icon: 'pi pi-pencil', command: () => this.abrirEditarTabla() },
      {
        label: tabla?.activa ? 'Desactivar tabla' : 'Activar tabla',
        icon: tabla?.activa ? 'pi pi-pause' : 'pi pi-play',
        command: () => this.toggleEstadoTabla(),
      },
      { separator: true },
      { label: 'Exportar a Excel (CSV)', icon: 'pi pi-file-excel', command: () => this.exportarTabla() },
    ];
  });

  abrirMenuTabla(event: Event): void {
    this.menuTabla?.toggle(event);
  }

  /* ── Editar datos de la tabla ── */
  abrirEditarTabla(): void {
    const tabla = this.tablaActiva();
    if (!tabla) return;
    this.editTablaNombre.set(tabla.nombre);
    this.editTablaDesc.set(tabla.descripcion);
    this.editTablaNombreTocado.set(false);
    this.dialogoTablaVisible.set(true);
  }

  get tablaNombreInvalido(): boolean {
    return this.editTablaNombre().trim().length === 0;
  }

  guardarTablaDatos(): void {
    this.editTablaNombreTocado.set(true);
    if (this.tablaNombreInvalido) return;
    const tabla = this.tablaActiva();
    if (!tabla) return;
    tabla.nombre = this.editTablaNombre().trim();
    tabla.descripcion = this.editTablaDesc().trim();
    this.tablaActiva.set({ ...tabla }); // fuerza nueva referencia para refrescar la vista
    this.toast('success', 'Tabla actualizada', `Se actualizaron los datos de "${tabla.nombre}".`);
    this.dialogoTablaVisible.set(false);
  }

  /* ── Activar / desactivar la tabla completa ── */
  toggleEstadoTabla(): void {
    const tabla = this.tablaActiva();
    if (!tabla) return;
    tabla.activa = !tabla.activa;
    this.tablaActiva.set({ ...tabla });
    this.toast('info', tabla.activa ? 'Tabla activada' : 'Tabla desactivada',
      `"${tabla.nombre}" ahora está ${tabla.activa ? 'activa' : 'inactiva'}.`);
  }

  /* ── Exportar a Excel (CSV con BOM, separador ';' para es-CO) ── */
  exportarTabla(): void {
    const tabla = this.tablaActiva();
    if (!tabla) return;

    const escapar = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const encabezado = ['Código', 'Valor', 'Nivel', 'Nombre nivel', 'Estado', 'Ruta'];
    const filas: string[] = [encabezado.map(escapar).join(';')];

    const recorrer = (nodos: NodoLista[], ruta: string[]) => {
      for (const n of nodos) {
        const rutaActual = [...ruta, n.valor];
        filas.push([
          n.code,
          n.valor,
          String(n.nivel),
          this.nombreNivel(n.nivel),
          n.estado === 'activo' ? 'Activo' : 'Inactivo',
          rutaActual.join(' > '),
        ].map(escapar).join(';'));
        recorrer(n.hijos, rutaActual);
      }
    };
    recorrer(this.arbol(), []);

    const csv = '﻿' + filas.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tabla.tabCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast('success', 'Exportación lista', `Se descargó "${tabla.tabCode}.csv".`);
  }

  /* ═══════════════ Helpers de árbol ═══════════════ */
  private contar(nodos: NodoLista[], pred: (n: NodoLista) => boolean): number {
    let total = 0;
    const walk = (ns: NodoLista[]) => ns.forEach(n => { if (pred(n)) total++; walk(n.hijos); });
    walk(nodos);
    return total;
  }

  private buscarNodo(nodos: NodoLista[], id: string): NodoLista | null {
    for (const n of nodos) {
      if (n.id === id) return n;
      const found = this.buscarNodo(n.hijos, id);
      if (found) return found;
    }
    return null;
  }

  private hermanosDe(nodos: NodoLista[], id: string): NodoLista[] | null {
    if (nodos.some(n => n.id === id)) return nodos;
    for (const n of nodos) {
      const r = this.hermanosDe(n.hijos, id);
      if (r) return r;
    }
    return null;
  }

  private rutaDe(nodos: NodoLista[], id: string, padres: NodoLista[]): NodoLista[] {
    for (const n of nodos) {
      const conN = [...padres, n];
      if (n.id === id) return conN;
      const r = this.rutaDe(n.hijos, id, conN);
      if (r.length) return r;
    }
    return [];
  }

  private mapearNodo(nodos: NodoLista[], id: string, fn: (n: NodoLista) => NodoLista): NodoLista[] {
    return nodos.map(n => {
      if (n.id === id) return fn(n);
      if (n.hijos.length > 0) return { ...n, hijos: this.mapearNodo(n.hijos, id, fn) };
      return n;
    });
  }

  private removerNodo(nodos: NodoLista[], id: string): NodoLista[] {
    return nodos
      .filter(n => n.id !== id)
      .map(n => (n.hijos.length > 0 ? { ...n, hijos: this.removerNodo(n.hijos, id) } : n));
  }

  private generarCode(padre: NodoLista | null): string {
    if (!padre) {
      return `N${this.arbol().length + 1}`;
    }
    return `${padre.code}-${padre.hijos.length + 1}`;
  }

  private toast(severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string): void {
    this.message.add({ severity, summary, detail, life: 3200 });
  }

  /* ═══════════════ Datos mock ═══════════════ */
  private n(code: string, valor: string, nivel: number, estado: EstadoNodo = 'activo', hijos: NodoLista[] = []): NodoLista {
    return { id: `nodo-${this.seqNodo++}`, code, valor, nivel, estado, hijos };
  }

  private crearTablas(): TablaParametrica[] {
    /* ── IDENTIFICACION ─────────────────────────────────────────── */

    // Código CUIN (Sector → Subsector → Tipo)
    const cuin: NodoLista[] = [
      this.n('S1', '1 · Sociedad pública no financiera', 1, 'activo', [
        this.n('S1-1', '1 · Sociedad no financiera pública', 2, 'activo', [
          this.n('S1-1-1', '1 · Empresa industrial y comercial', 3),
          this.n('S1-1-2', '2 · Sociedad de economía mixta', 3),
        ]),
        this.n('S1-2', '2 · Sociedad no financiera mixta', 2, 'activo', [
          this.n('S1-2-1', '1 · Participación pública mayoritaria', 3),
        ]),
      ]),
      this.n('S2', '2 · Sociedad pública financiera', 1, 'activo', [
        this.n('S2-1', '1 · Entidad financiera pública', 2, 'activo', [
          this.n('S2-1-1', '1 · Banca de primer piso', 3),
          this.n('S2-1-2', '2 · Banca de segundo piso', 3, 'inactivo'),
        ]),
      ]),
      this.n('S3', '3 · Gobierno general', 1, 'activo', [
        this.n('S3-1', '1 · Gobierno central', 2),
        this.n('S3-2', '2 · Gobierno departamental', 2),
        this.n('S3-3', '3 · Gobierno municipal', 2),
        this.n('S3-4', '4 · Seguridad social', 2, 'inactivo'),
      ]),
      this.n('S4', '4 · Sector 4', 1, 'inactivo'),
    ];

    const documentos: NodoLista[] = [
      this.n('D1', 'Cédula de ciudadanía', 1),
      this.n('D2', 'Cédula de extranjería', 1),
      this.n('D3', 'Tarjeta de identidad', 1),
      this.n('D4', 'Registro civil', 1),
      this.n('D5', 'Pasaporte', 1),
      this.n('D6', 'NIT', 1),
    ];

    const reportes: NodoLista[] = [
      this.n('R1', 'Información entidades', 1),
      this.n('R2', 'Relación entidades', 1),
      this.n('R3', 'Histórico composición patrimonial', 1),
      this.n('R4', 'Hoja de vida entidad', 1),
      this.n('R5', 'Acciones propias readquiridas', 1, 'inactivo'),
      this.n('R6', 'Entidades activas', 1),
    ];

    const naturaleza: NodoLista[] = [
      this.n('NJ1', 'Pública', 1),
      this.n('NJ2', 'Privada', 1),
      this.n('NJ3', 'Mixta', 1),
    ];

    const subestados: NodoLista[] = [
      this.n('SE1', 'Vigente', 1),
      this.n('SE2', 'Liquidada', 1),
      this.n('SE3', 'En liquidación', 1),
      this.n('SE4', 'Fusionada', 1),
    ];

    const normCuin: NodoLista[] = [
      this.n('MN1', 'Decreto', 1, 'activo', [
        this.n('MN1-1', 'Decreto 1068 de 2015', 2),
        this.n('MN1-2', 'Decreto 2649 de 1993', 2),
      ]),
      this.n('MN2', 'Resolución', 1, 'activo', [
        this.n('MN2-1', 'Resolución 533 de 2015', 2),
      ]),
    ];

    const muestras: NodoLista[] = [
      this.n('M1', 'Muestra trimestral', 1, 'activo', [
        this.n('M1-1', 'Entidades territoriales', 2),
        this.n('M1-2', 'Entidades nacionales', 2),
      ]),
      this.n('M2', 'Muestra anual', 1, 'inactivo'),
    ];

    const identificacion: TablaParametrica[] = [
      this.tabla('rep', 'identificacion', 'ENTIDADES', 'Reportes', 'Catálogo de reportes asociados a las entidades.', ['Reporte'], true, reportes),
      this.tabla('cuin', 'identificacion', 'COD_CUIN', 'Código CUIN', 'Clasificación institucional por sector, subsector y tipo.', ['Sector', 'Subsector', 'Tipo'], true, cuin),
      this.tabla('doc', 'identificacion', 'DOCUMENTOS', 'Documentos', 'Tipos de documento de identificación admitidos.', ['Tipo de documento'], true, documentos),
      this.tabla('norm', 'identificacion', 'NORM_CUIN', 'Marco normativo CUIN', 'Marco normativo asociado a la clasificación CUIN.', ['Tipo de norma', 'Norma'], true, normCuin),
      this.tabla('mue', 'identificacion', 'MUESTRAS', 'Muestras', 'Definición de muestras de entidades para seguimiento.', ['Muestra', 'Entidad'], false, muestras),
      this.tabla('nat', 'identificacion', 'NATURALEZA', 'Naturaleza jurídica', 'Naturaleza jurídica de las entidades reportantes.', ['Naturaleza'], true, naturaleza),
      this.tabla('sub', 'identificacion', 'SUBESTADOS', 'Subestados', 'Subestados del ciclo de vida de una entidad.', ['Subestado'], true, subestados),
    ];

    /* ── UBICACIÓN: ejemplo de 5 niveles, mixto (config 2 y 3) ───── */
    // País → Departamento → Municipio → Comuna/Localidad → Barrio.
    // Ramas completas de 5 niveles + nodos sin hijos en distintos niveles.
    const ubicacion: NodoLista[] = [
      this.n('CO', 'Colombia', 1, 'activo', [
        this.n('CO-ANT', 'Antioquia', 2, 'activo', [
          this.n('CO-ANT-MED', 'Medellín', 3, 'activo', [
            this.n('CO-ANT-MED-C14', 'Comuna 14 · El Poblado', 4, 'activo', [
              this.n('CO-ANT-MED-C14-CAS', 'Castropol', 5),
              this.n('CO-ANT-MED-C14-MAN', 'Manila', 5),
              this.n('CO-ANT-MED-C14-PAT', 'Patio Bonito', 5, 'inactivo'),
            ]),
            this.n('CO-ANT-MED-C11', 'Comuna 11 · Laureles', 4, 'activo', [
              this.n('CO-ANT-MED-C11-LAU', 'Laureles', 5),
              this.n('CO-ANT-MED-C11-EST', 'Estadio', 5),
            ]),
          ]),
          this.n('CO-ANT-BEL', 'Bello', 3), // municipio sin comunas (mixto)
        ]),
        this.n('CO-CUN', 'Cundinamarca', 2, 'activo', [
          this.n('CO-CUN-BOG', 'Bogotá D.C.', 3, 'activo', [
            this.n('CO-CUN-BOG-CHA', 'Localidad de Chapinero', 4, 'activo', [
              this.n('CO-CUN-BOG-CHA-CHI', 'Chicó', 5),
              this.n('CO-CUN-BOG-CHA-RET', 'El Retiro', 5),
            ]),
            this.n('CO-CUN-BOG-USA', 'Localidad de Usaquén', 4), // localidad sin barrios (mixto)
          ]),
          this.n('CO-CUN-SOA', 'Soacha', 3), // municipio sin comunas (mixto)
        ]),
        this.n('CO-VAC', 'Valle del Cauca', 2, 'activo', [
          this.n('CO-VAC-CAL', 'Cali', 3), // municipio sin comunas (mixto, nivel intermedio)
        ]),
      ]),
      this.n('MX', 'México', 1, 'inactivo'), // país sin departamentos (mixto, raíz sin hijos)
    ];

    /* ── GENERALES (muestra representativa de las 456) ──────────── */
    const generalesNombres = [
      'Acepta signo', 'AE tipo conceptos presupuestales', 'AESGPRI asociaciones indígenas',
      'AESGPRI CPC', 'AESGPRI entidades territoriales', 'AESGPRI FVAC',
      'AESGPRI inversión ejecución', 'AESGPRI inversión programación', 'AESGPRI tipo deficiencias',
      'Agrupación', 'Aumento servicio deuda', 'BDME estado deuda',
      'BDME tipo actualización', 'Categorías según MEFP 2001',
    ];
    const generales: TablaParametrica[] = [
      this.tabla(
        'ubicacion', 'generales', 'UBICACION', 'Ubicación',
        'División político-administrativa: país, departamento, municipio, comuna/localidad y barrio.',
        ['País', 'Departamento', 'Municipio', 'Comuna/Localidad', 'Barrio'], true, ubicacion,
      ),
      ...generalesNombres.map((nombre, i) =>
        this.tabla(
          `gen-${i}`, 'generales',
          nombre.toUpperCase().replace(/ /g, '_').slice(0, 18),
          nombre,
          'Lista general transversal del sistema.',
          ['Valor'],
          i % 5 !== 0,
          [
            this.n(`G${i}1`, 'Opción 1', 1),
            this.n(`G${i}2`, 'Opción 2', 1),
            this.n(`G${i}3`, 'Opción 3', 1, 'inactivo'),
          ],
        ),
      ),
    ];

    /* ── Otros grupos (muestras) ────────────────────────────────── */
    const gestion: TablaParametrica[] = [
      this.tabla('ges-1', 'gestion', 'ESTADO_PROCESO', 'Estado de proceso', 'Estados del flujo de gestión.', ['Estado'], true, [
        this.n('EP1', 'Borrador', 1), this.n('EP2', 'En revisión', 1), this.n('EP3', 'Aprobado', 1), this.n('EP4', 'Rechazado', 1),
      ]),
      this.tabla('ges-2', 'gestion', 'PRIORIDAD', 'Prioridad', 'Niveles de prioridad de la gestión.', ['Prioridad'], true, [
        this.n('PR1', 'Alta', 1), this.n('PR2', 'Media', 1), this.n('PR3', 'Baja', 1),
      ]),
    ];

    const sistema: TablaParametrica[] = [
      this.tabla('sis-1', 'sistema', 'PARAMETRO_SIS', 'Parámetros del sistema', 'Configuraciones internas de la plataforma.', ['Parámetro'], true, [
        this.n('PS1', 'Tiempo de sesión (min)', 1), this.n('PS2', 'Intentos de login', 1),
      ]),
      this.tabla('sis-2', 'sistema', 'TIPO_USUARIO', 'Tipo de usuario', 'Tipos de usuario del sistema.', ['Tipo'], true, [
        this.n('TU1', 'Administrador', 1), this.n('TU2', 'Analista', 1), this.n('TU3', 'Consulta', 1),
      ]),
    ];

    const normalizacion: TablaParametrica[] = [
      this.tabla('nor-1', 'normalizacion', 'CATEGORIA', 'Categorías', 'Categorías fijas de normalización.', ['Categoría', 'Subcategoría'], true, [
        this.n('C1', 'Ingresos', 1, 'activo', [this.n('C1-1', 'Tributarios', 2), this.n('C1-2', 'No tributarios', 2)]),
        this.n('C2', 'Gastos', 1, 'activo', [this.n('C2-1', 'Funcionamiento', 2)]),
      ]),
    ];

    const detalle: TablaParametrica[] = [
      this.tabla('det-1', 'detalle', 'DETALLE', 'Detalle', 'Tabla de detalle del sistema.', ['Detalle'], true, [
        this.n('DT1', 'Detalle general', 1),
      ]),
    ];

    return [...identificacion, ...generales, ...gestion, ...sistema, ...normalizacion, ...detalle];
  }

  private tabla(
    id: string, grupoId: string, tabCode: string, nombre: string, descripcion: string,
    niveles: string[], activa: boolean, arbol: NodoLista[],
  ): TablaParametrica {
    return { id, grupoId, tabCode, nombre, descripcion, jerarquica: niveles.length > 1, niveles, activa, arbol };
  }
}
