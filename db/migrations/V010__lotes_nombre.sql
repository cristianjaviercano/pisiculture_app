-- V010: Add nombre column to lotes
-- Omitted from V002; required by crearLoteAction (web), pullMasterData (mobile sync),
-- and the dashboard breadcrumbs. Without this column both INSERT and SELECT fail in production.

ALTER TABLE lotes ADD COLUMN nombre TEXT;

-- Backfill existing rows so the column is never null in practice
UPDATE lotes l
SET nombre = e.nombre || ' · ' || l.especie
FROM estanques e
WHERE e.id = l.id_estanque AND l.nombre IS NULL;
