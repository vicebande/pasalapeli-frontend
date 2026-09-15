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
  public tickets: Ticket[] = [];
  public cargando: boolean = true;
  public error: string | null = null;
  public mensajeExito: string | null = null;
  public devolviendoId: number | null = null;

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

  public devolverTicket(t: Ticket): void {
    if (t.estado !== 'PAGADO') return;
    const confirmado = confirm(
      `¿Simular la DEVOLUCIÓN del ticket ${t.codigo}?\n\nSus ${t.cantidad ?? 1} asiento(s) se liberarán de la función y el ticket quedará ANULADO (CANCELADO).`
    );
    if (!confirmado) return;

    this.devolviendoId = t.id;
    this.error = null;
    this.mensajeExito = null;
    this.ticketService.devolverTicket(t.id).subscribe({
      next: (devuelto) => {
        this.devolviendoId = null;
        this.mensajeExito = `Ticket ${devuelto.codigo} devuelto: se liberaron sus asientos y quedó anulado.`;
        this.cargarTickets();
      },
      error: (err) => {
        this.devolviendoId = null;
        this.error = err.error?.message || 'No fue posible realizar la devolución del ticket.';
      }
    });
  }
}
