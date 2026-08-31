import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';

/** Formatos soportados por el botón estándar "Descargar". */
export type DownloadFormatId = 'csv' | 'xlsx' | 'pdf' | 'txt';

interface DownloadFormat {
  label: string;
  icon: string;
  format: DownloadFormatId;
  /** Restricciones del formato: van en el tooltip del icono `?` del item. */
  info: string;
}

/**
 * Botón "Descargar" estándar del DS: un trigger con chevron que abre el menú
 * de los cuatro formatos, cada uno con el detalle de sus limitaciones.
 *
 * Vive aquí y no en cada pantalla porque el catálogo de formatos y sus límites
 * son los mismos en todas: duplicarlo es garantizar que se desincronicen.
 * Quien lo usa sólo decide qué hacer con el formato elegido.
 */
@Component({
  selector: 'app-boton-descargar',
  standalone: true,
  imports: [ButtonModule, MenuModule, TooltipModule],
  templateUrl: './boton-descargar.component.html',
  styleUrl: './boton-descargar.component.scss',
})
export class BotonDescargarComponent {
  @Input() label = 'Descargar';
  @Input() ariaLabel = 'Descargar en distintos formatos';
  /** `small` para toolbars densas; vacío para el tamaño normal. */
  @Input() size: 'small' | undefined;

  /** Formato elegido en el menú. */
  @Output() formato = new EventEmitter<DownloadFormatId>();

  private readonly formatos: readonly DownloadFormat[] = [
    { label: 'CSV — Valores separados por comas', icon: 'pi pi-file', format: 'csv',
      info: 'Sin límite de filas. Encoding UTF-8. Encabezados incluidos.' },
    { label: 'Excel (XLSX)', icon: 'pi pi-file-excel', format: 'xlsx',
      info: 'Máximo 50 MB por archivo. Hasta 1.048.576 filas por hoja. Múltiples hojas permitidas.' },
    { label: 'PDF', icon: 'pi pi-file-pdf', format: 'pdf',
      info: 'Máximo 10.000 líneas por archivo. División automática si excede el límite.' },
    { label: 'TXT', icon: 'pi pi-file', format: 'txt',
      info: 'Sin límite de filas. Encoding UTF-8. Formato de texto plano.' },
  ];

  // El texto del info viaja en `data` (campo libre del MenuItem) y se enlaza
  // con [pTooltip] sólo sobre el icono `?`: si fuera del item entero, PrimeNG
  // renderizaría un tooltip nativo encima y quedarían dos.
  readonly items: MenuItem[] = this.formatos.map(f => ({
    label: f.label,
    icon: f.icon,
    command: () => this.formato.emit(f.format),
    data: { info: f.info },
  }));
}
