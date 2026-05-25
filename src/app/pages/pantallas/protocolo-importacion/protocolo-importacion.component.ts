import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';

type TipoDato = 'Numérico' | 'Texto' | 'Fecha' | 'Lista';
type TipoRegistro = 'Cabecera' | 'Detalle';

interface ValorLista {
  codigo: string;
  nombre: string;
}

interface Variable {
  numero: number;
  tipoRegistro: TipoRegistro;
  nombre: string;
  tipoDato: TipoDato;
  longitud: number;
  decimales: number | null;
  unidad: string;
  observaciones: string;
  listaKey?: string;
}

interface Lista {
  key: string;
  nombre: string;
  descripcion: string;
  valores: ValorLista[];
}

interface OpcionSelect {
  label: string;
  value: string;
}

@Component({
  selector: 'app-protocolo-importacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    DialogModule,
    TableModule,
    TabsModule,
    TagModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    MessageModule,
    ToastModule,
    AppBreadcrumbComponent,
  ],
  providers: [MessageService],
  templateUrl: './protocolo-importacion.component.html',
  styleUrl: './protocolo-importacion.component.scss',
})
export class ProtocoloImportacionComponent {
  /* ─────────── Filtros (paso 1: contexto) ─────────── */
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
    { label: 'BOLETÍN DE DEUDORES MOROSOS DEL ESTADO', value: 'BDME' },
  ];

  readonly formularios: OpcionSelect[] = [
    { label: 'CGN001_SALDOS_Y_MOVIMIENTOS_CONVERGENCIA', value: 'CGN001' },
    { label: 'CGN002_OPERACIONES_RECIPROCAS_CONVERGENCIA', value: 'CGN002' },
    { label: 'BDME001_BOLETIN_DEUDORES_MOROSOS', value: 'BDME001' },
  ];

  anio = signal<string | null>('2025');
  entidad = signal<string | null>('CGN');
  categoria = signal<string | null>('ICP_CONV');
  formulario = signal<string | null>('CGN001');

  protocoloGenerado = signal(false);

  /* ─────────── Labels completos para tooltips (al pasar el mouse sobre el select) ─────────── */
  anioLabel = computed(() => this.anios.find(o => o.value === this.anio())?.label ?? '');
  entidadLabel = computed(() => this.entidades.find(o => o.value === this.entidad())?.label ?? '');
  categoriaLabel = computed(() => this.categorias.find(o => o.value === this.categoria())?.label ?? '');
  formularioLabel = computed(() => this.formularios.find(o => o.value === this.formulario())?.label ?? '');

  /* ─────────── Datos del protocolo (mock) ─────────── */
  readonly registrosCabecera: Variable[] = [
    { numero: 1, tipoRegistro: 'Cabecera', nombre: 'Tipo de Registro',
      tipoDato: 'Texto', longitud: 1, decimales: null, unidad: '—',
      observaciones: 'C indicando que es tipo de registro cabecera' },
    { numero: 2, tipoRegistro: 'Cabecera', nombre: 'AÑO',
      tipoDato: 'Numérico', longitud: 4, decimales: 0, unidad: '—',
      observaciones: 'Año del período a reportar (ej: 2025)' },
    { numero: 3, tipoRegistro: 'Cabecera', nombre: 'PERIODO',
      tipoDato: 'Lista', longitud: 2, decimales: null, unidad: '—',
      observaciones: 'Período contable del reporte',
      listaKey: 'PERIODOS' },
    { numero: 4, tipoRegistro: 'Cabecera', nombre: 'ENTIDAD',
      tipoDato: 'Texto', longitud: 14, decimales: null, unidad: '—',
      observaciones: 'Código DANE de la entidad reportante' },
    { numero: 5, tipoRegistro: 'Cabecera', nombre: 'CATEGORIA',
      tipoDato: 'Texto', longitud: 50, decimales: null, unidad: '—',
      observaciones: 'Nombre de la categoría a la que pertenece el formulario' },
    { numero: 6, tipoRegistro: 'Cabecera', nombre: 'FORMULARIO',
      tipoDato: 'Texto', longitud: 50, decimales: null, unidad: '—',
      observaciones: 'Nombre del formulario que se está reportando' },
  ];

  readonly registrosDetalle: Variable[] = [
    { numero: 1, tipoRegistro: 'Detalle', nombre: 'Tipo de Registro',
      tipoDato: 'Texto', longitud: 1, decimales: null, unidad: '—',
      observaciones: 'D indicando que es tipo de registro detalle' },
    { numero: 2, tipoRegistro: 'Detalle', nombre: 'CONCEPTO',
      tipoDato: 'Lista', longitud: 25, decimales: null, unidad: '—',
      observaciones: 'Código del concepto contable a reportar',
      listaKey: 'CONCEPTOS' },
    { numero: 3, tipoRegistro: 'Detalle', nombre: 'SLDO_INC',
      tipoDato: 'Numérico', longitud: 25, decimales: 2, unidad: 'Pesos',
      observaciones: 'Saldo inicial del concepto' },
    { numero: 4, tipoRegistro: 'Detalle', nombre: 'MOV_DB',
      tipoDato: 'Numérico', longitud: 25, decimales: 2, unidad: 'Pesos',
      observaciones: 'Movimiento débito del período' },
    { numero: 5, tipoRegistro: 'Detalle', nombre: 'MOV_CR',
      tipoDato: 'Numérico', longitud: 25, decimales: 2, unidad: 'Pesos',
      observaciones: 'Movimiento crédito del período' },
    { numero: 6, tipoRegistro: 'Detalle', nombre: 'ENT_RECIP',
      tipoDato: 'Lista', longitud: 14, decimales: null, unidad: '—',
      observaciones: 'Entidad recíproca asociada al movimiento',
      listaKey: 'ENTIDADES_RECIPROCAS' },
    { numero: 7, tipoRegistro: 'Detalle', nombre: 'VR_CTE',
      tipoDato: 'Numérico', longitud: 25, decimales: 2, unidad: 'Pesos',
      observaciones: 'Valor corriente del movimiento' },
  ];

  /* ─────────── Listas (mock) ─────────── */
  readonly listas: Record<string, Lista> = {
    PERIODOS: {
      key: 'PERIODOS',
      nombre: 'PERIODOS',
      descripcion: 'Períodos contables válidos para el reporte trimestral.',
      valores: [
        { codigo: '01', nombre: 'Ene-Mar' },
        { codigo: '02', nombre: 'Abr-Jun' },
        { codigo: '03', nombre: 'Jul-Sep' },
        { codigo: '04', nombre: 'Oct-Dic' },
      ],
    },
    CONCEPTOS: {
      key: 'CONCEPTOS',
      nombre: 'CONCEPTOS',
      descripcion: 'Catálogo de conceptos contables del formulario CGN001.',
      valores: this.generarConceptos(),
    },
    ENTIDADES_RECIPROCAS: {
      key: 'ENTIDADES_RECIPROCAS',
      nombre: 'ENTIDADES_RECIPROCAS',
      descripcion: 'Listado de entidades públicas con las que se realizan operaciones recíprocas.',
      valores: this.generarEntidadesReciprocas(),
    },
  };

  /* ─────────── Modal de lista ─────────── */
  listaActiva = signal<Lista | null>(null);
  busquedaLista = signal('');

  valoresFiltrados = computed<ValorLista[]>(() => {
    const lista = this.listaActiva();
    if (!lista) return [];
    const q = this.busquedaLista().trim().toLowerCase();
    if (!q) return lista.valores;
    return lista.valores.filter(v =>
      v.codigo.toLowerCase().includes(q) || v.nombre.toLowerCase().includes(q),
    );
  });

  constructor(private message: MessageService) {}

  /* ─────────── Acciones ─────────── */
  generarProtocolo(): void {
    if (!this.anio() || !this.entidad() || !this.categoria() || !this.formulario()) {
      this.message.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'Selecciona año, entidad, categoría y formulario para generar el protocolo.',
        life: 4000,
      });
      return;
    }
    this.protocoloGenerado.set(true);
    this.message.add({
      severity: 'success',
      summary: 'Protocolo generado',
      detail: 'Revisa las variables del formulario y descarga el archivo de importación.',
      life: 3500,
    });
  }

  limpiarFiltros(): void {
    this.anio.set(null);
    this.entidad.set(null);
    this.categoria.set(null);
    this.formulario.set(null);
    this.protocoloGenerado.set(false);
  }

  abrirLista(listaKey: string | undefined): void {
    if (!listaKey) return;
    const lista = this.listas[listaKey];
    if (!lista) return;
    this.busquedaLista.set('');
    this.listaActiva.set(lista);
  }

  cerrarLista(): void {
    this.listaActiva.set(null);
    this.busquedaLista.set('');
  }

  descargarLista(): void {
    const lista = this.listaActiva();
    if (!lista) return;
    const filas = [['Código', 'Nombre'], ...lista.valores.map(v => [v.codigo, v.nombre])];
    const csv = filas
      .map(fila => fila.map(c => `"${c.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lista_${lista.nombre}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.message.add({
      severity: 'success',
      summary: 'Archivo descargado',
      detail: `Lista_${lista.nombre}.csv`,
      life: 3000,
    });
  }

  descargarProtocolo(): void {
    this.message.add({
      severity: 'info',
      summary: 'Descargando protocolo',
      detail: 'Se está generando el archivo plano de importación.',
      life: 3000,
    });
  }

  /* ─────────── Generadores de datos mock ─────────── */
  private generarConceptos(): ValorLista[] {
    const items: ValorLista[] = [
      { codigo: '1.1.05', nombre: 'CAJA' },
      { codigo: '1.1.10', nombre: 'BANCOS' },
      { codigo: '1.1.20', nombre: 'INVERSIONES' },
      { codigo: '1.4.07', nombre: 'PRESTACIÓN DE SERVICIOS' },
      { codigo: '1.4.13', nombre: 'TRANSFERENCIAS POR COBRAR' },
      { codigo: '2.4.01', nombre: 'ADQUISICIÓN DE BIENES Y SERVICIOS' },
      { codigo: '2.4.36', nombre: 'RETENCIÓN EN LA FUENTE' },
      { codigo: '3.1.05', nombre: 'CAPITAL FISCAL' },
      { codigo: '3.1.10', nombre: 'RESULTADO DEL EJERCICIO' },
      { codigo: '4.4.08', nombre: 'INGRESOS FINANCIEROS' },
      { codigo: '5.1.01', nombre: 'SUELDOS Y SALARIOS' },
      { codigo: '5.1.11', nombre: 'GENERALES' },
    ];
    return items;
  }

  private generarEntidadesReciprocas(): ValorLista[] {
    return [
      { codigo: '102000000', nombre: 'CONTRALORÍA GENERAL DE LA REPÚBLICA' },
      { codigo: '104500000', nombre: 'DEPARTAMENTO ADMINISTRATIVO NACIONAL DE ESTADÍSTICA' },
      { codigo: '105000000', nombre: 'DEPARTAMENTO NACIONAL DE PLANEACIÓN' },
      { codigo: '106000000', nombre: 'DEPARTAMENTO ADMINISTRATIVO DE LA PRESIDENCIA DE LA REPÚBLICA' },
      { codigo: '106500000', nombre: 'DEPARTAMENTO ADMINISTRATIVO DE LA FUNCIÓN PÚBLICA' },
      { codigo: '110000000', nombre: 'MINISTERIO DE AGRICULTURA Y DESARROLLO RURAL' },
      { codigo: '110500000', nombre: 'MINISTERIO DE TECNOLOGÍAS DE LA INFORMACIÓN Y LAS COMUNICACIONES' },
      { codigo: '111000000', nombre: 'MINISTERIO DE DEFENSA NACIONAL' },
      { codigo: '111500000', nombre: 'GOBERNACIÓN DE ANTIOQUIA' },
      { codigo: '111600000', nombre: 'GOBERNACIÓN DEL ATLÁNTICO' },
      { codigo: '111700000', nombre: 'GOBERNACIÓN DE BOLÍVAR' },
      { codigo: '111800000', nombre: 'GOBERNACIÓN DE BOYACÁ' },
      { codigo: '111900000', nombre: 'GOBERNACIÓN DE CALDAS' },
      { codigo: '112000000', nombre: 'GOBERNACIÓN DEL CAQUETÁ' },
      { codigo: '112100000', nombre: 'GOBERNACIÓN DEL CAUCA' },
      { codigo: '112200000', nombre: 'GOBERNACIÓN DEL CESAR' },
      { codigo: '112300000', nombre: 'GOBERNACIÓN DE CÓRDOBA' },
      { codigo: '112400000', nombre: 'GOBERNACIÓN DE CUNDINAMARCA' },
      { codigo: '112500000', nombre: 'GOBERNACIÓN DEL CHOCÓ' },
      { codigo: '112600000', nombre: 'GOBERNACIÓN DEL HUILA' },
      { codigo: '112700000', nombre: 'GOBERNACIÓN DE LA GUAJIRA' },
      { codigo: '112800000', nombre: 'GOBERNACIÓN DEL MAGDALENA' },
      { codigo: '112900000', nombre: 'GOBERNACIÓN DEL META' },
      { codigo: '113000000', nombre: 'GOBERNACIÓN DE NARIÑO' },
      { codigo: '113100000', nombre: 'GOBERNACIÓN DE NORTE DE SANTANDER' },
      { codigo: '113200000', nombre: 'GOBERNACIÓN DEL PUTUMAYO' },
      { codigo: '113300000', nombre: 'GOBERNACIÓN DEL QUINDÍO' },
      { codigo: '113400000', nombre: 'GOBERNACIÓN DE RISARALDA' },
      { codigo: '113500000', nombre: 'GOBERNACIÓN DE SANTANDER' },
      { codigo: '113600000', nombre: 'GOBERNACIÓN DE SUCRE' },
      { codigo: '113700000', nombre: 'GOBERNACIÓN DEL TOLIMA' },
      { codigo: '113800000', nombre: 'GOBERNACIÓN DEL VALLE DEL CAUCA' },
      { codigo: '113900000', nombre: 'GOBERNACIÓN DEL VAUPÉS' },
      { codigo: '114000000', nombre: 'GOBERNACIÓN DEL VICHADA' },
      { codigo: '114100000', nombre: 'ALCALDÍA MAYOR DE BOGOTÁ' },
      { codigo: '114200000', nombre: 'ALCALDÍA DE MEDELLÍN' },
      { codigo: '114300000', nombre: 'ALCALDÍA DE CALI' },
      { codigo: '114400000', nombre: 'ALCALDÍA DE BARRANQUILLA' },
      { codigo: '114500000', nombre: 'ALCALDÍA DE CARTAGENA' },
      { codigo: '114600000', nombre: 'ALCALDÍA DE BUCARAMANGA' },
    ];
  }
}
