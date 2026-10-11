// Demo data used when API is not available (development / demos)
import type { Obra, Requisicion, OrdenCompra, Articulo, DashboardKpis, Hito } from './types';

export const DEMO_KPIS: DashboardKpis = {
  obras_activas: 3,
  obras_terminadas_mes: 1,
  requisiciones_pendientes: 7,
  oc_pendientes_firma: 2,
  articulos_stock_critico: 4,
  costo_ejecutado_mes: 284_500_000,
  avance_promedio_obras: 62,
};

export const DEMO_OBRAS: Obra[] = [
  {
    id: '1', codigo: 'OBR-2026-001',
    nombre: 'Hospital Regional de Montería',
    cliente: 'Gobernación de Córdoba',
    valor_contrato: 1_850_000_000,
    fecha_inicio: '2026-01-15',
    fecha_fin_proyectada: '2026-12-31',
    estado: 'ejecucion',
    porcentaje_avance: 68,
    jefe_obra_nombre: 'Carlos Herrera',
  },
  {
    id: '2', codigo: 'OBR-2026-002',
    nombre: 'Colegio Departamental Cereté',
    cliente: 'Municipio de Cereté',
    valor_contrato: 1_200_000_000,
    fecha_inicio: '2026-03-01',
    fecha_fin_proyectada: '2026-11-30',
    estado: 'ejecucion',
    porcentaje_avance: 41,
    jefe_obra_nombre: 'María Fernández',
  },
  {
    id: '3', codigo: 'OBR-2026-003',
    nombre: 'Vía Urbana Lorica — Tramo 2',
    cliente: 'INVÍAS Córdoba',
    valor_contrato: 1_150_000_000,
    fecha_inicio: '2026-04-10',
    fecha_fin_proyectada: '2026-10-15',
    estado: 'ejecucion',
    porcentaje_avance: 77,
    jefe_obra_nombre: 'Andrés Martínez',
  },
  {
    id: '4', codigo: 'OBR-2025-008',
    nombre: 'Puente Vehicular Sahagún',
    cliente: 'Gobernación de Córdoba',
    valor_contrato: 950_000_000,
    fecha_inicio: '2025-06-01',
    fecha_fin_proyectada: '2026-08-31',
    estado: 'terminada',
    porcentaje_avance: 100,
    jefe_obra_nombre: 'Carlos Herrera',
  },
];

export const DEMO_HITOS: Hito[] = [
  { id: 'h1', nombre: 'Cimentación y Estructura', fecha_programada: '2026-04-30', fecha_real: '2026-05-05', completado: true },
  { id: 'h2', nombre: 'Mampostería y Cubierta', fecha_programada: '2026-07-31', completado: false },
  { id: 'h3', nombre: 'Instalaciones Hidráulicas', fecha_programada: '2026-09-30', completado: false },
  { id: 'h4', nombre: 'Acabados y Entrega', fecha_programada: '2026-12-15', completado: false },
];

export const DEMO_REQUISICIONES: Requisicion[] = [
  { id: 'r1', numero: 'REQ-2026-041', obra_nombre: 'Hospital Regional de Montería', descripcion: 'Cemento Portland tipo I', estado: 'pendiente', urgencia: 'alta', solicitado_por_nombre: 'Carlos Herrera', fecha_solicitada: '2026-10-08', fecha_requerida: '2026-10-15' },
  { id: 'r2', numero: 'REQ-2026-040', obra_nombre: 'Colegio Departamental Cereté', descripcion: 'Varilla de acero 1/2"', estado: 'aprobada', urgencia: 'normal', solicitado_por_nombre: 'María Fernández', fecha_solicitada: '2026-10-07', fecha_requerida: '2026-10-18' },
  { id: 'r3', numero: 'REQ-2026-039', obra_nombre: 'Vía Urbana Lorica', descripcion: 'Agregado grueso triturado', estado: 'pendiente', urgencia: 'critica', solicitado_por_nombre: 'Andrés Martínez', fecha_solicitada: '2026-10-06', fecha_requerida: '2026-10-12' },
  { id: 'r4', numero: 'REQ-2026-038', obra_nombre: 'Hospital Regional de Montería', descripcion: 'Tubería PVC presión 4"', estado: 'borrador', urgencia: 'baja', solicitado_por_nombre: 'Carlos Herrera', fecha_solicitada: '2026-10-05' },
];

export const DEMO_ORDENES: OrdenCompra[] = [
  { id: 'oc1', numero: 'OC-2026-028', proveedor_nombre: 'Cementos Argos S.A.', estado: 'emitida', total: 45_600_000, fecha_emision: '2026-10-09', firmado: true, contrafirmado: false },
  { id: 'oc2', numero: 'OC-2026-027', proveedor_nombre: 'Aceros Codacero Ltda.', estado: 'emitida', total: 38_200_000, fecha_emision: '2026-10-08', firmado: false, contrafirmado: false },
  { id: 'oc3', numero: 'OC-2026-026', proveedor_nombre: 'Agregados del Sinú S.A.S.', estado: 'entregada', total: 12_800_000, fecha_emision: '2026-10-01', firmado: true, contrafirmado: true },
];

export const DEMO_ARTICULOS: Articulo[] = [
  { id: 'a1', codigo: 'MAT-001', nombre: 'Cemento Portland Tipo I (50kg)', unidad: 'bulto', stock_minimo: 200, stock_actual: 145, precio_promedio: 32_000 },
  { id: 'a2', codigo: 'MAT-002', nombre: 'Varilla corrugada 1/2" × 6m', unidad: 'unidad', stock_minimo: 500, stock_actual: 380, precio_promedio: 28_500 },
  { id: 'a3', codigo: 'MAT-003', nombre: 'Agregado grueso triturado', unidad: 'm³', stock_minimo: 50, stock_actual: 12, precio_promedio: 185_000 },
  { id: 'a4', codigo: 'MAT-004', nombre: 'Arena de río lavada', unidad: 'm³', stock_minimo: 30, stock_actual: 8, precio_promedio: 95_000 },
  { id: 'a5', codigo: 'EQP-001', nombre: 'Andamio metálico 1m × 2m', unidad: 'módulo', stock_minimo: 20, stock_actual: 34, precio_promedio: 240_000 },
  { id: 'a6', codigo: 'MAT-005', nombre: 'Tubería PVC presión 4"', unidad: 'tramo', stock_minimo: 40, stock_actual: 22, precio_promedio: 68_000 },
];

export const fmt = {
  currency: (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n),
  percent: (n: number) => `${n.toFixed(1)}%`,
  date: (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
};
