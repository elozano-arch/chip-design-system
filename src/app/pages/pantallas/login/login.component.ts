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

  // ── Bloqueo de seguridad ──
  /** Contador local de intentos fallidos en la sesión actual del navegador. */
  intentosFallidos = 0;
  /**
   * Máximo de intentos fallidos antes de bloquear la cuenta.
   * Variable parametrizable: viene del campo `intentos_fallidos` del rol
   * asignado al usuario (ver pantalla 'Modificar Datos del Rol').
   * En producción: `usuario.rol.intentos_fallidos`.
   * Mock: 3, equivalente a la variable `{{intentos_fallidos}}`.
   */
  intentosFallidosMax = 3;
  bloqueado = false;

  // Versión del sistema
  versionSistema = 'v2.0.0';

  constructor(private router: Router, private messageService: MessageService) {}

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
   * Mock de usuarios para demostrar las 4 ramas del flujo de login (diagrama CGN).
   * En producción esto vendría del backend.
   *
   * - JLMUNOZ + demo123  → ingreso exitoso normal.
   * - VENCIDO + demo123  → contraseña caducada (last_password_change_date + duration < hoy).
   * - PRIMER  + demo123  → primer ingreso (password_changed_required = 1).
   * - BLOQUEADO + cualquier → usuario inactivo en BD (enabled = 0).
   * - Cualquier otro → credenciales incorrectas (failed_logins +1, bloqueo al 3er intento).
   */
  private readonly USUARIOS_MOCK: Record<string, {
    password: string;
    enabled: boolean;
    passwordChangedRequired: boolean;
    passwordExpired: boolean;
  }> = {
    JLMUNOZ: { password: 'demo123', enabled: true, passwordChangedRequired: false, passwordExpired: false },
    VENCIDO: { password: 'demo123', enabled: true, passwordChangedRequired: false, passwordExpired: true },
    PRIMER: { password: 'demo123', enabled: true, passwordChangedRequired: true, passwordExpired: false },
    BLOQUEADO: { password: 'demo123', enabled: false, passwordChangedRequired: false, passwordExpired: false },
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

      // Rama 1: enabled = 0 → bloqueado en BD (texto exacto solicitado)
      if (user && !user.enabled) {
        this.bloqueado = true;
        this.errorMsg = 'El usuario está bloqueado y no puede conectarse a la aplicación. Por favor contacte al administrador del sistema.';
        return;
      }

      // Rama 2: contraseña incorrecta (usuario inexistente o pass mal)
      if (!user || user.password !== this.contrasena) {
        this.intentosFallidos++;
        const restantes = this.intentosFallidosMax - this.intentosFallidos;
        if (this.intentosFallidos >= this.intentosFallidosMax) {
          // failed_logins >= max_failed_logins → set enabled = 0
          this.bloqueado = true;
          this.errorMsg = 'El usuario está bloqueado y no puede conectarse a la aplicación. Por favor contacte al administrador del sistema.';
        } else {
          this.errorMsg = `Usuario o contraseña incorrectos. Le quedan ${restantes} intento${restantes === 1 ? '' : 's'}.`;
        }
        return;
      }

      // Credenciales correctas — reset contador
      this.intentosFallidos = 0;

      // Rama 3: password_changed_required = 1 → forzar cambio (primer ingreso)
      if (user.passwordChangedRequired) {
        this.messageService.add({
          severity: 'info',
          summary: 'Primer ingreso',
          detail: 'Por seguridad, debe cambiar su contraseña antes de continuar.',
          life: 4000,
        });
        setTimeout(() => this.router.navigate(
          ['/pantallas/seguridad/cambiar-contrasena'],
          { queryParams: { forzado: 'true', motivo: 'primer-ingreso' } },
        ), 1200);
        return;
      }

      // Rama 4: contraseña caducada (last_password_change_date + duration < hoy)
      if (user.passwordExpired) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Contraseña vencida',
          detail: 'Por motivos de seguridad, su contraseña del CHIP debe renovarse.',
          life: 4000,
        });
        setTimeout(() => this.router.navigate(
          ['/pantallas/seguridad/cambiar-contrasena'],
          { queryParams: { forzado: 'true', motivo: 'caducidad' } },
        ), 1200);
        return;
      }

      // Rama final: ingreso exitoso
      this.messageService.add({
        severity: 'success',
        summary: 'Bienvenido',
        detail: `Sesión iniciada como ${userKey}`,
      });
      setTimeout(() => this.router.navigate(['/pantallas/seguridad/perfil-usuario']), 1000);
    }, 800);
  }
}
