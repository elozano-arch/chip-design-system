import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { StepperModule } from 'primeng/stepper';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import { PERIODOS_TRIMESTRALES } from '../../../services/periodos';

type EstadoFormulario = 'pendiente' | 'cargado' | 'validado' | 'con-errores';
type ModoPaso1 = 'consultar' | 'importar';

interface Deficiencia {
  fila: number;
  campo: string;
  valor: string;
  regla: string;
  sugerencia: string;
}

interface FormularioEnvio {
  id: string;
  codigo: string;
  nombre: string;
  estado: EstadoFormulario;
  registros: number;
  ultimaCarga: string | null;
  origen: 'Manual' | 'Importado' | '—';
  deficiencias: Deficiencia[];
}

interface OpcionSelect {
  label: string;
  value: string;
}

interface EstadoGuardado {
  paso: number;
  anio: string | null;
  entidad: string | null;
  categoria: string | null;
  periodo: string | null;
  modoPaso1: ModoPaso1;
  adjuntoEnviado: boolean;
}

const STORAGE_KEY = 'chip-flujo-envio-state';

@Component({
  selector: 'app-flujo-envio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    StepperModule,
    TableModule,
    TagModule,
    DialogModule,
    TooltipModule,
    MessageModule,
    CheckboxModule,
    InputTextModule,
    TextareaModule,
    IconFieldModule,
    InputIconModule,
    ProgressBarModule,
    ToastModule,
    AppBreadcrumbComponent,
  ],
  providers: [MessageService],
  templateUrl: './flujo-envio.component.html',
  styleUrl: './flujo-envio.component.scss',
})
export class FlujoEnvioComponent {
  /* ─────────── Stepper ─────────── */
  pasoActivo = signal<number>(1);

  /* ─────────── Paso 1 — Contexto ─────────── */
  readonly anios: OpcionSelect[] = [
    { label: '2026', value: '2026' },
    { label: '2025', value: '2025' },
    { label: '2024', value: '2024' },
  ];

  readonly entidades: OpcionSelect[] = [
    { label: 'U.A.E. Contaduría General de la Nación', value: 'CGN' },
    { label: 'Ministerio de Hacienda y Crédito Público', value: 'MHCP' },
    { label: 'Departamento Nacional de Planeación', value: 'DNP' },
    { label: 'Gobernación de Antioquia', value: 'GOB_ANT' },
    { label: 'Alcaldía Mayor de Bogotá', value: 'ALC_BOG' },
  ];

  readonly categorias: OpcionSelect[] = [
    { label: 'INFORMACIÓN CONTABLE PÚBLICA - CONVERGENCIA', value: 'ICP_CONV' },
    { label: 'OPERACIONES RECÍPROCAS', value: 'OP_RECIP' },
    { label: 'CONVERGENCIA DE LEY', value: 'CONV_LEY' },
  ];

  /** Catálogo compartido: la etiqueta es el rango de meses. Ver periodos.ts. */
  readonly periodos: OpcionSelect[] = PERIODOS_TRIMESTRALES;

  anio = signal<string | null>(null);
  entidad = signal<string | null>(null);
  categoria = signal<string | null>(null);
  periodo = signal<string | null>(null);
  modoPaso1 = signal<ModoPaso1>('consultar');

  contextoCompleto = computed(() =>
    !!(this.anio() && this.entidad() && this.categoria() && this.periodo()),
  );

  labelEntidad = computed(() => this.entidades.find(e => e.value === this.entidad())?.label ?? '—');
  labelCategoria = computed(() => this.categorias.find(c => c.value === this.categoria())?.label ?? '—');
  labelPeriodo = computed(() => this.periodos.find(p => p.value === this.periodo())?.label ?? '—');

  /* ─────────── Paso 2 — Validación ─────────── */
  formularios = signal<FormularioEnvio[]>([]);

  totalFormularios = computed(() => this.formularios().length);
  totalValidados = computed(() => this.formularios().filter(f => f.estado === 'validado').length);
  totalConErrores = computed(() => this.formularios().filter(f => f.estado === 'con-errores').length);
  totalPendientes = computed(() => this.formularios().filter(f => f.estado === 'pendiente').length);

  todosValidados = computed(() => this.totalFormularios() > 0 && this.totalValidados() === this.totalFormularios());

  progresoValidacion = computed(() => {
    const total = this.totalFormularios();
    if (total === 0) return 0;
    return Math.round((this.totalValidados() / total) * 100);
  });

  /* Modal de deficiencias */
  formularioDeficienciasAbierto = signal<FormularioEnvio | null>(null);
  busquedaDeficiencias = signal('');

  deficienciasFiltradas = computed<Deficiencia[]>(() => {
    const form = this.formularioDeficienciasAbierto();
    if (!form) return [];
    const q = this.busquedaDeficiencias().trim().toLowerCase();
    if (!q) return form.deficiencias;
    return form.deficiencias.filter(d =>
      d.campo.toLowerCase().includes(q) ||
      d.regla.toLowerCase().includes(q) ||
      String(d.fila).includes(q),
    );
  });

  /* ─────────── Paso 3 — Envío ─────────── */
  adjuntoNombre = signal<string | null>(null);
  observacionesEnvio = signal('');
  entidadesAgregadas = signal<string[]>([]);
  aceptaTerminos = signal(false);
  enviando = signal(false);
  envioCompletado = signal(false);

  readonly opcionesEntidadesAgregadas: OpcionSelect[] = [
    { label: 'Establecimiento Público adscrito', value: 'EPA' },
    { label: 'Unidad Administrativa Especial', value: 'UAE' },
    { label: 'Empresa Industrial y Comercial del Estado', value: 'EICE' },
  ];

  puedeEnviar = computed(() =>
    this.todosValidados() &&
    !!this.adjuntoNombre() &&
    this.aceptaTerminos() &&
    !this.enviando(),
  );

  constructor(private message: MessageService) {
    this.cargarEstado();
    effect(() => {
      this.guardarEstado();
    });
  }

  /* ═════════════ Acciones Paso 1 ═════════════ */
  cambiarModo(modo: ModoPaso1): void {
    this.modoPaso1.set(modo);
  }

  irAValidacion(): void {
    if (!this.contextoCompleto()) {
      this.message.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'Completa los cuatro filtros del paso 1 para continuar.',
        life: 3500,
      });
      return;
    }
    this.cargarFormulariosMock();
    this.pasoActivo.set(2);
    this.message.add({
      severity: 'info',
      summary: 'Contexto guardado',
      detail: `${this.labelCategoria()} · ${this.labelPeriodo()} ${this.anio()}`,
      life: 3000,
    });
  }

  importarArchivo(): void {
    this.message.add({
      severity: 'info',
      summary: 'Importar archivo',
      detail: 'Se abriría el explorador de archivos para cargar el archivo plano.',
      life: 3000,
    });
  }

  /* ═════════════ Acciones Paso 2 ═════════════ */
  private cargarFormulariosMock(): void {
    if (this.formularios().length > 0) return;
    this.formularios.set([
      {
        id: 'f1', codigo: 'CGN001',
        nombre: 'CGN001_SALDOS_Y_MOVIMIENTOS_CONVERGENCIA',
        estado: 'cargado', registros: 174, ultimaCarga: '23/05/2026 09:14',
        origen: 'Importado', deficiencias: [],
      },
      {
        id: 'f2', codigo: 'CGN002',
        nombre: 'CGN002_OPERACIONES_RECIPROCAS_CONVERGENCIA',
        estado: 'pendiente', registros: 0, ultimaCarga: null,
        origen: '—', deficiencias: [],
      },
      {
        id: 'f3', codigo: 'CGN003',
        nombre: 'CGN003_VARIACIONES_PATRIMONIALES_CONVERGENCIA',
        estado: 'cargado', registros: 87, ultimaCarga: '23/05/2026 09:05',
        origen: 'Manual', deficiencias: [],
      },
      {
        id: 'f4', codigo: 'CGN004',
        nombre: 'CGN004_NOTAS_A_LOS_ESTADOS_FINANCIEROS',
        estado: 'cargado', registros: 42, ultimaCarga: '22/05/2026 16:32',
        origen: 'Manual', deficiencias: [],
      },
    ]);
  }

  validar(form: FormularioEnvio): void {
    if (form.estado === 'pendiente') {
      this.message.add({
        severity: 'warn',
        summary: 'Formulario sin información',
        detail: `Carga datos en ${form.codigo} antes de validar.`,
        life: 3500,
      });
      return;
    }
    const conErrores = form.codigo === 'CGN003';
    const deficiencias: Deficiencia[] = conErrores ? this.generarDeficiencias() : [];
    this.actualizarFormulario(form.id, {
      estado: conErrores ? 'con-errores' : 'validado',
      deficiencias,
    });
    this.message.add({
      severity: conErrores ? 'error' : 'success',
      summary: conErrores ? 'Validación con errores' : 'Formulario validado',
      detail: conErrores
        ? `${form.codigo}: ${deficiencias.length} deficiencias encontradas.`
        : `${form.codigo}: ${form.registros} registros validados sin errores.`,
      life: 4000,
    });
  }

  validarTodos(): void {
    this.formularios().forEach(f => {
      if (f.estado === 'pendiente') return;
      this.validar(f);
    });
  }

  recargar(form: FormularioEnvio): void {
    this.actualizarFormulario(form.id, { estado: 'cargado', deficiencias: [] });
    this.message.add({
      severity: 'info',
      summary: 'Formulario recargado',
      detail: `${form.codigo} marcado como cargado. Valida nuevamente.`,
      life: 3000,
    });
  }

  verDeficiencias(form: FormularioEnvio): void {
    this.busquedaDeficiencias.set('');
    this.formularioDeficienciasAbierto.set(form);
  }

  cerrarDeficiencias(): void {
    this.formularioDeficienciasAbierto.set(null);
  }

  descargarDeficiencias(form: FormularioEnvio | null = null): void {
    const target = form ?? this.formularioDeficienciasAbierto();
    const items = target
      ? [{ form: target, deficiencias: target.deficiencias }]
      : this.formularios()
          .filter(f => f.deficiencias.length > 0)
          .map(f => ({ form: f, deficiencias: f.deficiencias }));

    if (items.length === 0) {
      this.message.add({
        severity: 'info',
        summary: 'Sin deficiencias',
        detail: 'No hay deficiencias para descargar.',
        life: 3000,
      });
      return;
    }

    const header = ['Formulario', 'Fila', 'Campo', 'Valor', 'Regla', 'Sugerencia'];
    const rows = items.flatMap(({ form, deficiencias }) =>
      deficiencias.map(d => [form.codigo, String(d.fila), d.campo, d.valor, d.regla, d.sugerencia]),
    );
    const csv = [header, ...rows]
      .map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = target
      ? `Deficiencias_${target.codigo}.csv`
      : `Deficiencias_${this.categoria()}_${this.periodo()}_${this.anio()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.message.add({
      severity: 'success',
      summary: 'Archivo descargado',
      detail: a.download,
      life: 3000,
    });
  }

  irAEnvio(): void {
    if (!this.todosValidados()) {
      this.message.add({
        severity: 'warn',
        summary: 'Hay formularios sin validar',
        detail: 'Todos los formularios deben estar en estado "Validado" para enviar la categoría.',
        life: 4000,
      });
      return;
    }
    this.pasoActivo.set(3);
  }

  /* ═════════════ Acciones Paso 3 ═════════════ */
  seleccionarAdjunto(): void {
    this.adjuntoNombre.set('Soporte_envio_2025_Mar.pdf');
    this.message.add({
      severity: 'success',
      summary: 'Adjunto cargado',
      detail: 'Soporte_envio_2025_Mar.pdf',
      life: 2500,
    });
  }

  quitarAdjunto(): void {
    this.adjuntoNombre.set(null);
  }

  toggleEntidadAgregada(value: string): void {
    const actuales = this.entidadesAgregadas();
    if (actuales.includes(value)) {
      this.entidadesAgregadas.set(actuales.filter(v => v !== value));
    } else {
      this.entidadesAgregadas.set([...actuales, value]);
    }
  }

  enviarCategoria(): void {
    if (!this.puedeEnviar()) return;
    this.enviando.set(true);
    setTimeout(() => {
      this.enviando.set(false);
      this.envioCompletado.set(true);
      this.message.add({
        severity: 'success',
        summary: 'Categoría enviada al CHIP central',
        detail: `${this.labelCategoria()} · ${this.labelPeriodo()} ${this.anio()}`,
        life: 5000,
      });
    }, 1400);
  }

  reiniciarFlujo(): void {
    this.envioCompletado.set(false);
    this.enviando.set(false);
    this.adjuntoNombre.set(null);
    this.observacionesEnvio.set('');
    this.entidadesAgregadas.set([]);
    this.aceptaTerminos.set(false);
    this.formularios.set([]);
    this.anio.set(null);
    this.entidad.set(null);
    this.categoria.set(null);
    this.periodo.set(null);
    this.pasoActivo.set(1);
    localStorage.removeItem(STORAGE_KEY);
  }

  /* ═════════════ Helpers UI ═════════════ */
  severidadEstado(estado: EstadoFormulario): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (estado) {
      case 'validado': return 'success';
      case 'con-errores': return 'danger';
      case 'cargado': return 'info';
      case 'pendiente': return 'warn';
      default: return 'secondary';
    }
  }

  iconoEstado(estado: EstadoFormulario): string {
    switch (estado) {
      case 'validado': return 'pi pi-check-circle';
      case 'con-errores': return 'pi pi-times-circle';
      case 'cargado': return 'pi pi-clock';
      case 'pendiente': return 'pi pi-info-circle';
      default: return 'pi pi-circle';
    }
  }

  labelEstado(estado: EstadoFormulario): string {
    switch (estado) {
      case 'validado': return 'Validado';
      case 'con-errores': return 'Con errores';
      case 'cargado': return 'Cargado';
      case 'pendiente': return 'Pendiente';
      default: return estado;
    }
  }

  /* ═════════════ Persistencia local ═════════════ */
  private cargarEstado(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as Partial<EstadoGuardado>;
      if (data.anio !== undefined) this.anio.set(data.anio);
      if (data.entidad !== undefined) this.entidad.set(data.entidad);
      if (data.categoria !== undefined) this.categoria.set(data.categoria);
      if (data.periodo !== undefined) this.periodo.set(data.periodo);
      if (data.modoPaso1) this.modoPaso1.set(data.modoPaso1);
      if (data.paso) this.pasoActivo.set(data.paso);
      if (this.pasoActivo() >= 2 && this.contextoCompleto()) {
        this.cargarFormulariosMock();
      }
    } catch {
      // Storage corrupto — ignorar
    }
  }

  private guardarEstado(): void {
    try {
      const data: EstadoGuardado = {
        paso: this.pasoActivo(),
        anio: this.anio(),
        entidad: this.entidad(),
        categoria: this.categoria(),
        periodo: this.periodo(),
        modoPaso1: this.modoPaso1(),
        adjuntoEnviado: this.envioCompletado(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Quota llena u otro error — ignorar silenciosamente
    }
  }

  private actualizarFormulario(id: string, cambios: Partial<FormularioEnvio>): void {
    this.formularios.update(arr =>
      arr.map(f => (f.id === id ? { ...f, ...cambios } : f)),
    );
  }

  private generarDeficiencias(): Deficiencia[] {
    return [
      { fila: 12, campo: 'SLDO_INC', valor: '-1500000.50', regla: 'Saldo inicial no admite valores negativos',
        sugerencia: 'Revisa la cuenta 1.4.07 y corrige el signo.' },
      { fila: 28, campo: 'ENT_RECIP', valor: '999999999', regla: 'Código de entidad recíproca no existe en el catálogo',
        sugerencia: 'Consulta el catálogo ENTIDADES_RECIPROCAS en el Protocolo.' },
      { fila: 45, campo: 'MOV_DB', valor: '123456789012345678', regla: 'Excede la longitud máxima (25 dígitos)',
        sugerencia: 'Verifica el valor con el área contable.' },
      { fila: 67, campo: 'CONCEPTO', valor: '9.9.99', regla: 'Concepto no pertenece al formulario CGN003',
        sugerencia: 'Usa solo conceptos del plan contable público vigente.' },
      { fila: 89, campo: 'MOV_CR', valor: 'ABC', regla: 'El campo debe ser numérico',
        sugerencia: 'Reemplaza el valor de texto por un número.' },
    ];
  }
}
