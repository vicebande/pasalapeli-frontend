import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
  public readonly QR_N = 25;
  public readonly QR_QUIET = 2;
  public readonly QR_TOTAL = this.QR_N + this.QR_QUIET * 2;

  public tickets: Ticket[] = [];
  public cargando: boolean = true;
  public error: string | null = null;
  public mensajeExito: string | null = null;
  public devolviendoId: number | null = null;
  public ticketConfirmacion: Ticket | null = null;
  public ticketParaEscanear: Ticket | null = null;
  public qrCeldas: { x: number; y: number }[] = [];

  constructor(
    private ticketService: TicketService,
    public authService: AuthService
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
    this.qrCeldas = this.calcularCeldas(t.codigo);
  }

  public cerrarModal(): void {
    this.ticketParaEscanear = null;
    this.qrCeldas = [];
  }

  /**
   * Matriz de celdas encendidas del QR pseudo-gráfico determinista a partir
   * del código del ticket (sin dependencias): mismo código => misma matriz.
   * Se renderiza como <svg> nativo en el template (sin [innerHTML] ni
   * bypass del sanitizer de Angular). Solo decorativo: la validación real la
   * hace Ticket Service por código.
   */
  private calcularCeldas(codigo: string): { x: number; y: number }[] {
    const n = this.QR_N;
    const siguiente = this.creadorAleatorio(this.fnv1a(codigo));
    const celdas: { x: number; y: number }[] = [];
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        let on = false;
        if (this.esFinder(x, y, n)) {
          on = this.moduloFinder(x - this.origenFinder(x, n), y - this.origenFinder(y, n));
        } else if (x === 6 || y === 6) {
          on = (x + y) % 2 === 0;
        } else {
          on = siguiente() < 0.47;
        }
        if (on) {
          celdas.push({ x, y });
        }
      }
    }
    return celdas;
  }

  private fnv1a(texto: string): number {
    let h = 2166136261;
    for (let i = 0; i < texto.length; i++) {
      h ^= texto.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0 || 1;
  }

  private creadorAleatorio(seed: number): () => number {
    let s = seed;
    return () => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      s >>>= 0;
      return s / 4294967296;
    };
  }

  private origenFinder(v: number, n: number): number {
    return v >= n - 7 ? n - 7 : 0;
  }

  private esFinder(x: number, y: number, n: number): boolean {
    return (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  }

  private moduloFinder(fx: number, fy: number): boolean {
    const anillo = fx === 0 || fx === 6 || fy === 0 || fy === 6;
    const centro = fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4;
    return anillo || centro;
  }
}
