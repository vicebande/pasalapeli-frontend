export interface Funcion {
  id: number;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm:ss
  sala: string;
  entradasDisponibles: number;
  precio: number;
  peliculaId?: number;
  peliculaTitulo?: string;
}

export interface Disponibilidad {
  funcionId: number;
  peliculaId: number;
  peliculaTitulo: string;
  sala: string;
  entradasDisponibles: number;
  precio: number;
  disponible: boolean;
}

export interface FuncionRequest {
  fecha: string;
  hora: string;
  sala: string;
  entradasDisponibles: number;
  precio: number;
  peliculaId: number;
}
