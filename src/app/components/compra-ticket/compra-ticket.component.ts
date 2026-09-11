import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarteleraService } from '../../services/cartelera.service';
import { TicketService } from '../../services/ticket.service';
import { AuthService } from '../../services/auth.service';
import { Funcion } from '../../models/funcion.model';
import { Ticket } from '../../models/ticket.model';

@Component({
  selector: 'app-compra-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compra-ticket.component.html',
  styleUrls: ['./compra-ticket.component.css']
})
export class CompraTicketComponent implements OnInit {
  @Input() funcionId!: number;
  @Output() cerrar = new EventEmitter<void>();

  public funcion: Funcion | null = null;
  public cargandoFuncion: boolean = true;
  public procesandoCompra: boolean = false;

  public cantidad: number = 1;
  public metodoPago: string = 'WEBPAY';

  // Estados de resultado
  public ticketGenerado: Ticket | null = null;
  public errorConflict: string | null = null; // HTTP 409
  public errorGeneral: string | null = null;

  constructor(
    private carteleraService: CarteleraService,
    private ticketService: TicketService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarFuncion();
  }

  public cargarFuncion(): void {
    this.cargandoFuncion = true;
    this.carteleraService.getFuncionPorId(this.funcionId).subscribe({
      next: (data) => {
        this.funcion = data;
        this.cargandoFuncion = false;
      },
      error: () => {
        this.errorGeneral = 'Error al consultar disponibilidad de la función.';
        this.cargandoFuncion = false;
      }
    });
  }

  public incrementar(): void {
    if (this.funcion && this.cantidad < this.funcion.entradasDisponibles) {
      this.cantidad++;
    }
  }

  public decrementar(): void {
    if (this.cantidad > 1) {
      this.cantidad--;
    }
  }

  public get totalPagar(): number {
    if (!this.funcion) return 0;
    return this.funcion.precio * this.cantidad;
  }

  public confirmarCompra(): void {
    if (!this.funcion) return;

    this.procesandoCompra = true;
    this.errorConflict = null;
    this.errorGeneral = null;

    const request = {
      usuarioId: this.authService.getUserId(),
      funcionId: this.funcion.id,
      cantidad: this.cantidad,
      metodoPago: this.metodoPago
    };

    this.ticketService.comprarTicket(request).subscribe({
      next: (ticketConfirmado) => {
        this.ticketGenerado = ticketConfirmado;
        this.procesandoCompra = false;
      },
      error: (err) => {
        this.procesandoCompra = false;
        // Identificación del código HTTP 409 Conflict según diagrama de secuencia
        if (err.status === 409) {
          this.errorConflict = 'Conflicto 409: Lo sentimos, las entradas seleccionadas ya no están disponibles o superan el cupo disponible.';
        } else if (err.status === 401) {
          this.errorGeneral = 'Error de autenticación (401). Inicia sesión para continuar.';
        } else {
          this.errorGeneral = err.error?.message || 'Ocurrió un error inesperado al procesar la compra.';
        }
      }
    });
  }

  public cerrarModal(): void {
    this.cerrar.emit();
  }
}
