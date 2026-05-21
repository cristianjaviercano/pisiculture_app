import type { SQLiteDatabase } from 'expo-sqlite';
import { getSupabase } from './supabaseClient';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline' | 'unconfigured';

export interface SyncResult {
  pushed: number;
  failed: number;
  error?: string;
}

interface RawEvent {
  id: string;
  type: string;
  id_lote: string;
  id_tenant: string;
  id_usuario: string;
  ts: string;
  payload: string;
  sync_status: string;
}

async function isOnline(): Promise<boolean> {
  try {
    const r = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      cache: 'no-store',
    });
    return r.status === 204 || r.ok;
  } catch {
    return false;
  }
}

export async function syncPendingEvents(db: SQLiteDatabase): Promise<SyncResult> {
  const supabase = getSupabase();
  if (!supabase) return { pushed: 0, failed: 0, error: 'Supabase no configurado' };

  const online = await isOnline();
  if (!online) return { pushed: 0, failed: 0, error: 'Sin conexión a Internet' };

  const pending = await db.getAllAsync<RawEvent>(
    "SELECT * FROM evento_local WHERE sync_status='pending' ORDER BY ts ASC LIMIT 100"
  );

  let pushed = 0;
  let failed = 0;

  for (const raw of pending) {
    const { error } = await supabase.from('evento_operativo').upsert(
      {
        id:          raw.id,
        type:        raw.type,
        id_lote:     raw.id_lote,
        id_tenant:   raw.id_tenant,
        id_usuario:  raw.id_usuario,
        ts:          raw.ts,
        payload:     JSON.parse(raw.payload),
        sync_status: 'synced',
      },
      { onConflict: 'id' }
    );

    if (error) {
      failed++;
    } else {
      await db.runAsync(
        "UPDATE evento_local SET sync_status='synced' WHERE id=?",
        [raw.id]
      );
      pushed++;
    }
  }

  return { pushed, failed };
}

export async function pullMasterData(db: SQLiteDatabase): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  // Pull lotes activos del tenant (usando app.tenant_id de la sesión local)
  const sessionRow = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM session_local WHERE key='current_user'"
  );
  if (!sessionRow) return;

  const user = JSON.parse(sessionRow.value) as { id_tenant: string };

  const { data: lotes } = await supabase
    .from('lotes')
    .select('id, id_estanque, id_finca, id_tenant, especie, estado, created_at')
    .eq('id_tenant', user.id_tenant)
    .eq('estado', 'activo');

  if (lotes) {
    for (const l of lotes) {
      await db.runAsync(
        `INSERT OR IGNORE INTO lotes_local
           (id, id_estanque, id_finca, id_tenant, especie, nombre, activo, created_at)
         VALUES (?,?,?,?,?,?,?,?)`,
        [l.id, l.id_estanque, l.id_finca, l.id_tenant,
         l.especie, `Lote ${l.id.slice(0, 8)}`, 1,
         l.created_at ?? new Date().toISOString()]
      );
    }
  }
}
