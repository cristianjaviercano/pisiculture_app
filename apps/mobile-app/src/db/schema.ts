import type { SQLiteDatabase } from 'expo-sqlite';

export async function initDB(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS session_local (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS usuarios_local (
      id        TEXT PRIMARY KEY,
      id_tenant TEXT NOT NULL,
      nombre    TEXT NOT NULL,
      email     TEXT NOT NULL,
      rol       TEXT NOT NULL,
      id_finca  TEXT,
      activo    INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS fincas_local (
      id           TEXT PRIMARY KEY,
      id_tenant    TEXT NOT NULL,
      nombre       TEXT NOT NULL,
      municipio    TEXT NOT NULL,
      departamento TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS estanques_local (
      id        TEXT PRIMARY KEY,
      id_finca  TEXT NOT NULL,
      id_tenant TEXT NOT NULL,
      nombre    TEXT NOT NULL,
      codigo_qr TEXT,
      volumen_m3 REAL,
      area_m2   REAL,
      tipo      TEXT NOT NULL DEFAULT 'tierra'
    );

    CREATE TABLE IF NOT EXISTS lotes_local (
      id          TEXT PRIMARY KEY,
      id_estanque TEXT NOT NULL,
      id_finca    TEXT NOT NULL,
      id_tenant   TEXT NOT NULL,
      especie     TEXT NOT NULL,
      nombre      TEXT NOT NULL,
      activo      INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evento_local (
      id          TEXT PRIMARY KEY,
      type        TEXT NOT NULL,
      id_lote     TEXT NOT NULL,
      id_tenant   TEXT NOT NULL,
      id_usuario  TEXT NOT NULL,
      ts          TEXT NOT NULL,
      payload     TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE INDEX IF NOT EXISTS idx_ev_lote ON evento_local(id_lote);
    CREATE INDEX IF NOT EXISTS idx_ev_ts   ON evento_local(ts);
    CREATE INDEX IF NOT EXISTS idx_ev_sync ON evento_local(sync_status);
  `);
}
