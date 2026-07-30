#!/usr/bin/env node
'use strict';

/**
 * Claude Code UserPromptSubmit hook — CHIP UI triage.
 *
 * Cuando el prompt del usuario menciona algo visual (pantalla, botón, modal,
 * formulario, etc.) inyecta un recordatorio para que el agente declare el
 * triage del Kit UI antes de implementar. Si el prompt no toca UI, sale en
 * silencio (exit 0 sin output).
 *
 * Entrada (stdin, JSON): { prompt, session_id, cwd, ... }
 * Salida (stdout): texto a inyectar en el contexto del próximo turno.
 */

const fs = require('fs');

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const prompt = String(input.prompt || '').toLowerCase();

// Disparadores: palabras que casi siempre implican trabajo visual en este proyecto.
// La regex es laxa a propósito — preferimos falsos positivos (recordatorio extra,
// inofensivo) sobre falsos negativos (drift silencioso).
const triggers = /(pantalla|panel|bot[oó]n|modal|card|formulario|tabla|header|footer|cabezote|icono|estilo|color|paleta|tipograf|dise[ñn]|componente|p-input|p-select|p-button|p-dialog|p-toast|dropdown|sidebar|men[uú]|breadcrumb|filt(ro|ros)|tag|chip|badge|spinner|skeleton|stepper|tab|toolbar|navbar|hero|widget|tarjet|kit ui|govco|primeng|scss|\.html|\.scss)/;

if (!triggers.test(prompt)) {
  process.exit(0);
}

const reminder = [
  '',
  '════════════════════════════════════════════════════════════',
  '🚦 CHIP UI TRIAGE — esta tarea toca UI. Antes de implementar,',
  'declara explícitamente:',
  '',
  '  1. Sección del Kit UI 9.2 que aplica (docs/kit-ui-9-2.pdf).',
  '  2. Componente PrimeNG a usar — sin inventar ni cambiar de librería.',
  '  3. Desviaciones del DS que el pedido implica. Lista cada una y',
  '     propone la versión Kit-UI-aligned como default. Pide',
  '     confirmación antes de implementar la versión "desviada".',
  '  4. ¿Requiere dependencia npm nueva? Confirmar con el usuario',
  '     antes de tocar package.json (ver allowlist en CLAUDE.md).',
  '  5. Mínimo viable tablet (576–992px) — valida la interfaz contra',
  '     los 6 parámetros antes de darla por terminada:',
  '       a. Sin scroll horizontal del <body> a 768px.',
  '       b. Tablas anchas: scroll en su propio contenedor.',
  '       c. Grids/filtros: máx. 2 columnas en tablet.',
  '       d. Touch targets ≥ 44×44px (WCAG 2.5.5).',
  '       e. Breakpoints de la escala oficial (576/768/992/1200/1400),',
  '          vía mixins de src/styles/_breakpoints.scss — no valores ad-hoc.',
  '       f. Sin anchos fijos > 100%; usar max-width.',
  '',
  'Al terminar, recorre el checklist de chip-ui-rules antes de',
  'reportar la tarea como completa.',
  '════════════════════════════════════════════════════════════',
  '',
].join('\n');

process.stdout.write(reminder);
process.exit(0);
