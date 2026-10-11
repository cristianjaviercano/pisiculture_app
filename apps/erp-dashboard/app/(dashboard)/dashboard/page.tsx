import type { Metadata } from 'next';
import Link from 'next/link';
import KpiCard from '@/components/ui/KpiCard';
import ProgressBar from '@/components/ui/ProgressBar';
import { ObraEstadoBadge, ReqEstadoBadge } from '@/components/ui/Badge';
import { DEMO_KPIS, DEMO_OBRAS, DEMO_REQUISICIONES, fmt } from '@/lib/demo-data';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  const kpis = DEMO_KPIS;
  const obras = DEMO_OBRAS;
  const reqs = DEMO_REQUISICIONES;

  const heading: React.CSSProperties = {
    fontFamily: 'var(--font-serif)',
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--tx)',
    marginBottom: '12px',
  };

  const card: React.CSSProperties = {
    background: 'var(--sur)',
    border: '1px solid var(--brd)',
    borderRadius: 'var(--radius)',
    padding: '20px',
    boxShadow: 'var(--shadow-sm)',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 600, marginBottom: '4px' }}>
          Resumen ejecutivo
        </h1>
        <p style={{ color: 'var(--tx3)', fontSize: '13px' }}>
          Constructora Zenith S.A.S. · Octubre 2026
        </p>
      </div>

      {/* KPI grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '28px',
      }}>
        <KpiCard title="Obras activas" value={kpis.obras_activas} sub="en ejecución" icon="🏗" accent />
        <KpiCard title="Avance promedio" value={`${kpis.avance_promedio_obras}%`} delta={8} sub="vs. mes anterior" icon="📈" />
        <KpiCard title="Requisiciones" value={kpis.requisiciones_pendientes} sub="pendientes aprobación" icon="📋" />
        <KpiCard title="OC sin firmar" value={kpis.oc_pendientes_firma} sub="requieren firma" icon="📄" />
        <KpiCard title="Stock crítico" value={kpis.articulos_stock_critico} sub="artículos bajo mínimo" icon="⚠️" />
        <KpiCard title="Costo ejecutado" value={fmt.currency(kpis.costo_ejecutado_mes)} sub="en octubre" icon="💰" />
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* Obras activas */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={heading}>Obras</h2>
            <Link href="/obras" style={{ fontSize: '12px', color: 'var(--ac)' }}>Ver todas →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {obras.filter(o => o.estado === 'ejecucion').map(obra => (
              <div key={obra.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <Link href={`/obras/${obra.id}`} style={{ fontSize: '13px', fontWeight: 500, color: 'var(--tx)', display: 'block' }}>
                      {obra.nombre}
                    </Link>
                    <span style={{ fontSize: '11px', color: 'var(--tx3)' }}>{obra.codigo}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--tx2)' }}>
                    {obra.porcentaje_avance}%
                  </span>
                </div>
                <ProgressBar value={obra.porcentaje_avance} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Requisiciones recientes */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={heading}>Requisiciones recientes</h2>
            <Link href="/compras/requisiciones" style={{ fontSize: '12px', color: 'var(--ac)' }}>Ver todas →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {reqs.slice(0, 4).map(req => (
              <div key={req.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px',
                background: 'var(--bg)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--tx)' }}>
                    {req.numero}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--tx3)' }} className="truncate">
                    {req.descripcion}
                  </div>
                </div>
                <ReqEstadoBadge estado={req.estado} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertas */}
      <div style={card}>
        <h2 style={heading}>Alertas del sistema</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {kpis.oc_pendientes_firma > 0 && (
            <Alert variant="warn" icon="📄">
              {kpis.oc_pendientes_firma} órdenes de compra esperan{kpis.oc_pendientes_firma > 1 ? 'n' : ''} firma.{' '}
              <Link href="/compras/ordenes">Revisar →</Link>
            </Alert>
          )}
          {kpis.articulos_stock_critico > 0 && (
            <Alert variant="err" icon="📦">
              {kpis.articulos_stock_critico} artículos con stock por debajo del mínimo.{' '}
              <Link href="/inventario">Ver kardex →</Link>
            </Alert>
          )}
          {kpis.requisiciones_pendientes > 0 && (
            <Alert variant="inf" icon="📋">
              {kpis.requisiciones_pendientes} requisiciones pendientes de aprobación.{' '}
              <Link href="/compras/requisiciones">Aprobar →</Link>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}

function Alert({ variant, icon, children }: { variant: 'warn' | 'err' | 'inf'; icon: string; children: React.ReactNode }) {
  const colors = {
    warn: { bg: 'var(--warn-bg)', border: 'var(--warn)', color: 'var(--warn)' },
    err:  { bg: 'var(--err-bg)',  border: 'var(--err)',  color: 'var(--err)'  },
    inf:  { bg: 'var(--inf-bg)',  border: 'var(--inf)',  color: 'var(--inf)'  },
  };
  const c = colors[variant];
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '10px 14px',
      background: c.bg, borderLeft: `3px solid ${c.border}`,
      borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
      fontSize: '13px', color: c.color,
    }}>
      <span>{icon}</span>
      <span>{children}</span>
    </div>
  );
}
