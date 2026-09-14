import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarteleraService } from '../../services/cartelera.service';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { Pelicula, PeliculaRequest } from '../../models/pelicula.model';
import { FuncionRequest } from '../../models/funcion.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  public peliculas: Pelicula[] = [];
  public cargando: boolean = true;
  public guardandoPelicula: boolean = false;
  public guardandoFuncion: boolean = false;

  // Formulario Película
  public nuevaPelicula: PeliculaRequest = {
    titulo: '',
    descripcion: '',
    genero: 'Acción',
    duracion: 120,
    clasificacion: 'TE+14',
    imagen: ''
  };
  public archivoPortada: File | null = null;
  public vistaPreviaImagen: string | null = null;

  // Formulario Función
  public mostrarModalFuncion: boolean = false;
  public peliculaSeleccionadaParaFuncion: Pelicula | null = null;
  public nuevaFuncion: FuncionRequest = {
    fecha: new Date().toISOString().split('T')[0],
    hora: '19:00:00',
    sala: 'Sala 1 - IMAX',
    entradasDisponibles: 50,
    precio: 5500,
    peliculaId: 0
  };

  public mensajeExito: string | null = null;
  public mensajeError: string | null = null;

  constructor(
    private carteleraService: CarteleraService,
    private adminService: AdminService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarPeliculas();
  }

  public cargarPeliculas(): void {
    this.cargando = true;
    this.carteleraService.getPeliculas().subscribe({
      next: (data) => {
        this.peliculas = data;
        this.cargando = false;
      },
      error: () => {
        this.mensajeError = 'Error al cargar catálogo de películas para administración.';
        this.cargando = false;
      }
    });
  }

  public onArchivoSeleccionado(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.archivoPortada = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.vistaPreviaImagen = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  public guardarPelicula(): void {
    if (!this.nuevaPelicula.titulo || !this.nuevaPelicula.genero) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    this.guardandoPelicula = true;
    this.mensajeExito = null;
    this.mensajeError = null;

    this.adminService.crearPeliculaConImagen(this.nuevaPelicula, this.archivoPortada || undefined)
      .subscribe({
        next: (peliculaCreada) => {
          this.guardandoPelicula = false;
          this.mensajeExito = `¡Película "${peliculaCreada.titulo}" registrada exitosamente con portada!`;
          this.limpiarFormularioPelicula();
          this.cargarPeliculas();
        },
        error: (err) => {
          this.guardandoPelicula = false;
          this.mensajeError = err.error?.message || 'Error al crear la película en Movie Service.';
        }
      });
  }

  public eliminarPelicula(id: number, titulo: string): void {
    if (confirm(`¿Estás seguro de eliminar "${titulo}" y su imagen asociada?`)) {
      this.adminService.eliminarPelicula(id).subscribe({
        next: () => {
          this.mensajeExito = `Película "${titulo}" eliminada correctamente.`;
          this.cargarPeliculas();
        },
        error: () => {
          this.mensajeError = 'Error al eliminar la película.';
        }
      });
    }
  }

  public abrirCrearFuncion(p: Pelicula): void {
    this.peliculaSeleccionadaParaFuncion = p;
    this.nuevaFuncion.peliculaId = p.id;
    this.mostrarModalFuncion = true;
  }

  public cerrarModalFuncion(): void {
    this.mostrarModalFuncion = false;
    this.peliculaSeleccionadaParaFuncion = null;
  }

  public guardarFuncion(): void {
    this.guardandoFuncion = true;
    this.adminService.crearFuncion(this.nuevaFuncion).subscribe({
      next: () => {
        this.guardandoFuncion = false;
        this.cerrarModalFuncion();
        this.mensajeExito = '¡Función programada exitosamente en Movie Service!';
        this.cargarPeliculas();
      },
      error: () => {
        this.guardandoFuncion = false;
        alert('Error al programar función.');
      }
    });
  }

  private limpiarFormularioPelicula(): void {
    this.nuevaPelicula = {
      titulo: '',
      descripcion: '',
      genero: 'Acción',
      duracion: 120,
      clasificacion: 'TE+14',
      imagen: ''
    };
    this.archivoPortada = null;
    this.vistaPreviaImagen = null;
  }
}
