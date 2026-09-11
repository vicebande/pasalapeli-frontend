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

  // Checkout simulado con tarjeta
  public paso: 'detalle' | 'pago' = 'detalle';
  public tarjeta = { titulares: '', numero: '', expira: '', cvv: '' };
  public errorPago: string | null = null;
  private timeoutPago: ReturnType<typeof setTimeout> | null = null;

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

  public irAlPago(): void {
    this.errorPago = null;
    this.errorGeneral = null;
    this.paso = 'pago';
  }

  public volverAlDetalle(): void {
    this.cancelarPagoDiferido();
    this.errorPago = null;
    this.paso = 'detalle';
  }

  public formatearNumeroTarjeta(): void {
    this.tarjeta.numero = this.tarjeta.numero
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  public formatearExpiracion(): void {
    let v = this.tarjeta.expira.replace(/\D/g, '').slice(0, 4);
    if (v.length > 2) {
      v = v.slice(0, 2) + '/' + v.slice(2);
    }
    this.tarjeta.expira = v;
  }

  public confirmarPago(): void {
    this.errorPago = null;
    if (!this.validarTarjeta()) return;
    this.procesandoCompra = true;
    // Simula el procesamiento de la transacción con el gateway (pago 100% simulado)
    this.timeoutPago = setTimeout(() => this.confirmarCompra(), 1200);
  }

  private cancelarPagoDiferido(): void {
    if (this.timeoutPago !== null) {
      clearTimeout(this.timeoutPago);
      this.timeoutPago = null;
    }
    this.procesandoCompra = false;
  }

  private validarTarjeta(): boolean {
    const num = this.tarjeta.numero.replace(/\s/g, '');
    const partes = this.tarjeta.expira.split('/');
    const mes = partes[0] ? Number(partes[0]) : 0;

    if (
      this.tarjeta.titulares.trim().length < 3 ||
      !/^\d{16}$/.test(num) ||
      !/^\d{2}$/.test(partes[0] || '') ||
      mes < 1 || mes > 12 ||
      !/^\d{2}$/.test(partes[1] || '') ||
      !/^\d{3,4}$/.test(this.tarjeta.cvv)
    ) {
      this.errorPago = 'Revisa los datos: titular, número de 16 dígitos, vencimiento MM/AA y CVV de 3-4 dígitos.';
      return false;
    }
    return true;
  }

  public get tarjetaMarca(): string {
    const n = this.tarjeta.numero.replace(/\s/g, '');
    if (n.startsWith('4')) return 'VISA';
    if (n.startsWith('5')) return 'MASTERCARD';
    if (n.startsWith('3')) return 'AMEX';
    if (n.startsWith('6')) return 'DINERS';
    return 'CARD';
  }

  public confirmarCompra(): void {
    if (!this.funcion) return;
    this.timeoutPago = null;

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
    this.cancelarPagoDiferido();
    this.cerrar.emit();
  }
}
