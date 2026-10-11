import type { Metadata } from 'next';
import Link from 'next/link';
import { ReqEstadoBadge, UrgenciaBadge } from '@/components/ui/Badge';
import { DEMO_REQUISICIONES, fmt } from '@/lib/demo-data';

export const metadata: Metadata = { title: 'Requisiciones' };

export default function RequisicionesPage() {
  const reqs = DEMO_REQUISICIONES;
  const pendientes = reqs.filter(r => r.estado === 'pendiente').length;

  const cell: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid var(--brd)',
    fontSize: '13px', color: 'var(--tx2)',
    verticalAlign: 'middle',
  };

  const th: React.CSSProperties = {
    padding: '10px 16px', textAlign: 'left',
    fontSize: '11px', fontWeight: 600, color: 'var(--tx3)',
    textTransform: 'uppercase', letterSpacing: '.05em',
    borderBottom: '1px solid var(--brd)',
    background: 'var(--bg)',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 600 }}>Requisiciones</h1>
          <p style={{ color: 'var(--tx3)', fontSize: '13px', marginTop: '2px' }}>
            {pendientes} pendiente{pendientes !== 1 ? 's' : ''} de aprobación
          </p>
        </div>
        <Link href="/compras/requisiciones/nueva" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '9px 16px', background: 'var(--ac)', color: '#fff',
          borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 600,
        }}>
          + Nueva requisición
        </Link>
      </div>

      <div style={{
        background: 'var(--sur)', border: '1px solid var(--brd)',
        borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Número</th>
              <th style={th}>Obra</th>
              <th style={th}>Descripción</th>
              <th style={th}>Urgencia</th>
              <th style={th}>Estado</th>
              <th style={th}>Solicitado por</th>
              <th style={th}>F. Requerida</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {reqs.map(req => (
              <tr key={req.id}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--ac-light)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={cell}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ac)' }}>
                    {req.numero}
                  </span>
                </td>
                <td style={{ ...cell, maxWidth: '160px' }}>
                  <span className="truncate" style={{ display: 'block' }}>{req.obra_nombre ?? '—'}</span>
                </td>
                <td style={{ ...cell, maxWidth: '200px' }}>
                  <span className="truncate" style={{ display: 'block' }}>{req.descripcion ?? '—'}</span>
                </td>
                <td style={cell}><UrgenciaBadge urgencia={req.urgencia} /></td>
                <td style={cell}><ReqEstadoBadge estado={req.estado} /></td>
                <td style={cell}>{req.solicitado_por_nombre ?? '—'}</td>
                <td style={{ ...cell, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  {req.fecha_requerida ? fmt.date(req.fecha_requerida) : '—'}
                </td>
                <td style={cell}>
                  {req.estado === 'pendiente' && (
                    <button style={{
                      padding: '4px 10px',
                      background: 'var(--ok-bg)', color: 'var(--ok)',
                      border: '1px solid var(--ok)', borderRadius: 'var(--radius-sm)',
                      fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    }}>
                      Aprobar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
