interface Props {
  value: number;   // 0-100
  size?: 'sm' | 'md';
  showLabel?: boolean;
  color?: string;
}

export default function ProgressBar({ value, size = 'md', showLabel = false, color }: Props) {
  const h = size === 'sm' ? 4 : 8;
  const pct = Math.min(100, Math.max(0, value));
  const bar = color ?? (pct >= 80 ? 'var(--ok)' : pct >= 50 ? 'var(--ac)' : 'var(--warn)');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, background: 'var(--sur2)', borderRadius: h, height: h, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: bar, borderRadius: h, transition: 'width .4s ease' }} />
      </div>
      {showLabel && (
        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--tx3)', minWidth: '36px', textAlign: 'right' }}>
          {pct.toFixed(0)}%
        </span>
      )}
    </div>
  );
}
