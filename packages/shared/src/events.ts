import type { SpeciesKey } from './species.js';
import type { WaterReadingInput } from './waterQuality.js';

export type SyncStatus = 'pending' | 'synced' | 'conflict';

export type EventType =
  | 'LOTE_INICIADO'
  | 'AGUA_REGISTRADA'
  | 'ALIMENTO_SUMINISTRADO'
  | 'MORTALIDAD_REGISTRADA'
  | 'MUESTREO_BIOMETRICO'
  | 'INSUMO_APLICADO'
  | 'LOTE_COSECHADO'
  | 'CORRECCION_REGISTRADA';

export interface BaseEvent<T extends EventType, P> {
  id: string;
  type: T;
  id_lote: string;
  id_tenant: string;
  id_usuario: string;
  ts: string;
  sync_status: SyncStatus;
  payload: P;
}

export interface LoteIniciado extends BaseEvent<
  'LOTE_INICIADO',
  {
    especie: SpeciesKey;
    count_inicial: number;
    peso_inicial_g: number;
    id_estanque: string;
    id_finca: string;
    unidad_costo_cop: number;
  }
> {}

export interface AguaRegistrada extends BaseEvent<
  'AGUA_REGISTRADA',
  WaterReadingInput
> {}

export interface AlimentoSuministrado extends BaseEvent<
  'ALIMENTO_SUMINISTRADO',
  {
    kg_suministrado: number;
    lmax_kg: number;
    n_raciones: number;
    temperatura_agua?: number;
  }
> {}

export interface MortalidadRegistrada extends BaseEvent<
  'MORTALIDAD_REGISTRADA',
  {
    cantidad: number;
    causa_presunta?: string;
    notas?: string;
  }
> {}

export interface MuestreosBiometricos extends BaseEvent<
  'MUESTREO_BIOMETRICO',
  {
    pesos_g: number[];
    peso_promedio_g: number;
    cv_pct: number;
    valid: boolean;
    n: number;
  }
> {}

export interface InsumoAplicado extends BaseEvent<
  'INSUMO_APLICADO',
  {
    id_insumo: string;
    cantidad_aplicada: number;
    unidad: string;
    motivo_aplicacion: string;
    periodo_retiro_dias: number;
    fecha_fin_retiro: string;
    notas?: string;
  }
> {}

export interface LoteCosechado extends BaseEvent<
  'LOTE_COSECHADO',
  {
    biomasa_cosechada_kg: number;
    precio_venta_cop_kg: number;
    notas?: string;
  }
> {}

export interface CorreccionRegistrada extends BaseEvent<
  'CORRECCION_REGISTRADA',
  {
    evento_original_id: string;
    motivo: string;
    payload_corregido: Record<string, unknown>;
  }
> {}

export type OperationalEvent =
  | LoteIniciado
  | AguaRegistrada
  | AlimentoSuministrado
  | MortalidadRegistrada
  | MuestreosBiometricos
  | InsumoAplicado
  | LoteCosechado
  | CorreccionRegistrada;
