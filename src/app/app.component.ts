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

  increaseFontSize() {
    const html = document.documentElement;
    const current = parseFloat(getComputedStyle(html).fontSize);
    html.style.fontSize = Math.min(current + 2, 24) + 'px';
  }

  decreaseFontSize() {
    const html = document.documentElement;
    const current = parseFloat(getComputedStyle(html).fontSize);
    html.style.fontSize = Math.max(current - 2, 12) + 'px';
  }
}
