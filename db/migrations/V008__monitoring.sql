-- V008: Operational monitoring views

-- Sync queue: pending events grouped by lote, for the ops dashboard
-- and alert triggers (e.g. "lote X has been offline for 3 days")
CREATE VIEW v_sync_pendiente AS
SELECT
    eo.id_tenant,
    eo.id_lote,
    l.especie,
    e.nombre          AS estanque,
    COUNT(*)          AS eventos_pendientes,
    MIN(eo.ts)        AS mas_antiguo,
    MAX(eo.ts)        AS mas_reciente,
    (NOW() - MIN(eo.ts)) AS tiempo_sin_sync
FROM evento_operativo eo
JOIN lotes     l ON l.id = eo.id_lote
JOIN estanques e ON e.id = l.id_estanque
WHERE eo.sync_status = 'pending'
GROUP BY eo.id_tenant, eo.id_lote, l.especie, e.nombre;

-- Active withdrawal periods: lotes currently under a medication withdrawal window.
-- DISTINCT ON returns the latest withdrawal record per lote (most restrictive end date).
CREATE VIEW v_retiro_vigente AS
SELECT DISTINCT ON (ai.id_lote)
    ai.id_lote,
    ai.id_tenant,
    l.especie,
    e.nombre                            AS estanque,
    i.nombre_producto,
    i.principio_activo,
    ai.fecha_aplicacion,
    ai.fecha_fin_retiro,
    (ai.fecha_fin_retiro - CURRENT_DATE) AS dias_restantes
FROM aplic_insumos ai
JOIN lotes     l ON l.id = ai.id_lote
JOIN estanques e ON e.id = l.id_estanque
JOIN insumos   i ON i.id = ai.id_insumo
WHERE ai.fecha_fin_retiro >= CURRENT_DATE
  AND l.estado = 'activo'
ORDER BY ai.id_lote, ai.fecha_fin_retiro DESC;
