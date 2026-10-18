import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { DestinoNotificacion, ReglaDistribucion, MensajeFallido } from '../../models/notificacion.model';

/**
 * Administracion de la mensajeria asincrona: crear/eliminar destinos y
 * reglas de distribucion, y diagnostico de mensajes fallidos (Dead-Letter).
 */
@Component({
  selector: 'app-admin-mensajeria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-mensajeria.component.html',
  styleUrls: ['./admin-mensajeria.component.css']
})
export class AdminMensajeriaComponent implements OnInit {
  public destinos: DestinoNotificacion[] = [];
  public reglas: ReglaDistribucion[] = [];
  public mensajesFallidos: MensajeFallido[] = [];

  public readonly eventos = ['PELICULA_CREADA', 'PELICULA_ELIMINADA', 'TICKET_PAGADO', 'TICKET_DEVUELTO', 'ANUNCIO'];
  public readonly tiposDestino = ['TODOS', 'ROL', 'USUARIO', 'USUARIO_EVENTO'];

  public nuevoDestino: Partial<DestinoNotificacion> = {
    nombre: '', tipo: 'TODOS', valor: '', descripcion: '', activo: true
  };
  public nuevaRegla: Partial<ReglaDistribucion> = {
    evento: 'PELICULA_CREADA', destinoId: 0, activo: true
  };

  public mensajeExito: string | null = null;
  public mensajeError: string | null = null;

  public anuncioTitulo: string = '';
  public anuncioMensaje: string = '';
  public enviandoAnuncio: boolean = false;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.cargarTodo();
  }

  public cargarTodo(): void {
    this.cargarDestinos();
    this.cargarReglas();
    this.cargarMensajesFallidos();
  }

  public cargarDestinos(): void {
    this.adminService.getDestinos().subscribe({
      next: (d) => this.destinos = d || [],
      error: () => this.mensajeError = 'No se pudieron cargar los destinos.'
    });
  }

  public cargarReglas(): void {
    this.adminService.getReglas().subscribe({
      next: (r) => this.reglas = r || [],
      error: () => this.mensajeError = 'No se pudieron cargar las reglas de distribución.'
    });
  }

  public cargarMensajesFallidos(): void {
    this.adminService.getMensajesFallidos().subscribe({
      next: (m) => this.mensajesFallidos = m || [],
      error: () => { /* silencioso */ }
    });
  }

  public get requiereValor(): boolean {
    return this.nuevoDestino.tipo === 'ROL' || this.nuevoDestino.tipo === 'USUARIO';
  }

  public crearDestino(): void {
    this.mensajeExito = null;
    this.mensajeError = null;
    if (!this.nuevoDestino.nombre) {
      alert('Ingrese el nombre del destino.');
      return;
    }
    this.adminService.crearDestino({ ...this.nuevoDestino }).subscribe({
      next: () => {
        this.mensajeExito = 'Destino creado correctamente.';
        this.nuevoDestino = { nombre: '', tipo: 'TODOS', valor: '', descripcion: '', activo: true };
        this.cargarDestinos();
      },
      error: (err) => this.mensajeError = err.error?.message || 'Error al crear el destino.'
    });
  }

  public eliminarDestino(d: DestinoNotificacion): void {
    if (!confirm(`¿Eliminar el destino "${d.nombre}" y sus reglas asociadas?`)) return;
    this.adminService.eliminarDestino(d.id).subscribe({
      next: () => {
        this.mensajeExito = `Destino "${d.nombre}" eliminado.`;
        this.cargarTodo();
      },
      error: () => this.mensajeError = 'Error al eliminar el destino.'
    });
  }

  public crearRegla(): void {
    this.mensajeExito = null;
    this.mensajeError = null;
    if (!this.nuevaRegla.destinoId) {
      alert('Seleccione un destino.');
      return;
    }
    this.adminService.crearRegla({
      evento: this.nuevaRegla.evento,
      destinoId: Number(this.nuevaRegla.destinoId),
      activo: this.nuevaRegla.activo
    }).subscribe({
      next: () => {
        this.mensajeExito = 'Regla de distribución creada correctamente.';
        this.cargarReglas();
      },
      error: (err) => this.mensajeError = err.error?.message || 'Error al crear la regla.'
    });
  }

  public eliminarRegla(r: ReglaDistribucion): void {
    if (!confirm(`¿Eliminar la regla ${r.evento} → ${r.destinoNombre}?`)) return;
    this.adminService.eliminarRegla(r.id).subscribe({
      next: () => {
        this.mensajeExito = 'Regla eliminada.';
        this.cargarReglas();
      },
      error: () => this.mensajeError = 'Error al eliminar la regla.'
    });
  }

  public crearAnuncio(): void {
    this.mensajeExito = null;
    this.mensajeError = null;
    const titulo = this.anuncioTitulo.trim();
    const mensaje = this.anuncioMensaje.trim();
    if (!titulo || !mensaje) {
      this.mensajeError = 'Ingrese un título y un mensaje para el anuncio.';
      return;
    }
    if (titulo.length > 150 || mensaje.length > 500) {
      this.mensajeError = 'El título admite hasta 150 caracteres y el mensaje hasta 500.';
      return;
    }
    this.enviandoAnuncio = true;
    this.adminService.crearAnuncio(titulo, mensaje).subscribe({
      next: (r) => {
        this.enviandoAnuncio = false;
        this.anuncioTitulo = '';
        this.anuncioMensaje = '';
        this.mensajeExito = `Anuncio enviado a ${r?.enviados ?? 0} usuario(s).`;
      },
      error: (err) => {
        this.enviandoAnuncio = false;
        this.mensajeError = err.error?.message || 'Error al enviar el anuncio.';
      }
    });
  }
}
