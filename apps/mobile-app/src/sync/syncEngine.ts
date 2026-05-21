import type { SQLiteDatabase } from 'expo-sqlite';
import { getSupabase } from './supabaseClient';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline' | 'unconfigured';

export interface SyncResult {
  pushed: number;
  failed: number;
  pulled: number;
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

  // Pull remote events not yet in local DB (events created on other devices)
  const pulled = await pullRemoteEvents(db);

  return { pushed, failed, pulled };
}

async function pullRemoteEvents(db: SQLiteDatabase): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;

  const sessionRow = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM session_local WHERE key='current_user'"
  );
  if (!sessionRow) return 0;

  const user = JSON.parse(sessionRow.value) as { id_tenant: string };

  // Get local lote IDs to limit the pull scope
  const localLotes = await db.getAllAsync<{ id: string }>('SELECT id FROM lotes_local WHERE activo=1');
  const loteIds = localLotes.map(l => l.id);
  if (loteIds.length === 0) return 0;

  const { data: remoteEvents } = await supabase
    .from('evento_operativo')
    .select('id, type, id_lote, id_tenant, id_usuario, ts, payload')
    .in('id_lote', loteIds)
    .eq('id_tenant', user.id_tenant)
    .order('ts', { ascending: true });

  if (!remoteEvents?.length) return 0;

  let pulled = 0;
  for (const ev of remoteEvents) {
    const exists = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM evento_local WHERE id=?', [ev.id]
    );
    if (!exists) {
      await db.runAsync(
        'INSERT INTO evento_local VALUES (?,?,?,?,?,?,?,?)',
        [ev.id, ev.type, ev.id_lote, ev.id_tenant, ev.id_usuario,
         ev.ts, JSON.stringify(ev.payload), 'synced']
      );
      pulled++;
    }
  }
  return pulled;
}

export async function pullMasterData(db: SQLiteDatabase): Promise<{ lotes: number; estanques: number }> {
  const supabase = getSupabase();
  if (!supabase) return { lotes: 0, estanques: 0 };

  const sessionRow = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM session_local WHERE key='current_user'"
  );
  if (!sessionRow) return { lotes: 0, estanques: 0 };

  const user = JSON.parse(sessionRow.value) as { id_tenant: string };

  // Pull estanques
  let estanquesCount = 0;
  const { data: estanques } = await supabase
    .from('estanques')
    .select('id, id_finca, id_tenant, nombre, codigo_interno, area_m2, volumen_m3, tipo')
    .eq('id_tenant', user.id_tenant);

  if (estanques) {
    for (const e of estanques) {
      const exists = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM estanques_local WHERE id=?', [e.id]
      );
      if (!exists) {
        await db.runAsync(
          'INSERT INTO estanques_local VALUES (?,?,?,?,?,?,?,?)',
          [e.id, e.id_finca, e.id_tenant, e.nombre,
           e.codigo_interno ?? '', e.area_m2 ?? 0, e.volumen_m3 ?? 0, e.tipo ?? 'tierra']
        );
        estanquesCount++;
      }
    }
  }

  // Pull active lotes
  let lotesCount = 0;
  const { data: lotes } = await supabase
    .from('lotes')
    .select('id, id_estanque, id_finca, id_tenant, especie, nombre, estado, created_at')
    .eq('id_tenant', user.id_tenant)
    .eq('estado', 'activo');

  if (lotes) {
    for (const l of lotes) {
      const exists = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM lotes_local WHERE id=?', [l.id]
      );
      if (!exists) {
        await db.runAsync(
          'INSERT INTO lotes_local (id, id_estanque, id_finca, id_tenant, especie, nombre, activo, created_at) VALUES (?,?,?,?,?,?,?,?)',
          [l.id, l.id_estanque, l.id_finca, l.id_tenant,
           l.especie, l.nombre ?? `Lote ${l.id.slice(0, 8)}`, 1,
           l.created_at ?? new Date().toISOString()]
        );
        lotesCount++;
      }
    }
  }

  return { lotes: lotesCount, estanques: estanquesCount };
}
