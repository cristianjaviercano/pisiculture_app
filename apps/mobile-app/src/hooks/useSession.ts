import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect, useCallback } from 'react';

export interface SessionUser {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  id_tenant: string;
  id_finca: string | null;
}

export function useSession() {
  const db = useSQLiteContext();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM session_local WHERE key='current_user'"
    );
    setUser(row ? (JSON.parse(row.value) as SessionUser) : null);
    setLoading(false);
  }, [db]);

  useEffect(() => { void loadSession(); }, [loadSession]);

  async function login(email: string): Promise<boolean> {
    const u = await db.getFirstAsync<SessionUser>(
      'SELECT id,nombre,email,rol,id_tenant,id_finca FROM usuarios_local WHERE email=? AND activo=1',
      [email]
    );
    if (!u) return false;
    await db.runAsync(
      "INSERT OR REPLACE INTO session_local VALUES ('current_user',?)",
      [JSON.stringify(u)]
    );
    setUser(u);
    return true;
  }

  async function logout(): Promise<void> {
    await db.runAsync("DELETE FROM session_local WHERE key='current_user'");
    setUser(null);
  }

  return { user, loading, login, logout };
}
