import type { SQLiteDatabase } from 'expo-sqlite';
import type { OperationalEvent } from '@aquashell/shared';

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

function parseEvent(row: RawEvent): OperationalEvent {
  return {
    id: row.id,
    type: row.type,
    id_lote: row.id_lote,
    id_tenant: row.id_tenant,
    id_usuario: row.id_usuario,
    ts: row.ts,
    sync_status: row.sync_status,
    payload: JSON.parse(row.payload),
  } as OperationalEvent;
}

export async function getEventsForLote(
  db: SQLiteDatabase,
  id_lote: string,
): Promise<OperationalEvent[]> {
  const rows = await db.getAllAsync<RawEvent>(
    'SELECT * FROM evento_local WHERE id_lote = ? ORDER BY ts ASC',
    [id_lote],
  );
  return rows.map(parseEvent);
}

export async function saveEvent(
  db: SQLiteDatabase,
  event: OperationalEvent,
): Promise<void> {
  await db.runAsync(
    'INSERT INTO evento_local (id,type,id_lote,id_tenant,id_usuario,ts,payload,sync_status) VALUES (?,?,?,?,?,?,?,?)',
    [event.id, event.type, event.id_lote, event.id_tenant, event.id_usuario,
      event.ts, JSON.stringify(event.payload), event.sync_status],
  );
}

export async function getTodayFedKg(
  db: SQLiteDatabase,
  id_lote: string,
): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db.getAllAsync<{ payload: string }>(
    "SELECT payload FROM evento_local WHERE id_lote=? AND type='ALIMENTO_SUMINISTRADO' AND ts>=?",
    [id_lote, `${today}T00:00:00.000Z`],
  );
  return rows.reduce((sum, row) => {
    const p = JSON.parse(row.payload) as { kg_suministrado: number };
    return sum + p.kg_suministrado;
  }, 0);
}

export async function getPendingCount(
  db: SQLiteDatabase,
  id_lote: string,
): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM evento_local WHERE id_lote=? AND sync_status='pending'",
    [id_lote],
  );
  return row?.count ?? 0;
}
