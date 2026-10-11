'use client';
import { usePathname } from 'next/navigation';

const BREADCRUMBS: Record<string, string> = {
  '/dashboard':               'Dashboard',
  '/obras':                   'Obras',
  '/compras/requisiciones':   'Compras / Requisiciones',
  '/compras/ordenes':         'Compras / Órdenes de Compra',
  '/inventario':              'Inventario',
  '/presupuesto':             'Presupuesto',
  '/crm':                     'CRM',
  '/admin':                   'Administración',
};

interface Props {
  userName?: string;
  tenantNombre?: string;
}

export default function Topbar({ userName = 'Usuario', tenantNombre }: Props) {
  const pathname = usePathname();
  const crumb = Object.entries(BREADCRUMBS).find(([k]) => pathname.startsWith(k))?.[1] ?? pathname;

  return (
    <header style={{
      height: 'var(--topbar-h)',
      background: 'var(--sur)',
      borderBottom: '1px solid var(--brd)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px',
      gap: '12px',
      position: 'sticky', top: 0, zIndex: 30,
    }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--tx)' }}>{crumb}</span>
      </div>

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--tx)' }}>{userName}</div>
          {tenantNombre && <div style={{ fontSize: '11px', color: 'var(--tx3)' }}>{tenantNombre}</div>}
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--ac)',
          color: '#fff', fontWeight: 700, fontSize: '13px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
