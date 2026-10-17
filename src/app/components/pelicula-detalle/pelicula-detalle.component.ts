import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CarteleraService } from '../../services/cartelera.service';
import { Pelicula } from '../../models/pelicula.model';
import { Funcion } from '../../models/funcion.model';
import { CompraTicketComponent } from '../compra-ticket/compra-ticket.component';

@Component({
  selector: 'app-pelicula-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, CompraTicketComponent],
  templateUrl: './pelicula-detalle.component.html',
  styleUrls: ['./pelicula-detalle.component.css']
})
export class PeliculaDetalleComponent implements OnInit {
  public pelicula: Pelicula | null = null;
  public funciones: Funcion[] = [];
  public cargando: boolean = true;
  public error: string | null = null;

  public mostrarModalCompra: boolean = false;
  public funcionSeleccionadaId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private carteleraService: CarteleraService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.cargarDetalle(id);
    }
  }

  public cargarDetalle(id: number): void {
    this.cargando = true;
    this.carteleraService.getPeliculaPorId(id).subscribe({
      next: (data) => {
        this.pelicula = data;
        this.cargarFunciones(id);
      },
      error: () => {
        this.error = 'No fue posible cargar el detalle de la película.';
        this.cargando = false;
      }
    });
  }

  public cargarFunciones(peliculaId: number): void {
    this.carteleraService.getFuncionesPorPelicula(peliculaId).subscribe({
      next: (funcs) => {
        this.funciones = funcs;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  public abrirCompra(funcionId: number): void {
    this.funcionSeleccionadaId = funcionId;
    this.mostrarModalCompra = true;
  }

  public cerrarModalCompra(): void {
    this.mostrarModalCompra = false;
    this.funcionSeleccionadaId = null;
    // Recargar funciones para refrescar cupos restantes en vivo
    if (this.pelicula) {
      this.cargarFunciones(this.pelicula.id);
    }
  }
}
