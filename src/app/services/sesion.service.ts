import { Injectable, computed, signal } from '@angular/core';

export interface EntidadSesion {
  codigo: string;
  razonSocial: string;
  tipo: string;
}

/** Usuario autenticado. Unifica los mocks que antes vivían sueltos en
 *  perfil-usuario, usuarios y entidades-agregadas, que no coincidían entre sí. */
export interface UsuarioSesion {
  usuario: string;
  nombreCompleto: string;
  primerNombre: string;
  iniciales: string;
  correo: string;
  /** Nombre legible del perfil/rol, p. ej. "Administrador General". */
  perfil: string;
  perfilCodigo: string;
  entidad: EntidadSesion;
  ultimoAcceso: string;
  diasParaVencimiento: number;
  diasTotalVigencia: number;
}

/** Sesión de demostración. En producción vendría del token de autenticación. */
const USUARIO_DEMO: UsuarioSesion = {
  usuario: 'JLMUNOZ',
  nombreCompleto: 'Juan Luis Muñoz Martínez',
  primerNombre: 'Juan Luis',
  iniciales: 'JM',
  correo: 'jlmunoz@contaduria.gov.co',
  perfil: 'Administrador General',
  perfilCodigo: 'ADM_CHIP',
  entidad: {
    codigo: '210111001',
    razonSocial: 'Contaduría General de la Nación',
    tipo: 'Central',
  },
  ultimoAcceso: '28/04/2026 — 09:42 a.m.',
  diasParaVencimiento: 73,
  diasTotalVigencia: 90,
};

/**
 * Estado de sesión de la aplicación (CH-1737).
 *
 * El proyecto no tiene backend ni autenticación real: este servicio es la única
 * fuente de verdad del usuario en sesión para que el cabezote y las pantallas
 * muestren siempre lo mismo. Arranca con el usuario de demostración para que
 * las pantallas del design system se puedan navegar sin pasar por el login.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly _usuario = signal<UsuarioSesion | null>(USUARIO_DEMO);

  readonly usuario = this._usuario.asReadonly();
  readonly autenticado = computed(() => this._usuario() !== null);

  /** Etiqueta corta "Perfil · Entidad" para el cabezote. */
  readonly contexto = computed(() => {
    const u = this._usuario();
    return u ? `${u.perfil} · ${u.entidad.razonSocial}` : '';
  });

  iniciarSesion(usuario: UsuarioSesion): void {
    this._usuario.set(usuario);
  }

  /** Inicia la sesión de demostración con el código de usuario indicado. */
  iniciarSesionDemo(codigoUsuario: string): void {
    this._usuario.set({ ...USUARIO_DEMO, usuario: codigoUsuario.toUpperCase() });
  }

  cerrarSesion(): void {
    this._usuario.set(null);
  }
}
