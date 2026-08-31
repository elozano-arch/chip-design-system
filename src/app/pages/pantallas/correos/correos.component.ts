import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';

/** Grupos de plantillas — el orden aquí define el orden del acordeón */
const GRUPOS = [
  'Seguridad y acceso',
  'Común a los 3 procesos',
  'Importación',
  'Validaciones locales',
  'Validación central',
] as const;

type Grupo = (typeof GRUPOS)[number];

interface Plantilla {
  /** Ticket Jira. Ausente en las plantillas del proceso CHIP Local (pendientes de asignar). */
  jira?: string;
  grupo: Grupo;
  key: string;
  nombre: string;
  asunto: string;
  descripcion: string;
  archivo: string;
  variables: { name: string; descripcion: string }[];
}

/** Plantilla con su posición en el array plano, para poder seleccionarla desde el acordeón */
interface PlantillaIndexada extends Plantilla {
  indice: number;
}

@Component({
  selector: 'app-correos',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule, AccordionModule, ToastModule, TagModule,
    AppBreadcrumbComponent,
  ],
  providers: [MessageService],
  templateUrl: './correos.component.html',
  styleUrl: './correos.component.scss',
})
export class CorreosComponent {
  plantillas: Plantilla[] = [
    {
      jira: 'CH-1364',
      grupo: 'Seguridad y acceso',
      key: 'creacion-usuario',
      nombre: 'Creación de usuario',
      asunto: 'Bienvenido al CHIP - Su cuenta ha sido creada',
      descripcion: 'Se envía cuando un administrador crea una nueva cuenta. Incluye un enlace seguro (vigencia parametrizable) para activar la cuenta y definir la contraseña por primera vez. Ya no se envía la contraseña temporal en texto plano.',
      archivo: 'assets/correos/creacion-usuario.html',
      variables: [
        { name: '{{nombre_usuario}}', descripcion: 'Nombre completo del usuario' },
        { name: '{{entidad}}', descripcion: 'Entidad a la que pertenece' },
        { name: '{{usuario}}', descripcion: 'Código/usuario de acceso (ej: JLMUNOZ)' },
        { name: '{{token_link}}', descripcion: 'URL única con token para activar la cuenta y definir contraseña (uso único)' },
        { name: '{{horas_vigencia}}', descripcion: 'Número de horas de vigencia del enlace (parametrizable, normalmente 24)' },
      ],
    },
    {
      jira: 'CH-1365',
      grupo: 'Seguridad y acceso',
      key: 'cambio-contrasena',
      nombre: 'Cambio de contraseña',
      asunto: 'Su contraseña fue actualizada en CHIP',
      descripcion: 'Confirmación informativa de cambio exitoso de contraseña. No incluye datos de la operación (fecha/IP/dispositivo) para evitar exponer información sensible.',
      archivo: 'assets/correos/cambio-contrasena.html',
      variables: [
        { name: '{{nombre_usuario}}', descripcion: 'Nombre completo del usuario' },
      ],
    },
    {
      jira: 'CH-1366',
      grupo: 'Seguridad y acceso',
      key: 'olvido-clave',
      nombre: 'Olvido su clave',
      asunto: 'Restablecer su contraseña - CHIP',
      descripcion: 'Se envía cuando el usuario solicita restablecer su contraseña. Incluye link único con vigencia parametrizable y uso único.',
      archivo: 'assets/correos/olvido-clave.html',
      variables: [
        { name: '{{nombre_usuario}}', descripcion: 'Nombre completo del usuario' },
        { name: '{{token_link}}', descripcion: 'URL única con token de recuperación (uso único)' },
        { name: '{{horas_vigencia}}', descripcion: 'Número de horas de vigencia del enlace (parametrizable, normalmente 24)' },
      ],
    },
    {
      jira: 'CH-1367',
      grupo: 'Seguridad y acceso',
      key: 'caducidad',
      nombre: 'Cambio por caducidad',
      asunto: 'Su contraseña está por vencer - CHIP',
      descripcion: 'Aviso preventivo cuando la contraseña está próxima a vencer (7, 3 y 1 días antes).',
      archivo: 'assets/correos/caducidad.html',
      variables: [
        { name: '{{nombre_usuario}}', descripcion: 'Nombre completo del usuario' },
        { name: '{{dias_restantes}}', descripcion: 'Número de días para el vencimiento' },
        { name: '{{plural_dias}}', descripcion: 'Letra "s" cuando dias_restantes !== 1' },
        { name: '{{fecha_vencimiento}}', descripcion: 'Fecha exacta de vencimiento' },
        { name: '{{url_cambio_contrasena}}', descripcion: 'URL de la pantalla para cambiar contraseña' },
      ],
    },

    /* ----------------------------------------------------------------
       PROCESO CHIP LOCAL — Importación / Validaciones locales / Central
       ---------------------------------------------------------------- */
    {
      grupo: 'Común a los 3 procesos',
      key: 'validacion-iniciada',
      nombre: 'Validación iniciada',
      asunto: '{{proceso}} en validación - CHIP',
      descripcion: 'Se envía cuando el sistema arranca la validación de cualquiera de los 3 procesos. Una sola plantilla para los tres: el backend inyecta el nombre del proceso en {{proceso}} (Importación / Validaciones locales / Validación central). No requiere acción del usuario. En Importación y Validaciones locales los formularios avanzan de forma independiente, así que se envía un correo por cada formulario. En Validación central, en cambio, cubre el conjunto completo.',
      archivo: 'assets/correos/validacion-iniciada.html',
      variables: [
        { name: '{{nombre_usuario}}', descripcion: 'Nombre completo del usuario' },
        { name: '{{proceso}}', descripcion: 'Nombre del proceso: "Importación", "Validaciones locales" o "Validación central"' },
        { name: '{{entidad}}', descripcion: 'Entidad que reporta' },
        { name: '{{categoria}}', descripcion: 'Categoría reportada' },
        { name: '{{periodo}}', descripcion: 'Periodo del reporte (ej: 2026-Q1)' },
        { name: '{{formularios}}', descripcion: 'Alcance del correo. En Importación y Validaciones locales, el código del formulario. En Validación central, el total enviado (ej: "12 formularios")' },
        { name: '{{fecha_hora}}', descripcion: 'Fecha y hora de inicio de la validación' },
        { name: '{{url_detalle}}', descripcion: 'URL a la pantalla de seguimiento del proceso' },
      ],
    },
    {
      grupo: 'Importación',
      key: 'importacion-carga-fallida',
      nombre: 'Carga del archivo fallida',
      asunto: 'No se pudo cargar su archivo - {{categoria}} - CHIP',
      descripcion: 'La carga del archivo ocurre ANTES de las validaciones y puede fallar por sí sola. Cuando el proceso no logra cargar el archivo para procesarlo, no se ejecuta ninguna validación y no hay deficiencias que reportar. El correo le dice al usuario que reintente y, si vuelve a fallar, que contacte al soporte de la CGN con el número de referencia del intento.',
      archivo: 'assets/correos/importacion-carga-fallida.html',
      variables: [
        { name: '{{nombre_usuario}}', descripcion: 'Nombre completo del usuario' },
        { name: '{{entidad}}', descripcion: 'Entidad que reporta' },
        { name: '{{categoria}}', descripcion: 'Categoría reportada' },
        { name: '{{periodo}}', descripcion: 'Periodo del reporte' },
        { name: '{{nombre_archivo}}', descripcion: 'Nombre del archivo que no se pudo cargar' },
        { name: '{{fecha_hora}}', descripcion: 'Fecha y hora del intento fallido' },
        { name: '{{id_proceso}}', descripcion: 'Número de referencia del intento, para que el soporte lo ubique' },
        { name: '{{url_importacion}}', descripcion: 'URL a la pantalla de importación, para reintentar' },
      ],
    },
    {
      grupo: 'Importación',
      key: 'importacion-exitosa',
      nombre: 'Importación exitosa',
      asunto: 'Importación exitosa - {{categoria}} - CHIP',
      descripcion: 'La importación terminó sin deficiencias. La información queda cargada y se habilitan las validaciones locales. En este proceso los formularios avanzan de forma independiente, así que se envía un correo por cada formulario.',
      archivo: 'assets/correos/importacion-exitosa.html',
      variables: [
        { name: '{{nombre_usuario}}', descripcion: 'Nombre completo del usuario' },
        { name: '{{entidad}}', descripcion: 'Entidad que reporta' },
        { name: '{{categoria}}', descripcion: 'Categoría reportada' },
        { name: '{{periodo}}', descripcion: 'Periodo del reporte' },
        { name: '{{fecha_hora}}', descripcion: 'Fecha y hora de finalización' },
        { name: '{{formulario}}', descripcion: 'Código del formulario al que corresponde este correo (ej: CGN2015_001)' },
        { name: '{{url_detalle}}', descripcion: 'URL a la pantalla para ejecutar validaciones locales' },
      ],
    },
    {
      grupo: 'Importación',
      key: 'importacion-observaciones',
      nombre: 'Importación con observaciones',
      asunto: 'Importación exitosa con observaciones - {{categoria}} - CHIP',
      descripcion: 'La importación terminó con deficiencias no bloqueantes. El usuario puede continuar, pero se le recomienda revisarlas. En este proceso los formularios avanzan de forma independiente, así que se envía un correo por cada formulario.',
      archivo: 'assets/correos/importacion-observaciones.html',
      variables: [
        { name: '{{nombre_usuario}}', descripcion: 'Nombre completo del usuario' },
        { name: '{{entidad}}', descripcion: 'Entidad que reporta' },
        { name: '{{categoria}}', descripcion: 'Categoría reportada' },
        { name: '{{periodo}}', descripcion: 'Periodo del reporte' },
        { name: '{{total_observaciones}}', descripcion: 'Cantidad de deficiencias NO bloqueantes detectadas' },
        { name: '{{fecha_hora}}', descripcion: 'Fecha y hora de finalización' },
        { name: '{{formulario}}', descripcion: 'Código del formulario al que corresponde este correo (ej: CGN2015_001)' },
        { name: '{{url_detalle}}', descripcion: 'URL al detalle de las observaciones' },
      ],
    },
    {
      grupo: 'Importación',
      key: 'importacion-rechazada',
      nombre: 'Importación rechazada',
      asunto: 'Importación rechazada - {{categoria}} - CHIP',
      descripcion: 'La importación fue rechazada por deficiencias bloqueantes. La información NO queda cargada; el usuario debe corregir el archivo y volver a importarlo. En este proceso los formularios avanzan de forma independiente, así que se envía un correo por cada formulario.',
      archivo: 'assets/correos/importacion-rechazada.html',
      variables: [
        { name: '{{nombre_usuario}}', descripcion: 'Nombre completo del usuario' },
        { name: '{{entidad}}', descripcion: 'Entidad que reporta' },
        { name: '{{categoria}}', descripcion: 'Categoría reportada' },
        { name: '{{periodo}}', descripcion: 'Periodo del reporte' },
        { name: '{{total_deficiencias}}', descripcion: 'Cantidad de deficiencias BLOQUEANTES detectadas' },
        { name: '{{fecha_hora}}', descripcion: 'Fecha y hora de finalización' },
        { name: '{{formulario}}', descripcion: 'Código del formulario al que corresponde este correo (ej: CGN2015_001)' },
        { name: '{{url_detalle}}', descripcion: 'URL al detalle de las deficiencias' },
      ],
    },
    {
      grupo: 'Validaciones locales',
      key: 'validacion-local-exitosa',
      nombre: 'Validaciones locales exitosas',
      asunto: 'Validaciones locales exitosas - {{categoria}} - CHIP',
      descripcion: 'Las validaciones locales terminaron sin deficiencias. Se habilita el envío a validación central. En este proceso los formularios avanzan de forma independiente, así que se envía un correo por cada formulario.',
      archivo: 'assets/correos/validacion-local-exitosa.html',
      variables: [
        { name: '{{nombre_usuario}}', descripcion: 'Nombre completo del usuario' },
        { name: '{{entidad}}', descripcion: 'Entidad que reporta' },
        { name: '{{categoria}}', descripcion: 'Categoría reportada' },
        { name: '{{formulario}}', descripcion: 'Código del formulario al que corresponde este correo (ej: CGN2015_001)' },
        { name: '{{periodo}}', descripcion: 'Periodo del reporte' },
        { name: '{{total_validaciones}}', descripcion: 'Cantidad de reglas de validación ejecutadas' },
        { name: '{{fecha_hora}}', descripcion: 'Fecha y hora de finalización' },
        { name: '{{url_detalle}}', descripcion: 'URL a la pantalla para enviar a validación central' },
      ],
    },
    {
      grupo: 'Validaciones locales',
      key: 'validacion-local-observaciones',
      nombre: 'Validaciones locales con observaciones',
      asunto: 'Validaciones locales exitosas con observaciones - {{categoria}} - CHIP',
      descripcion: 'Las validaciones locales terminaron con deficiencias no bloqueantes. El usuario puede enviar a validación central, pero se le recomienda revisarlas. En este proceso los formularios avanzan de forma independiente, así que se envía un correo por cada formulario.',
      archivo: 'assets/correos/validacion-local-observaciones.html',
      variables: [
        { name: '{{nombre_usuario}}', descripcion: 'Nombre completo del usuario' },
        { name: '{{entidad}}', descripcion: 'Entidad que reporta' },
        { name: '{{categoria}}', descripcion: 'Categoría reportada' },
        { name: '{{formulario}}', descripcion: 'Código del formulario al que corresponde este correo (ej: CGN2015_001)' },
        { name: '{{periodo}}', descripcion: 'Periodo del reporte' },
        { name: '{{total_validaciones}}', descripcion: 'Cantidad de reglas de validación ejecutadas' },
        { name: '{{total_observaciones}}', descripcion: 'Cantidad de deficiencias NO bloqueantes detectadas' },
        { name: '{{fecha_hora}}', descripcion: 'Fecha y hora de finalización' },
        { name: '{{url_detalle}}', descripcion: 'URL al detalle de las observaciones' },
      ],
    },
    {
      grupo: 'Validaciones locales',
      key: 'validacion-local-rechazada',
      nombre: 'Validaciones locales rechazadas',
      asunto: 'Validaciones locales rechazadas - {{categoria}} - CHIP',
      descripcion: 'Las validaciones locales detectaron deficiencias bloqueantes. La categoría no avanza; el usuario debe reiniciar desde el proceso de importación. En este proceso los formularios avanzan de forma independiente, así que se envía un correo por cada formulario.',
      archivo: 'assets/correos/validacion-local-rechazada.html',
      variables: [
        { name: '{{nombre_usuario}}', descripcion: 'Nombre completo del usuario' },
        { name: '{{entidad}}', descripcion: 'Entidad que reporta' },
        { name: '{{categoria}}', descripcion: 'Categoría reportada' },
        { name: '{{formulario}}', descripcion: 'Código del formulario al que corresponde este correo (ej: CGN2015_001)' },
        { name: '{{periodo}}', descripcion: 'Periodo del reporte' },
        { name: '{{total_deficiencias}}', descripcion: 'Cantidad de deficiencias BLOQUEANTES detectadas' },
        { name: '{{fecha_hora}}', descripcion: 'Fecha y hora de finalización' },
        { name: '{{url_detalle}}', descripcion: 'URL al detalle de las deficiencias' },
      ],
    },
    {
      grupo: 'Validación central',
      key: 'validacion-central-aceptada',
      nombre: 'Categoría aceptada',
      asunto: 'Categoría aceptada - {{categoria}} - CHIP',
      descripcion: 'La validación central terminó sin deficiencias: la categoría queda aceptada y el reporte formalmente registrado ante la CGN. Fin del flujo. En validación central se envían todos los formularios juntos, así que este correo es uno solo por categoría e incluye el desglose por formulario. La plantilla se elige por la regla "gana el peor estado".',
      archivo: 'assets/correos/validacion-central-aceptada.html',
      variables: [
        { name: '{{nombre_usuario}}', descripcion: 'Nombre completo del usuario' },
        { name: '{{entidad}}', descripcion: 'Entidad que reporta' },
        { name: '{{categoria}}', descripcion: 'Categoría reportada' },
        { name: '{{periodo}}', descripcion: 'Periodo del reporte' },
        { name: '{{numero_envio}}', descripcion: 'Consecutivo del envío, sirve como soporte del reporte' },
        { name: '{{fecha_hora}}', descripcion: 'Fecha y hora de aceptación' },
        { name: '{{total_formularios}}', descripcion: 'Cantidad de formularios enviados a validación central' },
        { name: '{{#formularios_exitosos}}', descripcion: 'Sección repetible: formularios aceptados sin deficiencias. Cada item usa {{nombre}}.' },
        { name: '{{url_detalle}}', descripcion: 'URL a la constancia del envío' },
      ],
    },
    {
      grupo: 'Validación central',
      key: 'validacion-central-observaciones',
      nombre: 'Categoría aceptada con observaciones',
      asunto: 'Categoría aceptada con observaciones - {{categoria}} - CHIP',
      descripcion: 'La validación central terminó con deficiencias no bloqueantes: la categoría queda aceptada y registrada, pero con observaciones a tener en cuenta. En validación central se envían todos los formularios juntos, así que este correo es uno solo por categoría e incluye el desglose por formulario. La plantilla se elige por la regla "gana el peor estado".',
      archivo: 'assets/correos/validacion-central-observaciones.html',
      variables: [
        { name: '{{nombre_usuario}}', descripcion: 'Nombre completo del usuario' },
        { name: '{{entidad}}', descripcion: 'Entidad que reporta' },
        { name: '{{categoria}}', descripcion: 'Categoría reportada' },
        { name: '{{periodo}}', descripcion: 'Periodo del reporte' },
        { name: '{{numero_envio}}', descripcion: 'Consecutivo del envío, sirve como soporte del reporte' },
        { name: '{{total_observaciones}}', descripcion: 'Cantidad de deficiencias NO bloqueantes detectadas' },
        { name: '{{fecha_hora}}', descripcion: 'Fecha y hora de aceptación' },
        { name: '{{total_formularios}}', descripcion: 'Cantidad de formularios enviados a validación central' },
        { name: '{{#formularios_observaciones}}', descripcion: 'Sección repetible: formularios con deficiencias NO bloqueantes. Cada item usa {{nombre}} y {{observaciones}} (conteo).' },
        { name: '{{#formularios_exitosos}}', descripcion: 'Sección repetible: formularios aceptados sin deficiencias. Cada item usa {{nombre}}.' },
        { name: '{{url_detalle}}', descripcion: 'URL al detalle de las observaciones' },
      ],
    },
    {
      grupo: 'Validación central',
      key: 'validacion-central-rechazada',
      nombre: 'Categoría rechazada',
      asunto: 'Categoría rechazada - {{categoria}} - CHIP',
      descripcion: 'La validación central detectó deficiencias bloqueantes: la categoría NO es aceptada y el reporte no queda registrado. El usuario debe reiniciar desde el proceso de importación. En validación central se envían todos los formularios juntos, así que este correo es uno solo por categoría e incluye el desglose por formulario. La plantilla se elige por la regla "gana el peor estado".',
      archivo: 'assets/correos/validacion-central-rechazada.html',
      variables: [
        { name: '{{nombre_usuario}}', descripcion: 'Nombre completo del usuario' },
        { name: '{{entidad}}', descripcion: 'Entidad que reporta' },
        { name: '{{categoria}}', descripcion: 'Categoría reportada' },
        { name: '{{periodo}}', descripcion: 'Periodo del reporte' },
        { name: '{{numero_envio}}', descripcion: 'Consecutivo del envío rechazado' },
        { name: '{{total_deficiencias}}', descripcion: 'Cantidad de deficiencias BLOQUEANTES detectadas' },
        { name: '{{fecha_hora}}', descripcion: 'Fecha y hora del rechazo' },
        { name: '{{total_formularios}}', descripcion: 'Cantidad de formularios enviados a validación central' },
        { name: '{{#formularios_rechazados}}', descripcion: 'Sección repetible: formularios con deficiencias BLOQUEANTES. Cada item usa {{nombre}} y {{deficiencias}} (conteo).' },
        { name: '{{#formularios_observaciones}}', descripcion: 'Sección repetible: formularios con deficiencias NO bloqueantes. Cada item usa {{nombre}} y {{observaciones}} (conteo).' },
        { name: '{{#formularios_exitosos}}', descripcion: 'Sección repetible: formularios aceptados sin deficiencias. Cada item usa {{nombre}}.' },
        { name: '{{url_detalle}}', descripcion: 'URL al detalle de las deficiencias' },
      ],
    },
  ];

  /** Plantillas agrupadas para el acordeón, conservando el índice del array plano */
  grupos: { nombre: Grupo; plantillas: PlantillaIndexada[] }[] = GRUPOS
    .map((nombre) => ({
      nombre,
      plantillas: this.plantillas
        .map((plantilla, indice) => ({ ...plantilla, indice }))
        .filter((plantilla) => plantilla.grupo === nombre),
    }))
    .filter((grupo) => grupo.plantillas.length > 0);

  /** Paneles abiertos del acordeón (multiple) */
  panelesAbiertos: string[] = [GRUPOS[0]];

  activeIndex = signal(0);
  htmlContent = signal('');
  copiando = signal(false);

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private sanitizer: DomSanitizer,
  ) {
    this.cargarPlantilla(0);
  }

  get plantillaActiva(): Plantilla {
    return this.plantillas[this.activeIndex()];
  }

  /** URL relativa del archivo (para link externo y descarga) */
  get archivoUrl(): string {
    return this.plantillaActiva.archivo;
  }

  /** URL sanitizada para usar en iframe */
  get iframeSafeUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.plantillaActiva.archivo);
  }

  seleccionarPlantilla(index: number) {
    this.activeIndex.set(index);
    this.cargarPlantilla(index);
  }

  private cargarPlantilla(index: number) {
    const plantilla = this.plantillas[index];
    this.http.get(plantilla.archivo, { responseType: 'text' }).subscribe({
      next: (html) => this.htmlContent.set(html),
      error: () => this.htmlContent.set('// No se pudo cargar la plantilla.'),
    });
  }

  copiarHtml() {
    if (!navigator.clipboard) return;
    this.copiando.set(true);
    navigator.clipboard.writeText(this.htmlContent()).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'HTML copiado',
        detail: `Plantilla "${this.plantillaActiva.nombre}" copiada al portapapeles.`,
      });
      setTimeout(() => this.copiando.set(false), 1500);
    });
  }

  descargarHtml() {
    const blob = new Blob([this.htmlContent()], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.plantillaActiva.key}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.messageService.add({
      severity: 'info',
      summary: 'Descarga iniciada',
      detail: `Archivo ${this.plantillaActiva.key}.html`,
    });
  }
}
