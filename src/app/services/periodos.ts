/**
 * Catálogo único de periodos del design system.
 *
 * **Convención:** la etiqueta es el RANGO de meses, "mes inicial - mes final".
 * El rango ya comunica la periodicidad y por eso no se nombra aparte:
 *
 *   Enero - Enero      → mensual
 *   Enero - Marzo      → trimestral
 *   Enero - Junio      → semestral
 *   Enero - Diciembre  → anual
 *
 * Antes cada pantalla escribía lo suyo ("Enero - Marzo (Trimestre 1)",
 * "I Trimestre (Ene-Mar)", "Trimestre I"), y en Levantamiento de restricciones
 * las dos listas del mismo archivo ya habían divergido entre sí. Cualquier
 * pantalla que necesite periodos toma las opciones de aquí.
 */

/** Periodicidad con la que una categoría reporta. */
export type Periodicidad = 'mensual' | 'trimestral' | 'semestral' | 'anual';

export interface OpcionPeriodo {
  label: string;
  value: string;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

/** Mensual: value '01'..'12'. El rango es el mismo mes en los dos extremos. */
export const PERIODOS_MENSUALES: OpcionPeriodo[] = MESES.map((mes, i) => ({
  label: `${mes} - ${mes}`,
  value: String(i + 1).padStart(2, '0'),
}));

export const PERIODOS_TRIMESTRALES: OpcionPeriodo[] = [
  { label: 'Enero - Marzo', value: 'T1' },
  { label: 'Abril - Junio', value: 'T2' },
  { label: 'Julio - Septiembre', value: 'T3' },
  { label: 'Octubre - Diciembre', value: 'T4' },
];

export const PERIODOS_SEMESTRALES: OpcionPeriodo[] = [
  { label: 'Enero - Junio', value: 'S1' },
  { label: 'Julio - Diciembre', value: 'S2' },
];

export const PERIODO_ANUAL: OpcionPeriodo = { label: 'Enero - Diciembre', value: 'ANUAL' };

/** Opciones que corresponden a una periodicidad. */
export function periodosDe(periodicidad: Periodicidad): OpcionPeriodo[] {
  switch (periodicidad) {
    case 'mensual': return PERIODOS_MENSUALES;
    case 'trimestral': return PERIODOS_TRIMESTRALES;
    case 'semestral': return PERIODOS_SEMESTRALES;
    case 'anual': return [PERIODO_ANUAL];
  }
}

/** Etiqueta de un periodo dentro de su periodicidad ('' si no existe). */
export function etiquetaPeriodo(periodicidad: Periodicidad, value: string): string {
  return periodosDe(periodicidad).find(o => o.value === value)?.label ?? '';
}

/**
 * Opciones del filtro de periodo de las pantallas de consulta: los cuatro
 * trimestres más el anual, precedidos del placeholder de selección.
 */
export const PERIODOS_FILTRO: OpcionPeriodo[] = [
  { label: 'Seleccione periodo', value: '' },
  ...PERIODOS_TRIMESTRALES,
  PERIODO_ANUAL,
];
