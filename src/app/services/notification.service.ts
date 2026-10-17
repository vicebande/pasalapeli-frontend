import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notificacion, NotificacionCount } from '../models/notificacion.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiBaseUrl}/notificaciones`;

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

  public getMisNotificaciones(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  public getConteoNoLeidas(): Observable<NotificacionCount> {
    return this.http.get<NotificacionCount>(`${this.apiUrl}/no-leidas/count`, {
      headers: this.getHeaders()
    });
  }

  public marcarLeida(id: number): Observable<Notificacion> {
    return this.http.post<Notificacion>(`${this.apiUrl}/${id}/leer`, null, {
      headers: this.getHeaders()
    });
  }

  public marcarTodasLeidas(): Observable<{ actualizadas: number; noLeidas: number }> {
    return this.http.post<{ actualizadas: number; noLeidas: number }>(
      `${this.apiUrl}/leer-todas`, null, { headers: this.getHeaders() }
    );
  }
}
