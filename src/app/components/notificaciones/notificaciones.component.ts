import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  public abierto = false;
  public noLeidas = 0;
  public notificaciones: Notificacion[] = [];
  public cargando = false;
  private subs = new Subscription();

  constructor(
    private notificationService: NotificationService,
    public authService: AuthService
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
    this.notificationService.getMisNotificaciones().subscribe({
      next: (data) => {
        this.notificaciones = data || [];
        this.cargando = false;
        this.actualizarConteo();
      },
      error: (e) => {
        this.cargando = false;
        console.warn('[Notificaciones] No se pudo cargar la bandeja', e);
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
