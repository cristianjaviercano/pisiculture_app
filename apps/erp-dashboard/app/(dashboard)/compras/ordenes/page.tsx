import type { Metadata } from 'next';
import { OcEstadoBadge } from '@/components/ui/Badge';
import { DEMO_ORDENES, fmt } from '@/lib/demo-data';

export const metadata: Metadata = { title: 'Órdenes de Compra' };

export default function OrdenesPage() {
  const ordenes = DEMO_ORDENES;

  const cell: React.CSSProperties = {
    padding: '12px 16px', borderBottom: '1px solid var(--brd)',
    fontSize: '13px', color: 'var(--tx2)', verticalAlign: 'middle',
  };
  const th: React.CSSProperties = {
    padding: '10px 16px', textAlign: 'left',
    fontSize: '11px', fontWeight: 600, color: 'var(--tx3)',
    textTransform: 'uppercase', letterSpacing: '.05em',
    borderBottom: '1px solid var(--brd)', background: 'var(--bg)',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 600 }}>Órdenes de Compra</h1>
          <p style={{ color: 'var(--tx3)', fontSize: '13px', marginTop: '2px' }}>
            {ordenes.filter(o => !o.firmado).length} pendiente(s) de firma
          </p>
        </div>
        <button style={{
          padding: '9px 16px', background: 'var(--ac)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-sm)',
          fontSize: '13px', fontWeight: 600, cursor: 'pointer',
        }}>
          + Nueva OC
        </button>
      </div>

      <div style={{
        background: 'var(--sur)', border: '1px solid var(--brd)',
        borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Número</th>
              <th style={th}>Proveedor</th>
              <th style={th}>Total</th>
              <th style={th}>Fecha emisión</th>
              <th style={th}>Estado</th>
              <th style={th}>Firma 1</th>
              <th style={th}>Firma 2</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map(oc => (
              <tr key={oc.id}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--ac-light)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={cell}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ac)' }}>{oc.numero}</span>
                </td>
                <td style={cell}>{oc.proveedor_nombre}</td>
                <td style={{ ...cell, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {fmt.currency(oc.total)}
                </td>
                <td style={{ ...cell, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  {fmt.date(oc.fecha_emision)}
                </td>
                <td style={cell}><OcEstadoBadge estado={oc.estado} /></td>
                <td style={cell}>
                  <span style={{ fontSize: '16px' }}>{oc.firmado ? '✅' : '⏳'}</span>
                </td>
                <td style={cell}>
                  <span style={{ fontSize: '16px' }}>{oc.contrafirmado ? '✅' : '⏳'}</span>
                </td>
                <td style={cell}>
                  {!oc.firmado && (
                    <button style={{
                      padding: '4px 10px',
                      background: 'var(--ac-light)', color: 'var(--ac)',
                      border: '1px solid var(--ac)', borderRadius: 'var(--radius-sm)',
                      fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    }}>
                      Firmar
                    </button>
                  )}
                  {oc.firmado && !oc.contrafirmado && (
                    <button style={{
                      padding: '4px 10px',
                      background: 'var(--ok-bg)', color: 'var(--ok)',
                      border: '1px solid var(--ok)', borderRadius: 'var(--radius-sm)',
                      fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    }}>
                      Contrafirmar
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
