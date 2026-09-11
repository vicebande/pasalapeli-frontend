import { Funcion } from './funcion.model';

export interface Pelicula {
  id: number;
  titulo: string;
  descripcion?: string;
  genero: string;
  duracion: number;
  clasificacion: string;
  imagen?: string;
  funciones?: Funcion[];
}

export interface PeliculaRequest {
  titulo: string;
  descripcion?: string;
  genero: string;
  duracion: number;
  clasificacion: string;
  imagen?: string;
}
