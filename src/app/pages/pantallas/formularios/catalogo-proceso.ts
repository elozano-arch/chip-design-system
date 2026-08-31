/**
 * Catálogo del proceso de formularios — espejo del modelo de datos del backend.
 * Vive aparte porque lo comparten la pantalla de formularios y la tabla de
 * deficiencias del control de envío.
 */

/** Severity admitida por los `p-tag` del panel de estado. */
export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

/* ═══════════════════════════════════════════════════════════════════════
   Etapa y estado del proceso — espejo del modelo de datos del backend.
   Tres tablas replicadas aquí como catálogo del demo:
     • tab_etapa_proceso  → id_etapa_proceso 1..4 (fase del flujo)
     • tab_estado         → id_estado (char) + nombre + descripción
     • cruce etapa↔estado → qué estados son válidos en cada etapa
   El listado de formularios muestra el par: la etapa dice en qué fase del
   flujo va el formulario y el estado qué pasó dentro de esa fase.
   ═══════════════════════════════════════════════════════════════════════ */

/** `tab_etapa_proceso.id_etapa_proceso`. */
export type EtapaId = 1 | 2 | 3 | 4;

/** `tab_estado.id_estado`. */
export type EstadoId = 'V' | 'M' | 'D' | 'A' | 'E' | 'G' | 'W' | 'S' | 'N';

export interface EtapaProceso {
  id: EtapaId;
  /** `tab_etapa_proceso.nombre`, tal cual está en BD. */
  nombre: string;
  /** Etiqueta legible para la UI (la de BD viene en snake_case). */
  label: string;
  icon: string;
}

export interface EstadoProceso {
  id: EstadoId;
  /** `tab_estado.nombre`, tal cual está en BD. */
  nombre: string;
  /** `tab_estado.descripcion`, tal cual está en BD. */
  descripcion: string;
  /** Etiqueta legible para el `p-tag` (la de BD viene en mayúsculas). */
  label: string;
  severity: TagSeverity;
}

export const ETAPAS_PROCESO: readonly EtapaProceso[] = [
  { id: 1, nombre: 'Importacion',        label: 'Importación',        icon: 'pi pi-file-import' },
  { id: 2, nombre: 'Validacion_Local',   label: 'Validación local',   icon: 'pi pi-check-square' },
  { id: 3, nombre: 'Validacion_Central', label: 'Validación central', icon: 'pi pi-building' },
  { id: 4, nombre: 'Envio',              label: 'Envío',              icon: 'pi pi-send' },
];

export const ESTADOS_PROCESO: readonly EstadoProceso[] = [
  { id: 'V', nombre: 'VALIDACION',          descripcion: 'PROCESO EN VALIDACION',           label: 'En validación',       severity: 'info' },
  { id: 'M', nombre: 'REQUIERE_COMENTARIO', descripcion: 'DEFICIENCIA REQUIERE COMENTARIO', label: 'Requiere comentario', severity: 'warn' },
  { id: 'D', nombre: 'DEFICIENCIA',         descripcion: 'ERROR DE DEFICIENCIA',            label: 'Deficiencia',         severity: 'danger' },
  { id: 'A', nombre: 'ACEPTADO',            descripcion: 'ACEPTADO',                        label: 'Aceptado',            severity: 'success' },
  { id: 'E', nombre: 'ERROR_TECNICO',       descripcion: 'ERROR TECNICO',                   label: 'Error técnico',       severity: 'danger' },
  { id: 'G', nombre: 'CARGA_ARCHIVO',       descripcion: 'CARGANDO ARCHIVO',                label: 'Importando',          severity: 'info' },
  { id: 'W', nombre: 'EN ESPERA',           descripcion: 'PROCESO EN ESPERA',               label: 'En espera',           severity: 'warn' },
  { id: 'S', nombre: 'ENVIADO',             descripcion: 'PROCESO ENVIADO A CENTRAL',       label: 'Enviado',             severity: 'info' },
  { id: 'N', nombre: 'REIMPORTANDO',        descripcion: 'REIMPORTACION DE INFORMACION',    label: 'Reimportando',        severity: 'warn' },
];

/**
 * "Sin registro" NO es un estado del catálogo: es una presentación. Se muestra
 * cuando el formulario no tiene registro en el detalle, para comunicar que está
 * en la etapa 1 (Importación) sin haberse importado todavía. Por eso se pinta
 * como texto neutro y no como `p-tag` — un tag lo haría parecer un estado más.
 *
 * IMPORTANTE — un formulario sin registro SÍ se puede seleccionar y validar:
 * cuando la categoría no exige archivo, pasa a validado y la entidad lo
 * presenta vacío. No bloquear su checkbox ni el botón "Validar formulario".
 */
export const SIN_REGISTRO_LABEL = 'Sin registro';
export const SIN_REGISTRO_AYUDA =
  'El formulario aún no se ha importado. Si la categoría no exige archivo, '
  + 'puede validarse y presentarse vacío.';

/**
 * Estados válidos en cada etapa — cruce etapa↔estado del modelo. Ningún
 * formulario puede quedar en un par (etapa, estado) fuera de esta matriz.
 */
export const ESTADOS_POR_ETAPA: Readonly<Record<EtapaId, readonly EstadoId[]>> = {
  1: ['A', 'D', 'E', 'G', 'N', 'V', 'W'],
  2: ['A', 'D', 'M', 'N', 'V', 'W'],
  3: ['A', 'D', 'M', 'N', 'V', 'W'],
  4: ['E', 'S', 'W'],
};

/**
 * Resultado de la validación central de la categoría (simulación demo).
 *   ninguna    → aún no enviado / sin respuesta
 *   enProceso  → enviado, en validación central
 *   aceptado   → aceptado por la CGN
 *   rechazado  → rechazado por deficiencia
 */
export type RespuestaCentral = 'ninguna' | 'enProceso' | 'aceptado' | 'rechazado';

/**
 * Naturaleza del error con el que cierra un proceso de importación. Cada tipo
 * tiene su propia familia de códigos de mensaje, y un mismo proceso no mezcla
 * las dos: o el archivo está mal formado (estructura) o le falta información
 * exigida por la categoría (completitud).
 *   • estructura  → `EST-###`  (longitud, tipo de dato, concepto inexistente…)
 *   • completitud → `COMP-###` (concepto obligatorio ausente, periodo incompleto…)
 */
export type TipoDeficiencia = 'estructura' | 'completitud';

/**
 * Mensaje de deficiencia tal como lo devuelve una verificación. El `id` es
 * consecutivo DENTRO de la etapa, no global: dos etapas distintas pueden tener
 * ambas un id 1.
 *
 * `permisible` indica que la categoría se puede enviar aun con la deficiencia
 * presente; `requiereComentario` obliga a justificarla y es lo único que
 * habilita la caja de comentario de esa fila. Las deficiencias de importación
 * llevan los dos en `false`: un archivo mal formado no se justifica, se corrige.
 */
export interface MensajeDeficiencia {
  id: number;
  codMensaje: string;
  mensaje: string;
  permisible: boolean;
  requiereComentario: boolean;
}

/**
 * Un registro del detalle del proceso. Es la unidad del control de envío: el
 * histórico lista TODOS los procesos del formulario, hayan generado
 * deficiencias o no — un proceso aceptado, uno con error técnico y uno en
 * curso son parte del expediente igual que uno que falló.
 */
export interface ProcesoDetalle {
  etapa: EtapaId;
  idDetalleProceso: number;
  /** Estado con que cerró el registro de detalle — `tab_estado`. */
  estado: EstadoId;
  /** Quien ejecutó el proceso. No es el autor del comentario. */
  usuarioProceso: string;
  /** Vacío = el proceso no generó deficiencias. */
  deficiencias: readonly MensajeDeficiencia[];
}

/**
 * Fila de la tabla del control de envío: los datos del registro de detalle más
 * los de la deficiencia. Cuando el proceso no generó ninguna, `id` es `null` y
 * las columnas de deficiencia van vacías.
 */
export interface DeficienciaEnvio {
  etapa: EtapaId;
  idDetalleProceso: number;
  estado: EstadoId;
  usuarioProceso: string;
  /** `null` = el proceso no generó deficiencia. */
  id: number | null;
  codMensaje: string;
  mensaje: string;
  permisible: boolean;
  requiereComentario: boolean;
  /**
   * Texto en edición de la variante "en la grilla". La variante "en modal"
   * no lo usa: allí el borrador vive en el componente, para que cancelar no
   * deje rastro en la fila.
   */
  comentario: string;
  /** Error de validación bajo la caja, sólo en la variante "en la grilla". */
  comentarioError: string;
  /** Justificación confirmada, la escriba quien la escriba. */
  comentarioGuardado: string;
  /** Fecha en que se guardó la justificación (vacío = todavía sin justificar). */
  fechaComentario: string;
}

/**
 * Aplana un proceso en filas de tabla. Sin deficiencias devuelve una sola fila
 * con los datos del proceso, que es como el histórico deja ver los procesos
 * que terminaron bien.
 */
export function filasDeProceso(proceso: ProcesoDetalle): DeficienciaEnvio[] {
  const cabecera = {
    etapa: proceso.etapa,
    idDetalleProceso: proceso.idDetalleProceso,
    estado: proceso.estado,
    usuarioProceso: proceso.usuarioProceso,
  };
  const vacios = {
    comentario: '', comentarioError: '', comentarioGuardado: '', fechaComentario: '',
  };
  if (proceso.deficiencias.length === 0) {
    return [{
      ...cabecera, ...vacios,
      id: null, codMensaje: '', mensaje: '',
      permisible: false, requiereComentario: false,
    }];
  }
  return proceso.deficiencias.map(d => ({ ...cabecera, ...d, ...vacios }));
}

/** Fila de `tab_etapa_proceso` que corresponde a una etapa. */
export function etapaDe(id: EtapaId): EtapaProceso {
  return ETAPAS_PROCESO.find(e => e.id === id) ?? ETAPAS_PROCESO[0];
}

/** Fila de `tab_estado` que corresponde a un estado. */
export function estadoDe(id: EstadoId): EstadoProceso {
  return ESTADOS_PROCESO.find(e => e.id === id) ?? ESTADOS_PROCESO[0];
}

