import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';

type TipoColumna = 'numero' | 'texto' | 'seleccion';
type Severidad = 'success' | 'warn' | 'danger' | 'info' | 'secondary';

interface ColumnaConfig {
  key: string;
  label: string;
  editable: boolean;
  tipo: TipoColumna;
  ancho?: string;
  alineacion?: 'right' | 'center' | 'left';
  opciones?: string[];
  fija?: boolean;
}

interface NodoArbol {
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

@Component({
  selector: 'app-tree-table-estandar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ToggleSwitchModule,
    TagModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    ToastModule,
    DialogModule,
    AppBreadcrumbComponent,
  ],
  providers: [MessageService],
  templateUrl: './tree-table-estandar.component.html',
  styleUrl: './tree-table-estandar.component.scss',
})
export class TreeTableEstandarComponent {
  /* ─────────── Configuración de columnas ─────────── */
  readonly columnasFijas: ColumnaConfig[] = [
    { key: 'codigo', label: 'Código', editable: false, tipo: 'texto', ancho: '180px', fija: true },
    { key: 'nombre', label: 'Concepto', editable: false, tipo: 'texto', ancho: '220px', fija: true },
  ];

  readonly columnasVariables: ColumnaConfig[] = [
    { key: 'sldoInicial', label: 'Saldo Inicial', editable: true, tipo: 'numero', alineacion: 'right' },
    { key: 'movDebito', label: 'Mov. Débito', editable: true, tipo: 'numero', alineacion: 'right' },
    { key: 'movCredito', label: 'Mov. Crédito', editable: true, tipo: 'numero', alineacion: 'right' },
    { key: 'sldoFinal', label: 'Saldo Final', editable: false, tipo: 'numero', alineacion: 'right' },
    { key: 'ptoAsignado', label: 'Pto. Asignado', editable: true, tipo: 'numero', alineacion: 'right' },
    { key: 'ptoEjecutado', label: 'Pto. Ejecutado', editable: true, tipo: 'numero', alineacion: 'right' },
    { key: 'riesgoAlerta', label: 'Riesgo Alerta', editable: true, tipo: 'seleccion',
      opciones: ['Sí', 'No'], alineacion: 'center' },
    { key: 'puntajeCtrl', label: 'Puntaje Ctrl.', editable: true, tipo: 'numero', alineacion: 'right' },
    { key: 'notaAnalista', label: 'Nota Analista', editable: true, tipo: 'texto', alineacion: 'left' },
    { key: 'estado', label: 'Estado', editable: true, tipo: 'seleccion',
      opciones: ['Activo', 'Inactivo', 'Pendiente'], alineacion: 'center' },
    { key: 'clasificacion', label: 'Clasificación', editable: true, tipo: 'seleccion',
      opciones: ['Alta', 'Media', 'Baja'], alineacion: 'center' },
    { key: 'observacion', label: 'Observación', editable: true, tipo: 'texto', alineacion: 'left' },
  ];

  readonly opcionesTamanoPagina = TAMANOS_PAGINA.map(n => ({ label: `${n}`, value: n }));

  /* ─────────── Estado de la tabla ─────────── */
  arbol = signal<NodoArbol[]>(this.generarArbol());

  /* Comportamiento de expansión */
  modoUnaRama = signal(true);
  nodosExpandidos = signal<Set<string>>(new Set());
  nodoActivoId = signal<string | null>(null);

  /* Paginación interna por nodo (rows) */
  paginasNodo = signal<Record<string, number>>({});
  tamanosPaginaNodo = signal<Record<string, number>>({});

  /* Paginación horizontal de columnas */
  paginaColumnas = signal(0);

  totalPaginasColumnas = computed(() =>
    Math.ceil(this.columnasVariables.length / COLUMNAS_VISIBLES),
  );

  columnasMostradas = computed<ColumnaConfig[]>(() => {
    const inicio = this.paginaColumnas() * COLUMNAS_VISIBLES;
    return this.columnasVariables.slice(inicio, inicio + COLUMNAS_VISIBLES);
  });

  rangoColumnasTxt = computed(() => {
    const inicio = this.paginaColumnas() * COLUMNAS_VISIBLES + 1;
    const fin = Math.min(inicio + COLUMNAS_VISIBLES - 1, this.columnasVariables.length);
    return `${inicio}-${fin} de ${this.columnasVariables.length} columnas variables`;
  });

  /* Búsqueda global */
  busqueda = signal('');

  arbolFiltrado = computed<NodoArbol[]>(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) return this.arbol();
    return this.filtrarArbol(this.arbol(), q);
  });

  /* Edición y cambios pendientes */
  edicionActiva = signal<{ nodoId: string; campo: string } | null>(null);
  valorEditando = signal<string | number>('');
  cambiosPendientes = signal<CambioPendiente[]>([]);

  /* Ruta del nodo activo (miga de pan) */
  rutaActiva = computed<RutaNodo[]>(() => {
    const id = this.nodoActivoId();
    if (!id) return [];
    return this.buscarRuta(this.arbol(), id, []) ?? [];
  });

  constructor(private message: MessageService) {}

  /* ═════════════ Búsqueda ═════════════ */
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
      // Cerrando: quitar este y todos sus descendientes
      this.cerrarRamaCompleta(set, nodo);
      if (this.nodoActivoId() === nodo.id) {
        this.nodoActivoId.set(null);
      }
    } else {
      // Abriendo: si está activo modo "una sola rama", cerrar los hermanos al mismo nivel
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
      // Cerrar todo excepto la primera rama activa
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
    if (!col.editable) return;
    this.edicionActiva.set({ nodoId: nodo.id, campo: col.key });
    this.valorEditando.set(nodo.valores[col.key] ?? '');
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
    // Actualizar valor en el nodo (mutar copia inmutable del árbol)
    this.arbol.update(arb => this.actualizarValor(arb, nodo.id, col.key, valorNuevo));

    // Registrar cambio
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
      detail: `${total} ${total === 1 ? 'cambio enviado' : 'cambios enviados'} al CHIP local.`,
      life: 3500,
    });
  }

  descartarCambios(): void {
    const total = this.cambiosPendientes().length;
    if (total === 0) return;
    // Revertir valores
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

  /* ═════════════ Ruta (miga de pan del árbol) ═════════════ */
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

  /* ═════════════ Helpers ═════════════ */
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
    if (col.key === 'clasificacion') {
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

  hayCambioEn(nodoId: string, campo: string): boolean {
    return this.cambiosPendientes().some(c => c.nodoId === nodoId && c.campo === campo);
  }

  /* ═════════════ Datos mock ═════════════ */
  private generarArbol(): NodoArbol[] {
    const conceptos = [
      { codigo: '1100', nombre: 'Activos corrientes', hijos: 18 },
      { codigo: '1200', nombre: 'Activos no corrientes', hijos: 12 },
      { codigo: '2100', nombre: 'Pasivos corrientes', hijos: 14 },
      { codigo: '2200', nombre: 'Pasivos no corrientes', hijos: 8 },
      { codigo: '3100', nombre: 'Patrimonio institucional', hijos: 6 },
      { codigo: '4100', nombre: 'Ingresos operacionales', hijos: 22 },
      { codigo: '5100', nombre: 'Gastos de administración', hijos: 16 },
      { codigo: '6100', nombre: 'Gastos de operación', hijos: 11 },
    ];

    return conceptos.map((c, i) => this.crearNodo(c.codigo, c.nombre, 1, c.hijos, `n${i}`));
  }

  private crearNodo(codigo: string, nombre: string, nivel: number, cantHijos: number, idBase: string): NodoArbol {
    const hijos: NodoArbol[] = [];
    if (nivel < 3 && cantHijos > 0) {
      for (let i = 1; i <= cantHijos; i++) {
        const subCod = `${codigo}-${String(i).padStart(2, '0')}`;
        const subId = `${idBase}-${i}`;
        // Deterministic: en nivel 2, los pares tienen 4 hijos, los impares no.
        const subHijos = nivel === 1 && i % 2 === 0 ? 4 : 0;
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
    // Generador determinístico con buena dispersión (LCG sobre el hash de la semilla)
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
    const notas = [
      'Revisión técnica 1', 'Revisión técnica 2', 'Pendiente analista',
      'Aprobado', 'Verificar soporte',
    ];
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
