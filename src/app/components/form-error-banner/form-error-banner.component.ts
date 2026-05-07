import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MessageModule } from 'primeng/message';

/**
 * Banner persistente de errores de formulario.
 *
 * Patrón Kit UI GOV.CO + WCAG 2.1: cuando un usuario intenta enviar un
 * formulario inválido, mostrar un banner contextual (no un toast efímero)
 * que liste los errores y se mantenga visible hasta que se corrijan.
 *
 * Reemplaza el patrón anterior de `p-toast` con severity="warn" para
 * validación de formulario.
 *
 * Uso típico:
 * ```html
 * <app-form-error-banner
 *   [visible]="formSubmitted && errors.length > 0"
 *   [errors]="errors" />
 * ```
 *
 * El componente:
 * - Usa `p-message severity="error"` (rojo, mismo del DS).
 * - Anuncia los errores con `aria-live="assertive"` para lectores de pantalla.
 * - Lista cada error individualmente debajo del resumen.
 * - Se oculta cuando `visible` es false (no ocupa espacio).
 */
@Component({
  selector: 'app-form-error-banner',
  standalone: true,
  imports: [CommonModule, MessageModule],
  templateUrl: './form-error-banner.component.html',
  styleUrl: './form-error-banner.component.scss',
})
export class FormErrorBannerComponent {
  /** Lista de mensajes de error a mostrar. */
  @Input() errors: string[] = [];

  /** Si es false, el banner no se renderiza. */
  @Input() visible = false;

  /**
   * Texto principal del banner. Si no se pasa, se autogenera con el conteo:
   * "Hay 3 campos por corregir" / "Hay 1 campo por corregir".
   */
  @Input() summary?: string;

  get computedSummary(): string {
    if (this.summary) return this.summary;
    const n = this.errors.length;
    if (n === 0) return 'Revise los datos del formulario.';
    if (n === 1) return 'Hay 1 campo por corregir.';
    return `Hay ${n} campos por corregir.`;
  }
}
