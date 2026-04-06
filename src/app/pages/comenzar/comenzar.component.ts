import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';

@Component({
  selector: 'app-comenzar',
  standalone: true,
  imports: [CommonModule, DividerModule, CodeBlockComponent],
  templateUrl: './comenzar.component.html',
  styleUrl: './comenzar.component.scss',
})
export class ComenzarComponent {

  // ── 1. Prerequisites ──────────────────────────────────────────
  codePrerequisites = `# Verificar versiones instaladas
node -v          # v22.x
ng version       # Angular CLI 19.x

# Crear un nuevo proyecto Angular 19
ng new chip-app --style=scss --routing

# Instalar PrimeNG 19 y sus dependencias
cd chip-app
npm install primeng@19 @primeng/themes primeicons`;

  // ── 2. App config with ChipPreset ─────────────────────────────
  codeAppConfig = `// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { ChipPreset } from './theme/chip-preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: ChipPreset,
        options: {
          darkModeSelector: '.dark-mode',
        },
      },
    }),
  ],
};`;

  // ── 3. Recommended folder structure ───────────────────────────
  codeFolderStructure = `src/app/
├── components/          # Componentes reutilizables (shared)
│   ├── code-block/
│   └── header/
├── pages/               # Páginas principales (lazy-loaded)
│   ├── home/
│   ├── comenzar/
│   └── ejemplos/
├── theme/               # Preset y estilos del Design System
│   └── chip-preset.ts
├── services/            # Servicios inyectables
├── guards/              # Guards de navegación
├── interceptors/        # Interceptors HTTP
├── app.component.ts
├── app.config.ts
├── app.routes.ts
└── styles.scss          # Estilos globales y variables CSS`;

  // ── 4. Import and use a PrimeNG component ─────────────────────
  codeImportExample = `// src/app/pages/mi-pagina/mi-pagina.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-mi-pagina',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule, TagModule],
  template: \`
    <h2>Mi Página</h2>

    <p-button label="Guardar" icon="pi pi-save" />

    <p-table [value]="datos" [stripedRows]="true">
      <ng-template #header>
        <tr>
          <th>Nombre</th>
          <th>Estado</th>
        </tr>
      </ng-template>
      <ng-template #body let-row>
        <tr>
          <td>{{ row.nombre }}</td>
          <td>
            <p-tag [value]="row.estado" severity="success" />
          </td>
        </tr>
      </ng-template>
    </p-table>
  \`,
})
export class MiPaginaComponent {
  datos = [
    { nombre: 'Entidad A', estado: 'Activo' },
    { nombre: 'Entidad B', estado: 'Activo' },
  ];
}`;

  // ── 5. Global styles setup ────────────────────────────────────
  codeStylesSetup = `/* src/styles.scss */

/* ── PrimeNG & PrimeIcons ── */
@import 'primeicons/primeicons.css';

/* ── Fuentes (Kit UI v9.2 - GOV.CO) ── */
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap');

/* ── Variables CSS del Design System CHIP 2.0 ── */
:root {
  /* Tipografía */
  --font-heading: 'Nunito Sans', sans-serif;
  --font-body: Verdana, Geneva, Tahoma, sans-serif;

  /* Paleta Cobalt (primario) */
  --chip-cobalt-50:  #EBF0FA;
  --chip-cobalt-100: #C2D0F0;
  --chip-cobalt-200: #9EB4E3;
  --chip-cobalt-500: #3366CC;
  --chip-cobalt-700: #0943B5;
  --chip-cobalt-900: #041F57;

  /* Escala de grises */
  --chip-grey-50:  #F5F5F5;
  --chip-grey-100: #EBEBEB;
  --chip-grey-200: #D6D6D6;
  --chip-grey-500: #9E9E9E;
  --chip-grey-600: #7A7A7A;
  --chip-grey-700: #616161;
  --chip-grey-800: #3B3B3B;
  --chip-grey-900: #1A1A1A;

  /* Colores informativos */
  --chip-success: #4CAF50;
  --chip-warning: #FFC107;
  --chip-error:   #F44336;
  --chip-info:    #2196F3;

  /* Bordes */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

/* ── Reset básico ── */
body {
  margin: 0;
  font-family: var(--font-body);
  color: var(--chip-grey-900);
  background-color: #FAFAFA;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}`;
}
