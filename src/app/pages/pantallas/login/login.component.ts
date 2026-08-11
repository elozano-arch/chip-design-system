import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { FormErrorBannerComponent } from '../../../components/form-error-banner/form-error-banner.component';
import { SesionService } from '../../../services/sesion.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, InputTextModule, IconFieldModule, InputIconModule,
    CheckboxModule, SelectModule, MessageModule, ToastModule,
    FormErrorBannerComponent,
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  usuario = '';
  contrasena = '';
  recordar = false;
  showPassword = false;
  capsLockOn = false;
  loading = false;
  errorMsg = '';

  // Validaciones UI
  usuarioTouched = false;
  contrasenaTouched = false;
  loginFormSubmitted = false;

  /** Se activa cuando el usuario está bloqueado (enabled = 0 en BD). */
  bloqueado = false;

  // Versión del sistema
  versionSistema = 'v2.0.0';

  constructor(
    private router: Router,
    private messageService: MessageService,
    private sesion: SesionService,
  ) {}

  // ── Validaciones CH-1370 ──
  private readonly USUARIO_REGEX = /^[A-Za-z0-9]{4,20}$/;

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

  get contrasenaVacia(): boolean {
    return this.contrasenaTouched && !this.contrasena.trim();
  }
  get contrasenaInvalid(): boolean {
    return this.contrasenaVacia;
  }

  get formInvalid(): boolean {
    if (!this.usuario.trim() || !this.contrasena.trim()) return true;
    if (!this.USUARIO_REGEX.test(this.usuario.trim())) return true;
    return false;
  }

  /**
   * Errores que alimentan el banner. Combina:
   * - Errores de validación del form (campos vacíos / formato).
   * - Error de autenticación (credenciales incorrectas, bloqueo).
   * Los dos casos son mutuamente excluyentes — el auth solo dispara después
   * de que el form pasó validación.
   */
  get loginBannerErrors(): string[] {
    if (this.errorMsg) return [this.errorMsg];
    if (!this.loginFormSubmitted) return [];
    const errors: string[] = [];
    if (!this.usuario.trim()) {
      errors.push('El usuario es obligatorio.');
    } else if (!this.USUARIO_REGEX.test(this.usuario.trim())) {
      errors.push('El usuario debe tener de 4 a 20 caracteres alfanuméricos.');
    }
    if (!this.contrasena.trim()) errors.push('La contraseña es obligatoria.');
    return errors;
  }

  get loginBannerSummary(): string | undefined {
    if (this.errorMsg) return this.bloqueado ? 'Cuenta bloqueada' : 'No se pudo iniciar sesión';
    return undefined;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onPasswordKey(event: KeyboardEvent) {
    this.capsLockOn = event.getModifierState && event.getModifierState('CapsLock');
  }

  /**
   * Mock de usuarios — versión simplificada para demo.
   * Solo se consideran 3 escenarios:
   * - JLMUNOZ + demo123     → ingreso exitoso.
   * - BLOQUEADO + cualquier → cuenta bloqueada (enabled = 0).
   * - Cualquier otro        → credenciales incorrectas.
   */
  private readonly USUARIOS_MOCK: Record<string, { password: string; enabled: boolean }> = {
    JLMUNOZ: { password: 'demo123', enabled: true },
    BLOQUEADO: { password: 'demo123', enabled: false },
  };

  onSubmit() {
    if (this.bloqueado) return;

    this.loginFormSubmitted = true;
    this.usuarioTouched = true;
    this.contrasenaTouched = true;
    this.errorMsg = '';

    if (this.formInvalid) return;

    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      const userKey = this.usuario.trim().toUpperCase();
      const user = this.USUARIOS_MOCK[userKey];

      // Caso 1: usuario bloqueado (enabled = 0)
      if (user && !user.enabled) {
        this.bloqueado = true;
        this.errorMsg = 'El usuario está bloqueado y no puede conectarse a la aplicación. Por favor contacte al administrador del sistema.';
        return;
      }

      // Caso 2: credenciales incorrectas (usuario inexistente o contraseña mal)
      if (!user || user.password !== this.contrasena) {
        this.errorMsg = 'Usuario o contraseña incorrectos.';
        return;
      }

      // Caso 3: ingreso exitoso
      this.sesion.iniciarSesionDemo(userKey);
      this.messageService.add({
        severity: 'success',
        summary: 'Bienvenido',
        detail: `Sesión iniciada como ${userKey}`,
      });
      setTimeout(() => this.router.navigate(['/pantallas/seguridad/perfil-usuario']), 1000);
    }, 800);
  }
}
