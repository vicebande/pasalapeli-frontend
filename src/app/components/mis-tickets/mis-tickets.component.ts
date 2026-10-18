import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TicketService } from '../../services/ticket.service';
import { AuthService } from '../../services/auth.service';
import { Ticket } from '../../models/ticket.model';

@Component({
  selector: 'app-mis-tickets',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-tickets.component.html',
  styleUrls: ['./mis-tickets.component.css']
})
export class MisTicketsComponent implements OnInit {
  public tickets: Ticket[] = [];
  public cargando: boolean = true;
  public error: string | null = null;
  public mensajeExito: string | null = null;
  public devolviendoId: number | null = null;
  public ticketConfirmacion: Ticket | null = null;
  public ticketParaEscanear: Ticket | null = null;

  constructor(
    private ticketService: TicketService,
    public authService: AuthService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.cargarTickets();
  }

  public cargarTickets(): void {
    this.cargando = true;
    this.error = null;
    this.mensajeExito = null;
    this.ticketService.getMisTickets().subscribe({
      next: (data) => {
        this.tickets = data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No fue posible cargar el historial de tickets.';
        this.cargando = false;
      }
    });
  }

  public solicitarDevolucion(t: Ticket): void {
    if (t.estado !== 'PAGADO') return;
    this.ticketConfirmacion = t;
  }

  public cancelarDevolucion(): void {
    this.ticketConfirmacion = null;
  }

  public confirmarDevolucion(): void {
    if (!this.ticketConfirmacion) return;
    const t = this.ticketConfirmacion;

    this.devolviendoId = t.id;
    this.error = null;
    this.mensajeExito = null;
    this.ticketService.devolverTicket(t.id).subscribe({
      next: (devuelto) => {
        this.devolviendoId = null;
        this.ticketConfirmacion = null;
        this.mensajeExito = `Ticket ${devuelto.codigo} devuelto: asientos liberados y eliminado de Mis Entradas.`;
        this.cargarTickets();
      },
      error: (err) => {
        this.devolviendoId = null;
        this.ticketConfirmacion = null;
        this.error = err.error?.message || 'No fue posible realizar la devolución del ticket.';
      }
    });
  }

  public abrirModal(t: Ticket): void {
    this.ticketParaEscanear = t;
  }

  public cerrarModal(): void {
    this.ticketParaEscanear = null;
  }

  /**
   * QR pseudo-gráfico determinista a partir del código del ticket (sin
   * dependencias): mismo código => misma matriz. Solo decorativo/escaneable
   * como imagen, la validación real la hace Ticket Service por código.
   */
  public qrSvg(codigo: string): SafeHtml {
    const n = 25;
    const quiet = 2;
    const total = n + quiet * 2;

    let h = 2166136261;
    for (let i = 0; i < codigo.length; i++) {
      h ^= codigo.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    let s = (h >>> 0) || 1;
    const rand = (): number => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      s >>>= 0;
      return s / 4294967296;
    };

    const inFinder = (x: number, y: number): boolean =>
      (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);

    let rects = '';
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        let on = false;
        if (inFinder(x, y)) {
          const fx = x >= n - 7 ? x - (n - 7) : x;
          const fy = y >= n - 7 ? y - (n - 7) : y;
          const ring = fx === 0 || fx === 6 || fy === 0 || fy === 6;
          const center = fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4;
          on = ring || center;
        } else if (x === 6 || y === 6) {
          on = (x + y) % 2 === 0;
        } else {
          on = rand() < 0.47;
        }
        if (on) {
          rects += `<rect x="${x + quiet}" y="${y + quiet}" width="1" height="1"/>`;
        }
      }
    }

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" role="img" aria-label="Código ${codigo}">` +
      `<rect width="${total}" height="${total}" fill="#ffffff"/><g fill="#111111">${rects}</g></svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
