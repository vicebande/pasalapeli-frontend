import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ComprarTicketRequest, Ticket } from '../models/ticket.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = `${environment.apiBaseUrl}/tickets`;

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

  public comprarTicket(request: ComprarTicketRequest): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.apiUrl}/comprar`, request, {
      headers: this.getHeaders()
    });
  }

  public getTicketPorId(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  public getTicketPorCodigo(codigo: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/codigo/${codigo}`, {
      headers: this.getHeaders()
    });
  }

  public getMisTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}`, {
      headers: this.getHeaders()
    });
  }

  public devolverTicket(id: number): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.apiUrl}/${id}/devolver`, null, {
      headers: this.getHeaders()
    });
  }
}
