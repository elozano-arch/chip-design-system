import { Component, Input, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-typescript';

@Component({
  selector: 'app-code-block',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="code-block">
      <div class="code-block__header">
        <span class="code-block__lang">{{ language.toUpperCase() }}</span>
        <button class="code-block__copy" (click)="copyCode()" [attr.aria-label]="'Copiar código'">
          <i [class]="copied ? 'pi pi-check' : 'pi pi-copy'"></i>
          {{ copied ? 'Copiado' : 'Copiar' }}
        </button>
      </div>
      <pre class="code-block__pre"><code #codeEl [class]="'language-' + language"></code></pre>
    </div>
  `,
  styles: [`
    .code-block {
      border: 1px solid #D6D6D6;
      border-radius: 8px;
      overflow: hidden;
      margin: 12px 0 24px;
      background: #1e1e2e;
    }

    .code-block__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background: #2b2b3c;
      border-bottom: 1px solid #3b3b4f;
    }

    .code-block__lang {
      font-size: 11px;
      font-weight: 600;
      color: #9E9E9E;
      letter-spacing: 0.5px;
    }

    .code-block__copy {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: 1px solid #4C4C4C;
      border-radius: 4px;
      padding: 4px 10px;
      color: #BDBDBD;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;

      &:hover {
        background: #3b3b4f;
        color: #ffffff;
        border-color: #7A7A7A;
      }

      i { font-size: 13px; }
    }

    .code-block__pre {
      margin: 0;
      padding: 16px;
      overflow-x: auto;
      font-size: 13px;
      line-height: 1.6;
      font-family: 'Courier New', Consolas, monospace;

      code {
        color: #e0e0e0;
        background: none;
        text-shadow: none;
      }
    }

    /* Prism theme overrides */
    :host ::ng-deep {
      .token.tag { color: #ff79c6; }
      .token.attr-name { color: #50fa7b; }
      .token.attr-value { color: #f1fa8c; }
      .token.string { color: #f1fa8c; }
      .token.keyword { color: #ff79c6; }
      .token.comment { color: #6272a4; }
      .token.punctuation { color: #BDBDBD; }
      .token.operator { color: #ff79c6; }
      .token.property { color: #66d9ef; }
      .token.number { color: #bd93f9; }
      .token.boolean { color: #bd93f9; }
      .token.function { color: #50fa7b; }
      .token.class-name { color: #66d9ef; }
    }
  `],
})
export class CodeBlockComponent implements AfterViewInit {
  @Input() code = '';
  @Input() language = 'markup';
  @ViewChild('codeEl') codeEl!: ElementRef<HTMLElement>;
  copied = false;

  ngAfterViewInit() {
    this.highlight();
  }

  private highlight() {
    if (this.codeEl?.nativeElement) {
      this.codeEl.nativeElement.textContent = this.code;
      Prism.highlightElement(this.codeEl.nativeElement);
    }
  }

  copyCode() {
    navigator.clipboard.writeText(this.code).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }
}
