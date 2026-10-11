import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Iniciar sesión' };

export default function LoginPage() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a3d3d 0%, #0D6B6B 50%, #1a8585 100%)',
      padding: '16px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: '14px',
            background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)',
            marginBottom: '12px', fontSize: '26px',
          }}>⬡</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', color: '#fff', fontSize: '22px', fontWeight: 600 }}>
            ERP Modular
          </h1>
          <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '13px', marginTop: '4px' }}>
            Constructora Zenith S.A.S.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--sur)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,.25)',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
            Bienvenido
          </h2>
          <p style={{ color: 'var(--tx3)', fontSize: '13px', marginBottom: '24px' }}>
            Ingresa tus credenciales para continuar
          </p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
