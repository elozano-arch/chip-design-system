#!/usr/bin/env node
'use strict';

/**
 * Claude Code Stop hook — CHIP UI code-level deviations check.
 *
 * Al cerrar el turno, escanea los archivos UI modificados en el working tree
 * buscando desviaciones objetivas a nivel de CÓDIGO contra el DS. Si encuentra
 * algo, imprime un reporte con archivo, línea y regla violada. Silencio si
 * no hay archivos UI modificados o no hay desvíos.
 *
 * Alcance INTENCIONAL (sólo código, sin requerir validación humana):
 *   ✓ Hex hardcoded fuera del registro de tokens
 *   ✓ Tipografías fuera de Nunito Sans / Verdana
 *   ✓ Anti-patterns de CLAUDE.md (<div (click)>, <ul> padding-left:20px)
 *   ✓ p-button solo-icono sin aria-label
 *   ✓ imports fuera de la allowlist
 */

const fs = require('fs');
const { execSync } = require('child_process');

// ───────────────────────────────────────────────────────────
// 1. Archivos UI candidatos (working tree)
// ───────────────────────────────────────────────────────────
let candidates;
try {
  const modified = execSync('git diff --name-only HEAD', { encoding: 'utf8' })
    .split('\n').filter(Boolean);
  const untracked = execSync('git ls-files --others --exclude-standard', { encoding: 'utf8' })
    .split('\n').filter(Boolean);
  candidates = [...new Set([...modified, ...untracked])];
} catch {
  process.exit(0); // no es repo git o git falló
}

// src/styles.scss es el registro de tokens — hex y font-family son válidos ahí.
// public/assets/correos/* son plantillas de email — usan inline CSS por diseño.
const SKIP_FILES = new Set(['src/styles.scss']);
const uiFiles = candidates.filter(f =>
  f.startsWith('src/')
  && /\.(html|scss|css)$|\.component\.ts$/.test(f)
  && !SKIP_FILES.has(f)
  && !f.startsWith('src/assets/correos/')
);

if (uiFiles.length === 0) process.exit(0);

// ───────────────────────────────────────────────────────────
// 2. Allowlist de dependencias (alineada con CLAUDE.md)
// ───────────────────────────────────────────────────────────
const ALLOWED_DEPS = new Set([
  '@angular/core', '@angular/common', '@angular/forms', '@angular/router',
  '@angular/platform-browser', '@angular/platform-browser-dynamic',
  '@angular/animations', '@angular/cli', '@angular/compiler',
  '@angular/compiler-cli', '@angular/build',
  'primeicons', 'rxjs', 'zone.js', 'tslib',
]);
const ALLOWED_DEP_PREFIXES = ['@angular/', 'primeng/', 'rxjs/', 'primeicons/'];

const isAllowedDep = (mod) => {
  if (mod.startsWith('.') || mod.startsWith('/') || mod.startsWith('@/')) return true;
  if (ALLOWED_DEPS.has(mod)) return true;
  return ALLOWED_DEP_PREFIXES.some(p => mod.startsWith(p));
};

const FONT_TOKEN_OR_NAME = /var\(--font-(heading|body)\)|Nunito Sans|Verdana|inherit|monospace/i;

// ───────────────────────────────────────────────────────────
// 3. Escaneo
// ───────────────────────────────────────────────────────────
const findings = [];
const flag = (file, line, rule, sample) => {
  findings.push({ file, line, rule, sample: String(sample).trim().slice(0, 110) });
};

for (const f of uiFiles) {
  if (!fs.existsSync(f)) continue;
  const lines = fs.readFileSync(f, 'utf8').split('\n');

  if (f.endsWith('.scss') || f.endsWith('.css')) {
    lines.forEach((line, i) => {
      if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) return;
      // Declaración de variable CSS (--chip-*: #...) — válido
      if (/^\s*--[\w-]+\s*:/.test(line)) return;

      if (/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3,5})?\b/.test(line)) {
        flag(f, i + 1, 'hex hardcoded — usar var(--chip-*)', line);
      }
      if (/font-family\s*:/i.test(line) && !FONT_TOKEN_OR_NAME.test(line)) {
        flag(f, i + 1, 'font-family fuera de tokens — usar var(--font-heading|body)', line);
      }
    });
  }

  if (f.endsWith('.html')) {
    lines.forEach((line, i) => {
      if (/<div\b[^>]*\(click\)/i.test(line)) {
        flag(f, i + 1, '<div (click)> — usar <button> (o role="button"+tabindex+keydown)', line);
      }
      if (/<ul\b[^>]*padding-left\s*:\s*20px/i.test(line)) {
        flag(f, i + 1, '<ul> con padding-left:20px — usar lista con icono pi-check', line);
      }
      const btn = line.match(/<p-button\b[^>]*\bicon\s*=/i);
      if (btn && !/\blabel\s*=/i.test(line)
          && !/(ariaLabel|aria-label|\[attr\.aria-label\])/i.test(line)) {
        flag(f, i + 1, 'p-button solo-icono sin aria-label (CLAUDE.md §Iconos)', line);
      }
    });
  }

  if (f.endsWith('.component.ts')) {
    const importRe = /^\s*import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/gm;
    const content = lines.join('\n');
    let m;
    while ((m = importRe.exec(content)) !== null) {
      const mod = m[1];
      if (!isAllowedDep(mod)) {
        const lineIdx = content.slice(0, m.index).split('\n').length - 1;
        flag(f, lineIdx + 1, `import fuera de allowlist: ${mod}`, lines[lineIdx] || mod);
      }
    }
  }
}

// ───────────────────────────────────────────────────────────
// 4. Output — silencio si limpio
// ───────────────────────────────────────────────────────────
if (findings.length === 0) process.exit(0);

const out = [
  '',
  '════════════════════════════════════════════════════════════',
  `⚠️  CHIP UI — ${findings.length} posible(s) desvío(s) de código detectado(s)`,
  '════════════════════════════════════════════════════════════',
];

const byFile = findings.reduce((acc, x) => ((acc[x.file] ||= []).push(x), acc), {});
for (const [file, items] of Object.entries(byFile)) {
  out.push('', `📄 ${file}`);
  for (const it of items) {
    out.push(`   L${it.line}  ${it.rule}`);
    out.push(`         › ${it.sample}`);
  }
}

out.push('');
out.push('Justifica o corrige cada desvío antes de reportar terminado.');
out.push('════════════════════════════════════════════════════════════');
out.push('');

process.stdout.write(out.join('\n'));
process.exit(0);
