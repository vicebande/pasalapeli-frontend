export interface Notificacion {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  referencia?: string;
  leida: boolean;
  fechaCreacion: string;
}

export interface NotificacionCount {
  count: number;
}

/** Respuesta paginada de la bandeja (?page&size) para "cargar más". */
export interface PageNotificaciones<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface DestinoNotificacion {
  id: number;
  nombre: string;
  tipo: string;
  valor?: string;
  descripcion?: string;
  activo: boolean;
  fechaCreacion?: string;
}

export interface ReglaDistribucion {
  id: number;
  evento: string;
  destinoId: number;
  destinoNombre?: string;
  activo: boolean;
  fechaCreacion?: string;
}

export interface MensajeFallido {
  id: number;
  cola: string;
  payload?: string;
  error?: string;
  intentos: number;
  fechaCreacion?: string;
}
