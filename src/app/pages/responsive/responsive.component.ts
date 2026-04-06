import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';

@Component({
  selector: 'app-responsive',
  standalone: true,
  imports: [CommonModule, DividerModule, CodeBlockComponent],
  templateUrl: './responsive.component.html',
  styleUrl: './responsive.component.scss',
})
export class ResponsiveComponent {

  // ── Section 2: Grid de 12 columnas ──
  codeGrid = `<!-- Grid de 12 columnas -->
<div class="chip-row">
  <div class="chip-col-12">col-12 (100%)</div>
</div>
<div class="chip-row">
  <div class="chip-col-6">col-6 (50%)</div>
  <div class="chip-col-6">col-6 (50%)</div>
</div>
<div class="chip-row">
  <div class="chip-col-4">col-4 (33.3%)</div>
  <div class="chip-col-4">col-4 (33.3%)</div>
  <div class="chip-col-4">col-4 (33.3%)</div>
</div>
<div class="chip-row">
  <div class="chip-col-3">col-3</div>
  <div class="chip-col-3">col-3</div>
  <div class="chip-col-3">col-3</div>
  <div class="chip-col-3">col-3</div>
</div>`;

  codeGridScss = `/* Grid base */
.chip-row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8px;
}

/* Columnas de 1 a 12 */
@for $i from 1 through 12 {
  .chip-col-#{$i} {
    flex: 0 0 calc(#{$i} / 12 * 100%);
    max-width: calc(#{$i} / 12 * 100%);
    padding: 0 8px;
  }
}

/* Responsive: en móvil todas las columnas son 100% */
@media (max-width: 576px) {
  [class*="chip-col-"] {
    flex: 0 0 100%;
    max-width: 100%;
  }
}

/* Tablet: máximo 2 columnas */
@media (min-width: 577px) and (max-width: 768px) {
  .chip-col-3,
  .chip-col-4 {
    flex: 0 0 50%;
    max-width: 50%;
  }
}`;

  // ── Section 3: Comportamiento de componentes ──
  codeNavResponsive = `/* Navegación: colapsa a hamburguesa en móvil */
.app-header__nav {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .app-header__nav {
    display: none; /* Se oculta y se muestra el botón hamburguesa */
  }
  .app-header__hamburger {
    display: block;
  }
}`;

  codeCardsResponsive = `/* Cards: de 3 columnas a 1 en móvil */
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 992px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}`;

  // ── Section 4: Media queries ──
  codeMediaQueries = `/* ═══════════════════════════════════════
   CHIP 2.0 — Media Query Patterns
   Enfoque mobile-first
   ═══════════════════════════════════════ */

/* ── Mobile (base, < 576px) ── */
/* Los estilos base se escriben sin media query */

/* ── Tablet (>= 576px) ── */
@media (min-width: 576px) {
  .container { padding: 0 24px; }
}

/* ── Desktop small (>= 768px) ── */
@media (min-width: 768px) {
  .container { padding: 0 32px; }
  .form-grid { grid-template-columns: 1fr 1fr; }
}

/* ── Desktop (>= 992px) ── */
@media (min-width: 992px) {
  .container { max-width: 960px; }
  .card-grid { grid-template-columns: repeat(3, 1fr); }
}

/* ── Large desktop (>= 1200px) ── */
@media (min-width: 1200px) {
  .container { max-width: 1200px; }
}`;

  codeMixins = `/* Mixins SCSS reutilizables */
@mixin mobile {
  @media (max-width: 575.98px) { @content; }
}

@mixin tablet {
  @media (min-width: 576px) and (max-width: 767.98px) { @content; }
}

@mixin desktop-sm {
  @media (min-width: 768px) and (max-width: 991.98px) { @content; }
}

@mixin desktop {
  @media (min-width: 992px) and (max-width: 1199.98px) { @content; }
}

@mixin large {
  @media (min-width: 1200px) { @content; }
}

/* Uso: */
.sidebar {
  width: 100%;

  @include tablet {
    width: 280px;
  }

  @include desktop {
    width: 320px;
  }
}`;

  // ── Section 5: Buenas prácticas ──
  codeBuenasPracticas = `/* ✓ Usar unidades relativas */
.heading   { font-size: 1.5rem; }     /* ≈ 24px */
.paragraph { font-size: 0.875rem; }   /* ≈ 14px */
.spacing   { margin-bottom: 1.5em; }

/* ✓ min-width y max-width en lugar de width fijo */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.sidebar {
  min-width: 200px;
  max-width: 320px;
}

/* ✓ Tamaño mínimo de touch targets: 44×44px */
.btn,
.nav-link,
.icon-button {
  min-width: 44px;
  min-height: 44px;
  padding: 10px 16px;
}

/* ✓ Imágenes responsivas */
img {
  max-width: 100%;
  height: auto;
}`;
}
