import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'ERP Modular', template: '%s · ERP Modular' },
  description: 'Sistema ERP modular para empresas constructoras',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
