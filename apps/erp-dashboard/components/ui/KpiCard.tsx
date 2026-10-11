import type { CSSProperties } from 'react';

interface Props {
  title: string;
  value: string | number;
  sub?: string;
  delta?: number;       // positive = good
  icon?: string;
  accent?: boolean;
  style?: CSSProperties;
}

export default function KpiCard({ title, value, sub, delta, icon, accent, style }: Props) {
  const deltaColor = delta === undefined ? '' : delta >= 0 ? 'var(--ok)' : 'var(--err)';
  const deltaSign = delta !== undefined && delta > 0 ? '+' : '';

  return (
    <div style={{
      background: accent ? 'var(--ac)' : 'var(--sur)',
      border: `1px solid ${accent ? 'var(--ac-hover)' : 'var(--brd)'}`,
      borderRadius: 'var(--radius)',
      padding: '20px',
      display: 'flex', flexDirection: 'column', gap: '8px',
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 500, color: accent ? 'rgba(255,255,255,.8)' : 'var(--tx3)', lineHeight: 1.4 }}>
          {title}
        </span>
        {icon && (
          <span style={{
            fontSize: '18px', lineHeight: 1,
            background: accent ? 'rgba(255,255,255,.15)' : 'var(--ac-light)',
            padding: '6px', borderRadius: 'var(--radius-sm)',
          }}>
            {icon}
          </span>
        )}
      </div>
      <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-sans)', lineHeight: 1, color: accent ? '#fff' : 'var(--tx)' }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
        {delta !== undefined && (
          <span style={{ fontSize: '12px', fontWeight: 600, color: accent ? 'rgba(255,255,255,.9)' : deltaColor }}>
            {deltaSign}{delta}%
          </span>
        )}
        {sub && (
          <span style={{ fontSize: '12px', color: accent ? 'rgba(255,255,255,.7)' : 'var(--tx3)' }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}
