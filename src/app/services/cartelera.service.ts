import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Pelicula } from '../models/pelicula.model';
import { Funcion } from '../models/funcion.model';

@Injectable({
  providedIn: 'root'
})
export class CarteleraService {
  private apiUrl = `${environment.apiBaseUrl}/cartelera`;

  constructor(private http: HttpClient) {}

  public getPeliculas(busqueda?: string): Observable<Pelicula[]> {
    let params = new HttpParams();
    if (busqueda) {
      params = params.set('busqueda', busqueda);
    }
    return this.http.get<Pelicula[]>(this.apiUrl, { params });
  }

  public getPeliculaPorId(id: number): Observable<Pelicula> {
    return this.http.get<Pelicula>(`${this.apiUrl}/${id}`);
  }

  public getFuncionesPorPelicula(peliculaId: number): Observable<Funcion[]> {
    return this.http.get<Funcion[]>(`${this.apiUrl}/${peliculaId}/funciones`);
  }

  public getFuncionPorId(funcionId: number): Observable<Funcion> {
    return this.http.get<Funcion>(`${this.apiUrl}/funciones/${funcionId}`);
  }
}
