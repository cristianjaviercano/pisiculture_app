export type MortalityStatus = 'ok' | 'warn' | 'critical';

export interface MortalityEvaluation {
  status: MortalityStatus;
  rate_pct: number;
  message: string;
}

/**
 * Evalúa la mortalidad diaria contra umbrales operacionales.
 * >= 1%/día → crítico (notificación inmediata al Coordinador)
 * >= 0.5%/día → alerta (revisar calidad de agua)
 * >= 0.1%/día → zona de alerta
 */
export function evaluateMortality(deaths_today: number, current_count: number): MortalityEvaluation {
  if (current_count <= 0) {
    return { status: 'ok', rate_pct: 0, message: '' };
  }

  const rate_pct = parseFloat(((deaths_today / current_count) * 100).toFixed(3));

  if (rate_pct >= 1.0) {
    return {
      status: 'critical',
      rate_pct,
      message: `Mortalidad CRÍTICA: ${rate_pct.toFixed(2)}%/día. Notifica al Coordinador INMEDIATAMENTE.`,
    };
  }
  if (rate_pct >= 0.5) {
    return {
      status: 'warn',
      rate_pct,
      message: `Mortalidad elevada: ${rate_pct.toFixed(2)}%/día. Revisa la calidad del agua.`,
    };
  }
  if (rate_pct >= 0.1) {
    return {
      status: 'warn',
      rate_pct,
      message: `Mortalidad en zona de alerta: ${rate_pct.toFixed(2)}%/día.`,
    };
  }

  return {
    status: 'ok',
    rate_pct,
    message: `Mortalidad normal: ${rate_pct.toFixed(2)}%/día.`,
  };
}
