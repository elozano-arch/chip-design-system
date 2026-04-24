import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService, MenuItem } from 'primeng/api';

interface Plantilla {
  jira: string;
  key: string;
  nombre: string;
  asunto: string;
  descripcion: string;
  archivo: string;
  variables: { name: string; descripcion: string }[];
}

@Component({
  selector: 'app-correos',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule, TabsModule, BreadcrumbModule, ToastModule, TagModule,
  ],
  providers: [MessageService],
  templateUrl: './correos.component.html',
  styleUrl: './correos.component.scss',
})
export class CorreosComponent {
  breadcrumbItems: MenuItem[] = [
    { label: 'Pantallas', icon: 'pi pi-th-large' },
    { label: 'Plantillas de correo' },
  ];
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  plantillas: Plantilla[] = [
    {
      jira: 'CH-1364',
      key: 'creacion-usuario',
      nombre: 'Creación de usuario',
      asunto: 'Bienvenido al CHIP - Su cuenta ha sido creada',
      descripcion: 'Se envía cuando un administrador crea una nueva cuenta. Incluye usuario y contraseña temporal.',
      archivo: 'assets/correos/creacion-usuario.html',
      variables: [
        { name: '{{nombre_usuario}}', descripcion: 'Nombre completo del usuario' },
        { name: '{{entidad}}', descripcion: 'Entidad a la que pertenece' },
        { name: '{{usuario}}', descripcion: 'Código/usuario de acceso (ej: JLMUNOZ)' },
        { name: '{{contrasena_temporal}}', descripcion: 'Contraseña generada automáticamente' },
        { name: '{{url_login}}', descripcion: 'URL de la pantalla de login del CHIP' },
      ],
    },
    {
      jira: 'CH-1365',
      key: 'cambio-contrasena',
      nombre: 'Cambio de contraseña',
      asunto: 'Su contraseña fue actualizada en CHIP',
      descripcion: 'Confirmación de cambio exitoso de contraseña. Incluye fecha, IP y dispositivo para auditoría.',
      archivo: 'assets/correos/cambio-contrasena.html',
      variables: [
        { name: '{{nombre_usuario}}', descripcion: 'Nombre completo del usuario' },
        { name: '{{fecha_cambio}}', descripcion: 'Fecha y hora del cambio (formato dd/mm/yyyy hh:mm)' },
        { name: '{{ip_origen}}', descripcion: 'Dirección IP desde donde se hizo el cambio' },
        { name: '{{dispositivo}}', descripcion: 'Navegador y sistema operativo' },
      ],
    },
    {
      jira: 'CH-1366',
      key: 'olvido-clave',
      nombre: 'Olvido su clave',
      asunto: 'Recuperación de contraseña - CHIP',
      descripcion: 'Se envía cuando el usuario solicita restablecer su contraseña. Incluye link único con expiración 24h.',
      archivo: 'assets/correos/olvido-clave.html',
      variables: [
        { name: '{{nombre_usuario}}', descripcion: 'Nombre completo del usuario' },
        { name: '{{url_recuperacion}}', descripcion: 'URL única con token de recuperación (caduca en 24h)' },
      ],
    },
    {
      jira: 'CH-1367',
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
  ];

  activeIndex = signal(0);
  htmlContent = signal('');
  copiando = signal(false);

  constructor(private http: HttpClient, private messageService: MessageService) {
    this.cargarPlantilla(0);
  }

  get plantillaActiva(): Plantilla {
    return this.plantillas[this.activeIndex()];
  }

  get safeUrl(): string {
    return this.plantillaActiva.archivo;
  }

  cambiarTab(index: number) {
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
