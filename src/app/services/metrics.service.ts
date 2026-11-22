import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import { environment } from '../../environments/environment';
import { MetricasSnapshot } from '../models/metricas.model';
import { AuthService } from './auth.service';

/**
 * Métricas de ventas en tiempo real.
 *
 * - `getSnapshot()`: snapshot REST inicial (GET /admin/metrics/snapshot).
 * - `connect()`: conexión STOMP pura (sin SockJS) al topic /topic/metrics,
 *   con reconexión automática cada 5 s; emite cada snapshot pushceado.
 * - `conectado$`: estado de la conexión para el badge "En vivo" / "Desconectado".
 * - `autoConnect()`: conecta automáticamente al iniciar el servicio.
 */
@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  private apiUrl = `${environment.apiBaseUrl}/admin/metrics/snapshot`;
  private client: Client | null = null;

  /** Emisor de los snapshots recibidos por WebSocket. */
  private readonly snapshots$ = new Subject<MetricasSnapshot>();
  /** Estado de la conexión STOMP (true = conectado). */
  private readonly conexion$ = new BehaviorSubject<boolean>(false);

  /** Estado de conexión STOMP observable para la UI. */
  public readonly conectado$: Observable<boolean> = this.conexion$.asObservable();
  /** Observable de conexión con datos (primer mensaje WS recibido). */
  public readonly conexionObservable$: Observable<boolean> = this.conexion$.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private zone: NgZone
  ) {}

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const devHeaders = this.authService.getUserRoleHeader();
    for (const key of Object.keys(devHeaders)) {
      headers = headers.set(key, devHeaders[key]);
    }
    return headers;
  }

  /** Snapshot inicial de métricas vía REST (con headers de auth como admin.service). */
  public getSnapshot(): Observable<MetricasSnapshot> {
    return this.http.get<MetricasSnapshot>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  /**
   * Conecta el cliente STOMP (reconexión automática cada 5 s, sin login)
   * y suscribe /topic/metrics. Cada mensaje pushceado se emite como snapshot.
   * Llamar una sola vez por vista; `disconnect()` cierra la conexión.
   */
  public connect(): Observable<MetricasSnapshot> {
    // Si ya hay un cliente pero no está activo, desconecta y vuelve a crear para forzar reconnect
    if (this.client && !this.client.active) {
      this.client.deactivate().catch(() => {});
      this.client = null;
    }
    if (!this.client) {
      const client = new Client({
        brokerURL: this.wsUrl(),
        reconnectDelay: 5000,
        connectHeaders: {},
        onConnect: () => {
          this.conexion$.next(true);
          client.subscribe('/topic/metrics', (message: IMessage) => {
            try {
              const snapshot = JSON.parse(message.body) as MetricasSnapshot;
              // Fuera de Angular zone: reenrutar para que la UI se actualice.
              this.zone.run(() => this.snapshots$.next(snapshot));
            } catch {
              // Mensaje malformado: se ignora sin tumbar la conexión.
            }
          });
        },
        onDisconnect: () => this.zone.run(() => this.conexion$.next(false)),
        onWebSocketClose: () => this.zone.run(() => this.conexion$.next(false)),
        onStompError: () => this.zone.run(() => this.conexion$.next(false))
      });
      this.client = client;
    }
    // Asegurar que el cliente esté activado
    if (this.client && !this.client.active) {
      this.client.activate();
    }
    return this.snapshots$.asObservable();
  }

  /** Cierra la conexión STOMP (al destruir la vista). Seguro de llamar varias veces. */
  public disconnect(): void {
    const cliente = this.client;
    this.client = null;
    this.conexion$.next(false);
    if (cliente) {
      cliente.deactivate().catch(() => {
        // Error al cerrar el socket: la conexión ya queda marcada como caída.
      });
    }
  }

  /**
   * URL del WebSocket según el entorno:
   * dev ('http://localhost:8080/api') → ws://localhost:8080/ws;
   * prod ('/api') → wss://{host}/ws (o ws:// si la página no es https).
   */
  private wsUrl(): string {
    const api = environment.apiBaseUrl;
    if (api.startsWith('http://')) {
      return `ws://${new URL(api).host}/ws`;
    }
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${window.location.host}/ws`;
  }
}
