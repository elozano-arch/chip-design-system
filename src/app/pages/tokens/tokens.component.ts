import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';

interface DesignToken {
  name: string;
  value: string;
  swatch: string;
}

interface TypographyToken {
  name: string;
  value: string;
  preview: string;
}

interface RadiusToken {
  name: string;
  value: string;
}

@Component({
  selector: 'app-tokens',
  standalone: true,
  imports: [CommonModule, DividerModule, CodeBlockComponent],
  templateUrl: './tokens.component.html',
  styleUrls: ['./tokens.component.scss'],
})
export class TokensComponent {
  /* --- Cobalt Palette --- */
  cobaltTokens: DesignToken[] = [
    { name: '--chip-cobalt-50', value: '#E8EDF8', swatch: '#E8EDF8' },
    { name: '--chip-cobalt-100', value: '#C5D2EE', swatch: '#C5D2EE' },
    { name: '--chip-cobalt-200', value: '#9EB4E3', swatch: '#9EB4E3' },
    { name: '--chip-cobalt-300', value: '#7796D8', swatch: '#7796D8' },
    { name: '--chip-cobalt-400', value: '#5A80CF', swatch: '#5A80CF' },
    { name: '--chip-cobalt-500', value: '#3D6AC6', swatch: '#3D6AC6' },
    { name: '--chip-cobalt-600', value: '#1E54B8', swatch: '#1E54B8' },
    { name: '--chip-cobalt-700', value: '#0943B5', swatch: '#0943B5' },
    { name: '--chip-cobalt-800', value: '#073899', swatch: '#073899' },
    { name: '--chip-cobalt-900', value: '#052D7D', swatch: '#052D7D' },
    { name: '--chip-cobalt-950', value: '#031E54', swatch: '#031E54' },
  ];

  /* --- Grey Scale --- */
  greyTokens: DesignToken[] = [
    { name: '--chip-grey-50', value: '#F5F5F5', swatch: '#F5F5F5' },
    { name: '--chip-grey-100', value: '#EBEBEB', swatch: '#EBEBEB' },
    { name: '--chip-grey-200', value: '#D6D6D6', swatch: '#D6D6D6' },
    { name: '--chip-grey-300', value: '#BDBDBD', swatch: '#BDBDBD' },
    { name: '--chip-grey-400', value: '#9E9E9E', swatch: '#9E9E9E' },
    { name: '--chip-grey-500', value: '#7A7A7A', swatch: '#7A7A7A' },
    { name: '--chip-grey-600', value: '#616161', swatch: '#616161' },
    { name: '--chip-grey-700', value: '#4C4C4C', swatch: '#4C4C4C' },
    { name: '--chip-grey-800', value: '#3B3B3B', swatch: '#3B3B3B' },
    { name: '--chip-grey-900', value: '#2B2B2B', swatch: '#2B2B2B' },
    { name: '--chip-grey-950', value: '#1A1A1A', swatch: '#1A1A1A' },
  ];

  /* --- Informative Colors --- */
  informativeTokens: DesignToken[] = [
    { name: '--chip-success', value: '#4CAF50', swatch: '#4CAF50' },
    { name: '--chip-warning', value: '#FBC02D', swatch: '#FBC02D' },
    { name: '--chip-danger', value: '#F44336', swatch: '#F44336' },
    { name: '--chip-info', value: '#0943B5', swatch: '#0943B5' },
  ];

  /* --- Background Colors --- */
  backgroundTokens: DesignToken[] = [
    { name: '--chip-bg-solitude', value: '#EBF0FA', swatch: '#EBF0FA' },
    { name: '--chip-bg-corn-silk', value: '#FFF8E1', swatch: '#FFF8E1' },
    { name: '--chip-bg-white-smoke', value: '#F5F5F5', swatch: '#F5F5F5' },
  ];

  /* --- Typography Tokens --- */
  typographyTokens: TypographyToken[] = [
    { name: '--font-heading', value: "'Nunito Sans', sans-serif", preview: 'Nunito Sans' },
    { name: '--font-body', value: 'Verdana, Geneva, Tahoma, sans-serif', preview: 'Verdana' },
  ];

  /* --- Border Radius Tokens --- */
  radiusTokens: RadiusToken[] = [
    { name: '--radius-sm', value: '4px' },
    { name: '--radius-md', value: '6px' },
    { name: '--radius-lg', value: '8px' },
    { name: '--radius-xl', value: '12px' },
  ];

  /* --- Usage Code Example --- */
  usageCode = `.my-component {
  color: var(--chip-cobalt-700);
  background: var(--chip-bg-solitude);
  font-family: var(--font-heading);
  border-radius: var(--radius-md);
}`;

  /** Returns true when the swatch color is light (needs dark text). */
  isLight(hex: string): boolean {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    // Perceived brightness (ITU-R BT.709)
    return (r * 0.299 + g * 0.587 + b * 0.114) > 160;
  }
}
