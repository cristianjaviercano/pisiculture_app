'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  permiso?: string;
}

interface NavGroup { label: string; items: NavItem[] }

const NAV: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '▦' },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { href: '/obras',                     label: 'Obras',          icon: '🏗', permiso: 'pm.obra.ver' },
      { href: '/compras/requisiciones',     label: 'Requisiciones',  icon: '📋', permiso: 'compras.requisicion.ver' },
      { href: '/compras/ordenes',           label: 'Órdenes de Compra', icon: '📄', permiso: 'compras.oc.ver' },
      { href: '/inventario',                label: 'Inventario',     icon: '📦', permiso: 'inventario.ver' },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { href: '/presupuesto',               label: 'Presupuesto',    icon: '💰', permiso: 'presupuesto.ver' },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { href: '/crm',                       label: 'CRM',            icon: '🤝', permiso: 'crm.ver' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin',                     label: 'Administración', icon: '⚙️', permiso: 'admin.full' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      flexShrink: 0,
      background: 'var(--sur)',
      borderRight: '1px solid var(--brd)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      zIndex: 40,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--brd)',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <div style={{
          width: 34, height: 34,
          background: 'var(--ac)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '16px', flexShrink: 0,
        }}>⬡</div>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: '14px', color: 'var(--tx)', lineHeight: 1.2 }}>
            ERP Modular
          </div>
          <div style={{ fontSize: '11px', color: 'var(--tx3)' }}>Constructora Zenith</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 0', flex: 1 }}>
        {NAV.map(group => (
          <div key={group.label} style={{ marginBottom: '4px' }}>
            <div style={{
              padding: '10px 20px 4px',
              fontSize: '10px', fontWeight: 700,
              color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '.08em',
            }}>
              {group.label}
            </div>
            {group.items.map(item => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href} href={item.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    padding: '7px 20px',
                    fontSize: '13px',
                    color: active ? 'var(--ac)' : 'var(--tx2)',
                    background: active ? 'var(--ac-light)' : 'transparent',
                    borderLeft: `2px solid ${active ? 'var(--ac)' : 'transparent'}`,
                    fontWeight: active ? 600 : 400,
                    transition: 'all .12s',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ fontSize: '15px', lineHeight: 1 }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--brd)' }}>
        <Link href="/login" style={{ fontSize: '12px', color: 'var(--tx3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>↩</span> Cerrar sesión
        </Link>
      </div>
    </aside>
  );
}
