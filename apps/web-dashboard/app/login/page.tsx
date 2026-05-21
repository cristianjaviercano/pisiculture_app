import { LoginForm } from './LoginForm';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export default function LoginPage() {
  const configured = isSupabaseConfigured();
  return (
    <div className="min-h-screen bg-primary-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🐟</div>
          <h1 className="text-2xl font-bold text-primary-700">Aquashell</h1>
          <p className="text-gray-500 text-sm mt-1">Dashboard de control piscícola</p>
        </div>

        {!configured ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-amber-700 font-semibold text-sm">⚙️ Supabase no configurado</p>
            <p className="text-amber-600 text-xs mt-1">
              Define <code>NEXT_PUBLIC_SUPABASE_URL</code> y{' '}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en <code>.env.local</code>
            </p>
            <a
              href="/dashboard"
              className="mt-3 inline-block bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              Entrar sin auth (demo)
            </a>
          </div>
        ) : (
          <LoginForm />
        )}
      </div>
    </div>
  );
}
