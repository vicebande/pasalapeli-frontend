import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
export class CompraTicketComponent implements OnInit, OnDestroy {
  @Input() funcionId!: number;
  @Output() cerrar = new EventEmitter<void>();

  public funcion: Funcion | null = null;
  public cargandoFuncion: boolean = true;
  public procesandoCompra: boolean = false;
  public redirigiendo: boolean = false;

  public cantidad: number = 1;
  public metodoPago: string = 'WEBPAY';
  private compraEnCurso: boolean = false;

  // Estados de resultado
  public ticketGenerado: Ticket | null = null;
  public errorConflict: string | null = null; // HTTP 409
  public errorGeneral: string | null = null;

  // Checkout simulado con tarjeta
  public paso: 'detalle' | 'pago' = 'detalle';
  public tarjeta = { titulares: '', numero: '', expira: '', cvv: '' };
  public errorPago: string | null = null;
  public erroresCampo: { titulares?: string; numero?: string; expira?: string; cvv?: string } = {};
  private timeoutPago: ReturnType<typeof setTimeout> | null = null;
  private timeoutRedireccion: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private carteleraService: CarteleraService,
    private ticketService: TicketService,
    public authService: AuthService,
    private router: Router
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
    this.erroresCampo = {};
    this.paso = 'pago';
  }

  public volverAlDetalle(): void {
    this.cancelarPagoDiferido();
    this.errorPago = null;
    this.erroresCampo = {};
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
    this.erroresCampo = {};
    if (!this.validarTarjeta()) return;
    this.confirmarCompra();
  }

  private cancelarPagoDiferido(): void {
    if (this.timeoutPago !== null) {
      clearTimeout(this.timeoutPago);
      this.timeoutPago = null;
    }
    if (this.timeoutRedireccion !== null) {
      clearTimeout(this.timeoutRedireccion);
      this.timeoutRedireccion = null;
    }
    this.procesandoCompra = false;
    this.redirigiendo = false;
  }

  ngOnDestroy(): void {
    this.cancelarPagoDiferido();
  }

  private validarTarjeta(): boolean {
    this.erroresCampo = {};
    let valida = true;

    const titulares = this.tarjeta.titulares.trim();
    const num = this.tarjeta.numero.replace(/\s/g, '');
    const partes = this.tarjeta.expira.split('/');
    const mes = partes[0] ? Number(partes[0]) : 0;
    const anioStr = partes[1] ? partes[1].trim() : '';

    if (titulares.length < 3) {
      this.erroresCampo.titulares = 'Ingresa el nombre del titular tal como aparece en la tarjeta (mínimo 3 letras).';
      valida = false;
    }

    if (!/^\d{16}$/.test(num)) {
      this.erroresCampo.numero = 'El número de tarjeta debe tener exactamente 16 dígitos.';
      valida = false;
    }

    if (!/^(\d{1,2})$/.test(partes[0] || '')) {
      this.erroresCampo.expira = 'El mes debe estar entre 01 y 12.';
      valida = false;
    } else if (mes < 1 || mes > 12) {
      this.erroresCampo.expira = 'El mes debe estar entre 01 y 12.';
      valida = false;
    }

    if (/^(\d{1,2})$/.test(partes[0] || '') && mes >= 1 && mes <= 12 && !/^(\d{2})$/.test(anioStr)) {
      this.erroresCampo.expira = 'Ingresa el vencimiento con formato MM/AA (por ejemplo 12/27).';
      valida = false;
    }

    if (valida && /^(\d{1,2})$/.test(partes[0] || '') && /^(\d{2})$/.test(anioStr)
        && mes >= 1 && mes <= 12) {
      const anio = 2000 + Number(anioStr);
      const hoy = new Date();
      const mesActual = hoy.getMonth() + 1;
      const anioActual = hoy.getFullYear();
      if (anio < anioActual || (anio === anioActual && mes < mesActual)) {
        this.erroresCampo.expira = 'La tarjeta está vencida. Usa una fecha de vencimiento futura.';
        valida = false;
      }
    }

    if (!/^\d{3,4}$/.test(this.tarjeta.cvv)) {
      this.erroresCampo.cvv = 'El CVV debe tener 3 o 4 dígitos.';
      valida = false;
    }

    if (!valida) {
      this.errorPago = 'Revisa los datos de la tarjeta: algunos campos no son válidos.';
    }
    return valida;
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
    if (this.compraEnCurso) return;
    if (!this.funcion) return;
    this.compraEnCurso = true;

    this.procesandoCompra = true;
    this.redirigiendo = false;
    this.ticketGenerado = null;
    this.errorConflict = null;
    this.errorGeneral = null;

    const request = {
      usuarioId: this.authService.getUserId(),
      funcionId: this.funcion.id,
      cantidad: this.cantidad,
      metodoPago: this.metodoPago
    };

    const inicio = Date.now();
    this.ticketService.comprarTicket(request).subscribe({
      next: (ticketConfirmado) => this.finalizarCompraExitosa(ticketConfirmado, inicio),
      error: (err) => this.manejarErrorCompra(err)
    });
  }

  private finalizarCompraExitosa(ticket: Ticket, inicio: number): void {
    const restante = 1200 - (Date.now() - inicio);
    this.timeoutPago = setTimeout(() => {
      this.procesandoCompra = false;
      this.redirigiendo = true;
      this.ticketGenerado = ticket;
      this.compraEnCurso = false;

      // Cierra el modal en el padre y navega a Mis Entradas (siempre tras éxito)
      this.timeoutRedireccion = setTimeout(() => {
        this.redirigiendo = false;
        this.cerrar.emit();
        this.router.navigate(['/mis-tickets']);
      }, 2000);
    }, restante > 0 ? restante : 0);
  }

  private manejarErrorCompra(err: any): void {
    if (err.status === 409) {
      this.compraEnCurso = false;
      this.procesandoCompra = false;
      this.ticketGenerado = null;
      this.errorConflict = 'Conflicto 409: Lo sentimos, las entradas seleccionadas ya no están disponibles o superan el cupo disponible.';
    } else if (err.status === 401) {
      this.compraEnCurso = false;
      this.procesandoCompra = false;
      this.ticketGenerado = null;
      this.errorGeneral = 'Error de autenticación (401). Inicia sesión para continuar.';
    } else {
      // Posible falso error: el ticket pudo haberse emitido igualmente (timeout/respuesta perdida).
      this.verificarCompraRealizada(err);
    }
  }

  private verificarCompraRealizada(err: any): void {
    if (!this.funcion) {
      this.compraEnCurso = false;
      this.procesandoCompra = false;
      return;
    }
    const funcionId = this.funcion.id;
    const cantidad = this.cantidad;
    const limite = Date.now() - 120000;

    this.ticketService.getMisTickets().subscribe({
      next: (tickets) => {
        const coincidente = tickets.find((t) =>
          t.funcionId === funcionId &&
          t.cantidad === cantidad &&
          (() => {
            const f = new Date(t.fechaCompra).getTime();
            return !isNaN(f) && f >= limite;
          })()
        );
        if (coincidente) {
          this.finalizarCompraExitosa(coincidente, Date.now() - 1200);
        } else {
          this.compraEnCurso = false;
          this.procesandoCompra = false;
          this.ticketGenerado = null;
          this.errorGeneral = err.error?.message || 'Ocurrió un error inesperado al procesar la compra.';
        }
      },
      error: () => {
        this.compraEnCurso = false;
        this.procesandoCompra = false;
        this.ticketGenerado = null;
        this.errorGeneral = err.error?.message || 'Ocurrió un error inesperado al procesar la compra.';
      }
    });
  }

  public cerrarModal(): void {
    this.cancelarPagoDiferido();
    this.cerrar.emit();
  }
}
