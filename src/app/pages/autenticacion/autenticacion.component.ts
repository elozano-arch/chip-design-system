import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-autenticacion',
  standalone: true,
  imports: [CommonModule, DividerModule],
  templateUrl: './autenticacion.component.html',
  styleUrl: './autenticacion.component.scss',
})
export class AutenticacionComponent {

  navIcons = [
    { name: 'home', label: 'Inicio' },
    { name: 'arrow-left', label: 'Volver' },
    { name: 'arrow-right', label: 'Siguiente' },
    { name: 'chevron-left', label: 'Anterior' },
    { name: 'chevron-right', label: 'Adelante' },
    { name: 'chevron-down', label: 'Desplegar' },
    { name: 'chevron-up', label: 'Contraer' },
    { name: 'angle-double-left', label: 'Primera página' },
    { name: 'angle-double-right', label: 'Última página' },
    { name: 'arrow-up', label: 'Volver arriba' },
    { name: 'external-link', label: 'Enlace externo' },
    { name: 'bars', label: 'Menú' },
    { name: 'ellipsis-h', label: 'Más opciones' },
    { name: 'ellipsis-v', label: 'Opciones vertical' },
    { name: 'sitemap', label: 'Mapa del sitio' },
    { name: 'link', label: 'Enlace' },
  ];

  actionIcons = [
    { name: 'save', label: 'Guardar' },
    { name: 'pencil', label: 'Editar' },
    { name: 'trash', label: 'Eliminar' },
    { name: 'plus', label: 'Agregar' },
    { name: 'minus', label: 'Quitar' },
    { name: 'times', label: 'Cerrar' },
    { name: 'check', label: 'Confirmar' },
    { name: 'search', label: 'Buscar' },
    { name: 'filter', label: 'Filtrar' },
    { name: 'filter-slash', label: 'Limpiar filtros' },
    { name: 'sort-alt', label: 'Ordenar' },
    { name: 'refresh', label: 'Actualizar' },
    { name: 'undo', label: 'Deshacer' },
    { name: 'copy', label: 'Copiar' },
    { name: 'clone', label: 'Duplicar' },
    { name: 'send', label: 'Enviar' },
    { name: 'download', label: 'Descargar' },
    { name: 'upload', label: 'Cargar' },
    { name: 'share-alt', label: 'Compartir' },
    { name: 'print', label: 'Imprimir' },
  ];

  statusIcons = [
    { name: 'info-circle', label: 'Información', color: 'info' },
    { name: 'check-circle', label: 'Éxito', color: 'success' },
    { name: 'exclamation-triangle', label: 'Advertencia', color: 'warn' },
    { name: 'times-circle', label: 'Error', color: 'danger' },
    { name: 'exclamation-circle', label: 'Alerta', color: 'warn' },
    { name: 'ban', label: 'Bloqueado', color: 'danger' },
    { name: 'clock', label: 'Pendiente', color: 'warn' },
    { name: 'spinner', label: 'Cargando', color: '' },
    { name: 'verified', label: 'Verificado', color: 'success' },
    { name: 'question-circle', label: 'Ayuda', color: 'info' },
  ];

  formIcons = [
    { name: 'calendar', label: 'Fecha' },
    { name: 'list', label: 'Lista' },
    { name: 'check-square', label: 'Checkbox' },
    { name: 'circle', label: 'Radio' },
    { name: 'sliders-h', label: 'Slider' },
    { name: 'toggle-on', label: 'Toggle activo' },
    { name: 'hashtag', label: 'Número' },
    { name: 'percentage', label: 'Porcentaje' },
    { name: 'at', label: 'Correo' },
    { name: 'phone', label: 'Teléfono' },
    { name: 'map-marker', label: 'Ubicación' },
    { name: 'id-card', label: 'Documento' },
  ];

  authIcons = [
    { name: 'user', label: 'Usuario' },
    { name: 'users', label: 'Usuarios' },
    { name: 'user-plus', label: 'Nuevo usuario' },
    { name: 'user-minus', label: 'Eliminar usuario' },
    { name: 'user-edit', label: 'Editar usuario' },
    { name: 'lock', label: 'Contraseña' },
    { name: 'unlock', label: 'Desbloquear' },
    { name: 'key', label: 'Cambiar clave' },
    { name: 'shield', label: 'Seguridad' },
    { name: 'sign-in', label: 'Iniciar sesión' },
    { name: 'sign-out', label: 'Cerrar sesión' },
    { name: 'eye', label: 'Ver contraseña' },
    { name: 'eye-slash', label: 'Ocultar contraseña' },
    { name: 'power-off', label: 'Sesión expirada' },
    { name: 'history', label: 'Historial acceso' },
    { name: 'fingerprint', label: 'Biométrico' },
  ];

  fileIcons = [
    { name: 'file', label: 'Archivo' },
    { name: 'file-edit', label: 'Editar archivo' },
    { name: 'file-pdf', label: 'PDF' },
    { name: 'file-excel', label: 'Excel' },
    { name: 'file-word', label: 'Word' },
    { name: 'file-import', label: 'Importar' },
    { name: 'file-export', label: 'Exportar' },
    { name: 'folder', label: 'Carpeta' },
    { name: 'folder-open', label: 'Carpeta abierta' },
    { name: 'paperclip', label: 'Adjunto' },
    { name: 'image', label: 'Imagen' },
    { name: 'database', label: 'Base de datos' },
  ];

  commIcons = [
    { name: 'envelope', label: 'Correo' },
    { name: 'inbox', label: 'Bandeja' },
    { name: 'bell', label: 'Notificación' },
    { name: 'comment', label: 'Comentario' },
    { name: 'comments', label: 'Conversación' },
    { name: 'megaphone', label: 'Anuncio' },
    { name: 'whatsapp', label: 'WhatsApp' },
    { name: 'facebook', label: 'Facebook' },
    { name: 'twitter', label: 'Twitter' },
    { name: 'instagram', label: 'Instagram' },
    { name: 'youtube', label: 'YouTube' },
    { name: 'globe', label: 'Web' },
  ];

  dataIcons = [
    { name: 'table', label: 'Tabla' },
    { name: 'chart-bar', label: 'Gráfico barras' },
    { name: 'chart-line', label: 'Gráfico líneas' },
    { name: 'chart-pie', label: 'Gráfico torta' },
    { name: 'th-large', label: 'Cuadricula' },
    { name: 'list-check', label: 'Lista verificación' },
    { name: 'sort-amount-up', label: 'Ordenar asc.' },
    { name: 'sort-amount-down', label: 'Ordenar desc.' },
    { name: 'calculator', label: 'Calculadora' },
    { name: 'money-bill', label: 'Finanzas' },
    { name: 'wallet', label: 'Cartera' },
    { name: 'receipt', label: 'Recibo' },
  ];

  systemIcons = [
    { name: 'cog', label: 'Configuración' },
    { name: 'cogs', label: 'Parámetros' },
    { name: 'wrench', label: 'Herramientas' },
    { name: 'server', label: 'Servidor' },
    { name: 'cloud', label: 'Nube' },
    { name: 'cloud-upload', label: 'Subir a nube' },
    { name: 'cloud-download', label: 'Descargar nube' },
    { name: 'sync', label: 'Sincronizar' },
    { name: 'bolt', label: 'Operaciones' },
    { name: 'building', label: 'Entidad' },
    { name: 'building-columns', label: 'Institución' },
    { name: 'box', label: 'Módulo' },
    { name: 'flag', label: 'Marcador' },
    { name: 'bookmark', label: 'Favorito' },
    { name: 'star', label: 'Destacado' },
    { name: 'tag', label: 'Etiqueta' },
    { name: 'tags', label: 'Etiquetas' },
    { name: 'stopwatch', label: 'Temporizador' },
  ];

  a11yIcons = [
    { name: 'eye', label: 'Ver / Mostrar' },
    { name: 'eye-slash', label: 'Ocultar / Contraste' },
    { name: 'sun', label: 'Contraste alto' },
    { name: 'moon', label: 'Modo oscuro' },
    { name: 'search-plus', label: 'Aumentar letra' },
    { name: 'search-minus', label: 'Reducir letra' },
    { name: 'comment', label: 'Chat de ayuda' },
    { name: 'comments', label: 'Asistencia' },
    { name: 'envelope', label: 'Correo contacto' },
    { name: 'phone', label: 'Teléfono' },
    { name: 'arrow-up', label: 'Volver arriba' },
    { name: 'chevron-up', label: 'Ir al inicio' },
    { name: 'volume-up', label: 'Lector pantalla' },
    { name: 'language', label: 'Idioma' },
    { name: 'palette', label: 'Tema visual' },
  ];
}
