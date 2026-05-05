import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';

interface PasswordRule {
  key: string;
  label: string;
  validate: (pwd: string) => boolean;
}

interface DispositivoActivo {
  navegador: string;
  sistema: string;
  ubicacion: string;
  ultimoAcceso: string;
  esActual: boolean;
}

@Component({
  selector: 'app-cambiar-contrasena',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, IconFieldModule, InputIconModule,
    DialogModule, MessageModule, ToastModule, TagModule,
    AppBreadcrumbComponent,
  ],
  providers: [MessageService],
  templateUrl: './cambiar-contrasena.component.html',
  styleUrl: './cambiar-contrasena.component.scss',
})
export class CambiarContrasenaComponent implements OnInit {
  // CH-1374: modo forzado tras login con contraseña vencida
  modoForzado = false;

  showDialog = false;
  loading = false;
  errorMsg = '';

  // Campos
  actual = '';
  nueva = '';
  confirmar = '';

  // Visibilidad
  showActual = false;
  showNueva = false;
  showConfirmar = false;

  // Touched
  actualTouched = false;
  nuevaTouched = false;
  confirmarTouched = false;

  /** Valores prohibidos en la contraseña (case-insensitive donde aplica). */
  private readonly FORBIDDEN_VALUES = ['Contaduría', 'contaduria', 'password', 'test', '&', '=', '¡', '¿', 'ñ', 'Ñ'];

  /** Cuenta cuántos tipos de caracteres distintos contiene la contraseña. */
  private countTypes(p: string): number {
    let count = 0;
    if (/[A-Z]/.test(p)) count++;
    if (/[a-z]/.test(p)) count++;
    if (/[0-9]/.test(p)) count++;
    if (/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~';]/.test(p)) count++;
    // Caracteres de otros idiomas (Unicode fuera de ASCII básico).
    if (/[^\x00-\x7F]/.test(p)) count++;
    return count;
  }

  /** Verifica si la contraseña contiene alguno de los valores prohibidos. */
  private hasForbiddenValue(p: string): boolean {
    if (!p) return false;
    const lower = p.toLowerCase();
    return this.FORBIDDEN_VALUES.some(v => {
      // Para símbolos y caracteres únicos: comparación literal case-sensitive.
      if (v.length === 1) return p.includes(v);
      // Para palabras: case-insensitive.
      return lower.includes(v.toLowerCase());
    });
  }

  // Política de contraseña (CGN — vigente)
  rules: PasswordRule[] = [
    { key: 'length', label: 'Entre 12 y 30 caracteres', validate: (p) => p.length >= 12 && p.length <= 30 },
    { key: 'upper', label: 'Al menos 1 letra mayúscula (A-Z)', validate: (p) => /[A-Z]/.test(p) },
    { key: 'lower', label: 'Al menos 1 letra minúscula (a-z)', validate: (p) => /[a-z]/.test(p) },
    { key: 'number', label: 'Al menos 1 número (0-9)', validate: (p) => /[0-9]/.test(p) },
    { key: 'three-types', label: 'Combina al menos 3 tipos: mayúscula, minúscula, número, símbolo u otros idiomas', validate: (p) => this.countTypes(p) >= 3 },
    { key: 'forbidden', label: 'No contiene valores prohibidos (Contaduría, password, test, &, =, ñ, ¡, ¿…)', validate: (p) => p.length > 0 && !this.hasForbiddenValue(p) },
  ];

  // Información de seguridad (mock)
  seguridadInfo = {
    ultimoCambio: '15 de enero de 2025',
    diasDesdeUltimoCambio: 97,
    diasParaVencer: 0,
    intentosFallidos24h: 0,
  };

  dispositivos: DispositivoActivo[] = [
    {
      navegador: 'Chrome 128',
      sistema: 'macOS Sonoma',
      ubicacion: 'Bogotá, Colombia',
      ultimoAcceso: 'Ahora',
      esActual: true,
    },
    {
      navegador: 'Safari 17',
      sistema: 'iOS 17',
      ubicacion: 'Bogotá, Colombia',
      ultimoAcceso: 'Hace 2 horas',
      esActual: false,
    },
    {
      navegador: 'Firefox 130',
      sistema: 'Windows 11',
      ubicacion: 'Medellín, Colombia',
      ultimoAcceso: 'Ayer 14:30',
      esActual: false,
    },
  ];

  constructor(
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    // CH-1374: si se llega con ?forzado=true desde login, abrir modal y forzar estado vencida
    this.route.queryParamMap.subscribe(params => {
      if (params.get('forzado') === 'true') {
        this.modoForzado = true;
        this.seguridadInfo.diasParaVencer = 0;
        this.abrirDialog();
      }
    });
  }

  get vencida(): boolean {
    return this.seguridadInfo.diasParaVencer <= 0;
  }

  get porVencer(): boolean {
    return this.seguridadInfo.diasParaVencer > 0 && this.seguridadInfo.diasParaVencer <= 7;
  }

  get vencidaMensaje(): string {
    const d = this.seguridadInfo.diasParaVencer;
    if (d === 0) return 'Su contraseña vence hoy. Cámbiela para continuar usando el sistema.';
    if (d === -1) return 'Su contraseña venció ayer. Cámbiela para continuar usando el sistema.';
    return `Su contraseña venció hace ${Math.abs(d)} días. Cámbiela para continuar usando el sistema.`;
  }

  // Reglas individuales
  ruleMet(rule: PasswordRule): boolean {
    return rule.validate(this.nueva);
  }

  get coincide(): boolean {
    return this.nueva === this.confirmar && this.confirmar.length > 0;
  }

  get nuevaIgualActual(): boolean {
    return this.nueva.length > 0 && this.actual.length > 0 && this.nueva === this.actual;
  }

  get formValido(): boolean {
    return !!this.actual.trim()
      && this.rules.every(r => r.validate(this.nueva))
      && this.coincide
      && !this.nuevaIgualActual;
  }

  abrirDialog() {
    this.resetForm();
    this.showDialog = true;
  }

  cerrarDialog() {
    // CH-1374: en modo forzado el modal no se puede cerrar manualmente
    if (this.modoForzado) return;
    this.showDialog = false;
    this.resetForm();
  }

  cerrarSesionDispositivo(d: DispositivoActivo) {
    if (d.esActual) return;
    this.dispositivos = this.dispositivos.filter(x => x !== d);
    this.messageService.add({
      severity: 'info',
      summary: 'Sesión cerrada',
      detail: `Se cerró la sesión en ${d.navegador} (${d.sistema}).`,
    });
  }

  private resetForm() {
    this.actual = '';
    this.nueva = '';
    this.confirmar = '';
    this.showActual = false;
    this.showNueva = false;
    this.showConfirmar = false;
    this.actualTouched = false;
    this.nuevaTouched = false;
    this.confirmarTouched = false;
    this.errorMsg = '';
  }

  guardar() {
    this.actualTouched = true;
    this.nuevaTouched = true;
    this.confirmarTouched = true;
    this.errorMsg = '';

    if (!this.formValido) return;

    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      if (this.actual !== 'demo123') {
        this.errorMsg = 'La contraseña actual es incorrecta.';
        return;
      }
      this.messageService.add({
        severity: 'success',
        summary: 'Contraseña actualizada',
        detail: this.modoForzado
          ? 'Su contraseña fue cambiada. Ingresando al sistema…'
          : 'Su contraseña fue cambiada exitosamente.',
        life: 4000,
      });
      // Actualizar info de seguridad
      this.seguridadInfo.ultimoCambio = 'Hoy';
      this.seguridadInfo.diasDesdeUltimoCambio = 0;
      this.seguridadInfo.diasParaVencer = 90;

      // CH-1374: si fue cambio forzado, liberar el modo y redirigir al home
      if (this.modoForzado) {
        this.modoForzado = false;
        this.showDialog = false;
        this.resetForm();
        setTimeout(() => this.router.navigate(['/']), 1500);
        return;
      }
      this.cerrarDialog();
    }, 800);
  }
}
