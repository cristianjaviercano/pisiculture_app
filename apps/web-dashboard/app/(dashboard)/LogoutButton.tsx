'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <button
      onClick={() => void handleLogout()}
      className="text-primary-200 hover:text-white text-sm transition-colors"
    >
      Salir →
    </button>
  );
}
