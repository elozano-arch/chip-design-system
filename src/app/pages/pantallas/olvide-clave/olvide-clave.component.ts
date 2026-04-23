import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-olvide-clave',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, InputTextModule, IconFieldModule, InputIconModule,
    MessageModule, ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './olvide-clave.component.html',
  styleUrl: './olvide-clave.component.scss',
})
export class OlvideClaveComponent {
  correo = '';
  correoNormalizado = '';
  loading = false;
  enviado = false;
  errorMsg = '';

  // Validaciones UI
  correoTouched = false;

  constructor(private messageService: MessageService) {}

  get correoVacio(): boolean {
    return this.correoTouched && !this.correo.trim();
  }

  get correoFormatoInvalido(): boolean {
    if (!this.correoTouched || !this.correo.trim()) return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !regex.test(this.correo.trim());
  }

  get correoInvalid(): boolean {
    return this.correoVacio || this.correoFormatoInvalido;
  }

  onSubmit() {
    this.correoTouched = true;
    this.errorMsg = '';

    if (this.correoInvalid) return;

    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.correoNormalizado = this.correo.trim().toLowerCase();
      this.enviado = true;
      this.messageService.add({
        severity: 'success',
        summary: 'Solicitud enviada',
        detail: 'Si el correo está registrado, recibirá las instrucciones.',
      });
    }, 800);
  }

  reintentar() {
    this.enviado = false;
    this.correo = '';
    this.correoNormalizado = '';
    this.correoTouched = false;
    this.errorMsg = '';
  }
}
