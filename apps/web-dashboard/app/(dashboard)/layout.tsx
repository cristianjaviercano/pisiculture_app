import Link from 'next/link';
import { LogoutButton } from './LogoutButton';

const NAV = [
  { href: '/dashboard',         label: '🏠 Dashboard' },
  { href: '/dashboard/eventos', label: '📋 Eventos'   },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary-700 text-white px-6 py-3 flex items-center gap-6 shadow">
        <span className="text-xl font-bold">🐟 Aquashell</span>
        <nav className="flex gap-4 flex-1">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className="text-primary-100 hover:text-white text-sm font-medium transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </header>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
