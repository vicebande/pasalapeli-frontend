export interface Pago {
  id: number;
  monto: number;
  metodo: string;
  estado: string;
  fechaPago: string;
}

export interface Ticket {
  id: number;
  codigo: string;
  estado: string;
  fechaCompra: string;
  usuarioId: number;
  usuarioNombre?: string;
  usuarioCorreo?: string;
  funcionId: number;
  peliculaTitulo?: string;
  sala?: string;
  cantidad?: number;
  pago?: Pago;
}

export interface ComprarTicketRequest {
  usuarioId: number;
  funcionId: number;
  cantidad: number;
  metodoPago: string;
}
