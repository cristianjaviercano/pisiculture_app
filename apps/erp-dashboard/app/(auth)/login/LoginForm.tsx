'use client';
import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'}/auth/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.detail ?? 'Credenciales incorrectas');
          return;
        }
        const { access, refresh } = await res.json();
        // Store tokens — httpOnly would be better; client cookie for MVP
        document.cookie = `erp_access=${access}; path=/; max-age=900; SameSite=Lax`;
        document.cookie = `erp_refresh=${refresh}; path=/; max-age=604800; SameSite=Lax`;
        localStorage.setItem('erp_access', access);
        const next = searchParams.get('next') ?? '/dashboard';
        router.push(next);
        router.refresh();
      } catch {
        setError('Error de conexión. Verifica la red.');
      }
    });
  }

  const input: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    border: '1px solid var(--brd)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '14px', color: 'var(--tx)',
    background: 'var(--bg)',
    outline: 'none', transition: 'border .15s',
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--tx2)' }}>
          Correo electrónico
        </label>
        <input
          type="email" required autoComplete="email"
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder="usuario@empresa.com"
          style={input}
          onFocus={e => (e.target.style.borderColor = 'var(--ac)')}
          onBlur={e => (e.target.style.borderColor = 'var(--brd)')}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--tx2)' }}>
          Contraseña
        </label>
        <input
          type="password" required autoComplete="current-password"
          value={password} onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          style={input}
          onFocus={e => (e.target.style.borderColor = 'var(--ac)')}
          onBlur={e => (e.target.style.borderColor = 'var(--brd)')}
        />
      </div>

      {error && (
        <div style={{
          padding: '10px 12px', borderRadius: 'var(--radius-sm)',
          background: 'var(--err-bg)', color: 'var(--err)',
          fontSize: '13px', marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      <button
        type="submit" disabled={isPending}
        style={{
          width: '100%', padding: '11px',
          background: isPending ? 'var(--tx4)' : 'var(--ac)',
          color: '#fff', border: 'none',
          borderRadius: 'var(--radius-sm)',
          fontSize: '14px', fontWeight: 600,
          transition: 'background .15s',
          cursor: isPending ? 'not-allowed' : 'pointer',
        }}
      >
        {isPending ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  );
}
