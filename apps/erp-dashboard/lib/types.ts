// ── Auth ──────────────────────────────────────────────────────────────
export interface TokenPayload {
  user_id: string;
  email: string;
  nombre: string;
  tenant_id: string;
  tenant_nombre: string;
  permisos: string[];
  modulos: string[];
  exp: number;
}

// ── API responses ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  meta?: { page: number; total: number; per_page: number };
}

export interface ApiError {
  code: string;
  detail: string;
  meta?: Record<string, unknown>;
}

// ── Domain models ─────────────────────────────────────────────────────
export type ObraEstado = 'planificacion' | 'ejecucion' | 'terminada' | 'suspendida';

export interface Obra {
  id: string;
  codigo: string;
  nombre: string;
  cliente: string;
  valor_contrato: number;
  fecha_inicio: string;
  fecha_fin_proyectada: string;
  estado: ObraEstado;
  porcentaje_avance: number;
  jefe_obra_nombre?: string;
}

export interface Hito {
  id: string;
  nombre: string;
  fecha_programada: string;
  fecha_real?: string;
  completado: boolean;
}

export interface Actividad {
  id: string;
  descripcion: string;
  cantidad?: number;
  unidad?: string;
  fecha: string;
  registrado_por_nombre?: string;
}

export interface ObraKpis {
  avance_real: number;
  avance_programado: number;
  costo_ejecutado: number;
  costo_presupuestado: number;
  spi: number;   // Schedule Performance Index
  cpi: number;   // Cost Performance Index
  dias_restantes: number;
}

export type RequisicionEstado = 'borrador' | 'pendiente' | 'aprobada' | 'rechazada' | 'cerrada';
export type OcEstado = 'borrador' | 'emitida' | 'entregada' | 'cancelada';
export type OportunidadEtapa = 'prospecto' | 'propuesta' | 'negociacion' | 'ganada' | 'perdida';

export interface Requisicion {
  id: string;
  numero: string;
  obra_nombre?: string;
  descripcion?: string;
  estado: RequisicionEstado;
  urgencia: 'baja' | 'normal' | 'alta' | 'critica';
  solicitado_por_nombre?: string;
  fecha_solicitada: string;
  fecha_requerida?: string;
}

export interface OrdenCompra {
  id: string;
  numero: string;
  proveedor_nombre: string;
  estado: OcEstado;
  total: number;
  fecha_emision: string;
  firmado: boolean;
  contrafirmado: boolean;
}

export interface Articulo {
  id: string;
  codigo: string;
  nombre: string;
  unidad: string;
  stock_minimo: number;
  stock_actual: number;
  precio_promedio: number;
}

export interface MovimientoInventario {
  id: string;
  tipo: 'entrada' | 'salida' | 'ajuste' | 'traslado';
  cantidad: number;
  precio_unitario?: number;
  obra_nombre?: string;
  referencia?: string;
  created_at: string;
}

export interface DashboardKpis {
  obras_activas: number;
  obras_terminadas_mes: number;
  requisiciones_pendientes: number;
  oc_pendientes_firma: number;
  articulos_stock_critico: number;
  costo_ejecutado_mes: number;
  avance_promedio_obras: number;
}
