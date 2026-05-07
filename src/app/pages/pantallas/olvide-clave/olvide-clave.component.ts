import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MessageService } from 'primeng/api';

import { FormErrorBannerComponent } from '../../../components/form-error-banner/form-error-banner.component';

@Component({
  selector: 'app-olvide-clave',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, InputTextModule, IconFieldModule, InputIconModule,
    MessageModule, ToastModule, DialogModule, RadioButtonModule,
    FormErrorBannerComponent,
  ],
  providers: [MessageService],
  templateUrl: './olvide-clave.component.html',
  styleUrl: './olvide-clave.component.scss',
})
export class OlvideClaveComponent implements OnInit {
  /** Usuario ingresado (alfanumérico 4-20). */
  usuario = '';
  /** Reto reCAPTCHA superado (mock). */
  recaptchaOk = false;
  /** Snapshot del usuario que disparó la solicitud (para mensajes posteriores). */
  usuarioSolicitud = '';

  loading = false;
  enviado = false;
  errorMsg = '';

  /** Estado link vencido — true cuando llega vía query param `?expired=true` */
  linkVencido = false;

  // Validaciones UI
  usuarioTouched = false;
  recaptchaTouched = false;
  okFormSubmitted = false;

  // Modal: confirmación de correos autorizados
  showCorreosDialog = false;
  /** Correos enmascarados que el sistema tiene asociados al usuario. */
  correosAutorizados: string[] = [];
  correoSeleccionado = '';

  // Constantes UI
  private readonly USUARIO_REGEX = /^[A-Za-z0-9]{4,20}$/;
  readonly MESA_SERVICIO_PBX = '(601) 492 6400 Opción 2';
  readonly MESA_SERVICIO_TEL = '+576014926400';

  constructor(
    private messageService: MessageService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // Si el usuario llegó por un link de correo ya vencido, mostrar el aviso.
    this.route.queryParams.subscribe(params => {
      this.linkVencido = params['expired'] === 'true';
    });
  }

  // ── Validaciones ──
  get usuarioVacio(): boolean {
    return this.usuarioTouched && !this.usuario.trim();
  }
  get usuarioFormatoInvalido(): boolean {
    if (!this.usuarioTouched || !this.usuario.trim()) return false;
    return !this.USUARIO_REGEX.test(this.usuario.trim());
  }
  get usuarioInvalid(): boolean {
    return this.usuarioVacio || this.usuarioFormatoInvalido;
  }

  /** True cuando el reCAPTCHA no fue marcado y el form ya se intentó enviar. */
  get recaptchaInvalid(): boolean {
    return this.recaptchaTouched && !this.recaptchaOk;
  }

  /** Errores que alimentan el banner. */
  get okBannerErrors(): string[] {
    if (this.errorMsg) return [this.errorMsg];
    if (!this.okFormSubmitted) return [];
    const errors: string[] = [];
    if (!this.usuario.trim()) {
      errors.push('El usuario es obligatorio.');
    } else if (!this.USUARIO_REGEX.test(this.usuario.trim())) {
      errors.push('El usuario debe tener de 4 a 20 caracteres alfanuméricos.');
    }
    if (!this.recaptchaOk) errors.push('Debe completar la verificación reCAPTCHA.');
    return errors;
  }

  /**
   * Toggle del reCAPTCHA mock. En producción se integra con grecaptcha.execute()
   * o reCAPTCHA Enterprise; aquí se simula con un checkbox.
   */
  toggleRecaptcha() {
    this.recaptchaOk = !this.recaptchaOk;
    this.recaptchaTouched = true;
  }

  /**
   * Paso 1: el usuario ingresa su nombre de usuario y supera el reCAPTCHA.
   * Si pasa validación, abrimos el modal con los correos autorizados.
   */
  onSubmit() {
    this.okFormSubmitted = true;
    this.usuarioTouched = true;
    this.recaptchaTouched = true;
    this.errorMsg = '';

    if (this.usuarioInvalid || this.recaptchaInvalid) return;

    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.usuarioSolicitud = this.usuario.trim().toUpperCase();

      // Mock de los correos asociados al usuario.
      // En producción el backend devuelve los correos enmascarados.
      this.correosAutorizados = this.obtenerCorreosMock(this.usuarioSolicitud);
      this.correoSeleccionado = '';
      this.showCorreosDialog = true;
    }, 600);
  }

  /**
   * Paso 2: el usuario eligió un correo y confirma. Cerramos el modal y
   * pasamos al estado "enviado" — el backend dispara el correo con el link.
   */
  confirmarRestablecer() {
    if (!this.correoSeleccionado) return;
    this.showCorreosDialog = false;
    this.enviado = true;
    this.linkVencido = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Solicitud enviada',
      detail: 'Si el usuario está registrado, recibirá un correo con las instrucciones.',
    });
  }

  cancelarRestablecer() {
    this.showCorreosDialog = false;
    this.correoSeleccionado = '';
  }

  /** Reset del flujo para volver al paso 1. */
  reintentar() {
    this.enviado = false;
    this.usuario = '';
    this.usuarioSolicitud = '';
    this.correoSeleccionado = '';
    this.correosAutorizados = [];
    this.recaptchaOk = false;
    this.usuarioTouched = false;
    this.recaptchaTouched = false;
    this.okFormSubmitted = false;
    this.linkVencido = false;
    this.errorMsg = '';
  }

  /**
   * Genera correos enmascarados de prueba para un usuario.
   * Formato: `xxx****@dominio.gov.co` — solo expone los primeros 3 caracteres.
   */
  private obtenerCorreosMock(usuario: string): string[] {
    const prefijo = usuario.toLowerCase().slice(0, 3);
    return [`${prefijo}****@contaduria.gov.co`];
  }
}
