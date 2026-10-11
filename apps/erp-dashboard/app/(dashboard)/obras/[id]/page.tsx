import type { Metadata } from 'next';
import Link from 'next/link';
import KpiCard from '@/components/ui/KpiCard';
import ProgressBar from '@/components/ui/ProgressBar';
import { ObraEstadoBadge } from '@/components/ui/Badge';
import { DEMO_OBRAS, DEMO_HITOS, fmt } from '@/lib/demo-data';
import { notFound } from 'next/navigation';

export const metadata: Metadata = { title: 'Detalle obra' };

export default function ObraDetailPage({ params }: { params: { id: string } }) {
  const obra = DEMO_OBRAS.find(o => o.id === params.id);
  if (!obra) notFound();

  const hitos = DEMO_HITOS;
  const card: React.CSSProperties = {
    background: 'var(--sur)', border: '1px solid var(--brd)',
    borderRadius: 'var(--radius)', padding: '20px',
    boxShadow: 'var(--shadow-sm)',
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: '12px', color: 'var(--tx3)', marginBottom: '16px' }}>
        <Link href="/obras" style={{ color: 'var(--ac)' }}>Obras</Link>
        {' / '}
        <span>{obra.codigo}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 600, marginBottom: '4px' }}>
            {obra.nombre}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ac)' }}>{obra.codigo}</span>
            <ObraEstadoBadge estado={obra.estado} />
            <span style={{ fontSize: '12px', color: 'var(--tx3)' }}>Jefe: {obra.jefe_obra_nombre}</span>
          </div>
        </div>
        <button style={{
          padding: '8px 14px', background: 'transparent',
          border: '1px solid var(--brd)', borderRadius: 'var(--radius-sm)',
          fontSize: '12px', color: 'var(--tx2)', cursor: 'pointer',
        }}>
          ✏️ Editar
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <KpiCard title="Valor contrato" value={fmt.currency(obra.valor_contrato)} icon="💰" accent />
        <KpiCard title="Avance real" value={`${obra.porcentaje_avance}%`} sub="ejecutado" icon="📊" />
        <KpiCard title="Fecha inicio" value={fmt.date(obra.fecha_inicio)} icon="📅" />
        <KpiCard title="Entrega estimada" value={fmt.date(obra.fecha_fin_proyectada)} icon="🏁" />
      </div>

      {/* Avance */}
      <div style={{ ...card, marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
          Avance del proyecto
        </h2>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: 'var(--tx3)' }}>
            <span>Avance real</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ok)', fontWeight: 600 }}>{obra.porcentaje_avance}%</span>
          </div>
          <ProgressBar value={obra.porcentaje_avance} color="var(--ok)" />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: 'var(--tx3)' }}>
            <span>Avance programado</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ac)', fontWeight: 600 }}>72%</span>
          </div>
          <ProgressBar value={72} color="var(--ac)" />
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Hitos */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 600 }}>Hitos</h2>
            <button style={{
              padding: '5px 10px', background: 'var(--ac)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-sm)',
              fontSize: '12px', cursor: 'pointer',
            }}>
              + Agregar
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {hitos.map(hito => (
              <div key={hito.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 12px',
                background: 'var(--bg)',
                borderRadius: 'var(--radius-sm)',
                opacity: hito.completado ? .7 : 1,
              }}>
                <span style={{ fontSize: '16px' }}>{hito.completado ? '✅' : '⭕'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '13px', fontWeight: 500, color: 'var(--tx)',
                    textDecoration: hito.completado ? 'line-through' : 'none',
                  }}>
                    {hito.nombre}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--tx3)' }}>
                    {hito.completado && hito.fecha_real
                      ? `Completado: ${fmt.date(hito.fecha_real)}`
                      : `Programado: ${fmt.date(hito.fecha_programada)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div style={card}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 600, marginBottom: '14px' }}>
            Información general
          </h2>
          {[
            ['Cliente', obra.cliente],
            ['Jefe de obra', obra.jefe_obra_nombre ?? '—'],
            ['Fecha inicio', fmt.date(obra.fecha_inicio)],
            ['Fecha entrega', fmt.date(obra.fecha_fin_proyectada)],
            ['Valor contrato', fmt.currency(obra.valor_contrato)],
            ['Estado', obra.estado],
          ].map(([k, v]) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid var(--brd)',
              fontSize: '13px',
            }}>
              <span style={{ color: 'var(--tx3)' }}>{k}</span>
              <span style={{ color: 'var(--tx)', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
