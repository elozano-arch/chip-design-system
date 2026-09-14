import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

import {
  DeficienciaEnvio,
  estadoDe,
  etapaDe,
} from '../catalogo-proceso';
import {
  BotonDescargarComponent,
  DownloadFormatId,
} from '../../../../components/boton-descargar/boton-descargar.component';
import {
  TreeTableComponent,
  ColumnaConfig,
  NodoArbol,
} from '../../../../components/tree-table/tree-table.component';

/**
 * Un proceso y sus deficiencias, que es lo que cuelga de cada nodo padre del
 * árbol. Las filas son las MISMAS instancias que llegan por `@Input`, no copias:
 * al guardar un comentario, el resumen del padre se recalcula solo.
 */
interface ProcesoNodo {
  /** Primera fila del proceso — de ahí salen las columnas del padre. */
  fila: DeficienciaEnvio;
  /** Vacío cuando el proceso cerró sin deficiencias. */
  deficiencias: DeficienciaEnvio[];
}

/**
 * Historial de procesos del formulario, como árbol: cada proceso es un nodo
 * padre y sus deficiencias, los hijos. Los procesos que no generaron
 * deficiencia se listan igual, sin hijos.
 *
 * El expediente (qué procesos tiene cada formulario) lo administra la pantalla
 * de formularios, porque también lo escribe la simulación de rechazo central.
 * Aquí sólo se presentan y se editan los comentarios — que se guardan sobre la
 * misma fila que llega por @Input.
 */
@Component({
  selector: 'app-deficiencias-envio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TooltipModule,
    TextareaModule,
    DialogModule,
    BotonDescargarComponent,
    TreeTableComponent,
  ],
  // Sin providers: el MessageService lo provee la pantalla de formularios,
  // que es la que tiene el <p-toast>. Uno propio dejaría los toasts mudos.
  templateUrl: './deficiencias-envio.component.html',
  styleUrl: './deficiencias-envio.component.scss',
})
export class DeficienciasEnvioComponent {
  /** Formulario abierto; `null` = se entró al historial sin elegir uno. */
  @Input() formulario: { codigo: string; nombre: string } | null = null;
  /**
   * Filas del expediente. El árbol necesita las filas agrupadas por proceso, y
   * agruparlas en un getter las recalcularía en cada ciclo de detección de
   * cambios (y el tree table volvería a clonar el árbol entero): se arman una
   * sola vez, cuando llega el expediente.
   */
  @Input() set visibles(v: DeficienciaEnvio[]) {
    this._visibles = v;
    this.nodosProcesos = this.construirNodos(v);
  }
  get visibles(): DeficienciaEnvio[] {
    return this._visibles;
  }
  private _visibles: DeficienciaEnvio[] = [];

  /** Total del expediente — distingue "sin procesos" de un árbol con datos. */
  @Input() total = 0;
  /** Resumen del expediente ("N proceso(s) · M deficiencias"). */
  @Input() resumen = '';
  /**
   * Registro de detalle más reciente del formulario. Es el único que admite
   * justificación: los anteriores ya cerraron y su comentario viajó con ese
   * envío, así que editarlos reescribiría historia.
   */
  @Input() ultimoProcesoId = 0;

  /** El expediente como árbol de procesos → deficiencias. */
  nodosProcesos: NodoArbol[] = [];

  readonly etapaDe = etapaDe;
  readonly estadoDe = estadoDe;

  constructor(private messageService: MessageService) {}

  /**
   * Agrupa las filas por proceso y arma el árbol, del proceso MÁS RECIENTE al
   * más antiguo: en un expediente lo que se consulta primero es lo último que
   * pasó. Es el orden de llegada; el usuario lo cambia desde las cabeceras.
   *
   * El `num` de cada nodo es su POSICIÓN en ese orden inicial, no el id del
   * proceso ni el de la deficiencia: es un consecutivo de lectura.
   */
  private construirNodos(filas: DeficienciaEnvio[]): NodoArbol[] {
    const porProceso = new Map<number, DeficienciaEnvio[]>();
    for (const f of filas) {
      const acumuladas = porProceso.get(f.idDetalleProceso);
      if (acumuladas) acumuladas.push(f);
      else porProceso.set(f.idDetalleProceso, [f]);
    }

    const procesos = [...porProceso.values()]
      .sort((a, b) => b[0].idDetalleProceso - a[0].idDetalleProceso);

    return procesos.map((filasProceso, i) => {
      const cabecera = filasProceso[0];
      // La fila con `id === null` es el proceso que cerró sin deficiencias: es
      // portadora de la cabecera, no una deficiencia, y no cuelga del nodo.
      const deficiencias = filasProceso.filter(f => f.id !== null);
      return {
        id: `p-${cabecera.idDetalleProceso}`,
        codigo: '',
        nombre: '',
        nivel: 1,
        valores: { num: i + 1 },
        data: { fila: cabecera, deficiencias } satisfies ProcesoNodo,
        hijos: deficiencias.map((d, j) => ({
          id: `d-${cabecera.idDetalleProceso}-${d.id}`,
          codigo: '',
          nombre: '',
          nivel: 2,
          hijos: [],
          valores: { num: j + 1 },
          data: d,
        })),
      };
    });
  }

  /* ── Columnas del árbol ──────────────────────────────────────────────────
     Las del proceso van como "fijas" porque el expansor vive en la primera
     columna fija del componente; las de la deficiencia son el esquema del
     nivel hijo, que el tree table pinta en su propia tabla anidada. */
  readonly columnasProceso: ColumnaConfig[] = [
    // Consecutivo de lectura: ordenar por él es lo mismo que por Id detalle.
    { key: 'num', label: '#', editable: false, tipo: 'numero', ancho: '96px', ordenable: false },
    { key: 'idDetalle', label: 'Id detalle proceso', editable: false, tipo: 'texto', ancho: '150px' },
    { key: 'fecha', label: 'Fecha', editable: false, tipo: 'texto', ancho: '120px' },
    { key: 'etapa', label: 'Etapa', editable: false, tipo: 'texto', ancho: '180px' },
    { key: 'estado', label: 'Estado', editable: false, tipo: 'texto', ancho: '160px' },
    { key: 'usuario', label: 'Usuario', editable: false, tipo: 'texto', ancho: '140px' },
    { key: 'deficiencias', label: 'Deficiencias', editable: false, tipo: 'texto' },
  ];

  readonly columnasDeficiencia: ColumnaConfig[] = [
    { key: 'num', label: '#', editable: false, tipo: 'numero', ancho: '48px' },
    { key: 'codMensaje', label: 'Cód. mensaje', editable: false, tipo: 'texto', ancho: '124px' },
    { key: 'mensaje', label: 'Mensaje', editable: false, tipo: 'texto' },
    { key: 'perm', label: 'Perm.', editable: false, tipo: 'texto', ancho: '68px' },
    { key: 'comentario', label: 'Comentario', editable: false, tipo: 'texto', ancho: '140px' },
  ];

  /** Tamaños de página de los dos paginadores del árbol. */
  readonly tamanosPaginaArbol = [5, 10, 25];

  // ── Búsqueda y orden ──────────────────────────────────────────────────────
  // Las celdas se pintan con plantillas desde `nodo.data`, así que el árbol no
  // sabe qué texto ve el usuario: se lo dicen estas dos funciones. Son
  // propiedades flecha, no métodos, para que viajen con su `this`.

  /**
   * Lo buscable de cada nodo: del proceso, lo que muestran sus columnas (con
   * la etapa y el estado en palabras, no en código); de la deficiencia, el
   * código y el mensaje completo.
   */
  readonly textoBusquedaNodo = (nodo: NodoArbol): string => {
    if (nodo.nivel === 1) {
      const p = (nodo.data as ProcesoNodo).fila;
      return [
        p.idDetalleProceso, p.fechaProceso, etapaDe(p.etapa).label,
        estadoDe(p.estado).label, p.usuarioProceso,
      ].join(' ');
    }
    const d = nodo.data as DeficienciaEnvio;
    return `${d.codMensaje} ${this.textoCompleto(d)}`;
  };

  /**
   * Valor de orden de cada columna del proceso. La fecha llega como
   * dd/mm/aaaa hh:mm y ordenada como texto mezclaría meses; la etapa se ordena
   * por su posición en el flujo, no alfabéticamente; las deficiencias, por
   * cantidad.
   */
  readonly valorOrdenNodo = (nodo: NodoArbol, key: string): string | number | undefined => {
    const { fila, deficiencias } = nodo.data as ProcesoNodo;
    switch (key) {
      case 'idDetalle': return fila.idDetalleProceso;
      case 'fecha': return this.fechaOrdenable(fila.fechaProceso);
      case 'etapa': return fila.etapa;
      case 'estado': return estadoDe(fila.estado).label;
      case 'usuario': return fila.usuarioProceso;
      case 'deficiencias': return deficiencias.length;
      default: return nodo.valores[key];
    }
  };

  /** dd/mm/aaaa hh:mm → aaaammddhhmm, que ordena bien como número. */
  private fechaOrdenable(fecha: string): number {
    const [dia = '', hora = '00:00'] = fecha.split(' ');
    const [dd = '00', mm = '00', aaaa = '0000'] = dia.split('/');
    return Number(`${aaaa}${mm}${dd}${hora.replace(':', '')}`);
  }

  /** Deficiencias del proceso que exigen comentario y siguen sin diligenciar. */
  pendientesDeProceso(proceso: ProcesoNodo): number {
    return proceso.deficiencias
      .filter(d => d.requiereComentario && !d.comentarioGuardado).length;
  }

  // ── Justificación: se escribe en un modal, no en la celda ────────────────

  /** Longitud mínima exigida a la justificación de una deficiencia. */
  readonly COMENTARIO_MIN = 30;

  /** Por qué una fila del histórico no deja escribir. */
  readonly AYUDA_SOLO_LECTURA =
    'Es un proceso anterior. Sólo se justifican las deficiencias del último proceso.';

  /**
   * True si la fila admite justificación: la deficiencia la exige Y pertenece
   * al último registro de detalle.
   */
  puedeDiligenciar(d: DeficienciaEnvio): boolean {
    return d.requiereComentario && d.idDetalleProceso === this.ultimoProcesoId;
  }

  /**
   * Color de la letra del estado. Se deriva de la severity del catálogo en vez
   * de mapearla otra vez aquí: así el verde/rojo/ámbar de esta celda no puede
   * desincronizarse del `p-tag` que muestra el mismo estado en otras pantallas.
   */
  claseEstado(d: DeficienciaEnvio): string {
    return `form-defic__est--${estadoDe(d.estado).severity}`;
  }

  /** Fecha del proceso (primera línea de la celda). */
  fechaDia(d: DeficienciaEnvio): string {
    return d.fechaProceso.split(' ')[0] ?? '';
  }

  /** Hora del proceso (segunda línea). Vacía si el dato no la trae. */
  fechaHora(d: DeficienciaEnvio): string {
    return d.fechaProceso.split(' ')[1] ?? '';
  }

  /**
   * Estado de la columna Comentario:
   *   'noRequiere' → la deficiencia no lo exige
   *   'registrar'  → lo exige, está pendiente y la fila admite escritura
   *   'registrado' → ya se diligenció
   *   'bloqueado'  → lo exige y sigue pendiente, pero es de un proceso anterior
   *                  y ya no se puede registrar. Sin esto, un enlace "Registrar"
   *                  prometería una acción que la fila no permite.
   */
  estadoComentario(
    d: DeficienciaEnvio,
  ): 'noRequiere' | 'registrar' | 'registrado' | 'bloqueado' {
    if (d.comentarioGuardado) return 'registrado';
    if (!d.requiereComentario) return 'noRequiere';
    return this.puedeDiligenciar(d) ? 'registrar' : 'bloqueado';
  }

  /** True si el modal abierto es de consulta (fila de un proceso anterior). */
  get modalSoloLectura(): boolean {
    const d = this.deficienciaEnEdicion;
    return !!d && !this.puedeDiligenciar(d);
  }

  /**
   * True si la deficiencia abierta admite justificación. Sin esto el modal no
   * muestra caja de texto: "Ver completo" lo abre también sobre deficiencias
   * que no la exigen, y ahí es sólo lectura del detalle.
   */
  get modalPideJustificacion(): boolean {
    return !!this.deficienciaEnEdicion?.requiereComentario;
  }

  /** Deficiencia abierta en el modal (`null` = modal cerrado). */
  deficienciaEnEdicion: DeficienciaEnvio | null = null;

  /**
   * Texto completo de la deficiencia: la descripción del catálogo más el
   * detalle que inyecta la regla.
   */
  textoCompleto(d: DeficienciaEnvio): string {
    return d.mensajeAdicional ? `${d.mensaje} ${d.mensajeAdicional}` : d.mensaje;
  }

  /** Texto en edición. Vive aquí para que Cancelar no deje rastro en la fila. */
  borrador = '';
  borradorError = '';

  /** Abre el detalle de una deficiencia (y su justificación, si la admite). */
  abrirDetalle(d: DeficienciaEnvio): void {
    this.deficienciaEnEdicion = d;
    this.borrador = d.comentarioGuardado;
    this.borradorError = '';
  }

  cerrarJustificacion(): void {
    this.deficienciaEnEdicion = null;
    this.borrador = '';
    this.borradorError = '';
  }

  /** Limpia el error mientras el usuario corrige, para no regañarlo al escribir. */
  onBorradorInput(): void {
    this.borradorError = '';
  }

  /**
   * A partir de aquí el mensaje se recorta y aparece "Ver completo". Son las
   * dos líneas que caben en la columna: por encima, el texto empujaría la fila.
   */
  private readonly MENSAJE_LARGO = 85;

  esMensajeLargo(d: DeficienciaEnvio): boolean {
    return this.textoCompleto(d).length > this.MENSAJE_LARGO;
  }

  /**
   * Guarda la justificación abierta en el modal. Exige `COMENTARIO_MIN`
   * caracteres: el texto viaja a la CGN, y un "ok" de tres letras no justifica
   * nada.
   */
  guardarJustificacion(): void {
    const d = this.deficienciaEnEdicion;
    if (!d || !this.puedeDiligenciar(d)) return;
    const texto = this.borrador.trim();
    if (texto.length < this.COMENTARIO_MIN) {
      this.borradorError =
        `Escriba al menos ${this.COMENTARIO_MIN} caracteres: lleva ${texto.length}.`;
      this.messageService.add({
        severity: 'warn',
        summary: 'Justificación demasiado corta',
        detail: `${d.codMensaje}: la justificación debe tener mínimo ${this.COMENTARIO_MIN} caracteres.`,
        life: 4500,
      });
      return;
    }
    d.comentario = texto;
    d.comentarioGuardado = texto;
    d.fechaComentario = this.ahora();
    this.messageService.add({
      severity: 'success',
      summary: 'Justificación guardada',
      detail: `Se guardó la justificación del mensaje ${d.codMensaje}.`,
      life: 4000,
    });
    this.cerrarJustificacion();
  }

  // ── Exportación ───────────────────────────────────────────────────────────

  /**
   * Columnas del archivo exportado. Van todas las del registro, sin importar
   * cuáles muestre el árbol: el archivo es el dato, no la vista.
   */
  private readonly COLUMNAS_EXPORT = [
    'Id', 'Id detalle proceso', 'Etapa', 'Estado', 'Fecha del proceso',
    'Usuario del proceso', 'Cód. mensaje', 'Mensaje', 'Mensaje adicional',
    'Permisible', 'Requiere comentario', 'Comentario', 'Fecha del comentario',
  ];

  /**
   * Exporta el expediente completo. El CSV se genera aquí porque el navegador
   * puede; los otros tres los arma el backend, así que el mensaje lo dice sin
   * prometer un archivo que aún no está.
   */
  exportar(formato: DownloadFormatId): void {
    const codigo = this.formulario?.codigo ?? 'formulario';
    const archivo = `Deficiencias_${codigo}.${formato}`;
    const n = this.visibles.filter(d => d.id !== null).length;
    const cuantas = `${n} ${n === 1 ? 'deficiencia exportada' : 'deficiencias exportadas'}`;
    const de = this.formulario
      ? ` de ${this.formulario.codigo} · ${this.formulario.nombre}`
      : '';

    if (formato === 'csv') {
      this.descargarCSV(archivo);
      this.messageService.add({
        severity: 'success',
        summary: 'Exportación completada',
        detail: `${cuantas}${de}. El archivo ${archivo} quedó en la carpeta de descargas.`,
        life: 6000,
      });
      return;
    }
    this.messageService.add({
      severity: 'info',
      summary: 'Exportación en proceso',
      detail: `${cuantas}${de}. ${archivo} se está generando y quedará en la carpeta de descargas.`,
      life: 6000,
    });
  }

  /** CSV con BOM UTF-8, que es lo que Excel espera para no romper los acentos. */
  private descargarCSV(archivo: string): void {
    const filas = [
      this.COLUMNAS_EXPORT,
      ...this.visibles.map(d => [
        d.id === null ? '' : String(d.id),
        String(d.idDetalleProceso),
        etapaDe(d.etapa).label,
        estadoDe(d.estado).label,
        d.fechaProceso,
        d.usuarioProceso,
        d.codMensaje,
        d.mensaje,
        d.mensajeAdicional,
        d.id === null ? '' : (d.permisible ? 'Sí' : 'No'),
        d.id === null ? '' : (d.requiereComentario ? 'Sí' : 'No'),
        d.comentarioGuardado,
        d.fechaComentario,
      ]),
    ];
    const csv = filas
      .map(fila => fila.map(c => `"${c.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = archivo;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Marca de tiempo del comentario, en el formato del resto de la pantalla. */
  private ahora(): string {
    const f = new Date();
    const dos = (n: number) => String(n).padStart(2, '0');
    return `${dos(f.getDate())}/${dos(f.getMonth() + 1)}/${f.getFullYear()}`
      + ` ${dos(f.getHours())}:${dos(f.getMinutes())}`;
  }
}
