import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{
        flex: 1,
        marginLeft: 'var(--sidebar-w)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        minWidth: 0,
      }}>
        <Topbar userName={session.nombre} tenantNombre={session.tenant_nombre} />
        <main style={{ flex: 1, padding: '28px 32px', maxWidth: '1200px', width: '100%' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
