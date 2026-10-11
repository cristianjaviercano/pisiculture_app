import type { Metadata } from 'next';
import Badge from '@/components/ui/Badge';
import { DEMO_ARTICULOS, fmt } from '@/lib/demo-data';

export const metadata: Metadata = { title: 'Inventario' };

export default function InventarioPage() {
  const articulos = DEMO_ARTICULOS;
  const criticos = articulos.filter(a => a.stock_actual <= a.stock_minimo);

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
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 600 }}>Inventario</h1>
          <p style={{ color: 'var(--tx3)', fontSize: '13px', marginTop: '2px' }}>
            {criticos.length} artículo{criticos.length !== 1 ? 's' : ''} con stock crítico
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{
            padding: '9px 14px',
            background: 'var(--ok-bg)', color: 'var(--ok)',
            border: '1px solid var(--ok)', borderRadius: 'var(--radius-sm)',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>
            + Entrada
          </button>
          <button style={{
            padding: '9px 14px',
            background: 'var(--warn-bg)', color: 'var(--warn)',
            border: '1px solid var(--warn)', borderRadius: 'var(--radius-sm)',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>
            Despacho a obra
          </button>
        </div>
      </div>

      {/* Alert */}
      {criticos.length > 0 && (
        <div style={{
          padding: '12px 16px', marginBottom: '20px',
          background: 'var(--err-bg)', borderLeft: '3px solid var(--err)',
          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
          fontSize: '13px', color: 'var(--err)',
        }}>
          ⚠️ Stock crítico: <strong>{criticos.map(a => a.nombre).join(', ')}</strong>
        </div>
      )}

      <div style={{
        background: 'var(--sur)', border: '1px solid var(--brd)',
        borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Código</th>
              <th style={th}>Artículo</th>
              <th style={th}>Unidad</th>
              <th style={th}>Stock actual</th>
              <th style={th}>Stock mínimo</th>
              <th style={th}>Precio promedio</th>
              <th style={th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {articulos.map(art => {
              const isCritico = art.stock_actual <= art.stock_minimo;
              return (
                <tr key={art.id}
                  style={{ background: isCritico ? 'rgba(150,48,42,.03)' : 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--ac-light)')}
                  onMouseLeave={e => (e.currentTarget.style.background = isCritico ? 'rgba(150,48,42,.03)' : 'transparent')}
                >
                  <td style={cell}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ac)' }}>{art.codigo}</span>
                  </td>
                  <td style={cell}>
                    <span style={{ fontWeight: 500, color: 'var(--tx)' }}>{art.nombre}</span>
                  </td>
                  <td style={cell}>{art.unidad}</td>
                  <td style={{ ...cell, fontFamily: 'var(--font-mono)', fontWeight: 600, color: isCritico ? 'var(--err)' : 'var(--ok)' }}>
                    {art.stock_actual}
                  </td>
                  <td style={{ ...cell, fontFamily: 'var(--font-mono)' }}>{art.stock_minimo}</td>
                  <td style={{ ...cell, fontFamily: 'var(--font-mono)' }}>{fmt.currency(art.precio_promedio)}</td>
                  <td style={cell}>
                    {isCritico
                      ? <Badge variant="err">Stock crítico</Badge>
                      : <Badge variant="ok">OK</Badge>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
