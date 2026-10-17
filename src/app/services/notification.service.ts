import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notificacion, NotificacionCount, PageNotificaciones } from '../models/notificacion.model';
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

  public getMisNotificaciones(page = 0, size = 20): Observable<PageNotificaciones<Notificacion>> {
    return this.http.get<PageNotificaciones<Notificacion>>(
      `${this.apiUrl}?page=${page}&size=${size}`,
      { headers: this.getHeaders() }
    );
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
