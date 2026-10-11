import type { Metadata } from 'next';
import Link from 'next/link';
import { ObraEstadoBadge } from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { DEMO_OBRAS, fmt } from '@/lib/demo-data';

export const metadata: Metadata = { title: 'Obras' };

export default function ObrasPage() {
  const obras = DEMO_OBRAS;

  const cell: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid var(--brd)',
    fontSize: '13px',
    color: 'var(--tx2)',
    verticalAlign: 'middle',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 600 }}>Obras</h1>
          <p style={{ color: 'var(--tx3)', fontSize: '13px', marginTop: '2px' }}>
            {obras.length} proyectos registrados
          </p>
        </div>
        <Link href="/obras/nuevo" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '9px 16px',
          background: 'var(--ac)', color: '#fff',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px', fontWeight: 600,
          textDecoration: 'none',
        }}>
          + Nueva obra
        </Link>
      </div>

      {/* Table card */}
      <div style={{
        background: 'var(--sur)', border: '1px solid var(--brd)',
        borderRadius: 'var(--radius)', overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg)' }}>
              {['Código', 'Obra', 'Cliente', 'Valor contrato', 'Avance', 'Estado', 'Jefe de obra', ''].map(h => (
                <th key={h} style={{
                  padding: '10px 16px', textAlign: 'left',
                  fontSize: '11px', fontWeight: 600, color: 'var(--tx3)',
                  textTransform: 'uppercase', letterSpacing: '.05em',
                  borderBottom: '1px solid var(--brd)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {obras.map(obra => (
              <tr key={obra.id} style={{ transition: 'background .1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--ac-light)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ ...cell }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ac)' }}>
                    {obra.codigo}
                  </span>
                </td>
                <td style={{ ...cell, maxWidth: '220px' }}>
                  <div style={{ fontWeight: 500, color: 'var(--tx)' }} className="truncate">{obra.nombre}</div>
                </td>
                <td style={{ ...cell }}>{obra.cliente}</td>
                <td style={{ ...cell, fontFamily: 'var(--font-mono)' }}>
                  {fmt.currency(obra.valor_contrato)}
                </td>
                <td style={{ ...cell, minWidth: '120px' }}>
                  <ProgressBar value={obra.porcentaje_avance} size="sm" showLabel />
                </td>
                <td style={{ ...cell }}>
                  <ObraEstadoBadge estado={obra.estado} />
                </td>
                <td style={{ ...cell }}>{obra.jefe_obra_nombre ?? '—'}</td>
                <td style={{ ...cell }}>
                  <Link href={`/obras/${obra.id}`} style={{ color: 'var(--ac)', fontSize: '12px', fontWeight: 500 }}>
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
