import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CarteleraService } from '../../services/cartelera.service';
import { Pelicula } from '../../models/pelicula.model';
import { CompraTicketComponent } from '../compra-ticket/compra-ticket.component';

@Component({
  selector: 'app-cartelera',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CompraTicketComponent],
  templateUrl: './cartelera.component.html',
  styleUrls: ['./cartelera.component.css']
})
export class CarteleraComponent implements OnInit {
  public peliculas: Pelicula[] = [];
  public busqueda: string = '';
  public cargando: boolean = true;
  public error: string | null = null;

  // Modal de compra rápida
  public mostrarModalCompra: boolean = false;
  public funcionSeleccionadaId: number | null = null;

  constructor(private carteleraService: CarteleraService) {}

  ngOnInit(): void {
    this.cargarPeliculas();
  }

  public cargarPeliculas(): void {
    this.cargando = true;
    this.error = null;
    this.carteleraService.getPeliculas(this.busqueda).subscribe({
      next: (data) => {
        this.peliculas = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'No fue posible cargar las películas. Verifica la conexión con el BFF y Movie Service.';
        this.cargando = false;
      }
    });
  }

  public onBuscar(): void {
    this.cargarPeliculas();
  }

  public abrirCompra(funcionId: number): void {
    this.funcionSeleccionadaId = funcionId;
    this.mostrarModalCompra = true;
  }

  public cerrarModalCompra(): void {
    this.mostrarModalCompra = false;
    this.funcionSeleccionadaId = null;
  }
}
