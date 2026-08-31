import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import { SesionService } from '../../../services/sesion.service';

/** Ancho simulado de los mockups. Las media queries reales no disparan dentro
 *  de la página, así que el cambio de vista se aplica por clase. */
type Vista = 'escritorio' | 'tablet';

/**
 * Las dos respuestas posibles a "¿un usuario puede operar varias entidades?".
 * La pregunta es funcional, no estética, y cambia cuál propuesta sirve.
 */
type Escenario = 'una' | 'varias';

/** Cómo queda cada propuesta bajo un escenario dado. */
interface Veredicto {
  opcion: string;
  estado: 'recomendada' | 'sirve' | 'descartada';
  razon: string;
}

interface EscenarioPropuesta {
  id: Escenario;
  titulo: string;
  premisa: string;
  veredictos: Veredicto[];
  /** Combinación que se recomienda si este escenario es el verdadero. */
  conclusion: string;
  puntos: string[];
  /** Qué se pierde si se implementa este escenario y el real era el otro. */
  riesgo: string;
}

/**
 * Fila de la tabla comparativa. Una columna por opción para que la lectura
 * sea horizontal: "este criterio, ¿cómo se resuelve en cada propuesta?".
 */
interface FilaComparativa {
  criterio: string;
  a: string;
  b: string;
  c: string;
  d: string;
  e: string;
}

/** Entidad del selector de la opción D (usuario con varias entidades). */
interface OpcionEntidad {
  codigo: string;
  razonSocial: string;
}

/**
 * Propuestas para mostrar los datos del usuario en sesión en el cabezote
 * (CH-1737). Nace de la revisión con el Ing. Armando y Diana Latorre: la
 * píldora que está hoy en producción es la opción A y sirve de línea base;
 * B, C y D son las alternativas a comparar.
 *
 * Esta pantalla NO modifica el cabezote real — sólo simula las cuatro
 * variantes para que el equipo elija una antes de implementarla.
 */
@Component({
  selector: 'app-propuesta-datos-usuario',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, DividerModule, MessageModule, PopoverModule,
    SelectModule, SelectButtonModule, TableModule, TagModule, TooltipModule,
    AppBreadcrumbComponent,
  ],
  templateUrl: './propuesta-datos-usuario.component.html',
  styleUrl: './propuesta-datos-usuario.component.scss',
})
export class PropuestaDatosUsuarioComponent {
  private readonly sesion = inject(SesionService);

  /** Los mockups usan el usuario real en sesión: mismo dato en las 4 opciones. */
  readonly usuario = this.sesion.usuario;

  // ─── Simulación de ancho ────────────────────────────────────────────────
  readonly vistas: Array<{ label: string; value: Vista; icon: string }> = [
    { label: 'Escritorio', value: 'escritorio', icon: 'pi pi-desktop' },
    { label: 'Tablet', value: 'tablet', icon: 'pi pi-tablet' },
  ];

  vista: Vista = 'escritorio';

  // ─── Estado de los paneles desplegables (opciones B y D) ────────────────
  // Se refleja en aria-expanded del botón que los abre.
  panelBAbierto = false;
  panelDAbierto = false;

  // ─── Selector de entidad (opción D) ─────────────────────────────────────
  /** En producción esta lista viene del backend y supera las 10 opciones,
   *  por eso el p-select lleva búsqueda. */
  readonly entidades: OpcionEntidad[] = [
    { codigo: '210111001', razonSocial: 'Contaduría General de la Nación' },
    { codigo: '211111001', razonSocial: 'Alcaldía Mayor de Bogotá D.C.' },
    { codigo: '212515001', razonSocial: 'Gobernación de Antioquia' },
  ];

  entidadActiva: string = this.entidades[0].codigo;

  get entidadActivaNombre(): string {
    const entidad = this.entidades.find(e => e.codigo === this.entidadActiva);
    return entidad ? entidad.razonSocial : '';
  }

  /** Sigla corta para el chip del cabezote en la opción D. */
  get entidadActivaSigla(): string {
    return this.entidadActivaNombre
      .split(' ')
      .filter(palabra => palabra.length > 3)
      .map(palabra => palabra[0])
      .join('')
      .slice(0, 4)
      .toUpperCase();
  }

  /**
   * Segundo ejemplo de la opción E: entidad con razón social larga, que es
   * el caso que obliga a truncar. El texto es el que trajo CGN.
   */
  readonly ejemploLargo = {
    usuario: 'ESPCOLOSO8627',
    nombreCompleto: 'Mónica Beltrán Salazar',
    perfil: 'Responsable de Reporte',
    entidad: 'E.S.P. EMPRESA MUNICIPAL DE ACUEDUCTO, ALCANTARILLADO Y ASEO',
  };

  /** Estado de los paneles de la opción E (aria-expanded de cada disparador). */
  panelEAbierto = false;
  panelELargoAbierto = false;

  // ─── Tabla comparativa ──────────────────────────────────────────────────
  readonly comparativa: FilaComparativa[] = [
    {
      criterio: 'Espacio que ocupa en el cabezote',
      a: 'Alto — píldora de ~320 px',
      b: 'Bajo — avatar y nombre',
      c: 'Medio — se reparte en dos filas',
      d: 'Bajo — avatar y sigla',
      e: 'Bajo — dos líneas compactas',
    },
    {
      criterio: 'Perfil y entidad visibles sin hacer clic',
      a: 'Sí',
      b: 'No — hay que abrir el panel',
      c: 'Sí',
      d: 'Sólo la entidad',
      e: 'La entidad sí; el perfil no',
    },
    {
      criterio: 'Qué pasa en tablet',
      a: 'Colapsa a sólo avatar: se pierde el contexto',
      b: 'Igual en todos los anchos',
      c: 'La barra de contexto se mantiene',
      d: 'Igual en todos los anchos',
      e: 'Igual en todos los anchos',
    },
    {
      criterio: 'Acciones de sesión (perfil, clave, salir)',
      a: 'No las ofrece',
      b: 'Sí, dentro del panel',
      c: 'No las ofrece',
      d: 'Sí, dentro del panel',
      e: 'Sólo cerrar sesión',
    },
    {
      criterio: 'Usuario con varias entidades',
      a: 'No lo resuelve',
      b: 'No lo resuelve',
      c: 'No lo resuelve',
      d: 'Sí — se cambia desde el panel',
      e: 'Muestra cuál, pero no la cambia',
    },
    {
      criterio: 'Familiaridad para el usuario',
      a: 'Media',
      b: 'Alta — es el patrón de Gmail',
      c: 'Media',
      d: 'Alta',
      e: 'Alta — desplegable conocido',
    },
    {
      criterio: 'Esfuerzo de desarrollo',
      a: 'Ninguno — ya está construida',
      b: 'Bajo',
      c: 'Medio — toca la barra de miga de pan',
      d: 'Alto — necesita servicio de cambio de entidad',
      e: 'Bajo',
    },
  ];

  // ─── Los dos escenarios ─────────────────────────────────────────────────
  escenario: Escenario = 'una';

  /** Estado de los paneles de los mockups de cada escenario. */
  panelE1Abierto = false;
  panelE2Abierto = false;

  readonly escenarios: EscenarioPropuesta[] = [
    {
      id: 'una',
      titulo: 'No — cada usuario opera una sola entidad',
      premisa:
        'El usuario pertenece a una entidad y no puede cambiar de contexto durante la sesión. ' +
        'La entidad es un dato de identidad, no un control.',
      veredictos: [
        {
          opcion: 'A · Píldora',
          estado: 'descartada',
          razon: 'Muestra el dato correcto, pero lo pierde en tablet y no ofrece acciones de sesión.',
        },
        {
          opcion: 'B · Panel',
          estado: 'recomendada',
          razon: 'Resuelve identidad y acciones con el patrón que el usuario ya conoce.',
        },
        {
          opcion: 'C · Dos niveles',
          estado: 'recomendada',
          razon: 'Deja perfil y entidad a la vista sin abrir nada, también en tablet.',
        },
        {
          opcion: 'D · Selector de entidad',
          estado: 'descartada',
          razon: 'El selector no tendría nada que seleccionar.',
        },
        {
          opcion: 'E · Código y entidad',
          estado: 'recomendada',
          razon: 'Es la que pidió CGN, y deja la entidad visible en el cabezote sin necesitar una barra aparte.',
        },
      ],
      conclusion:
        'E sola. Al subir la entidad al cabezote, absorbe lo que resolvía la barra de contexto de C: ' +
        'el usuario ve con qué entidad trabaja sin abrir nada y sin sumar una franja a la pantalla.',
      puntos: [
        'La entidad se muestra como texto, nunca como control: si no se puede cambiar, no debe parecer clicable.',
        'Es el escenario de menor esfuerzo — no toca backend.',
        'El código de usuario queda visible en el cabezote, que es lo que pidió la Dra. Sandra para que salga en los pantallazos.',
      ],
      riesgo:
        'Si más adelante aparece el usuario con varias entidades, hay que volver al cabezote: el sitio ' +
        'donde hoy va la entidad se conserva, pero la etiqueta tiene que convertirse en control.',
    },
    {
      id: 'varias',
      titulo: 'Sí — un usuario puede operar varias entidades',
      premisa:
        'El usuario cambia de entidad dentro de la misma sesión. Saber cuál está activa deja de ser ' +
        'informativo y pasa a ser crítico: un envío a la entidad equivocada es un error de negocio.',
      veredictos: [
        {
          opcion: 'A · Píldora',
          estado: 'descartada',
          razon: 'Muestra una entidad que el usuario no puede cambiar desde ahí.',
        },
        {
          opcion: 'B · Panel',
          estado: 'descartada',
          razon: 'Esconde tras un clic justo el dato que más necesita estar visible.',
        },
        {
          opcion: 'C · Dos niveles',
          estado: 'sirve',
          razon: 'Aporta la barra donde la entidad activa queda siempre a la vista.',
        },
        {
          opcion: 'D · Selector de entidad',
          estado: 'recomendada',
          razon: 'Único que convierte la entidad en control y hace visible el cambio.',
        },
        {
          opcion: 'E · Código y entidad',
          estado: 'sirve',
          razon: 'Deja la entidad activa siempre a la vista, pero no permite cambiarla: es la base sobre la que se monta D.',
        },
      ],
      conclusion:
        'E + el selector de D. El cabezote de E ya muestra la entidad activa; sólo falta que sea un control ' +
        'y no una etiqueta, con el cambio dentro del panel.',
      puntos: [
        'El cambio de entidad debe pedir confirmación: recarga el trabajo en curso.',
        'La barra de contexto anuncia el cambio con aria-live, para que no pase inadvertido a lectores de pantalla.',
        'Necesita servicio de backend para listar las entidades del usuario y cambiar el contexto de la sesión.',
      ],
      riesgo:
        'Si se implementa el selector y en realidad cada usuario tiene una sola entidad, se agrega una ' +
        'interacción que nadie usa y un riesgo de equivocarse que hoy no existe.',
    },
  ];

  get escenarioActivo(): EscenarioPropuesta {
    const activo = this.escenarios.find(e => e.id === this.escenario);
    return activo ?? this.escenarios[0];
  }

  veredictoSeverity(estado: Veredicto['estado']): 'success' | 'info' | 'warn' {
    if (estado === 'recomendada') return 'success';
    return estado === 'sirve' ? 'info' : 'warn';
  }

  veredictoEtiqueta(estado: Veredicto['estado']): string {
    if (estado === 'recomendada') return 'Recomendada';
    return estado === 'sirve' ? 'Sirve' : 'Descartada';
  }
}
