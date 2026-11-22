import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import { MetricsService } from '../../services/metrics.service';
import { MetricasSnapshot } from '../../models/metricas.model';

// Chart.js v4: registrar todos los elementos/controladores de fábrica.
Chart.register(...registerables);

/**
 * Dashboard de métricas de ventas en tiempo real.
 *
 * Pinta el snapshot REST al iniciar y se mantiene actualizado con los
 * snapshots que el BFF pushcea por WebSocket STOMP en /topic/metrics.
 * Los charts se actualizan con `.update()` (sin recrear la instancia)
 * y se destruyen en ngOnDestroy.
 */
@Component({
  selector: 'app-admin-metrics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-metrics.component.html',
  styleUrls: ['./admin-metrics.component.css']
})
export class AdminMetricsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartMinutoCanvas', { static: true }) private chartMinutoCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartProductoCanvas', { static: true }) private chartProductoCanvas!: ElementRef<HTMLCanvasElement>;

  /** Último snapshot recibido (REST o WebSocket). */
  public snapshot: MetricasSnapshot | null = null;
  /** true mientras no llega el primer snapshot. */
  public cargando = true;
  /** true si el socket STOMP está conectado (badge "En vivo"). */
  public enVivo = false;
  /** Mensaje de error inline (sin alert/confirm). */
  public mensajeError: string | null = null;

  private chartMinuto: Chart<'line'> | null = null;
  private chartProducto: Chart<'bar'> | null = null;
  private subSnapshot: Subscription | null = null;
  private subEstado: Subscription | null = null;
  private subVivo: Subscription | null = null;

  /** Formateador de pesos chilenos (CLP sin decimales). */
  private readonly clp = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  });

  constructor(private metricsService: MetricsService) {}

  public ngOnInit(): void {
    // Snapshot inicial REST (pinta de inmediato).
    this.subSnapshot = this.metricsService.getSnapshot().subscribe({
      next: (snapshot) => this.aplicarSnapshot(snapshot),
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No se pudieron cargar las métricas de ventas.';
      }
    });

    // Estado de conexión STOMP para el badge "En vivo" / "Desconectado'.
    // Usamos conectado$: el badge pone enVivo=true cuando el cliente
    // STOMP está conectado (evento onConnect del broker).
    this.subEstado = this.metricsService.conectado$.subscribe((conectado) => {
      this.enVivo = conectado;
    });

    // Conexión WebSocket STOMP a /topic/metrics con retry automático.
    // Se retrasa 1s para asegurar que el snapshot REST ya esté cargado.
    setTimeout(() => {
      this.subVivo = this.metricsService.connect().subscribe({
        next: (snapshot) => this.aplicarSnapshot(snapshot),
        error: () => {
          // Intento de reconexión después de 3 s si falla el primer connect.
          setTimeout(() => {
            this.subVivo = this.metricsService.connect().subscribe({
              next: (snapshot) => this.aplicarSnapshot(snapshot),
              error: () => {
                this.mensajeError = 'No se pudo establecer la conexión en tiempo real. Los datos se actualizan por cada compra.';
              }
            });
          }, 3000);
        }
      });
    }, 1000);
  }

  public ngAfterViewInit(): void {
    this.crearCharts();
    // Si el snapshot REST llegó antes de la vista, pinta con los datos ya cargados.
    this.actualizarCharts();
  }

  public ngOnDestroy(): void {
    this.subSnapshot?.unsubscribe();
    this.subEstado?.unsubscribe();
    this.subVivo?.unsubscribe();
    this.chartMinuto?.destroy();
    this.chartMinuto = null;
    this.chartProducto?.destroy();
    this.chartProducto = null;
    this.metricsService.disconnect();
  }

  /** Refresca la conexión WebSocket STOMP (desconecta y vuelve a conectar). */
  public refrescarConexion(): void {
    this.metricsService.disconnect();
    // Resetear estado de UI antes de reconectar
    this.enVivo = false;
    this.cargando = true;
    this.mensajeError = null;
    // Volver a conectar
    this.subVivo = this.metricsService.connect().subscribe({
      next: (snapshot) => this.aplicarSnapshot(snapshot),
      error: () => {
        this.mensajeError = 'Error al reconectar la conexión WebSocket.';
        this.cargando = false;
      }
    });
  }

  /** Formatea un monto en pesos chilenos (CLP). */
  public formatearClp(monto: number): string {
    return this.clp.format(monto || 0);
  }

  /** Reemplaza el estado con el snapshot recibido (REST o WebSocket). */
  private aplicarSnapshot(snapshot: MetricasSnapshot): void {
    this.snapshot = snapshot;
    this.cargando = false;
    this.mensajeError = null;
    this.actualizarCharts();
  }

  // ===================== Charts =====================

  /** Crea las instancias de Chart.js una sola vez (una por canvas). */
  private crearCharts(): void {
    if (!this.chartMinuto) {
      this.chartMinuto = new Chart(this.chartMinutoCanvas.nativeElement, this.configChartMinuto());
    }
    if (!this.chartProducto) {
      this.chartProducto = new Chart(this.chartProductoCanvas.nativeElement, this.configChartProducto());
    }
  }

  /**
   * Actualiza los charts existentes con el snapshot vigente.
   * No recrea la instancia: solo muta labels/datos y llama a `.update()`.
   */
  private actualizarCharts(): void {
    if (!this.snapshot) return;

    if (this.chartMinuto) {
      const porMinuto = this.snapshot.porMinuto || [];
      this.chartMinuto.data.labels = porMinuto.map((m) => m.minuto);
      this.chartMinuto.data.datasets[0].data = porMinuto.map((m) => m.monto);
      this.chartMinuto.update();
    }

    if (this.chartProducto) {
      const top = this.snapshot.topProductos || [];
      this.chartProducto.data.labels = top.map((p) => p.producto);
      this.chartProducto.data.datasets[0].data = top.map((p) => p.cantidad);
      this.chartProducto.update();
    }
  }

  /** Configuración del chart de líneas: ventas por minuto (monto CLP). */
  private configChartMinuto(): ChartConfiguration<'line'> {
    return {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Monto vendido',
            data: [],
            borderColor: '#FFC533',
            backgroundColor: 'rgba(255, 183, 0, 0.14)',
            pointBackgroundColor: '#FFC533',
            pointBorderColor: '#21222B',
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2,
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#2F3140',
            borderColor: '#3C4154',
            borderWidth: 1,
            titleColor: '#f8fafc',
            bodyColor: '#adb5bd',
            callbacks: {
              label: (item) => {
                const dato = this.snapshot?.porMinuto[item.dataIndex];
                return dato ? ` ${this.formatearClp(dato.monto)} · ${dato.cantidad} venta(s)` : '';
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#6c757d', maxRotation: 45, autoSkip: true },
            grid: { color: 'rgba(60, 65, 84, 0.35)' }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#6c757d', callback: (valor) => this.formatearClp(Number(valor)) },
            grid: { color: 'rgba(60, 65, 84, 0.5)' }
          }
        }
      }
    };
  }

  /** Configuración del chart de barras horizontales: unidades por producto. */
  private configChartProducto(): ChartConfiguration<'bar'> {
    return {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Unidades vendidas',
            data: [],
            backgroundColor: 'rgba(56, 189, 248, 0.65)',
            hoverBackgroundColor: '#38bdf8',
            borderColor: '#38bdf8',
            borderWidth: 1,
            borderRadius: 6
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#2F3140',
            borderColor: '#3C4154',
            borderWidth: 1,
            titleColor: '#f8fafc',
            bodyColor: '#adb5bd',
            callbacks: {
              label: (item) => {
                const dato = this.snapshot?.topProductos[item.dataIndex];
                return dato ? ` ${dato.cantidad} vendida(s) · ${this.formatearClp(dato.monto)}` : '';
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { color: '#6c757d', precision: 0 },
            grid: { color: 'rgba(60, 65, 84, 0.5)' }
          },
          y: {
            ticks: { color: '#adb5bd' },
            grid: { color: 'rgba(60, 65, 84, 0.35)' }
          }
        }
      }
    };
  }
}
