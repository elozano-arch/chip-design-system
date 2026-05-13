import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';

/**
 * Cada criterio de la propuesta de diseño para el TreeTable de conceptos.
 * - `problema`: lo que se ve hoy y por qué incomoda al usuario.
 * - `recomendacion`: el ajuste sugerido (objetivo, accionable).
 * Texto en lenguaje plano para que cualquier stakeholder pueda discutirlo.
 */
interface Criterio {
  id: number;
  icono: string;
  titulo: string;
  problema: string;
  recomendacion: string;
  impacto: 'alto' | 'medio' | 'bajo';
}

/**
 * Nodo del mockup visual. Tres tipos:
 *  - 'padre': fila destacada (bold, fondo cobalto).
 *  - 'hijo': fila normal (variables / hojas).
 *  - 'pager': fila de paginador inline, anclada a un padre y con la
 *    indentación de ese padre — refleja la propuesta de Manuel.
 */
interface NodoMock {
  codigoCorto?: string;
  codigoCompleto?: string;
  nombre?: string;
  nivel: number;
  tipo: 'padre' | 'hijo' | 'pager';
  valor?: string;
  estado?: 'Si' | 'No';
  expandido?: boolean;
  /** True si el padre es el "activo" — recibe color de selección. */
  activo?: boolean;
  /**
   * Solo para tipo 'pager': info compacta de paginación.
   * Refleja la simplificación de Manuel — no repetimos el nombre del
   * padre porque ya está indicado por la indentación + el color del
   * padre activo.
   */
  pagerInfo?: { paginaActual: number; totalPaginas: number };
}

@Component({
  selector: 'app-propuesta-diseno',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, IconFieldModule, InputIconModule,
    TagModule, TooltipModule, MessageModule,
    AppBreadcrumbComponent,
  ],
  templateUrl: './propuesta-diseno.component.html',
  styleUrl: './propuesta-diseno.component.scss',
})
export class PropuestaDisenoComponent {
  /**
   * Los 6 criterios objetivos para ajustar el TreeTable de conceptos.
   * Ordenados por impacto en la experiencia: códigos largos primero
   * (es lo que más rompe la lectura), columnas al final (oportunidad).
   */
  readonly criterios: Criterio[] = [
    {
      id: 1,
      icono: 'pi pi-eye',
      titulo: 'Códigos cortos con detalle en tooltip',
      problema: 'Los códigos tipo "N1-01-p0-i0-p0-i5-p0-i0-p0-002" son tan largos que el usuario no puede leer rápido la tabla.',
      recomendacion: 'Mostrar solo el último tramo del código (ej. "p0-002") y dejar el código completo en un tooltip cuando se pasa el mouse. La jerarquía ya la indica la indentación.',
      impacto: 'alto',
    },
    {
      id: 2,
      icono: 'pi pi-sitemap',
      titulo: 'Jerarquía visual entre padres e hijos',
      problema: 'Todas las filas se ven iguales. Solo cambia la indentación, así que es difícil distinguir un concepto padre de una subcuenta hija.',
      recomendacion: 'Padres en negrita con fondo gris claro, hijos en regular sobre blanco, y líneas verticales suaves que conecten cada padre con sus hijos.',
      impacto: 'alto',
    },
    {
      id: 3,
      icono: 'pi pi-search',
      titulo: 'Un solo buscador, no uno por padre',
      problema: 'Hoy aparece un campo "Buscar..." debajo de cada padre expandido. Si se abren varios, la pantalla queda llena de buscadores y se vuelve confusa.',
      recomendacion: 'Un buscador global arriba de la tabla que busque en todo el árbol, o que cada padre tenga un ícono de lupa y el input solo aparezca cuando el usuario lo pide.',
      impacto: 'medio',
    },
    {
      id: 4,
      icono: 'pi pi-directions',
      titulo: 'Breadcrumb del nodo actual',
      problema: 'Cuando el usuario baja muy profundo en el árbol, pierde de vista en qué rama está. Solo ve la fila inmediata sin saber el camino completo.',
      recomendacion: 'En la parte superior fija (sticky) mostrar una ruta tipo "Concepto > Subcuenta 1 > Subcuenta 2 > [actual]" que se actualice según el nivel donde está trabajando.',
      impacto: 'medio',
    },
    {
      id: 5,
      icono: 'pi pi-align-left',
      titulo: 'Paginador indentado al padre + color en el padre activo',
      problema: 'Si el paginador flota suelto al final, no se sabe a qué padre pertenece. Y cuando hay varios sub-menús expandidos al tiempo, se necesitan varios paginadores — uno por cada padre.',
      recomendacion: 'Cada paginador es una fila minimalista (← Página 1 de 3 →) indentada al nivel de su padre. El padre activo se resalta con color (fondo cobalto + borde izquierdo). Así no es necesario repetir el nombre del padre en el paginador — la indentación y el color ya lo indican.',
      impacto: 'alto',
    },
    {
      id: 6,
      icono: 'pi pi-arrows-h',
      titulo: 'Paginación también de columnas',
      problema: 'Un formulario puede tener 60 o más variables. Si todas se muestran como columnas, no caben en pantalla y el usuario tiene que hacer scroll horizontal infinito.',
      recomendacion: 'Igual que paginamos filas por padre, paginar también las columnas (mostrar 5 o 6 a la vez, navegar con flechas). Mismo patrón que aplicamos en la pantalla de Formularios.',
      impacto: 'bajo',
    },
  ];

  // ─────────────────────────────────────────────────────────────────────
  // Mockup visual al final: ejemplo aplicando los criterios.
  // Es ilustrativo (no funcional) — solo para que el equipo de desarrollo
  // y los stakeholders tengan una referencia visual concreta.
  // ─────────────────────────────────────────────────────────────────────
  busquedaGlobal = '';

  readonly breadcrumbActivo: string[] = ['Concepto', 'Subcuenta 1', 'Subcuenta 2'];

  /**
   * Estructura jerárquica del mockup. Refleja el feedback de Manuel:
   * cada padre con muchos hijos tiene SU paginador inline al final de
   * sus hijos, indentado al nivel del padre. Así, cuando hay varios
   * sub-menús expandidos al tiempo, hay varios paginadores visibles
   * y cada uno está claramente anclado a su padre.
   */
  /**
   * Estructura jerárquica del mockup. Aplica el feedback de Manuel:
   * - El padre "activo" se marca con color (border-left + fondo).
   * - El paginador es minimalista: solo "Página X de Y" + flechas,
   *   indentado al nivel del padre. No repite el nombre del padre
   *   porque la indentación + el color del padre ya lo indican.
   */
  readonly nodosMockup: NodoMock[] = [
    // Padre raíz
    { codigoCorto: 'p0-001', codigoCompleto: 'N1-01-p0-i0-p0-i5-p0-001', nombre: 'Concepto principal', nivel: 0, tipo: 'padre', valor: '93,00', estado: 'No', expandido: true },

    // Sub-padre nivel 1
    { codigoCorto: 'p0-001', codigoCompleto: 'N1-01-p0-i0-p0-i5-p0-i0-p0-001', nombre: 'Subcuenta 1', nivel: 1, tipo: 'padre', valor: '92,00', estado: 'No', expandido: true },

    // Sub-padre nivel 2 — marcado como ACTIVO (recibe color)
    { codigoCorto: 'p0-001', codigoCompleto: 'N1-01-p0-i0-p0-i5-p0-i0-p0-i0-p0-001', nombre: 'Subcuenta 2', nivel: 2, tipo: 'padre', valor: '67,00', estado: 'No', expandido: true, activo: true },
    { codigoCorto: 'p0-001', codigoCompleto: 'N1-01-p0-i0-p0-i5-p0-i0-p0-i0-p0-i0-p0-001', nombre: 'Variable 1', nivel: 3, tipo: 'hijo', valor: '79,00', estado: 'Si' },
    { codigoCorto: 'p0-002', codigoCompleto: 'N1-01-p0-i0-p0-i5-p0-i0-p0-i0-p0-i0-p0-002', nombre: 'Variable 2', nivel: 3, tipo: 'hijo', valor: '80,00', estado: 'No' },
    { codigoCorto: 'p0-003', codigoCompleto: 'N1-01-p0-i0-p0-i5-p0-i0-p0-i0-p0-i0-p0-003', nombre: 'Variable 3', nivel: 3, tipo: 'hijo', valor: '65,00', estado: 'No' },
    { codigoCorto: 'p0-004', codigoCompleto: 'N1-01-p0-i0-p0-i5-p0-i0-p0-i0-p0-i0-p0-004', nombre: 'Variable 4', nivel: 3, tipo: 'hijo', valor: '66,00', estado: 'No' },
    { codigoCorto: 'p0-005', codigoCompleto: 'N1-01-p0-i0-p0-i5-p0-i0-p0-i0-p0-i0-p0-005', nombre: 'Variable 5', nivel: 3, tipo: 'hijo', valor: '67,00', estado: 'Si' },
    // ↓ Paginador de Subcuenta 2 — minimalista, indentado al nivel 2 (su padre)
    { nivel: 2, tipo: 'pager', activo: true, pagerInfo: { paginaActual: 1, totalPaginas: 3 } },

    // Otro hijo de Subcuenta 1, después del bloque anidado anterior
    { codigoCorto: 'p0-002', codigoCompleto: 'N1-01-p0-i0-p0-i5-p0-i0-p0-i0-p0-002', nombre: 'Subcuenta 3', nivel: 2, tipo: 'hijo', valor: '54,00', estado: 'No' },
    // ↓ Paginador de Subcuenta 1 — minimalista, indentado al nivel 1 (su padre)
    { nivel: 1, tipo: 'pager', pagerInfo: { paginaActual: 1, totalPaginas: 2 } },
  ];

  /** Cada nivel suma 24px de indentación (similar al patrón de árboles). */
  indentacion(nivel: number): string {
    return `${nivel * 24}px`;
  }

  impactoSeverity(impacto: 'alto' | 'medio' | 'bajo'): 'danger' | 'warn' | 'info' {
    return impacto === 'alto' ? 'danger' : impacto === 'medio' ? 'warn' : 'info';
  }
}
