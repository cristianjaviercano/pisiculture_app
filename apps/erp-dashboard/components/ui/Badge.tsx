import type { CSSProperties } from 'react';

type Variant = 'ok' | 'warn' | 'err' | 'inf' | 'neutral' | 'ac';

const STYLES: Record<Variant, CSSProperties> = {
  ok:      { background: 'var(--ok-bg)',   color: 'var(--ok)' },
  warn:    { background: 'var(--warn-bg)', color: 'var(--warn)' },
  err:     { background: 'var(--err-bg)',  color: 'var(--err)' },
  inf:     { background: 'var(--inf-bg)',  color: 'var(--inf)' },
  neutral: { background: 'var(--sur2)',    color: 'var(--tx3)' },
  ac:      { background: 'var(--ac-light)',color: 'var(--ac-hover)' },
};

interface Props {
  variant?: Variant;
  children: React.ReactNode;
  style?: CSSProperties;
}

export default function Badge({ variant = 'neutral', children, style }: Props) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: '20px',
      fontSize: '11px', fontWeight: 600,
      fontFamily: 'var(--font-mono)',
      whiteSpace: 'nowrap',
      ...STYLES[variant],
      ...style,
    }}>
      {children}
    </span>
  );
}

// Semantic mappers
export function ObraEstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { v: Variant; label: string }> = {
    planificacion: { v: 'inf',     label: 'Planificación' },
    ejecucion:     { v: 'ok',      label: 'En ejecución'  },
    terminada:     { v: 'neutral', label: 'Terminada'     },
    suspendida:    { v: 'err',     label: 'Suspendida'    },
  };
  const { v, label } = map[estado] ?? { v: 'neutral', label: estado };
  return <Badge variant={v}>{label}</Badge>;
}

export function ReqEstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { v: Variant; label: string }> = {
    borrador:  { v: 'neutral', label: 'Borrador'  },
    pendiente: { v: 'warn',    label: 'Pendiente' },
    aprobada:  { v: 'ok',      label: 'Aprobada'  },
    rechazada: { v: 'err',     label: 'Rechazada' },
    cerrada:   { v: 'neutral', label: 'Cerrada'   },
  };
  const { v, label } = map[estado] ?? { v: 'neutral', label: estado };
  return <Badge variant={v}>{label}</Badge>;
}

export function OcEstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { v: Variant; label: string }> = {
    borrador:   { v: 'neutral', label: 'Borrador'   },
    emitida:    { v: 'inf',     label: 'Emitida'    },
    entregada:  { v: 'ok',      label: 'Entregada'  },
    cancelada:  { v: 'err',     label: 'Cancelada'  },
  };
  const { v, label } = map[estado] ?? { v: 'neutral', label: estado };
  return <Badge variant={v}>{label}</Badge>;
}

export function UrgenciaBadge({ urgencia }: { urgencia: string }) {
  const map: Record<string, { v: Variant; label: string }> = {
    baja:    { v: 'neutral', label: 'Baja'    },
    normal:  { v: 'inf',     label: 'Normal'  },
    alta:    { v: 'warn',    label: 'Alta'    },
    critica: { v: 'err',     label: 'Crítica' },
  };
  const { v, label } = map[urgencia] ?? { v: 'neutral', label: urgencia };
  return <Badge variant={v}>{label}</Badge>;
}
