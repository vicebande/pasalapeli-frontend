import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { Notificacion } from '../../models/notificacion.model';

/**
 * Campana de notificaciones con bandeja (inbox) integrada en el navbar.
 * Muestra el contador de no leidas, permite abrir la bandeja y marcar
 * notificaciones como leidas (individual o todas).
 */
@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.css']
})
export class NotificacionesComponent implements OnInit, OnDestroy {
  private static readonly TAMANO_PAGINA = 20;

  public abierto = false;
  public noLeidas = 0;
  public notificaciones: Notificacion[] = [];
  public cargando = false;
  public cargandoMas = false;
  public hayMas = false;
  private paginaActual = 0;
  private subs = new Subscription();

  constructor(
    private notificationService: NotificationService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Reacciona a cambios de sesion: carga/limpia el contador.
    this.subs.add(this.authService.currentUser$.subscribe(user => {
      if (user?.authenticated) {
        this.actualizarConteo();
      } else {
        this.noLeidas = 0;
        this.notificaciones = [];
        this.abierto = false;
      }
    }));

    // Sondeo periodico del contador de no leidas (10 s: respuesta casi inmediata).
    this.subs.add(interval(10000).subscribe(() => {
      if (this.authService.isAuthenticated() && !this.abierto) {
        this.actualizarConteo();
      }
    }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  public togglePanel(): void {
    this.abierto = !this.abierto;
    if (this.abierto) {
      this.cargarNotificaciones();
    }
  }

  public cerrarPanel(): void {
    this.abierto = false;
  }

  public actualizarConteo(): void {
    this.notificationService.getConteoNoLeidas().subscribe({
      next: (r) => this.noLeidas = r?.count ?? 0,
      // No romper la UI, pero dejar rastro en consola para diagnostico.
      error: (e) => console.warn('[Notificaciones] No se pudo obtener el conteo de no leidas', e)
    });
  }

  public cargarNotificaciones(): void {
    this.cargando = true;
    this.paginaActual = 0;
    this.notificationService.getMisNotificaciones(this.paginaActual, NotificacionesComponent.TAMANO_PAGINA).subscribe({
      next: (pagina) => {
        this.notificaciones = pagina?.content || [];
        this.hayMas = this.paginaActual + 1 < (pagina?.totalPages ?? 1);
        this.cargando = false;
        // Al abrir la bandeja se marcan todas como leidas automaticamente.
        if (this.noLeidas > 0 || this.notificaciones.some(n => !n.leida)) {
          this.marcarTodas();
        } else {
          this.actualizarConteo();
        }
      },
      error: (e) => {
        this.cargando = false;
        console.warn('[Notificaciones] No se pudo cargar la bandeja', e);
      }
    });
  }

  public cargarMas(): void {
    if (this.cargandoMas || !this.hayMas) return;
    this.cargandoMas = true;
    const siguiente = this.paginaActual + 1;
    this.notificationService.getMisNotificaciones(siguiente, NotificacionesComponent.TAMANO_PAGINA).subscribe({
      next: (pagina) => {
        this.notificaciones = [...this.notificaciones, ...(pagina?.content || [])];
        this.paginaActual = siguiente;
        this.hayMas = this.paginaActual + 1 < (pagina?.totalPages ?? 1);
        this.cargandoMas = false;
      },
      error: (e) => {
        this.cargandoMas = false;
        console.warn('[Notificaciones] No se pudo cargar más notificaciones', e);
      }
    });
  }

  public marcarLeida(n: Notificacion): void {
    if (n.leida) return;
    this.notificationService.marcarLeida(n.id).subscribe({
      next: () => {
        n.leida = true;
        this.actualizarConteo();
      },
      error: (e) => console.warn('[Notificaciones] No se pudo marcar como leida', n.id, e)
    });
  }

  /** Click en un item: lo marca como leida y, si es un anuncio de pelicula,
   *  navega al detalle de esa pelicula (/pelicula/{id}). */
  public abrirNotificacion(n: Notificacion): void {
    this.marcarLeida(n);
    if (this.esAnuncioPelicula(n)) {
      this.router.navigate(['/pelicula', n.referencia]);
      this.cerrarPanel();
    }
  }

  public esAnuncioPelicula(n: Notificacion): boolean {
    return n.tipo === 'PELICULA_CREADA' && /^\d+$/.test(n.referencia ?? '');
  }

  public iconoDe(n: Notificacion): string {
    switch (n.tipo) {
      case 'PELICULA_CREADA': return 'fa-film';
      case 'PELICULA_ELIMINADA': return 'fa-ban';
      case 'TICKET_PAGADO': return 'fa-circle-check';
      case 'TICKET_DEVUELTO': return 'fa-rotate-left';
      default: return 'fa-bell';
    }
  }

  public marcarTodas(): void {
    this.notificationService.marcarTodasLeidas().subscribe({
      next: () => {
        this.notificaciones.forEach(n => n.leida = true);
        this.noLeidas = 0;
      },
      error: (e) => console.warn('[Notificaciones] No se pudieron marcar todas como leidas', e)
    });
  }

  public trackById(_index: number, n: Notificacion): number {
    return n.id;
  }
}
