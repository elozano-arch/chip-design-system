import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';

import {
  DeficienciaEnvio,
  etapaDe,
  tipoDeficienciaDe,
} from '../catalogo-proceso';

/**
 * Tabla de deficiencias del control de envío.
 *
 * El expediente (qué deficiencias tiene cada formulario y cuál es el alcance
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

  @Output() alcanceChange = new EventEmitter<'ultimo' | 'historico'>();

  readonly etapaDe = etapaDe;
  readonly tipoDeficienciaDe = tipoDeficienciaDe;

  constructor(private messageService: MessageService) {}

  /** Longitud mínima exigida al comentario de una deficiencia. */
  readonly COMENTARIO_MIN = 30;

  /** True si el texto en edición difiere de lo último guardado. */
  comentarioPendiente(d: DeficienciaEnvio): boolean {
    return d.comentario.trim() !== d.comentarioGuardado;
  }

  /** Limpia el error mientras el usuario corrige, para no regañarlo al escribir. */
  onComentarioInput(d: DeficienciaEnvio): void {
    d.comentarioError = '';
  }

  /**
   * Guarda el comentario de una deficiencia. Exige `COMENTARIO_MIN` caracteres:
   * la justificación viaja a la CGN, y un "ok" de tres letras no justifica nada.
   */
  guardarComentario(d: DeficienciaEnvio): void {
    const texto = d.comentario.trim();
    if (texto.length < this.COMENTARIO_MIN) {
      d.comentarioError =
        `Escriba al menos ${this.COMENTARIO_MIN} caracteres: lleva ${texto.length}.`;
      this.messageService.add({
        severity: 'warn',
        summary: 'Comentario demasiado corto',
        detail: `${d.codMensaje}: la justificación debe tener mínimo ${this.COMENTARIO_MIN} caracteres.`,
        life: 4500,
      });
      return;
    }
    d.comentario = texto;
    d.comentarioGuardado = texto;
    d.comentarioError = '';
    this.messageService.add({
      severity: 'success',
      summary: 'Comentario guardado',
      detail: `Se guardó la justificación del mensaje ${d.codMensaje}.`,
      life: 3500,
    });
  }
}
