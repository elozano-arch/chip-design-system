import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

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
  currentYear = new Date().getFullYear();
  showBackToTop = false;
  showServicePanel = false;
  mobileMenuOpen = false;
  darkMode = false;

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
