import { Component, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';
import { MenuModule } from 'primeng/menu';
import { ChipModule } from 'primeng/chip';
import { StepperModule } from 'primeng/stepper';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule } from 'primeng/paginator';
import { TextareaModule } from 'primeng/textarea';
import { MessageService, MenuItem } from 'primeng/api';

import { SesionService } from '../../../services/sesion.service';
import { PERIODOS_FILTRO } from '../../../services/periodos';

import {
  EtapaId,
  EstadoId,
  EtapaProceso,
  EstadoProceso,
  ETAPAS_PROCESO,
  ESTADOS_PROCESO,
  SIN_REGISTRO_LABEL,
  SIN_REGISTRO_AYUDA,
  ESTADOS_POR_ETAPA,
  RespuestaCentral,
  TipoDeficiencia,
  TIPOS_DEFICIENCIA,
  DeficienciaEnvio,
  PlantillaDeficiencia,
  etapaDe,
  estadoDe,
} from './catalogo-proceso';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import { ProtocoloImportacionComponent } from './protocolo-importacion/protocolo-importacion.component';
import { RegistroManualComponent } from './registro-manual/registro-manual.component';
import { DeficienciasEnvioComponent } from './deficiencias-envio/deficiencias-envio.component';
import {
  DirectorioEntidadesComponent,
  Entidad,
} from '../../../components/directorio-entidades/directorio-entidades.component';

interface Formulario {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  categoria: string;
  periodo: string;
  anio: number;
  /** Etapa del proceso en que está el formulario — `tab_etapa_proceso`. */
  etapa: EtapaId;
  /**
   * Estado dentro de esa etapa — `tab_estado`, válido según `ESTADOS_POR_ETAPA`.
   * `null` = el formulario todavía no tiene registro (no se ha importado). No es
   * un estado del catálogo: la UI lo presenta como "Sin registro".
   */
  estado: EstadoId | null;
  ultimaModificacion: string;
}

interface AccionPermiso {
  key: string;
  label: string;
  icon: string;
  enabled: boolean;
}

/**
 * Comportamiento del envío de una categoría respecto a las entidades agregadas.
 *   noAplica    → no gestiona entidades (botón inactivo, envío directo)
 *   obligatoria → exige ≥1 entidad (bloquea si no hay)
 *   agregadora  → entidad agregadora (confirma responsabilidad si no hay)
 */
type ModoEntidades = 'noAplica' | 'obligatoria' | 'agregadora';

/** Entidad disponible para asignar a la categoría desde el modal "Entidades Agregadas". */
interface EntidadAgregada {
  id: string;
  nombre: string;
  nit: string;
}

/**
 * Tipo de usuario que determina cómo se resuelve la entidad del contexto (Paso 1):
 *   • 'L' (Local)       → opera una sola entidad: se carga por defecto, sin elegir.
 *   • 'A' (Agregadora)  ┐
 *   • 'C' (Consolidadora)│→ operan sobre varias entidades: deben elegir una desde
 *   • 'E' (Estratégico) ┘  el modal "Directorio de entidades".
 * En producción este valor vendría de la sesión/backend; aquí se mockea con un
 * selector de demostración para poder mostrar los escenarios en la pantalla demo.
 *   • 'L'          → entidad local activa, cargada por defecto.
 *   • 'L_INACTIVA' → entidad local inactiva (sin categorías activas) → alerta.
 *   • 'ACE'        → A/C/E: elige la entidad desde el directorio.
 */
type TipoUsuario = 'L' | 'L_INACTIVA' | 'ACE';


@Component({
  selector: 'app-formularios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    DividerModule,
    MessageModule,
    CheckboxModule,
    MenuModule,
    ChipModule,
    StepperModule,
    DialogModule,
    PaginatorModule,
    TextareaModule,
    AppBreadcrumbComponent,
    DirectorioEntidadesComponent,
    ProtocoloImportacionComponent,
    RegistroManualComponent,
    DeficienciasEnvioComponent,
  ],
  providers: [MessageService],
  templateUrl: './formularios.component.html',
  styleUrl: './formularios.component.scss',
})
export class FormulariosComponent implements OnDestroy {
  @ViewChild('menuFormulario') menuFormulario: any;
  selectedFormularioForMenu: Formulario | null = null;

  constructor(
    private messageService: MessageService,
    private sesion: SesionService,
  ) {}

  /** Correo del usuario en sesión — es a donde llega el resultado de la importación. */
  get correoUsuario(): string {
    return this.sesion.usuario()?.correo ?? 'su correo registrado';
  }

  ngOnDestroy(): void {
    this.cancelarAvanceProceso();
  }

  /**
   * Paso actual del wizard — 3 pasos:
   *   0: Filtros (contexto + Consultar Envíos previos)
   *   1: Formularios (importar, exportar, validar, acciones, editar manual,
   *      generar protocolo — y, al abrir un formulario, registro manual)
   *   2: Envíos (Enviar Categoría + Entidades Agregadas + Enviar Adjunto)
   */
  wizardStep = 0;

  /** Panel "Consultar envíos" desplegable en el paso 1 (Contexto). */
  wizardConsultarEnviosAbierto = false;

  /** Panel "Importar" desplegable en el paso 1 (Contexto). */
  wizardImportarAbierto = false;

  /**
   * Permite navegar a un paso anterior (o al actual) haciendo clic en el indicador.
   * Hacia adelante solo se avanza con los botones del flujo (Siguiente / Abrir).
   * Esto evita saltar pasos sin haber completado los requisitos.
   */
  irAPaso(step: number) {
    if (step < 0 || step > this.wizardStep) return;
    // Al volver al paso de filtros se CONSERVA el contexto aplicado (acordeón
    // colapsado con sus chips) para no bloquear Consultar envíos e Importar.
    // Solo se cierran los paneles inline que pudieran estar abiertos.
    if (step === 0) {
      this.cerrarPanelesPaso1();
    }
    this.cerrarDetalle();
    this.cerrarProtocolo();
    this.wizardStep = step;
  }

  pasoNavegable(step: number): boolean {
    return step <= this.wizardStep;
  }

  /**
   * Toggle del panel "Consultar envíos" en el paso 1.
   * Ambos paneles del paso 1 son mutuamente excluyentes para que el usuario
   * vea una sola pieza de información a la vez (UX: foco).
   */
  toggleConsultarEnviosWizard() {
    this.wizardConsultarEnviosAbierto = !this.wizardConsultarEnviosAbierto;
    if (this.wizardConsultarEnviosAbierto) this.wizardImportarAbierto = false;
  }

  /** Toggle del panel "Importar" en el paso 1. */
  toggleImportarWizard() {
    this.wizardImportarAbierto = !this.wizardImportarAbierto;
    if (this.wizardImportarAbierto) this.wizardConsultarEnviosAbierto = false;
  }

  /** Cierra ambos paneles (al cambiar de paso). */
  private cerrarPanelesPaso1() {
    this.wizardConsultarEnviosAbierto = false;
    this.wizardImportarAbierto = false;
  }

  // Mock de envíos previos — tabla del paso 1 "Consultar envíos".
  enviosPrevios: Array<{
    numero: string;
    fecha: string;
    formularios: number;
    usuario: string;
    estado: 'Aceptado' | 'Rechazado' | 'En proceso' | 'Pendiente';
  }> = [
    { numero: '2024-1105', fecha: '05/11/2024', formularios: 4, usuario: 'olozada@cgn.gov.co', estado: 'Aceptado' },
    { numero: '2024-1028', fecha: '28/10/2024', formularios: 6, usuario: 'olozada@cgn.gov.co', estado: 'Rechazado' },
    { numero: '2024-1015', fecha: '15/10/2024', formularios: 6, usuario: 'jmgallo@cgn.gov.co', estado: 'Aceptado' },
    { numero: '2024-0930', fecha: '30/09/2024', formularios: 5, usuario: 'olozada@cgn.gov.co', estado: 'En proceso' },
    { numero: '2024-0915', fecha: '15/09/2024', formularios: 4, usuario: 'cplascu@cgn.gov.co', estado: 'Aceptado' },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Vista Registro Manual (detalle del formulario)
  // Refleja la POC de Wilmar: cada concepto padre maneja su propio paginador
  // de filas (variables), y arriba un paginador global de columnas (periodos)
  // — porque un formulario puede tener hasta 60+ variables y muchas columnas.
  // ─────────────────────────────────────────────────────────────────────────
  detalleAbierto: Formulario | null = null;

  abrirDetalle(form: Formulario) {
    this.controlEnvioAbierto = false;
    this.detalleAbierto = form;
    // En el wizard de 3 pasos, abrir un formulario NO cambia de paso:
    // el registro manual vive dentro del paso "Formularios" (step 1).
    queueMicrotask(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /**
   * Validar el formulario abierto desde el detalle. Patrón UX: al ser el
   * "cierre" del trabajo en este formulario, lo pasamos a Validación local,
   * regresamos al listado (o al paso 2 en wizard) y mostramos toast para
   * que el usuario vea el estado actualizado y pueda elegir el siguiente.
   */
  validarFormularioActual() {
    if (!this.detalleAbierto) return;
    const id = this.detalleAbierto.id;
    const nombre = this.detalleAbierto.nombre;
    this._formulariosBase = this._formulariosBase.map(f =>
      f.id === id ? { ...f, etapa: 2 as EtapaId, estado: 'A' as EstadoId } : f,
    );
    // Al re-validar tras un rechazo, el resultado del envío anterior deja de aplicar.
    this.categoriaEnviada = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Formulario validado',
      detail: `"${nombre}" pasó a Validación local · Aceptado. Continúe con los demás formularios o envíe la categoría.`,
      life: 4500,
    });
    this.cerrarDetalle();
  }
  cerrarDetalle() {
    this.detalleAbierto = null;
    // En el wizard de 3 pasos, el listado y el registro manual viven en
    // el mismo paso (Formularios). Cerrar el detalle sólo limpia el estado;
    // el step se mantiene en 1.
  }

  // ──────────────────────────────────────────────────────────────────────
  // Resultado del último envío a validación central (simulación de demostración).
  // En producción este estado llega del backend tras "Enviar Categoría"; aquí se
  // elige desde "Control de envío" con un switch demo qué responderá la validación
  // central. Al pulsar "Enviar Categoría" se APLICA ese resultado:
  //   • rechazado → marca un formulario como "Rechazado por Deficiencia" (su motivo
  //                 se consulta en el listado, Sección 2 → "Ver motivo") y la
  //                 Sección 3 muestra el envío rechazado.
  //   • aceptado  → todos los formularios pasan a "Enviado" (aceptado por la CGN).
  //   • enProceso → todos "Enviado", en validación central.
  // El resultado en el banner solo aparece TRAS enviar (ver `resultadoEnvio`).
  // ──────────────────────────────────────────────────────────────────────
  respuestaCentral: RespuestaCentral = 'rechazado';

  /** True una vez que se pulsó "Enviar Categoría" (para mostrar el resultado). */
  categoriaEnviada = false;

  readonly respuestaCentralOptions = [
    { label: 'En proceso', value: 'enProceso' },
    { label: 'Aceptado', value: 'aceptado' },
    { label: 'Rechazado por deficiencia', value: 'rechazado' },
  ];

  /**
   * Resultado del envío a mostrar en el banner. Solo tras "Enviar Categoría"
   * (`categoriaEnviada`); antes de enviar devuelve null (banner de preparación).
   */
  get resultadoEnvio(): { clase: string; icon: string; titulo: string; detalle: string } | null {
    return this.categoriaEnviada ? this.respuestaCentralInfo : null;
  }

  /**
   * Presentación del resultado de validación central para el banner del Paso 3.
   */
  get respuestaCentralInfo(): { clase: string; icon: string; titulo: string; detalle: string } | null {
    switch (this.respuestaCentral) {
      case 'enProceso':
        return {
          clase: 'form-send-bar--proceso', icon: 'pi-hourglass',
          titulo: 'Envío en proceso de validación central',
          detalle: 'El resultado llegará en Consultar envíos.',
        };
      case 'aceptado':
        return {
          clase: 'form-send-bar--aceptado', icon: 'pi-check-circle',
          titulo: 'Categoría aceptada por validación central',
          detalle: 'No se requieren correcciones.',
        };
      case 'rechazado':
        return {
          clase: 'form-send-bar--rechazado', icon: 'pi-times-circle',
          titulo: 'Envío rechazado por deficiencia',
          detalle: 'Revise los formularios rechazados en el listado y corrija el motivo.',
        };
      default:
        return null;
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // Sub-vista "Generar protocolo de importación" — pertenece al Paso 2.
  // Se abre desde el menú ⋮ de cada fila (por formulario). El listado se
  // oculta y se vuelve con "Volver al listado". El contexto del wizard
  // (entidad/categoría/año/periodo) sigue visible en el context bar.
  // ──────────────────────────────────────────────────────────────────────
  protocoloAbierto: Formulario | null = null;

  abrirProtocolo(form: Formulario | null) {
    if (!form) return;
    this.cerrarDetalle();
    this.controlEnvioAbierto = false;
    this.protocoloAbierto = form;
    queueMicrotask(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  cerrarProtocolo() {
    this.protocoloAbierto = null;
  }

  /**
   * Menú ⋮ por fila — sólo acciones que NO se pueden aplicar masivamente desde
   * la toolbar (Exportar y Validar viven en la toolbar y operan sobre la selección).
   */
  menuFormularioItems: MenuItem[] = [
    {
      label: 'Registro manual',
      icon: 'pi pi-table',
      command: () => { if (this.selectedFormularioForMenu) this.abrirDetalle(this.selectedFormularioForMenu); },
    },
    {
      label: 'Ver control de envío',
      icon: 'pi pi-send',
      command: () => this.verControlEnvio(this.selectedFormularioForMenu),
    },
    { separator: true },
    {
      label: 'Generar protocolo de importación',
      icon: 'pi pi-file-export',
      command: () => this.abrirProtocolo(this.selectedFormularioForMenu),
    },
  ];

  abrirMenuFormulario(event: Event, form: Formulario) {
    this.selectedFormularioForMenu = form;
    this.menuFormulario.toggle(event);
  }

  /**
   * Control de envío como PANTALLA dedicada (no toggle lateral): se abre desde
   * la acción ⋮ de una fila y reemplaza el listado, igual que las sub-vistas de
   * Registro manual / Protocolo. Se vuelve con "Volver al listado".
   */
  controlEnvioAbierto = false;

  /**
   * Formulario cuyas deficiencias se están viendo. Las dos entradas al control
   * de envío llevan aquí: la acción ⋮ de la fila y el tag "Deficiencia" de la
   * columna Estado. Su nombre encabeza el contexto de la pantalla.
   */
  controlEnvioFormulario: Formulario | null = null;

  /**
   * Abre el control de envío. El alcance depende de por dónde se entre: desde
   * el tag "Deficiencia" del listado interesa el último proceso; desde la
   * acción ⋮, el histórico completo del formulario.
   */
  verControlEnvio(
    form: Formulario | null = null,
    alcance: 'ultimo' | 'historico' = 'historico',
  ): void {
    if (!this.filtersApplied) return;
    this.controlEnvioFormulario = form ?? this.selectedFormularioForMenu;
    this.alcanceDeficiencias = alcance;
    this.refrescarDeficienciasVisibles();
    this.cerrarDetalle();
    this.cerrarProtocolo();
    this.controlEnvioAbierto = true;
    queueMicrotask(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  cerrarControlEnvio(): void {
    this.controlEnvioAbierto = false;
    this.controlEnvioFormulario = null;
    this.deficienciasVisibles = [];
  }

  /**
   * Deficiencias del ÚLTIMO proceso de importación, por tipo de error. Un
   * proceso cierra con una sola familia de códigos —o el archivo está mal
   * formado (estructura) o le falta información exigida por la categoría
   * (completitud)—, y cada familia cuelga de su propio detalle de proceso.
   * En producción esto llega del backend por formulario.
   */
  private readonly deficienciasUltimoProceso: Readonly<
    Record<TipoDeficiencia, readonly PlantillaDeficiencia[]>
  > = {
    // Etapa 1 · Importación — detalle de proceso 4831. Errores de ESTRUCTURA:
    // el archivo no cumple el protocolo de importación.
    estructura: [
      { etapa: 1, idDetalleProceso: 4831, id: 1, tipo: 'estructura', codMensaje: 'EST-004', mensaje: 'Longitud de registro distinta a la declarada en el protocolo de importación.', permisible: false, requiereComentario: false },
      { etapa: 1, idDetalleProceso: 4831, id: 2, tipo: 'estructura', codMensaje: 'EST-011', mensaje: 'Campo numérico con caracteres no válidos.', permisible: false, requiereComentario: false },
      { etapa: 1, idDetalleProceso: 4831, id: 3, tipo: 'estructura', codMensaje: 'EST-019', mensaje: 'Código de concepto inexistente en la lista de la categoría.', permisible: false, requiereComentario: false },
      { etapa: 1, idDetalleProceso: 4831, id: 4, tipo: 'estructura', codMensaje: 'EST-023', mensaje: 'Registro duplicado para el mismo concepto y tercero.', permisible: true, requiereComentario: true },
    ],
    // Etapa 1 · Importación — detalle de proceso 4832. Errores de COMPLETITUD:
    // el archivo está bien formado, pero no trae todo lo que la categoría exige.
    completitud: [
      { etapa: 1, idDetalleProceso: 4832, id: 1, tipo: 'completitud', codMensaje: 'COMP-002', mensaje: 'Concepto obligatorio de la categoría sin registro en el archivo.', permisible: false, requiereComentario: false },
      { etapa: 1, idDetalleProceso: 4832, id: 2, tipo: 'completitud', codMensaje: 'COMP-014', mensaje: 'El archivo no incluye todos los periodos exigidos por la categoría.', permisible: false, requiereComentario: false },
      { etapa: 1, idDetalleProceso: 4832, id: 3, tipo: 'completitud', codMensaje: 'COMP-021', mensaje: 'Registro sin el tercero obligatorio para el concepto reportado.', permisible: false, requiereComentario: false },
      { etapa: 1, idDetalleProceso: 4832, id: 4, tipo: 'completitud', codMensaje: 'COMP-036', mensaje: 'Concepto informado sin la nota explicativa que exige la categoría.', permisible: true, requiereComentario: true },
    ],
  };

  /**
   * Procesos ANTERIORES del formulario (histórico). Son las deficiencias de
   * validación local y central: no llevan tipo, porque el tipo describe cómo
   * cerró una importación, no una validación.
   */
  private readonly historialDeficiencias: readonly PlantillaDeficiencia[] = [
    // Etapa 2 · Validación local — detalle de proceso 4822. El consecutivo
    // vuelve a empezar en 1: es por etapa, no global.
    { etapa: 2, idDetalleProceso: 4822, id: 1, codMensaje: 'VAL-001', mensaje: 'El total de débitos no coincide con el total de créditos del formulario.', permisible: false, requiereComentario: false },
    { etapa: 2, idDetalleProceso: 4822, id: 2, codMensaje: 'VAL-032', mensaje: 'Concepto obligatorio sin valor diligenciado.', permisible: false, requiereComentario: false },
    { etapa: 2, idDetalleProceso: 4822, id: 3, codMensaje: 'VAL-045', mensaje: 'Saldo negativo en una cuenta que no admite naturaleza contraria.', permisible: true, requiereComentario: false },
    { etapa: 2, idDetalleProceso: 4822, id: 4, codMensaje: 'VAL-051', mensaje: 'El saldo inicial no coincide con el saldo final del periodo anterior.', permisible: false, requiereComentario: false },

    // Etapa 3 · Validación central — detalle de proceso 4823.
    { etapa: 3, idDetalleProceso: 4823, id: 1, codMensaje: 'CEN-014', mensaje: 'Variación superior al 50% frente al periodo anterior.', permisible: true, requiereComentario: true },
    { etapa: 3, idDetalleProceso: 4823, id: 2, codMensaje: 'CEN-027', mensaje: 'Operación recíproca sin contraparte reportada por la entidad par.', permisible: true, requiereComentario: true },
    { etapa: 3, idDetalleProceso: 4823, id: 3, codMensaje: 'CEN-063', mensaje: 'Valor reportado en cero en un concepto con movimiento en el periodo anterior.', permisible: true, requiereComentario: true },
    { etapa: 3, idDetalleProceso: 4823, id: 4, codMensaje: 'CEN-078', mensaje: 'Tercero reportado sin identificación válida.', permisible: true, requiereComentario: true },
    { etapa: 3, idDetalleProceso: 4823, id: 5, codMensaje: 'CEN-084', mensaje: 'Cuenta reportada que no aplica para la naturaleza jurídica de la entidad.', permisible: true, requiereComentario: true },
    { etapa: 3, idDetalleProceso: 4823, id: 6, codMensaje: 'CEN-092', mensaje: 'Depreciación acumulada mayor al valor bruto del activo.', permisible: false, requiereComentario: false },
    { etapa: 3, idDetalleProceso: 4823, id: 7, codMensaje: 'CEN-105', mensaje: 'Concepto informado sin nota explicativa asociada.', permisible: true, requiereComentario: true },
  ];

  /**
   * Deficiencias por formulario (id → filas). Se crean la primera vez que se
   * abre el control de envío de ese formulario y se conservan, de modo que el
   * getter devuelve SIEMPRE el mismo array: si recreara la lista en cada ciclo
   * de detección de cambios, la tabla y los comentarios se reiniciarían solos.
   */
  private readonly deficienciasPorFormulario = new Map<number, DeficienciaEnvio[]>();

  /**
   * Tipo de error con el que cerró el último proceso de importación de cada
   * formulario. Lo asigna el resultado de la importación; sin entrada aquí, el
   * formulario no tiene deficiencias de importación.
   */
  private readonly tipoDeficienciaPorFormulario = new Map<number, TipoDeficiencia>();

  /** Deficiencias del formulario abierto en el control de envío. */
  get deficienciasEnvio(): DeficienciaEnvio[] {
    const form = this.controlEnvioFormulario;
    if (!form) return [];
    const existentes = this.deficienciasPorFormulario.get(form.id);
    if (existentes) return existentes;
    const filas = this.construirDeficiencias(form).map(d => ({
      ...d, comentario: '', comentarioGuardado: '', comentarioError: '',
    }));
    this.deficienciasPorFormulario.set(form.id, filas);
    return filas;
  }

  /**
   * Arma el expediente de un formulario: primero el último proceso (la
   * importación que acaba de cerrar, con su familia de códigos) y detrás los
   * procesos anteriores. Un formulario sin deficiencias devuelve lista vacía —
   * no todos los formularios de la categoría tienen por qué tener errores.
   */
  private construirDeficiencias(form: Formulario): readonly PlantillaDeficiencia[] {
    const tipo = this.tipoDeficienciaPorFormulario.get(form.id);
    if (tipo) return [...this.deficienciasUltimoProceso[tipo], ...this.historialDeficiencias];
    // Rechazado por la validación central (sin importación fallida detrás):
    // sólo tiene el expediente de validaciones.
    if (form.estado === 'D') return this.historialDeficiencias;
    return [];
  }

  // ── Alcance de la tabla de deficiencias ───────────────────────────────────
  // El mismo control de envío se abre desde dos sitios y no muestran lo mismo:
  //   • tag "Deficiencia" del listado → las del ÚLTIMO proceso, que es lo que
  //     el usuario acaba de ver fallar;
  //   • acción ⋮ "Ver control de envío" → el histórico completo del formulario.
  // El selector deja pasar de una vista a la otra sin salir de la pantalla.

  /** Alcance activo de la tabla de deficiencias. */
  alcanceDeficiencias: 'ultimo' | 'historico' = 'historico';

  /** Filas que ve la tabla — recalculadas al abrir o al cambiar de alcance. */
  deficienciasVisibles: DeficienciaEnvio[] = [];

  /** Id del detalle de proceso más reciente del formulario abierto (0 = ninguno). */
  get ultimoProcesoId(): number {
    return this.deficienciasEnvio.reduce((max, d) => Math.max(max, d.idDetalleProceso), 0);
  }

  /** Tipo de error del último proceso del formulario abierto, si lo tuvo. */
  get tipoUltimoProceso(): TipoDeficiencia | null {
    const form = this.controlEnvioFormulario;
    return (form && this.tipoDeficienciaPorFormulario.get(form.id)) || null;
  }
  cambiarAlcanceDeficiencias(alcance: 'ultimo' | 'historico'): void {
    this.alcanceDeficiencias = alcance;
    this.refrescarDeficienciasVisibles();
  }

  /** Aplica el alcance activo sobre el expediente del formulario abierto. */
  private refrescarDeficienciasVisibles(): void {
    const todas = this.deficienciasEnvio;
    this.deficienciasVisibles =
      this.alcanceDeficiencias === 'ultimo'
        ? todas.filter(d => d.idDetalleProceso === this.ultimoProcesoId)
        : todas;
  }

  /** Resumen del alcance activo, para el encabezado de la tabla. */
  get resumenDeficiencias(): string {
    const total = this.deficienciasVisibles.length;
    const plural = total === 1 ? 'deficiencia' : 'deficiencias';
    if (this.alcanceDeficiencias === 'ultimo') {
      const tipo = this.tipoUltimoProceso;
      const detalle = tipo ? ` de ${TIPOS_DEFICIENCIA[tipo].label.toLowerCase()}` : '';
      return `Proceso ${this.ultimoProcesoId} · ${total} ${plural}${detalle}`;
    }
    const procesos = new Set(this.deficienciasEnvio.map(d => d.idDetalleProceso)).size;
    return `${procesos} proceso(s) · ${total} ${plural}`;
  }

  // ── Rechazo por deficiencia ───────────────────────────────────────────────
  // Desde la columna Estado, las filas con estado Deficiencia (D) abren el
  // control de envío de ESE formulario, que es donde vive el detalle de las
  // deficiencias (mismo destino que la acción ⋮ "Ver control de envío").

  /** True si el formulario fue rechazado por deficiencia (hace clicable el tag). */
  esRechazado(form: Formulario): boolean {
    return form.estado === 'D';
  }

  // ── Tipo de usuario (mock de demostración) ──
  // Dispara los dos eventos de resolución de entidad del Paso 1.
  readonly entidadLocalPorDefecto: Entidad = {
    codigo: '110100000', nit: '830.000.000-0',
    razonSocial: 'Contaduría General de la Nación',
    departamento: 'Bogotá D.C.', municipio: 'Bogotá D.C.', estado: 'Activo',
  };
  /** Entidad local inactiva (mock) — escenario "sin categorías activas". */
  readonly entidadLocalInactiva: Entidad = {
    codigo: '210111076', nit: '800.345.678-3',
    razonSocial: 'Municipio de Puerto Nariño',
    departamento: 'Amazonas', municipio: 'Puerto Nariño', estado: 'Inactivo',
  };
  tiposUsuarioOptions = [
    { label: 'Tipo L · Entidad local (carga automática)', value: 'L' },
    { label: 'Tipo L · Entidad inactiva (sin categorías activas)', value: 'L_INACTIVA' },
    { label: 'Tipo A, C y E · Selecciona del directorio', value: 'ACE' },
  ];
  tipoUsuario: TipoUsuario = 'L';

  get esTipoLocal(): boolean {
    return this.tipoUsuario === 'L' || this.tipoUsuario === 'L_INACTIVA';
  }

  /** True cuando la entidad seleccionada está inactiva (no opera ninguna categoría). */
  get entidadInactiva(): boolean {
    return this.filterEntidad?.estado === 'Inactivo';
  }

  // ── Filtros ──
  filterEntidad: Entidad | null = this.entidadLocalPorDefecto;
  selectedCategoria = '';
  selectedAnio = '';
  selectedPeriodo = '';
  filtersApplied = false;
  filtersCollapsed = false;

  /** Etiqueta visible de la entidad seleccionada (código - razón social). */
  get entidadLabel(): string {
    return this.filterEntidad
      ? `${this.filterEntidad.codigo} - ${this.filterEntidad.razonSocial}`
      : '';
  }

  // ──────────────────────────────────────────────────────────────────────
  // Directorio de entidades — selección ÚNICA mediante el componente
  // compartido `app-directorio-entidades` (mismo estándar que Levantamiento
  // de Restricciones). El usuario A/C/E lo abre desde el campo Entidad.
  // ──────────────────────────────────────────────────────────────────────
  mostrarDirectorioEntidades = false;

  /**
   * Resuelve la entidad según el tipo de usuario (mock de los dos eventos).
   * Cambiar de contexto de entidad invalida cualquier filtro ya aplicado.
   */
  onTipoUsuarioChange() {
    this.resetContextoEntidad();
    this.mostrarDirectorioEntidades = false;
    if (this.tipoUsuario === 'L') {
      // Evento 1 — Local: la entidad se carga por defecto, sin modal.
      this.filterEntidad = this.entidadLocalPorDefecto;
    } else if (this.tipoUsuario === 'L_INACTIVA') {
      // Escenario — Local con entidad inactiva: carga la entidad inactiva (dispara alerta).
      this.filterEntidad = this.entidadLocalInactiva;
    } else {
      // Evento 2 — A/C/E: el usuario abre el directorio desde el campo Entidad.
      this.filterEntidad = null;
    }
  }

  abrirDirectorioEntidades() {
    // El usuario local no elige entidad: la suya viene cargada por defecto.
    if (this.esTipoLocal) return;
    this.mostrarDirectorioEntidades = true;
  }

  onEntidadSeleccionada(e: Entidad) {
    this.filterEntidad = e;
    // Cambiar la entidad del contexto invalida los filtros aplicados.
    this.resetContextoEntidad();
    this.messageService.add({
      severity: 'success',
      summary: 'Entidad seleccionada',
      detail: this.entidadLabel,
      life: 3000,
    });
  }

  limpiarEntidad() {
    this.filterEntidad = null;
    this.resetContextoEntidad();
  }

  /** Reinicia el contexto dependiente cuando cambia la entidad. */
  private resetContextoEntidad() {
    this.filtersApplied = false;
    this.filtersCollapsed = false;
    this.cerrarControlEnvio();
    this.showImportDialog = false;
    this.cerrarPanelesPaso1();
  }

  /**
   * `modoEntidades` define cómo se comporta el envío de la categoría frente a
   * las entidades agregadas (3 escenarios):
   *   • 'noAplica'    → la categoría no gestiona entidades agregadas. El botón
   *                     "Entidades agregadas" queda inactivo y el envío procede
   *                     sin validar entidades.
   *   • 'obligatoria' → exige al menos una entidad. Si no hay, el envío se
   *                     bloquea con un mensaje (Alerta 1).
   *   • 'agregadora'  → entidad agregadora: si no hay entidades configuradas,
   *                     el envío se confirma con asunción de responsabilidad
   *                     (Alerta 2). Ver enviarCategoria().
   * Sin valor explícito se asume 'noAplica'.
   */
  categoriaOptions: { label: string; value: string; modoEntidades?: ModoEntidades }[] = [
    { label: 'Seleccione categoría', value: '' },
    { label: 'INFORMACIÓN CONTABLE PÚBLICA CONVERGENCIA', value: 'ICP', modoEntidades: 'agregadora' },
    { label: 'INFORMACIÓN PRESUPUESTAL', value: 'IP', modoEntidades: 'obligatoria' },
    { label: 'INFORMACIÓN FINANCIERA', value: 'IF', modoEntidades: 'noAplica' },
    { label: 'CONTROL INTERNO CONTABLE', value: 'CIC', modoEntidades: 'obligatoria' },
    { label: 'CGR PRESUPUESTAL', value: 'CGR', modoEntidades: 'agregadora' },
    { label: 'FUT GASTOS DE FUNCIONAMIENTO', value: 'FUT_GF', modoEntidades: 'noAplica' },
    { label: 'FUT GASTOS DE INVERSIÓN', value: 'FUT_GI', modoEntidades: 'noAplica' },
    { label: 'FUT INGRESOS', value: 'FUT_ING', modoEntidades: 'noAplica' },
  ];

  anioOptions = [
    { label: 'Seleccione año', value: '' },
    { label: '2026', value: '2026' },
    { label: '2025', value: '2025' },
    { label: '2024', value: '2024' },
    { label: '2023', value: '2023' },
    { label: '2022', value: '2022' },
  ];

  /** Catálogo compartido: la etiqueta es el rango de meses. Ver periodos.ts. */
  periodoOptions = PERIODOS_FILTRO;

  // ──────────────────────────────────────────────────────────────────────
  // Acciones — agrupadas según el modelo de CRIS:
  //  • Globales (sobre toda la categoría): Importar, Enviar Adjunto,
  //    Entidades Agregadas, Generar protocolo, Exportar, Consultar Envíos.
  //  • Sobre seleccionados (1+ formularios marcados): Validar.
  //  • Terminal: Enviar Categoría — habilitada solo cuando TODOS los
  //    formularios del listado están validados localmente (etapa 2 / estado A).
  // ──────────────────────────────────────────────────────────────────────
  accionesGlobales: AccionPermiso[] = [
    { key: 'importar', label: 'Importar', icon: 'pi pi-upload', enabled: true },
    { key: 'enviarAdjunto', label: 'Enviar Adjunto', icon: 'pi pi-paperclip', enabled: true },
    { key: 'entidadesAgregadas', label: 'Entidades Agregadas', icon: 'pi pi-sitemap', enabled: true },
    { key: 'exportar', label: 'Exportar', icon: 'pi pi-download', enabled: true },
    { key: 'consultarEnvios', label: 'Consultar Envíos', icon: 'pi pi-inbox', enabled: true },
  ];

  accionesSeleccion: AccionPermiso[] = [
    { key: 'validar', label: 'Validar selección', icon: 'pi pi-check-circle', enabled: true },
  ];

  /** Compatibilidad: lista plana usada en lugares que aún la consumen. */
  get acciones(): AccionPermiso[] {
    return [...this.accionesGlobales, ...this.accionesSeleccion];
  }

  // ── Panel contextual activo ──
  activePanel: string | null = null;
  selectedFormularios: Formulario[] = [];

  // ── Importar (acción transversal de los 3 pasos) ──
  //
  // La importación sólo admite TXT (plano, según el protocolo de importación) y
  // es asíncrona: al confirmar, el archivo entra a la cola de proceso y el
  // resultado se notifica por correo. El diálogo recorre hasta tres momentos:
  //   1. 'seleccion'     → se elige el archivo y se valida la extensión
  //   2. 'justificacion' → SÓLO si la categoría ya fue enviada: reimportar
  //                        modifica información YA REPORTADA y hay que motivarlo
  //   3. 'confirmacion'  → SÓLO si el contexto ya tiene información importada:
  //                        avisa qué formularios se reemplazan y pide confirmar
  //   4. 'iniciado'      → alerta de proceso (o reproceso) iniciado + correo
  /** Única extensión admitida por la importación. */
  private readonly EXTENSION_IMPORT = '.txt';

  importFileName = '';
  /** Mensaje de rechazo del archivo elegido (extensión no admitida). */
  importFileError = '';
  /** Momento del diálogo de importación. */
  importPaso: 'seleccion' | 'justificacion' | 'confirmacion' | 'iniciado' = 'seleccion';
  /** True cuando lo iniciado reemplaza información ya importada. */
  esReimportacion = false;

  /* ── Justificación del reenvío ─────────────────────────────────────────
     Si la categoría ya se envió a la CGN, volver a importar modifica
     información YA REPORTADA. No se bloquea, pero exige motivo Y justificación
     escrita: los dos campos son obligatorios.
     El envío es, junto con la validación central, lo único que se razona
     por categoría; el resto del flujo es del contexto. */
  readonly REENVIO_JUSTIFICACION_MAX = 500;
  readonly reenvioMotivoOptions = [
    { label: 'Por error en el reporte de información', value: 'error' },
    { label: 'Solicitud de requerimiento por parte de la CGN', value: 'requerimiento' },
    { label: 'Conciliación de saldos pendientes', value: 'conciliacion' },
    { label: 'Otra', value: 'otra' },
  ];
  reenvioMotivo: string | null = null;
  reenvioJustificacion = '';
  reenvioMotivoError = '';
  reenvioJustificacionError = '';

  /** True si la categoría ya fue enviada a validación central. */
  get categoriaYaEnviada(): boolean {
    if (this.escenarioImport === 'reenvio') return true;
    return this.categoriaEnviada
      || this.filteredFormularios.some(f => this.esEnviado(f));
  }

  /** Diálogo de importación, accesible desde el botón transversal. */
  showImportDialog = false;

  /** Abre el diálogo de importación (gateado por el contexto del Paso 1). */
  abrirImportDialog() {
    if (!this.filtersApplied) return;
    this.resetImportDialog();
    this.showImportDialog = true;
  }

  cerrarImportDialog() {
    this.showImportDialog = false;
    this.resetImportDialog();
  }

  private resetImportDialog() {
    this.importFileName = '';
    this.importFileError = '';
    this.importPaso = 'seleccion';
    this.esReimportacion = false;
    this.reenvioMotivo = null;
    this.reenvioJustificacion = '';
    this.reenvioMotivoError = '';
    this.reenvioJustificacionError = '';
  }

  /**
   * Escenario de importación (SÓLO demostración). En producción esto no existe:
   * que haya o no información previa lo decide el estado del contexto. Como el
   * demo arranca con formularios ya importados, sin este switch nunca se vería
   * el mensaje de importación limpia.
   *   'auto'    → según los datos (lo que hará el sistema real)
   *   'limpio'  → fuerza "sin información previa": importación de primera vez
   *   'reenvio' → fuerza "categoría ya enviada": pide justificar el reenvío
   */
  escenarioImport: 'auto' | 'limpio' | 'reenvio' = 'auto';
  readonly escenarioImportOptions = [
    { label: 'Con información en el contexto · reimportación', value: 'auto' },
    { label: 'Sin información en el contexto · importación limpia', value: 'limpio' },
    { label: 'Categoría ya enviada · reenvío', value: 'reenvio' },
  ];

  /**
   * Formularios que ya cuentan con información para el CONTEXTO seleccionado
   * (entidad · año · periodo) y que, por tanto, el archivo reemplazaría. Si hay
   * al menos uno, la importación es una reimportación y el diálogo exige
   * confirmación antes de arrancar.
   *
   * Ojo con el alcance: importación y validación local son del contexto, no de
   * la categoría. La categoría sólo entra en la validación central y el envío.
   */
  get formulariosAReimportar(): Formulario[] {
    if (this.escenarioImport === 'limpio') return [];
    return this.filteredFormularios.filter(f => f.estado !== null);
  }

  /**
   * Validación de la extensión en el momento de elegir el archivo: si no es
   * .txt no se acepta, se explica por qué y se limpia el input para que el
   * usuario pueda volver a elegir (incluso el mismo archivo).
   */
  seleccionarArchivoImport(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    this.importFileName = '';
    this.importFileError = '';
    if (!archivo) return;

    if (!archivo.name.toLowerCase().endsWith(this.EXTENSION_IMPORT)) {
      this.importFileError =
        `"${archivo.name}" no es un archivo .txt. La importación sólo admite archivos de texto plano (.txt).`;
      input.value = '';
      this.messageService.add({
        severity: 'error',
        summary: 'Archivo no admitido',
        detail: 'Seleccione un archivo con extensión .txt.',
        life: 5000,
      });
      return;
    }
    this.importFileName = archivo.name;
  }

  // ── Exportar ──
  exportFormatOptions = [
    { label: 'Excel (.xlsx)', value: 'xlsx' },
    { label: 'PDF (.pdf)', value: 'pdf' },
    { label: 'CSV (.csv)', value: 'csv' },
  ];
  selectedExportFormat = 'xlsx';

  hasPermission(key: string): boolean {
    return this.acciones.find(a => a.key === key)?.enabled ?? false;
  }

  executeAction(key: string) {
    const accion = this.acciones.find(a => a.key === key);
    if (!accion) return;

    // Sin permisos → advertencia
    if (!accion.enabled) {
      this.messageService.add({
        severity: 'error',
        summary: 'CHIP - Acceso Denegado',
        detail: `No tiene permisos para "${accion.label}". Contacte al administrador de seguridad.`,
        life: 5000,
      });
      return;
    }

    // Validar requiere selección
    if (key === 'validar' && this.selectedFormularios.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Selección requerida', detail: 'Debe seleccionar al menos un formulario para validar.' });
      return;
    }

    // Toggle panel contextual
    if (['importar', 'exportar', 'consultarEnvios', 'validar'].includes(key)) {
      this.activePanel = this.activePanel === key ? null : key;
      return;
    }

    // Entidades Agregadas — abre modal de selección múltiple
    if (key === 'entidadesAgregadas') {
      this.abrirEntidadesModal();
      return;
    }
    if (key === 'enviarAdjunto') {
      this.messageService.add({ severity: 'info', summary: 'Enviar Adjunto', detail: 'Adjunte el archivo correspondiente a la categoría.' });
      return;
    }
  }

  /**
   * Envío final de la categoría — solo habilitado cuando todos los
   * formularios del listado están validados localmente. Reflejo del
   * flujo descrito por CRIS: validación local → envío central.
   */
  get todosValidados(): boolean {
    const lista = this.filteredFormularios;
    return lista.length > 0 && lista.every(f => this.esValidadoLocal(f));
  }

  /** Validado localmente: etapa Validación local (2) + estado Aceptado (A). */
  private esValidadoLocal(form: Formulario): boolean {
    return form.etapa === 2 && form.estado === 'A';
  }

  /** Enviado a validación central: etapa Envío (4) + estado Enviado (S). */
  private esEnviado(form: Formulario): boolean {
    return form.etapa === 4 && form.estado === 'S';
  }

  /** Etiqueta legible del periodo seleccionado (para el contexto de la pantalla). */
  get periodoLabel(): string {
    return this.periodoOptions.find(o => o.value === this.selectedPeriodo)?.label ?? '';
  }

  /** Diálogo de confirmación "entidad agregadora sin entidades" (Alerta 2). */
  showAgregadoraDialog = false;

  /** Modo de entidades agregadas de la categoría seleccionada (default noAplica). */
  get modoEntidades(): ModoEntidades {
    return this.categoriaOptions.find(o => o.value === this.selectedCategoria)?.modoEntidades
      ?? 'noAplica';
  }

  /** True cuando la categoría gestiona entidades agregadas (habilita el botón). */
  get entidadesAgregadasHabilitado(): boolean {
    return this.modoEntidades !== 'noAplica';
  }

  /** True si la categoría seleccionada corresponde a una entidad agregadora. */
  get categoriaEsAgregadora(): boolean {
    return this.modoEntidades === 'agregadora';
  }

  /** Etiqueta legible de la categoría seleccionada (para mensajes/diálogos). */
  get categoriaLabel(): string {
    return this.categoriaOptions.find(o => o.value === this.selectedCategoria)?.label
      ?? 'la categoría';
  }

  enviarCategoria() {
    if (!this.todosValidados) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Categoría no enviable',
        detail: 'Todos los formularios deben estar en Validación local · Aceptado antes de enviar la categoría.',
        life: 5000,
      });
      return;
    }

    // La categoría gestiona entidades agregadas y no hay ninguna configurada →
    // dos escenarios según el modo. Las categorías 'noAplica' se saltan esta
    // validación y envían directo.
    if (this.entidadesAgregadasHabilitado && this.selectedEntidades.length === 0) {
      if (this.categoriaEsAgregadora) {
        // Alerta 2: entidad agregadora — confirma asunción de responsabilidad.
        this.showAgregadoraDialog = true;
      } else {
        // Alerta 1: bloqueo — es obligatorio seleccionar al menos una entidad.
        this.messageService.add({
          severity: 'warn',
          summary: 'Seleccione entidades agregadas',
          detail: 'Debe agregar al menos una entidad antes de enviar la categoría. Use el botón "Entidades agregadas" para configurarlas.',
          life: 6000,
        });
      }
      return;
    }

    this.procederEnvioCategoria();
  }

  /** Confirmación del diálogo de entidad agregadora (Alerta 2). */
  confirmarEnvioAgregadora() {
    this.showAgregadoraDialog = false;
    this.procederEnvioCategoria();
  }

  /** Cancela el diálogo de entidad agregadora sin enviar. */
  cancelarEnvioAgregadora() {
    this.showAgregadoraDialog = false;
  }

  /** Envío efectivo de la categoría — aplica el resultado simulado (switch demo). */
  private procederEnvioCategoria() {
    this.categoriaEnviada = true;

    if (this.respuestaCentral === 'rechazado') {
      // Rechazo por deficiencia: UN formulario vuelve con etapa Validación
      // central (3) y estado Deficiencia (D); los demás quedan como estaban,
      // para poder reenviar tras corregirlo. El motivo se consulta en ese
      // formulario desde el listado (Sección 2 → "Ver motivo").
      let marcado = false;
      this._formulariosBase = this._formulariosBase.map(f => {
        if (!marcado) {
          marcado = true;
          return { ...f, etapa: 3 as EtapaId, estado: 'D' as EstadoId };
        }
        return f;
      });
      this.messageService.add({
        severity: 'error',
        summary: 'Envío rechazado por deficiencia',
        detail: 'Revise los formularios rechazados en el listado y corrija el motivo.',
        life: 6000,
      });
      return;
    }

    // Aceptado / En proceso: todos pasan a etapa Envío (4) / estado Enviado (S).
    this._formulariosBase = this._formulariosBase.map(f => ({
      ...f, etapa: 4 as EtapaId, estado: 'S' as EstadoId,
    }));
    this.messageService.add({
      severity: this.respuestaCentral === 'aceptado' ? 'success' : 'info',
      summary: this.respuestaCentral === 'aceptado' ? 'Categoría aceptada' : 'Categoría enviada',
      detail: this.respuestaCentral === 'aceptado'
        ? 'La validación central aceptó la categoría. No se requieren correcciones.'
        : 'La categoría fue enviada y está en validación central. Recibirá el resultado en Consultar envíos.',
      life: 5000,
    });
  }

  closePanel() {
    this.activePanel = null;
  }

  /**
   * Botón "Importar" / "Continuar". Antes de arrancar nada pasa por los filtros
   * que apliquen, en este orden: justificar el reenvío si la categoría ya se
   * reportó, y avisar del reemplazo si el contexto ya tiene información.
   */
  confirmImport() {
    if (!this.importFileName || this.importPaso === 'iniciado') return;

    if (this.importPaso === 'seleccion' && this.categoriaYaEnviada) {
      this.importPaso = 'justificacion';
      return;
    }
    if (this.importPaso === 'justificacion' && !this.validarJustificacionReenvio()) {
      return;
    }
    if (this.importPaso !== 'confirmacion' && this.formulariosAReimportar.length > 0) {
      this.importPaso = 'confirmacion';
      return;
    }
    this.iniciarProcesoImportacion();
  }

  /**
   * Motivo y justificación son obligatorios los dos. El tope de caracteres lo
   * impone además el maxlength del textarea: esto es el cinturón por si el
   * valor llegara por otra vía.
   */
  private validarJustificacionReenvio(): boolean {
    this.reenvioMotivoError = '';
    this.reenvioJustificacionError = '';

    if (!this.reenvioMotivo) {
      this.reenvioMotivoError = 'Seleccione el motivo del reenvío.';
    }
    const detalle = this.reenvioJustificacion.trim();
    if (!detalle) {
      this.reenvioJustificacionError = 'Describa la justificación del reenvío.';
    } else if (detalle.length > this.REENVIO_JUSTIFICACION_MAX) {
      this.reenvioJustificacionError =
        `La justificación no puede superar los ${this.REENVIO_JUSTIFICACION_MAX} caracteres.`;
    }

    const valido = !this.reenvioMotivoError && !this.reenvioJustificacionError;
    if (!valido) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Justificación incompleta',
        detail: 'Diligencie el motivo y la justificación del reenvío para continuar.',
        life: 4500,
      });
    }
    return valido;
  }

  /** "Cancelar reenvío": aborta la importación completa y cierra el diálogo. */
  cancelarReenvio() {
    this.cerrarImportDialog();
  }

  /** Vuelve del aviso de reemplazo a la selección de archivo, sin arrancar nada. */
  cancelarReimportacion() {
    this.importPaso = 'seleccion';
  }

  /**
   * Arranca el proceso. No se cierra el diálogo — se reemplaza su cuerpo por la
   * alerta, porque el usuario tiene que enterarse de que el proceso ya arrancó
   * y de que el resultado NO llega a esta pantalla sino a su correo.
   */
  private iniciarProcesoImportacion() {
    // Se calcula ANTES de tocar los estados: después, todos tienen registro.
    this.esReimportacion = this.formulariosAReimportar.length > 0;

    // Todo el contexto vuelve a la etapa Importación. Sólo una reimportación
    // arranca en Reimportando (N), y sólo para lo que ya tenía información; en
    // una importación limpia todo el contexto arranca en Importando (G).
    this._formulariosBase = this._formulariosBase.map(f => ({
      ...f,
      etapa: 1 as EtapaId,
      estado: (this.esReimportacion && f.estado !== null ? 'N' : 'G') as EstadoId,
    }));
    this.selectedFormularios = [];
    this.categoriaEnviada = false;
    this.programarAvanceProceso();

    this.importPaso = 'iniciado';
    this.activePanel = null;
    this.messageService.add({
      severity: 'info',
      summary: this.esReimportacion ? 'Reimportación iniciada' : 'Importación iniciada',
      detail: this.esReimportacion
        ? `"${this.importFileName}" inició su proceso de reimportación sobre el contexto seleccionado. El resultado se notificará a ${this.correoUsuario}.`
        : `"${this.importFileName}" inició su proceso de importación. El resultado se notificará a ${this.correoUsuario}.`,
      life: 6000,
    });
  }

  // ── Avance del proceso de importación (simulación de demostración) ────────
  // En producción el proceso corre en el servidor y el resultado llega por
  // correo; aquí se anima la secuencia real de estados para que la pantalla
  // muestre por dónde va cada formulario:
  //   limpia        →  Importando → En espera → Validando → Aceptado/Deficiencia
  //   reimportación →  Reimportando → Importando → En espera → Validando → …
  // Todo ocurre dentro de la etapa 1 (Importación).

  /** Duración de cada paso de la secuencia, en ms. */
  private readonly PASO_PROCESO_MS = 2200;

  /** Temporizadores en curso: se cancelan al reimportar, al filtrar y al destruir. */
  private timersProceso: number[] = [];

  /**
   * Con qué cierra el archivo demo cada formulario (id → tipo de error). Los
   * que no aparecen aquí terminan Aceptados. Se deja uno de cada familia para
   * poder comparar los dos juegos de códigos en el control de envío.
   */
  private readonly RESULTADO_IMPORTACION: Readonly<Record<number, TipoDeficiencia>> = {
    2: 'estructura',   // Balance General
    3: 'completitud',  // Estado de Resultados
  };

  /** Encadena los pasos restantes de la secuencia a partir del estado inicial. */
  private programarAvanceProceso(): void {
    this.cancelarAvanceProceso();
    const pasos: Array<() => void> = [];
    // La reimportación gasta un paso extra: primero Reimportando, luego ya
    // entra al mismo carril que una importación limpia.
    if (this.esReimportacion) pasos.push(() => this.aplicarEstadoATodos('G'));
    pasos.push(() => this.aplicarEstadoATodos('W'));
    pasos.push(() => this.aplicarEstadoATodos('V'));
    pasos.push(() => this.aplicarResultadoImportacion());

    pasos.forEach((paso, i) => {
      this.timersProceso.push(
        window.setTimeout(paso, this.PASO_PROCESO_MS * (i + 1)),
      );
    });
  }

  private cancelarAvanceProceso(): void {
    this.timersProceso.forEach(id => window.clearTimeout(id));
    this.timersProceso = [];
  }

  /** Mueve todo el contexto al mismo estado dentro de la etapa Importación. */
  private aplicarEstadoATodos(estado: EstadoId): void {
    this._formulariosBase = this._formulariosBase.map(f => ({
      ...f, etapa: 1 as EtapaId, estado,
    }));
  }

  /**
   * Cierra el proceso: reparte Aceptado / Deficiencia y deja registrado con qué
   * familia de códigos falló cada formulario. Las deficiencias cacheadas se
   * descartan: son de un proceso que ya no es el último.
   */
  private aplicarResultadoImportacion(): void {
    let conDeficiencia = 0;
    this._formulariosBase = this._formulariosBase.map(f => {
      const tipo = this.RESULTADO_IMPORTACION[f.id];
      this.deficienciasPorFormulario.delete(f.id);
      if (tipo) {
        this.tipoDeficienciaPorFormulario.set(f.id, tipo);
        conDeficiencia++;
        return { ...f, etapa: 1 as EtapaId, estado: 'D' as EstadoId };
      }
      this.tipoDeficienciaPorFormulario.delete(f.id);
      return { ...f, etapa: 1 as EtapaId, estado: 'A' as EstadoId };
    });
    // Si el control de envío está abierto, que muestre ya el proceso nuevo.
    this.refrescarDeficienciasVisibles();

    const aceptados = this._formulariosBase.length - conDeficiencia;
    this.messageService.add({
      severity: conDeficiencia ? 'warn' : 'success',
      summary: 'Proceso de importación finalizado',
      detail: `${aceptados} formulario(s) aceptados y ${conDeficiencia} con deficiencias. `
        + 'Abra el estado "Deficiencia" para ver los mensajes del proceso.',
      life: 7000,
    });
  }

  confirmExport() {
    this.messageService.add({ severity: 'success', summary: 'Exportación iniciada', detail: `Exportando ${this.filteredFormularios.length} formulario(s) en formato ${this.selectedExportFormat.toUpperCase()}...` });
    this.activePanel = null;
  }

  confirmValidation() {
    const count = this.selectedFormularios.length;
    // Los seleccionados avanzan a etapa Validación local (2) / estado Aceptado (A).
    // Incluye los que están "Sin registro": si la categoría no exige archivo,
    // se validan igual y la entidad los presenta vacíos.
    const seleccionadosIds = new Set(this.selectedFormularios.map(f => f.id));
    this._formulariosBase = this._formulariosBase.map(f =>
      seleccionadosIds.has(f.id) ? { ...f, etapa: 2 as EtapaId, estado: 'A' as EstadoId } : f,
    );
    this.selectedFormularios = [];
    this.activePanel = null;
    // Al re-validar tras un rechazo, el resultado del envío anterior deja de aplicar.
    this.categoriaEnviada = false;

    // Mensaje contextual: si todos quedaron validados, el botón "Siguiente"
    // se habilita y se invita a continuar al paso Envíos.
    if (this.todosValidados) {
      this.messageService.add({
        severity: 'success',
        summary: 'Todos los formularios validados',
        detail: `${count} formulario(s) pasaron a Validación local · Aceptado. Puede continuar al paso Envíos.`,
        life: 5000,
      });
    } else {
      const pendientes = this.filteredFormularios.filter(f => !this.esValidadoLocal(f)).length;
      this.messageService.add({
        severity: 'success',
        summary: 'Validación exitosa',
        detail: `${count} formulario(s) validado(s). Quedan ${pendientes} pendiente(s) por validar antes de avanzar a Envíos.`,
        life: 4500,
      });
    }
  }

  get canValidate(): boolean {
    return this.hasPermission('validar') && this.selectedFormularios.length > 0;
  }

  /**
   * Plantillas de formularios — el listado real se genera dinámicamente en
   * `filteredFormularios` según los filtros aplicados. Esto evita que el demo
   * salga vacío para combinaciones que no estén "cableadas" en el mock.
   */
  private readonly plantillasFormulario: Array<{
    nombre: string; etapa: EtapaId; estado: EstadoId | null;
  }> = [
    // El orden sigue el ciclo de vida, para que el listado del demo muestre de
    // arriba a abajo todos los casos que la columna Estado sabe representar.
    //
    // Sin registro: está en la etapa 1 pero todavía no se ha importado. Puede
    // validarse igual si la categoría no exige archivo (se presenta vacío).
    { nombre: 'Notas a los Estados Financieros', etapa: 1, estado: null },
    // Importados sin validar: la importación quedó Aceptada, falta validar local.
    { nombre: 'Balance General', etapa: 1, estado: 'A' },
    { nombre: 'Estado de Resultados', etapa: 1, estado: 'A' },
    { nombre: 'Flujo de Efectivo', etapa: 1, estado: 'A' },
    // Ya validado localmente.
    { nombre: 'Estado de Cambios en el Patrimonio', etapa: 2, estado: 'A' },
    // Devuelto por la validación central con deficiencia.
    { nombre: 'Información Complementaria', etapa: 3, estado: 'D' },
  ];

  searchFormulario = '';

  // ── Filtros ──
  get canApplyFilters(): boolean {
    return !!this.filterEntidad && !this.entidadInactiva
      && !!this.selectedCategoria && !!this.selectedAnio && !!this.selectedPeriodo;
  }

  /**
   * Listado filtrado — backing field cacheado para evitar recomputar y
   * recrear arrays en cada ciclo de Angular (eso colgaba la UI al
   * cambiar filtros, porque cada CD veía un array "nuevo").
   */
  private _formulariosBase: Formulario[] = [];
  get filteredFormularios(): Formulario[] {
    if (!this.filtersApplied) return [];
    const q = this.searchFormulario.trim().toLowerCase();
    if (!q) return this._formulariosBase;
    return this._formulariosBase.filter(
      f => f.nombre.toLowerCase().includes(q) || f.codigo.toLowerCase().includes(q),
    );
  }

  /** Recalcula el listado base a partir de los filtros aplicados. */
  private recomputarFormulariosBase() {
    // Contexto nuevo: se abandona el proceso en curso y su expediente.
    this.cancelarAvanceProceso();
    this.deficienciasPorFormulario.clear();
    this.tipoDeficienciaPorFormulario.clear();
    const periodoLabel = this.selectedPeriodo || 'T1';
    const anioNum = this.selectedAnio ? +this.selectedAnio : 2024;
    const catCode = this.selectedCategoria || 'ICP';

    this._formulariosBase = this.plantillasFormulario.map((plantilla, idx) => ({
      id: idx + 1,
      codigo: `CGN-${catCode}-${String(idx + 1).padStart(2, '0')}`,
      nombre: plantilla.nombre,
      tipo: 'Formulario',
      categoria: catCode,
      periodo: periodoLabel,
      anio: anioNum,
      etapa: plantilla.etapa,
      estado: plantilla.estado,
      ultimaModificacion: `0${(idx % 9) + 1}/${(idx % 12) + 1}/${anioNum}`,
    }));
    // Contexto nuevo: aún no se ha enviado.
    this.categoriaEnviada = false;
  }

  applyFilters() {
    if (!this.canApplyFilters) {
      this.messageService.add({ severity: 'warn', summary: 'Filtros requeridos', detail: 'Debe seleccionar Entidad, Categoría, Año y Periodo.' });
      return;
    }
    this.recomputarFormulariosBase();
    this.filtersApplied = true;
    // Al aplicar, el acordeón de filtros se colapsa a su resumen de chips.
    this.filtersCollapsed = true;
  }

  /**
   * Al modificar cualquier filtro tras haberlos aplicado, el contexto deja de
   * ser válido: Consultar envíos, Importar y Siguiente vuelven a inactivarse
   * (gateados por `filtersApplied`) y se cierran los paneles abiertos.
   */
  onFiltroModificado() {
    if (this.filtersApplied) {
      this.filtersApplied = false;
      this.cerrarControlEnvio();
      this.showImportDialog = false;
      this.categoriaEnviada = false;
      this.cerrarPanelesPaso1();
    }
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.filterEntidad) count++;
    if (this.selectedCategoria) count++;
    if (this.selectedAnio) count++;
    if (this.selectedPeriodo) count++;
    return count;
  }

  get activeFilters(): { label: string; field: string }[] {
    const filters: { label: string; field: string }[] = [];
    if (this.selectedCategoria) {
      const cat = this.categoriaOptions.find(o => o.value === this.selectedCategoria);
      filters.push({ label: `Categoría: ${cat?.label || this.selectedCategoria}`, field: 'selectedCategoria' });
    }
    if (this.selectedAnio) filters.push({ label: `Año: ${this.selectedAnio}`, field: 'selectedAnio' });
    if (this.selectedPeriodo) {
      const per = this.periodoOptions.find(o => o.value === this.selectedPeriodo);
      filters.push({ label: `Periodo: ${per?.label || this.selectedPeriodo}`, field: 'selectedPeriodo' });
    }
    return filters;
  }

  removeFilter(field: string) {
    (this as any)[field] = '';
    this.filtersApplied = false;
  }

  clearFilters() {
    this.selectedCategoria = '';
    this.selectedAnio = '';
    this.selectedPeriodo = '';
    this.filtersApplied = false;
    this.filtersCollapsed = false;
    this.searchFormulario = '';
    this.cerrarControlEnvio();
    this.showImportDialog = false;
    this.categoriaEnviada = false;
    this.cerrarPanelesPaso1();
  }

  // ──────────────────────────────────────────────────────────────────────
  // Modal "Entidades Agregadas" — selección múltiple para asignar entidades
  // destino a la categoría. Lista virtualizada con buscador y select-all.
  // Ubicado en el paso "Envíos" del wizard. La selección persiste entre
  // aperturas dentro de la misma sesión del componente.
  // ──────────────────────────────────────────────────────────────────────
  showEntidadesModal = false;
  entidadesBusqueda = '';
  selectedEntidades: EntidadAgregada[] = [];

  /** Catálogo mock de entidades disponibles (~300, combinatorias tipo×municipio). */
  readonly entidadesDisponibles: EntidadAgregada[] = this.generarEntidadesMock();

  abrirEntidadesModal() {
    this.entidadesBusqueda = '';
    this.showEntidadesModal = true;
  }

  cerrarEntidadesModal() {
    this.entidadesBusqueda = '';
    this.showEntidadesModal = false;
  }

  /** Filtrado por código, NIT o razón social — los 3 campos visibles en la tabla. */
  get entidadesFiltradas(): EntidadAgregada[] {
    const q = this.entidadesBusqueda.trim().toLowerCase();
    if (!q) return this.entidadesDisponibles;
    return this.entidadesDisponibles.filter(e =>
      e.id.toLowerCase().includes(q)
      || e.nit.toLowerCase().includes(q)
      || e.nombre.toLowerCase().includes(q),
    );
  }

  /** True cuando todas las entidades filtradas están seleccionadas. */
  get allFilteredSelected(): boolean {
    const filtradas = this.entidadesFiltradas;
    if (filtradas.length === 0) return false;
    const seleccionadasIds = new Set(this.selectedEntidades.map(e => e.id));
    return filtradas.every(e => seleccionadasIds.has(e.id));
  }

  /** Toggle del checkbox "Seleccionar todas" — aplica sólo a las filtradas. */
  toggleAllEntidades() {
    const filtradas = this.entidadesFiltradas;
    if (filtradas.length === 0) return;
    if (this.allFilteredSelected) {
      const filtradasIds = new Set(filtradas.map(e => e.id));
      this.selectedEntidades = this.selectedEntidades.filter(e => !filtradasIds.has(e.id));
    } else {
      const seleccionadasIds = new Set(this.selectedEntidades.map(e => e.id));
      const nuevas = filtradas.filter(e => !seleccionadasIds.has(e.id));
      this.selectedEntidades = [...this.selectedEntidades, ...nuevas];
    }
  }

  confirmarAsignacionEntidades() {
    const count = this.selectedEntidades.length;
    this.showEntidadesModal = false;
    this.entidadesBusqueda = '';
    this.messageService.add({
      severity: 'success',
      summary: 'Entidades asignadas',
      detail: `${count} entidad${count === 1 ? '' : 'es'} asignada${count === 1 ? '' : 's'} a la categoría.`,
      life: 3500,
    });
  }

  /**
   * Genera el catálogo mock combinando tipos de entidad con municipios.
   * 15 tipos × 20 municipios ≈ 300 entidades — suficiente para demostrar
   * virtualización del listado sin inflar el bundle.
   */
  private generarEntidadesMock(): EntidadAgregada[] {
    const tipos = [
      'Alcaldía Municipal de',
      'Gobernación de',
      'Hospital Regional de',
      'Instituto de Desarrollo de',
      'Universidad Pública de',
      'Empresa de Servicios Públicos de',
      'Secretaría de Salud de',
      'Secretaría de Educación de',
      'Personería Municipal de',
      'Contraloría Departamental de',
      'Cámara de Comercio de',
      'Empresa Social del Estado de',
      'Corporación Autónoma Regional de',
      'Instituto de Cultura y Turismo de',
      'Caja de Compensación Familiar de',
    ];
    const municipios = [
      'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
      'Cúcuta', 'Bucaramanga', 'Pereira', 'Manizales', 'Ibagué',
      'Santa Marta', 'Villavicencio', 'Pasto', 'Neiva', 'Armenia',
      'Popayán', 'Tunja', 'Sincelejo', 'Riohacha', 'Quibdó',
    ];
    const lista: EntidadAgregada[] = [];
    let counter = 1;
    for (const tipo of tipos) {
      for (const muni of municipios) {
        lista.push({
          id: `ENT-${String(counter).padStart(4, '0')}`,
          nombre: `${tipo} ${muni}`,
          nit: this.generarNit(counter),
        });
        counter++;
      }
    }
    return lista;
  }

  /** NIT mock con formato 800.xxx.xxx-d, dígito de verificación pseudo-aleatorio. */
  private generarNit(seed: number): string {
    const base = 800000000 + seed * 13;
    const s = String(base);
    const dv = seed % 10;
    return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${dv}`;
  }

  /* ── Catálogo etapa/estado — accesores para el listado ────────────────── */

  /** Presentación (no estado) de un formulario todavía sin registro. */
  readonly sinRegistroLabel = SIN_REGISTRO_LABEL;
  readonly sinRegistroAyuda = SIN_REGISTRO_AYUDA;

  /* Accesores del catálogo, expuestos como campos para poder llamarlos
     desde la plantilla. */
  readonly etapaDe = etapaDe;
  readonly estadoDe = estadoDe;

  /**
   * Tooltip del tag de estado: código y nombre exactos del catálogo, más la
   * descripción cuando aporta algo distinto al nombre. El dato esencial ya
   * está visible en el tag; esto es sólo la referencia al modelo de datos.
   */
  estadoTooltip(id: EstadoId): string {
    const estado = this.estadoDe(id);
    const base = `${estado.id} · ${estado.nombre}`;
    return estado.descripcion === estado.nombre
      ? base
      : `${base} — ${estado.descripcion}`;
  }
}
