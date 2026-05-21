-- V007: Performance indexes and operational views

-- Composite index covering the hot query path in getAllSnapshots():
-- SELECT * FROM evento_operativo WHERE id_lote = ? ORDER BY ts ASC
CREATE INDEX idx_evento_lote_ts   ON evento_operativo(id_lote, ts);

-- Partial index used during sync: SELECT * WHERE id_lote=? AND type='pending'
-- (the existing idx_evento_sync covers sync_status='pending' globally;
--  this one accelerates per-lote pending counts)
CREATE INDEX idx_evento_lote_sync ON evento_operativo(id_lote, sync_status)
    WHERE sync_status = 'pending';

-- GIN index for JSONB payload lookups (correction evento_original_id, insumo id, etc.)
CREATE INDEX idx_evento_payload   ON evento_operativo USING gin(payload);

-- View: active lotes pre-joined with estanque + finca context.
-- Used by the web dashboard to avoid N×2 individual queries.
CREATE VIEW v_lote_activo AS
SELECT
    l.id,
    l.id_tenant,
    l.especie,
    l.estado,
    l.fecha_inicio,
    l.count_inicial,
    l.count_actual,
    l.peso_inicial_g,
    l.peso_actual_g,
    l.total_alimento_kg,
    l.unidad_costo_cop,
    l.retiro_activo,
    l.fecha_fin_retiro,
    e.id     AS id_estanque,
    e.nombre AS estanque_nombre,
    f.id     AS id_finca,
    f.nombre AS finca_nombre
FROM lotes     l
JOIN estanques e ON e.id = l.id_estanque
JOIN fincas    f ON f.id = l.id_finca
WHERE l.estado = 'activo';
