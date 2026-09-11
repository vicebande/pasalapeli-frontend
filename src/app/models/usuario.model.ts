export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: 'ADMIN' | 'CLIENTE';
}

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  roles: string[];
  authenticated: boolean;
}
