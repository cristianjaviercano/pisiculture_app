export interface InsumoLocal {
  id: string;
  nombre_producto: string;
  principio_activo: string;
  tipo: 'medicamento' | 'acondicionador' | 'probiotico' | 'fertilizante';
  periodo_retiro_dias: number;
  unidad_medida: string;
  dosis_referencia: string;
}

// Catálogo base offline (espejo del seed V009 + extras comunes)
export const INSUMOS_CATALOG: InsumoLocal[] = [
  {
    id: 'ins-001',
    nombre_producto: 'Florfenicol 50%',
    principio_activo: 'Florfenicol',
    tipo: 'medicamento',
    periodo_retiro_dias: 12,
    unidad_medida: 'g',
    dosis_referencia: '10 mg/kg pv/día por 5 días',
  },
  {
    id: 'ins-002',
    nombre_producto: 'Oxitetraciclina 20%',
    principio_activo: 'Oxitetraciclina',
    tipo: 'medicamento',
    periodo_retiro_dias: 30,
    unidad_medida: 'g',
    dosis_referencia: '75 mg/kg pv/día por 10 días',
  },
  {
    id: 'ins-003',
    nombre_producto: 'Cal Agrícola (CaO)',
    principio_activo: 'Óxido de calcio',
    tipo: 'acondicionador',
    periodo_retiro_dias: 0,
    unidad_medida: 'kg',
    dosis_referencia: '50–100 kg/1000 m³',
  },
  {
    id: 'ins-004',
    nombre_producto: 'Sal Marina NaCl',
    principio_activo: 'Cloruro de sodio',
    tipo: 'acondicionador',
    periodo_retiro_dias: 0,
    unidad_medida: 'kg',
    dosis_referencia: '1–3 kg/m³',
  },
  {
    id: 'ins-005',
    nombre_producto: 'Probiótico Bacillus',
    principio_activo: 'Bacillus subtilis',
    tipo: 'probiotico',
    periodo_retiro_dias: 0,
    unidad_medida: 'g',
    dosis_referencia: '5–10 g/100 kg biomasa',
  },
  {
    id: 'ins-006',
    nombre_producto: 'Diquat (alguicida)',
    principio_activo: 'Dibromuro de diquat',
    tipo: 'acondicionador',
    periodo_retiro_dias: 3,
    unidad_medida: 'mL',
    dosis_referencia: '1–2 mL/m³ según turbidez',
  },
];

export const TIPO_LABELS: Record<InsumoLocal['tipo'], string> = {
  medicamento:   '💊 Medicamento',
  acondicionador:'🧪 Acondicionador',
  probiotico:    '🦠 Probiótico',
  fertilizante:  '🌿 Fertilizante',
};
