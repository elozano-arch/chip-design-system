import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';

/**
 * Árbol jerárquico de permisos con cascada y paginación por nivel.
 *
 * Patrón pedido por Diana (CHIP):
 * - Cada nodo se renderiza como una card con checkbox + label + chevron
 *   expand/collapse.
 * - Cuando el padre tiene más de 10 hijos, los primeros 10 se muestran
 *   y el resto queda detrás de un botón "Mostrar más" (suma 10 cada vez).
 * - Cascada: marcar el padre marca todos los descendientes; marcar un
 *   hijo deja al padre en estado parcial (rayita a la mitad). Igual al
 *   comportamiento nativo de PrimeNG TreeTable selectionMode="checkbox".
 *
 * Reusable también en Formularios (mismo patrón visual y de cascada).
 *
 * Uso:
 * ```html
 * <app-permisos-tree
 *   [nodes]="permissionsTree"
 *   [(selectedKeys)]="selectedKeys" />
 * ```
 */
@Component({
  selector: 'app-permisos-tree',
  standalone: true,
  imports: [CommonModule, FormsModule, CheckboxModule, ButtonModule],
  templateUrl: './permisos-tree.component.html',
  styleUrl: './permisos-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class PermisosTreeComponent {
  /** Árbol de permisos. Cada nodo debe tener `key` única y `data.nombre`. */
  @Input() nodes: TreeNode<{ codigo?: string; nombre: string }>[] = [];

  /**
   * Set de keys actualmente seleccionadas. Two-way binding via
   * `[(selectedKeys)]`. Solo contiene los nodos *explícitamente* marcados;
   * el estado parcial se infiere consultando los descendientes.
   */
  @Input() selectedKeys = new Set<string>();
  @Output() selectedKeysChange = new EventEmitter<Set<string>>();

  /** Profundidad para indentación. El padre raíz arranca en 0. */
  @Input() depth = 0;

  /** Cuántos hijos mostrar inicialmente por nodo padre. */
  readonly INITIAL_LIMIT = 10;
  /** Cuántos hijos sumar al hacer click en "Mostrar más". */
  readonly LOAD_INCREMENT = 10;

  /** Set local de keys expandidas (estado de UI, no se propaga). */
  expandedKeys = new Set<string>();

  /** Map local: key del padre → cuántos hijos mostrar actualmente. */
  showLimits = new Map<string, number>();

  // ── Estado de expand/collapse ──
  isExpanded(key: string | undefined): boolean {
    return !!key && this.expandedKeys.has(key);
  }

  toggleExpand(key: string | undefined) {
    if (!key) return;
    if (this.expandedKeys.has(key)) {
      this.expandedKeys.delete(key);
    } else {
      this.expandedKeys.add(key);
    }
  }

  // ── Visibilidad / paginación de hijos ──
  visibleChildren(node: TreeNode<{ nombre: string }>): TreeNode<{ nombre: string }>[] {
    if (!node.children || !node.key) return [];
    const limit = this.showLimits.get(node.key) ?? this.INITIAL_LIMIT;
    return node.children.slice(0, limit);
  }

  hasMoreChildren(node: TreeNode<{ nombre: string }>): boolean {
    if (!node.children || !node.key) return false;
    const limit = this.showLimits.get(node.key) ?? this.INITIAL_LIMIT;
    return node.children.length > limit;
  }

  hiddenCount(node: TreeNode<{ nombre: string }>): number {
    if (!node.children || !node.key) return 0;
    const limit = this.showLimits.get(node.key) ?? this.INITIAL_LIMIT;
    return Math.max(0, node.children.length - limit);
  }

  loadMore(node: TreeNode<{ nombre: string }>) {
    if (!node.key) return;
    const current = this.showLimits.get(node.key) ?? this.INITIAL_LIMIT;
    this.showLimits.set(node.key, current + this.LOAD_INCREMENT);
  }

  // ── Estado del checkbox (marcado / parcial) ──
  // Nota: `selectedKeys` SOLO almacena las hojas marcadas. El estado de los
  // padres se computa: marcado = todas las hojas descendientes marcadas,
  // parcial = algunas pero no todas. Esto coincide con la lógica nativa de
  // PrimeNG TreeTable y evita inconsistencias entre padre y hijos.

  /**
   * Marcado total: hoja en selectedKeys, o padre cuyas hojas-descendientes
   * están todas marcadas.
   */
  isChecked(node: TreeNode<{ nombre: string }>): boolean {
    if (!node.key) return false;
    if (!node.children?.length) {
      // Hoja
      return this.selectedKeys.has(node.key);
    }
    // Padre: marcado si TODAS las hojas debajo están seleccionadas.
    return this.allLeavesSelected(node);
  }

  /**
   * Marcado parcial ("rayita a la mitad"): el nodo no está completamente
   * marcado pero al menos una hoja descendiente sí lo está.
   */
  isPartial(node: TreeNode<{ nombre: string }>): boolean {
    if (!node.key) return false;
    if (!node.children?.length) return false;
    if (this.isChecked(node)) return false;
    return this.hasAnySelectedDescendant(node);
  }

  private allLeavesSelected(node: TreeNode<{ nombre: string }>): boolean {
    if (!node.children?.length) {
      return !!node.key && this.selectedKeys.has(node.key);
    }
    for (const child of node.children) {
      if (!this.allLeavesSelected(child)) return false;
    }
    return true;
  }

  private hasAnySelectedDescendant(node: TreeNode<{ nombre: string }>): boolean {
    if (!node.children?.length) {
      return !!node.key && this.selectedKeys.has(node.key);
    }
    for (const child of node.children) {
      if (this.hasAnySelectedDescendant(child)) return true;
    }
    return false;
  }

  // ── Toggle de selección con cascada ──
  toggleCheck(node: TreeNode<{ nombre: string }>) {
    if (!node.key) return;
    const next = new Set(this.selectedKeys);
    const wasChecked = this.isChecked(node);
    // Marca o desmarca recursivamente solo las HOJAS bajo este nodo.
    this.markLeavesUnder(node, !wasChecked, next);
    this.selectedKeys = next;
    this.selectedKeysChange.emit(next);
  }

  /** Recorre el subárbol y marca/desmarca solo las hojas. Padres se infieren. */
  private markLeavesUnder(
    node: TreeNode<{ nombre: string }>,
    mark: boolean,
    keys: Set<string>,
  ) {
    if (!node.children?.length) {
      if (node.key) {
        if (mark) keys.add(node.key);
        else keys.delete(node.key);
      }
      return;
    }
    for (const child of node.children) {
      this.markLeavesUnder(child, mark, keys);
    }
  }

  /** Helper para el HTML — TreeNode no expone children con tipo inferido. */
  hasChildren(node: TreeNode<{ nombre: string }>): boolean {
    return !!node.children?.length;
  }

  /** Propaga cambios de las instancias hijas hacia arriba. */
  onChildSelectionChange(keys: Set<string>) {
    this.selectedKeys = keys;
    this.selectedKeysChange.emit(keys);
  }
}
