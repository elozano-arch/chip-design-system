import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppBreadcrumbComponent } from '../../../components/app-breadcrumb/app-breadcrumb.component';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';

@Component({
  selector: 'app-footer-doc',
  standalone: true,
  imports: [
    CommonModule,
    AppBreadcrumbComponent,
    CodeBlockComponent,
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  readonly snFooter = `<footer class="app-footer">
  <div class="app-footer__main">
    <!-- Col 1: logos institucionales -->
    <div class="app-footer__logos-col">
      <img src="assets/logos/hacienda-blanco.svg" alt="Ministerio de Hacienda..." />
      <img src="assets/logos/govco-logo.png" alt="Logo GOV.CO" />
    </div>

    <!-- Col 2: identidad de la entidad -->
    <div class="app-footer__info-col">
      <h3 class="app-footer__entity-name">Contaduría General de la Nación</h3>
      <p class="app-footer__slogan">Cuentas Claras, Estado Transparente.</p>
      <p>Dirección, ciudad, código postal, horario de atención…</p>
      <div class="app-footer__social"><!-- redes --></div>
    </div>

    <!-- Col 3: contacto y enlaces legales -->
    <div class="app-footer__contact-col">
      <h3 class="app-footer__contact-title"><i class="pi pi-phone"></i> Contacto</h3>
      <p>Líneas, correos institucionales, políticas…</p>
      <p class="app-footer__copyright">© Copyright {{ '{' }}{{ '{' }} year {{ '}' }}{{ '}' }} · Gobierno de Colombia</p>
    </div>
  </div>
</footer>`;
}
