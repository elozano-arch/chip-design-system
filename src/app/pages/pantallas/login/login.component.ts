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

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, InputTextModule, IconFieldModule, InputIconModule,
    CheckboxModule, SelectModule, MessageModule, ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  usuario = '';
  contrasena = '';
  entidad = '';
  recordar = false;
  showPassword = false;
  capsLockOn = false;
  loading = false;
  errorMsg = '';

  // Validaciones UI
  usuarioTouched = false;
  contrasenaTouched = false;

  // Bloqueo de seguridad
  intentosFallidos = 0;
  readonly MAX_INTENTOS = 3;
  bloqueado = false;

  // Versión del sistema
  versionSistema = 'v2.0.0';

  // Opciones de entidad (mock)
  entidadOptions = [
    { label: 'CGN - Contaduría General de la Nación', value: 'CGN' },
    { label: 'Ministerio de Hacienda', value: 'MINHACIENDA' },
    { label: 'DNP - Departamento Nacional de Planeación', value: 'DNP' },
    { label: 'Contraloría General', value: 'CGR' },
    { label: 'Alcaldía de Bogotá', value: 'BOGOTA' },
    { label: 'DANE', value: 'DANE' },
  ];

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

  get entidadInvalid(): boolean {
    return this.contrasenaTouched && !this.entidad;
  }

  get formInvalid(): boolean {
    if (!this.usuario.trim() || !this.contrasena.trim() || !this.entidad) return true;
    if (!this.USUARIO_REGEX.test(this.usuario.trim())) return true;
    return false;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onPasswordKey(event: KeyboardEvent) {
    this.capsLockOn = event.getModifierState && event.getModifierState('CapsLock');
  }

  onSubmit() {
    if (this.bloqueado) return;

    this.usuarioTouched = true;
    this.contrasenaTouched = true;
    this.errorMsg = '';

    if (this.formInvalid) return;

    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      if (this.usuario.toUpperCase() === 'JLMUNOZ' && this.contrasena === 'demo123') {
        this.intentosFallidos = 0;
        // CH-1374: validar contraseña vencida (mock con usuario VENCIDO)
        const contrasenaVencida = false; // En producción consultar al backend
        if (contrasenaVencida) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Contraseña vencida',
            detail: 'Debe cambiar su contraseña antes de continuar.',
            life: 4000,
          });
          setTimeout(() => this.router.navigate(
            ['/pantallas/seguridad/cambiar-contrasena'],
            { queryParams: { forzado: 'true' } },
          ), 1500);
          return;
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Bienvenido',
          detail: `Sesión iniciada como ${this.usuario.toUpperCase()}`,
        });
        setTimeout(() => this.router.navigate(['/']), 1000);
      } else if (this.usuario.toUpperCase() === 'VENCIDO' && this.contrasena === 'demo123') {
        // Demo del flujo: usuario "VENCIDO" tiene contraseña vencida (CH-1374)
        this.intentosFallidos = 0;
        this.messageService.add({
          severity: 'warn',
          summary: 'Contraseña vencida',
          detail: 'Su contraseña expiró. Debe cambiarla antes de continuar.',
          life: 4000,
        });
        setTimeout(() => this.router.navigate(
          ['/pantallas/seguridad/cambiar-contrasena'],
          { queryParams: { forzado: 'true' } },
        ), 1500);
      } else {
        this.intentosFallidos++;
        const restantes = this.MAX_INTENTOS - this.intentosFallidos;
        if (this.intentosFallidos >= this.MAX_INTENTOS) {
          this.bloqueado = true;
          this.errorMsg = 'Cuenta bloqueada temporalmente por múltiples intentos fallidos. Contacte al administrador.';
        } else {
          this.errorMsg = `Usuario o contraseña incorrectos. Le quedan ${restantes} intento${restantes === 1 ? '' : 's'}.`;
        }
      }
    }, 800);
  }
}
