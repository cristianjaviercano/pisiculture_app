import type { Metadata } from 'next';
import Badge from '@/components/ui/Badge';

export const metadata: Metadata = { title: 'Administración' };

const MODULOS = [
  { codigo: 'usuarios', nombre: 'Usuarios & Roles', activo: true, core: true, descripcion: 'Autenticación, roles y permisos' },
  { codigo: 'pm', nombre: 'Project Management', activo: true, core: true, descripcion: 'Obras, hitos, actividades de campo' },
  { codigo: 'auditoria', nombre: 'Auditoría', activo: true, core: true, descripcion: 'Log inmutable de todas las acciones' },
  { codigo: 'compras', nombre: 'Compras', activo: true, core: false, descripcion: 'Requisiciones y órdenes de compra' },
  { codigo: 'inventario', nombre: 'Inventario', activo: true, core: false, descripcion: 'Kardex, entradas y despachos' },
  { codigo: 'presupuesto', nombre: 'Presupuesto', activo: true, core: false, descripcion: 'Partidas, ejecución y prorrateo' },
  { codigo: 'crm', nombre: 'CRM', activo: false, core: false, descripcion: 'Pipeline de oportunidades y clientes' },
  { codigo: 'nomina', nombre: 'Nómina', activo: false, core: false, descripcion: 'Liquidación y gestión de personal' },
  { codigo: 'contabilidad', nombre: 'Contabilidad', activo: false, core: false, descripcion: 'Plan de cuentas y estados financieros' },
];

export default function AdminPage() {
  const activos = MODULOS.filter(m => m.activo).length;

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 600, marginBottom: '4px' }}>
        Administración
      </h1>
      <p style={{ color: 'var(--tx3)', fontSize: '13px', marginBottom: '28px' }}>
        {activos} de {MODULOS.length} módulos activos
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        {MODULOS.map(mod => (
          <div key={mod.codigo} style={{
            background: 'var(--sur)', border: `1px solid ${mod.activo ? 'var(--brd)' : 'var(--brd)'}`,
            borderRadius: 'var(--radius)', padding: '16px',
            boxShadow: 'var(--shadow-sm)',
            opacity: mod.activo ? 1 : 0.65,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--tx)' }}>{mod.nombre}</div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '8px' }}>
                {mod.core && <Badge variant="inf">Core</Badge>}
                {mod.activo
                  ? <Badge variant="ok">Activo</Badge>
                  : <Badge variant="neutral">Inactivo</Badge>
                }
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--tx3)', marginBottom: '12px' }}>{mod.descripcion}</p>
            {!mod.core && (
              <button style={{
                padding: '4px 10px', fontSize: '11px', fontWeight: 600,
                cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                border: `1px solid ${mod.activo ? 'var(--err)' : 'var(--ok)'}`,
                background: mod.activo ? 'var(--err-bg)' : 'var(--ok-bg)',
                color: mod.activo ? 'var(--err)' : 'var(--ok)',
              }}>
                {mod.activo ? 'Desactivar' : 'Activar'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
