import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
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

/**
 * Tabla del control de envío. Cada fila es un registro del detalle del proceso;
 * los que no generaron deficiencia se listan igual, con las columnas de
 * deficiencia vacías.
 *
 * El expediente (qué procesos tiene cada formulario y cuál es el alcance
 * activo) lo administra la pantalla de formularios, porque también lo escribe
 * la simulación de rechazo central. Aquí sólo se presentan y se editan los
 * comentarios — que se guardan sobre la misma fila que llega por @Input.
 */
@Component({
  selector: 'app-deficiencias-envio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    TextareaModule,
    DialogModule,
    BotonDescargarComponent,
  ],
  // Sin providers: el MessageService lo provee la pantalla de formularios,
  // que es la que tiene el <p-toast>. Uno propio dejaría los toasts mudos.
  templateUrl: './deficiencias-envio.component.html',
  styleUrl: './deficiencias-envio.component.scss',
})
export class DeficienciasEnvioComponent {
  /** Formulario abierto; `null` = se entró al control de envío sin elegir uno. */
  @Input() formulario: { codigo: string; nombre: string } | null = null;
  /** Filas del alcance activo. */
  @Input() visibles: DeficienciaEnvio[] = [];
  /** Total del expediente — distingue "sin deficiencias" de "ninguna en este alcance". */
  @Input() total = 0;
  @Input() alcance: 'ultimo' | 'historico' = 'historico';
  @Input() resumen = '';
  /**
   * Dónde se diligencia la justificación. Sólo cambia la presentación: las dos
   * variantes escriben en `comentarioGuardado` y exigen el mismo mínimo.
   */
  @Input() modo: 'modal' | 'grilla' = 'modal';
  /**
   * Registro de detalle más reciente del formulario. Es el único que admite
   * justificación: los anteriores ya cerraron y su comentario viajó con ese
   * envío, así que editarlos reescribiría historia.
   */
  @Input() ultimoProcesoId = 0;

  @Output() alcanceChange = new EventEmitter<'ultimo' | 'historico'>();

  readonly etapaDe = etapaDe;
  readonly estadoDe = estadoDe;

  constructor(private messageService: MessageService) {}

  // ── Justificación: se escribe en un modal, no en la celda ────────────────
  // Un textarea por fila obligaba a la columna a 300px y dejaba las filas de
  // alturas distintas. El modal le da espacio real al texto y deja la grilla
  // como grilla.

  /** Longitud mínima exigida a la justificación de una deficiencia. */
  readonly COMENTARIO_MIN = 30;

  /** Por qué una fila del histórico no deja escribir. */
  readonly AYUDA_SOLO_LECTURA =
    'Es un proceso anterior. Sólo se justifican las deficiencias del último proceso.';

  /**
   * True si la fila admite justificación: la deficiencia la exige Y pertenece
   * al último registro de detalle. Vale para las dos variantes — la regla es
   * del dato, no de dónde se escriba.
   */
  puedeDiligenciar(d: DeficienciaEnvio): boolean {
    return d.requiereComentario && d.idDetalleProceso === this.ultimoProcesoId;
  }

  /** True si el modal abierto es de consulta (fila de un proceso anterior). */
  get modalSoloLectura(): boolean {
    const d = this.deficienciaEnEdicion;
    return !!d && !this.puedeDiligenciar(d);
  }

  /** Deficiencia abierta en el modal (`null` = modal cerrado). */
  deficienciaEnEdicion: DeficienciaEnvio | null = null;

  /** Texto en edición. Vive aquí para que Cancelar no deje rastro en la fila. */
  borrador = '';
  borradorError = '';

  // ── Variante "en la grilla": el borrador vive en la fila ─────────────────

  /** True si el texto en edición difiere de lo último guardado. */
  comentarioPendiente(d: DeficienciaEnvio): boolean {
    return d.comentario.trim() !== d.comentarioGuardado;
  }

  /** Limpia el error mientras el usuario corrige, para no regañarlo al escribir. */
  onComentarioInput(d: DeficienciaEnvio): void {
    d.comentarioError = '';
  }

  /** Guarda desde la celda. Mismo mínimo que el modal. */
  guardarEnGrilla(d: DeficienciaEnvio): void {
    if (!this.puedeDiligenciar(d)) return;
    const texto = d.comentario.trim();
    if (texto.length < this.COMENTARIO_MIN) {
      d.comentarioError =
        `Escriba al menos ${this.COMENTARIO_MIN} caracteres: lleva ${texto.length}.`;
      this.avisoCorto(d.codMensaje);
      return;
    }
    d.comentario = texto;
    d.comentarioError = '';
    this.confirmar(d, texto);
  }

  // ── Variante "en modal": el borrador vive en el componente ───────────────

  abrirJustificacion(d: DeficienciaEnvio): void {
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

  // ── Mensaje: recortado por defecto, expandible a demanda ──────────────────
  // El texto es el del catálogo más lo que la regla le inyecta al invocarlo, y
  // eso lo hace de largo variable. Mostrarlo completo desalinea las filas.

  /**
   * A partir de aquí el mensaje se recorta y aparece "Ver más". Son las dos
   * líneas que caben en la columna: por encima, el texto empujaría la fila.
   */
  private readonly MENSAJE_LARGO = 85;

  /** Filas con el mensaje expandido, por registro de detalle + consecutivo. */
  private readonly expandidos = new Set<string>();

  private clave(d: DeficienciaEnvio): string {
    return `${d.idDetalleProceso}-${d.id}`;
  }

  esMensajeLargo(d: DeficienciaEnvio): boolean {
    return d.mensaje.length > this.MENSAJE_LARGO;
  }

  estaExpandido(d: DeficienciaEnvio): boolean {
    return this.expandidos.has(this.clave(d));
  }

  alternarMensaje(d: DeficienciaEnvio): void {
    const k = this.clave(d);
    if (!this.expandidos.delete(k)) this.expandidos.add(k);
  }

  /** Guarda la justificación abierta en el modal. */
  guardarJustificacion(): void {
    const d = this.deficienciaEnEdicion;
    if (!d || !this.puedeDiligenciar(d)) return;
    const texto = this.borrador.trim();
    if (texto.length < this.COMENTARIO_MIN) {
      this.borradorError =
        `Escriba al menos ${this.COMENTARIO_MIN} caracteres: lleva ${texto.length}.`;
      this.avisoCorto(d.codMensaje);
      return;
    }
    d.comentario = texto;
    this.confirmar(d, texto);
    this.cerrarJustificacion();
  }

  // ── Lo que comparten las dos variantes ───────────────────────────────────

  /**
   * Deja la justificación en la fila. Exige `COMENTARIO_MIN` caracteres: el
   * texto viaja a la CGN, y un "ok" de tres letras no justifica nada.
   */
  private confirmar(d: DeficienciaEnvio, texto: string): void {
    d.comentarioGuardado = texto;
    d.fechaComentario = this.ahora();
    this.messageService.add({
      severity: 'success',
      summary: 'Justificación guardada',
      detail: `Se guardó la justificación del mensaje ${d.codMensaje}.`,
      life: 3500,
    });
  }

  private avisoCorto(codMensaje: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Justificación demasiado corta',
      detail: `${codMensaje}: la justificación debe tener mínimo ${this.COMENTARIO_MIN} caracteres.`,
      life: 4500,
    });
  }

  // ── Exportación ───────────────────────────────────────────────────────────

  /** Columnas del archivo exportado, en el orden en que se ven en la tabla. */
  private readonly COLUMNAS_EXPORT = [
    'Id', 'Id detalle proceso', 'Etapa', 'Estado', 'Usuario del proceso',
    'Cód. mensaje', 'Mensaje', 'Permisible', 'Requiere comentario',
    'Comentario', 'Fecha del comentario',
  ];

  /**
   * Exporta lo que se está viendo (el alcance activo, no el expediente entero).
   * El CSV se genera aquí porque el navegador puede; los otros tres los arma el
   * backend, así que el mensaje lo dice sin prometer un archivo que aún no está.
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
        d.usuarioProceso,
        d.codMensaje,
        d.mensaje,
        d.id === null ? '' : (d.permisible ? 'Sí' : 'No'),
        d.id === null ? '' : (d.requiereComentario ? 'Sí' : 'No'),
        d.comentarioGuardado,
        d.fechaComentario,
      ]),
    ];
    const csv = filas
      .map(fila => fila.map(c => `"${c.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
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
