import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarteleraService } from '../../services/cartelera.service';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { Pelicula, PeliculaRequest } from '../../models/pelicula.model';
import { Funcion, FuncionRequest } from '../../models/funcion.model';
import { AdminMensajeriaComponent } from '../admin-mensajeria/admin-mensajeria.component';

interface ConfirmacionState {
  titulo: string;
  mensaje: string;
  accion: () => void;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminMensajeriaComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  public peliculas: Pelicula[] = [];
  public cargando = true;
  public guardandoPelicula = false;
  public guardandoFuncion = false;

  // Formulario Película (crear / editar en modal)
  public mostrarModalPelicula = false;
  public modoPelicula: 'crear' | 'editar' = 'crear';
  public peliculaEditandoId: number | null = null;
  public peliculaForm: PeliculaRequest = this.peliculaVacia();
  public archivoPortada: File | null = null;
  public vistaPreviaImagen: string | null = null;

  // Formulario Función
  public mostrarModalFuncion = false;
  public modalModo: 'crear' | 'editar' = 'crear';
  public funcionEditando: Funcion | null = null;
  public peliculaSeleccionadaParaFuncion: Pelicula | null = null;
  public nuevaFuncion: FuncionRequest = this.funcionVacia(0);

  // Confirmación genérica (sustituye confirm()/alert())
  public confirmacion: ConfirmacionState | null = null;

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

  /**
   * El listado del BFF (todas=true) ya trae funciones futuras embebidas en cada
   * película: un solo request en vez de N+1 (una llamada por película).
   */
  public cargarPeliculas(): void {
    this.cargando = true;
    this.carteleraService.getPeliculas(undefined, true).subscribe({
      next: (data) => {
        this.peliculas = (data || []).map((p) => ({
          ...p,
          funciones: p.funciones || []
        }));
        this.cargando = false;
      },
      error: () => {
        this.mensajeError = 'Error al cargar catálogo de películas para administración.';
        this.cargando = false;
      }
    });
  }

  public getFunciones(peliculaId: number): Funcion[] {
    const p = this.peliculas.find((x) => x.id === peliculaId);
    return p?.funciones || [];
  }

  public totalFunciones(): number {
    return this.peliculas.reduce((acc, p) => acc + (p.funciones?.length || 0), 0);
  }

  // ===================== Películas =====================

  public abrirCrearPelicula(): void {
    this.modoPelicula = 'crear';
    this.peliculaEditandoId = null;
    this.peliculaForm = this.peliculaVacia();
    this.archivoPortada = null;
    this.vistaPreviaImagen = null;
    this.mensajeError = null;
    this.mostrarModalPelicula = true;
  }

  public abrirEditarPelicula(p: Pelicula): void {
    this.modoPelicula = 'editar';
    this.peliculaEditandoId = p.id;
    this.peliculaForm = {
      titulo: p.titulo,
      descripcion: p.descripcion || '',
      genero: p.genero,
      duracion: p.duracion,
      clasificacion: p.clasificacion,
      imagen: p.imagen || ''
    };
    this.archivoPortada = null;
    this.vistaPreviaImagen = p.imagen || null;
    this.mensajeError = null;
    this.mostrarModalPelicula = true;
  }

  public cerrarModalPelicula(): void {
    this.mostrarModalPelicula = false;
    this.peliculaEditandoId = null;
    this.archivoPortada = null;
    this.vistaPreviaImagen = null;
  }

  public onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.archivoPortada = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.vistaPreviaImagen = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  public guardarPelicula(formValid: boolean | null): void {
    if (!formValid) {
      this.mensajeError = 'Complete los campos obligatorios (título, género, duración y clasificación).';
      return;
    }
    this.guardandoPelicula = true;
    this.mensajeError = null;
    this.mensajeExito = null;

    const peticion =
      this.modoPelicula === 'editar' && this.peliculaEditandoId !== null
        ? this.adminService.actualizarPelicula(this.peliculaEditandoId, this.peliculaForm, this.archivoPortada || undefined)
        : this.adminService.crearPeliculaConImagen(this.peliculaForm, this.archivoPortada || undefined);

    peticion.subscribe({
      next: (pelicula) => {
        this.guardandoPelicula = false;
        this.mensajeExito =
          this.modoPelicula === 'editar'
            ? `Película "${pelicula?.titulo || this.peliculaForm.titulo}" actualizada.`
            : `Película "${pelicula?.titulo || this.peliculaForm.titulo}" registrada con portada.`;
        this.cerrarModalPelicula();
        this.cargarPeliculas();
      },
      error: (err) => {
        this.guardandoPelicula = false;
        this.mensajeError = err?.error?.message || 'Error al guardar la película en Movie Service.';
      }
    });
  }

  public eliminarPelicula(id: number, titulo: string): void {
    this.abrirConfirmacion(
      'Eliminar película',
      `¿Eliminar "${titulo}" y su imagen asociada? Las funciones también se quitan del catálogo.`,
      () => {
        this.adminService.eliminarPelicula(id).subscribe({
          next: () => {
            this.mensajeExito = `Película "${titulo}" eliminada.`;
            this.cargarPeliculas();
          },
          error: () => {
            this.mensajeError = 'Error al eliminar la película.';
          }
        });
      }
    );
  }

  // ===================== Funciones =====================

  public abrirCrearFuncion(p: Pelicula): void {
    this.funcionEditando = null;
    this.modalModo = 'crear';
    this.peliculaSeleccionadaParaFuncion = p;
    this.nuevaFuncion = this.funcionVacia(p.id);
    this.mostrarModalFuncion = true;
  }

  public abrirEditarFuncion(p: Pelicula, f: Funcion): void {
    this.funcionEditando = f;
    this.modalModo = 'editar';
    this.peliculaSeleccionadaParaFuncion = p;
    this.nuevaFuncion = {
      fecha: f.fecha,
      hora: f.hora,
      sala: f.sala,
      entradasDisponibles: f.entradasDisponibles,
      precio: f.precio,
      peliculaId: p.id
    };
    this.mostrarModalFuncion = true;
  }

  public cerrarModalFuncion(): void {
    this.mostrarModalFuncion = false;
    this.peliculaSeleccionadaParaFuncion = null;
    this.funcionEditando = null;
  }

  public guardarFuncion(formValid: boolean | null): void {
    if (!formValid) {
      this.mensajeError = 'Complete los datos de la función (fecha, hora y sala).';
      return;
    }
    this.guardandoFuncion = true;
    this.mensajeError = null;

    const peticion =
      this.modalModo === 'editar' && this.funcionEditando
        ? this.adminService.actualizarFuncion(this.funcionEditando.id, this.nuevaFuncion)
        : this.adminService.crearFuncion(this.nuevaFuncion);

    peticion.subscribe({
      next: () => {
        this.guardandoFuncion = false;
        const esEdicion = this.modalModo === 'editar';
        this.cerrarModalFuncion();
        this.mensajeExito = esEdicion
          ? 'Función actualizada en Movie Service.'
          : 'Función programada en Movie Service.';
        this.cargarPeliculas();
      },
      error: (err) => {
        this.guardandoFuncion = false;
        this.mensajeError = err?.error?.message || err?.message || 'Error al guardar la función.';
      }
    });
  }

  public eliminarFuncion(p: Pelicula, f: Funcion): void {
    this.abrirConfirmacion(
      'Eliminar función',
      `¿Eliminar la función del ${f.fecha} a las ${f.hora} de "${p.titulo}"?`,
      () => {
        this.adminService.eliminarFuncion(f.id).subscribe({
          next: () => {
            this.mensajeExito = `Función del ${f.fecha} a las ${f.hora} eliminada.`;
            this.cargarPeliculas();
          },
          error: () => {
            this.mensajeError = 'Error al eliminar la función.';
          }
        });
      }
    );
  }

  // ===================== Confirmación =====================

  public abrirConfirmacion(titulo: string, mensaje: string, accion: () => void): void {
    this.confirmacion = { titulo, mensaje, accion };
  }

  public cancelarConfirmacion(): void {
    this.confirmacion = null;
  }

  public aceptarConfirmacion(): void {
    const accion = this.confirmacion?.accion;
    this.confirmacion = null;
    if (accion) accion();
  }

  public cerrarBanners(): void {
    this.mensajeExito = null;
    this.mensajeError = null;
  }

  private peliculaVacia(): PeliculaRequest {
    return {
      titulo: '',
      descripcion: '',
      genero: 'Acción',
      duracion: 120,
      clasificacion: 'TE+14',
      imagen: ''
    };
  }

  private funcionVacia(peliculaId: number): FuncionRequest {
    return {
      fecha: new Date().toISOString().split('T')[0],
      hora: '19:00:00',
      sala: 'Sala 1 - IMAX',
      entradasDisponibles: 50,
      precio: 5500,
      peliculaId
    };
  }
}
