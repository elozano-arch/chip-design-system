import { Component, HostListener, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { SesionService } from './services/sesion.service';

/** Pantallas públicas: no hay sesión, así que el cabezote no muestra al usuario. */
const RUTAS_SIN_SESION = [
  '/pantallas/seguridad/login',
  '/pantallas/seguridad/olvide-clave',
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly sesion = inject(SesionService);

  readonly usuarioSesion = this.sesion.usuario;

  private readonly urlActual = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** El bloque de usuario se oculta en las pantallas públicas de seguridad. */
  readonly mostrarSesion = computed(() =>
    this.usuarioSesion() !== null &&
    !RUTAS_SIN_SESION.some(r => this.urlActual().startsWith(r)),
  );

  currentYear = new Date().getFullYear();
  showBackToTop = false;
  showServicePanel = false;
  mobileMenuOpen = false;
  sidebarCollapsed = false;
  darkMode = false;
  componentesOpen = true;
  seguridadOpen = true;
  formulariosOpen = true;
  formulariosSubOpen = true;
  formulariosConsultasOpen = true;
  entidadesOpen = true;
  categoriasOpen = true;

  constructor() {
    const saved = localStorage.getItem('chip-sidebar-collapsed');
    this.sidebarCollapsed = saved === 'true';
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('chip-sidebar-collapsed', String(this.sidebarCollapsed));
  }

  @HostListener('window:scroll')
  onScroll() {
    this.showBackToTop = window.scrollY > 300;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    document.documentElement.classList.toggle('dark-mode', this.darkMode);
  }

  fontScale = 100;

  increaseFontSize() {
    this.fontScale = Math.min(this.fontScale + 10, 150);
    document.body.style.zoom = `${this.fontScale}%`;
  }

  decreaseFontSize() {
    this.fontScale = Math.max(this.fontScale - 10, 80);
    document.body.style.zoom = `${this.fontScale}%`;
  }
}
