import type { SQLiteDatabase } from 'expo-sqlite';

const T_ID  = 'a0000000-0000-0000-0000-000000000001';
const F1_ID = 'b0000000-0000-0000-0000-000000000001';
const E1_ID = 'c0000000-0000-0000-0000-000000000001';
const E2_ID = 'c0000000-0000-0000-0000-000000000002';
const L1_ID = 'd0000000-0000-0000-0000-000000000001';
const L2_ID = 'd0000000-0000-0000-0000-000000000002';
const U_OP  = 'e0000000-0000-0000-0000-000000000001';
const U_CO  = 'e0000000-0000-0000-0000-000000000002';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export async function seedIfEmpty(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM usuarios_local'
  );
  if (row && row.count > 0) return;

  await db.runAsync(
    'INSERT OR IGNORE INTO fincas_local VALUES (?,?,?,?,?)',
    [F1_ID, T_ID, 'La Esperanza', 'Espinal', 'Tolima']
  );

  await db.runAsync(
    'INSERT OR IGNORE INTO usuarios_local VALUES (?,?,?,?,?,?,?)',
    [U_OP, T_ID, 'Carlos Medina', 'operario@aquashell.co', 'operario', F1_ID, 1]
  );
  await db.runAsync(
    'INSERT OR IGNORE INTO usuarios_local VALUES (?,?,?,?,?,?,?)',
    [U_CO, T_ID, 'Laura Ospina', 'coordinador@aquashell.co', 'coordinador', null, 1]
  );

  await db.runAsync(
    'INSERT OR IGNORE INTO estanques_local VALUES (?,?,?,?,?,?,?,?)',
    [E1_ID, F1_ID, T_ID, 'Estanque 1-A', 'AQ-F1-001', 120, 400, 'tierra']
  );
  await db.runAsync(
    'INSERT OR IGNORE INTO estanques_local VALUES (?,?,?,?,?,?,?,?)',
    [E2_ID, F1_ID, T_ID, 'Estanque 1-B', 'AQ-F1-002', 120, 400, 'tierra']
  );

  await db.runAsync(
    'INSERT OR IGNORE INTO lotes_local VALUES (?,?,?,?,?,?,?,?)',
    [L1_ID, E1_ID, F1_ID, T_ID, 'tilapia_nilotica', 'Lote 1-A', 1, daysAgo(68)]
  );
  await db.runAsync(
    'INSERT OR IGNORE INTO lotes_local VALUES (?,?,?,?,?,?,?,?)',
    [L2_ID, E2_ID, F1_ID, T_ID, 'tilapia_nilotica', 'Lote 1-B', 1, daysAgo(42)]
  );

  const events = [
    {
      id: 'seed-ev-001', type: 'LOTE_INICIADO', id_lote: L1_ID,
      ts: daysAgo(68), sync_status: 'synced',
      payload: { especie: 'tilapia_nilotica', count_inicial: 1200,
        peso_inicial_g: 5, id_estanque: E1_ID, id_finca: F1_ID, unidad_costo_cop: 350 },
    },
    {
      id: 'seed-ev-002', type: 'MUESTREO_BIOMETRICO', id_lote: L1_ID,
      ts: daysAgo(38), sync_status: 'synced',
      payload: { pesos_g: Array.from({ length: 20 }, (_, i) => 90 + i * 3),
        peso_promedio_g: 118.5, cv_pct: 9.2, valid: true, n: 20 },
    },
    {
      id: 'seed-ev-003', type: 'MORTALIDAD_REGISTRADA', id_lote: L1_ID,
      ts: daysAgo(50), sync_status: 'synced',
      payload: { cantidad: 12, causa_presunta: 'hipoxia' },
    },
    {
      id: 'seed-ev-004', type: 'ALIMENTO_SUMINISTRADO', id_lote: L1_ID,
      ts: daysAgo(0), sync_status: 'pending',
      payload: { kg_suministrado: 2.5, lmax_kg: 3.2, n_raciones: 2, temperatura_agua: 27 },
    },
    {
      id: 'seed-ev-005', type: 'LOTE_INICIADO', id_lote: L2_ID,
      ts: daysAgo(42), sync_status: 'synced',
      payload: { especie: 'tilapia_nilotica', count_inicial: 1000,
        peso_inicial_g: 8, id_estanque: E2_ID, id_finca: F1_ID, unidad_costo_cop: 350 },
    },
    {
      id: 'seed-ev-006', type: 'MUESTREO_BIOMETRICO', id_lote: L2_ID,
      ts: daysAgo(12), sync_status: 'synced',
      payload: { pesos_g: Array.from({ length: 15 }, (_, i) => 55 + i * 2),
        peso_promedio_g: 69, cv_pct: 11.3, valid: true, n: 15 },
    },
  ] as const;

  for (const ev of events) {
    await db.runAsync(
      'INSERT OR IGNORE INTO evento_local VALUES (?,?,?,?,?,?,?,?)',
      [ev.id, ev.type, ev.id_lote, T_ID, U_OP, ev.ts, JSON.stringify(ev.payload), ev.sync_status]
    );
  }
}
