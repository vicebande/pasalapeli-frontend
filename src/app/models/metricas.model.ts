/**
 * Snapshot de métricas de ventas del día.
 * Lo sirve el BFF en GET /admin/metrics/snapshot y lo pushcea igual
 * por el topic STOMP /topic/metrics.
 */
export interface MetricasSnapshot {
  /** Fecha/hora ISO del snapshot (ej: "2026-11-21T22:45:00-03:00"). */
  timestamp: string;
  /** Monto total vendido hoy en pesos chilenos (CLP). */
  totalHoy: number;
  /** Cantidad de ventas registradas hoy. */
  cantidadHoy: number;
  /** Ventas agrupadas por minuto, en orden cronológico ascendente. Puede venir vacío. */
  porMinuto: MinutoVenta[];
  /** Top de productos vendidos, ordenado desc por cantidad (máx. 5). */
  topProductos: ProductoVenta[];
}

/** Venta agregada de un minuto específico. */
export interface MinutoVenta {
  /** Minuto en formato "HH:mm". */
  minuto: string;
  /** Monto vendido en ese minuto (CLP). */
  monto: number;
  /** Cantidad de ventas en ese minuto. */
  cantidad: number;
}

/** Producto del ranking de ventas. */
export interface ProductoVenta {
  /** Nombre del producto (película). */
  producto: string;
  /** Categoría/género del producto. */
  categoria: string;
  /** Unidades vendidas. */
  cantidad: number;
  /** Monto vendido en CLP. */
  monto: number;
}
