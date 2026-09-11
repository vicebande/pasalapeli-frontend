import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Pelicula, PeliculaRequest } from '../models/pelicula.model';
import { Funcion, FuncionRequest } from '../models/funcion.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiBaseUrl}/admin`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const devHeaders = this.authService.getUserRoleHeader();
    for (const key of Object.keys(devHeaders)) {
      headers = headers.set(key, devHeaders[key]);
    }
    return headers;
  }

  public crearPeliculaConImagen(datos: PeliculaRequest, imagenFile?: File): Observable<Pelicula> {
    const formData = new FormData();
    formData.append('datos', JSON.stringify(datos));
    if (imagenFile) {
      formData.append('imagen', imagenFile, imagenFile.name);
    }
    return this.http.post<Pelicula>(`${this.apiUrl}/movies`, formData, {
      headers: this.getHeaders()
    });
  }

  public eliminarPelicula(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/movies/${id}`, {
      headers: this.getHeaders()
    });
  }

  public crearFuncion(request: FuncionRequest): Observable<Funcion> {
    return this.http.post<Funcion>(`${this.apiUrl}/funciones`, request, {
      headers: this.getHeaders()
    });
  }
}
