-- V003: Tabla de eventos operativos — append-only (event sourcing)
-- NUNCA se editan ni borran: trigger aborta UPDATE/DELETE

CREATE TYPE sync_status AS ENUM ('pending', 'synced', 'conflict');
CREATE TYPE event_type AS ENUM (
    'LOTE_INICIADO',
    'AGUA_REGISTRADA',
    'ALIMENTO_SUMINISTRADO',
    'MORTALIDAD_REGISTRADA',
    'MUESTREO_BIOMETRICO',
    'INSUMO_APLICADO',
    'LOTE_COSECHADO',
    'CORRECCION_REGISTRADA'
);

CREATE TABLE evento_operativo (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type         event_type NOT NULL,
    id_lote      UUID NOT NULL REFERENCES lotes(id),
    id_tenant    UUID NOT NULL REFERENCES tenants(id),
    id_usuario   UUID NOT NULL REFERENCES usuarios(id),
    ts           TIMESTAMPTZ NOT NULL DEFAULT now(),
    payload      JSONB NOT NULL,
    sync_status  sync_status NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger de inmutabilidad: prohíbe UPDATE y DELETE
CREATE OR REPLACE FUNCTION abort_on_mutate()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION
        'evento_operativo es append-only. Una corrección debe ser un nuevo evento CORRECCION_REGISTRADA. (id=%)', OLD.id;
END;
$$;

CREATE TRIGGER tg_evento_immutable
    BEFORE UPDATE OR DELETE ON evento_operativo
    FOR EACH ROW EXECUTE FUNCTION abort_on_mutate();

CREATE INDEX idx_evento_lote      ON evento_operativo(id_lote);
CREATE INDEX idx_evento_tenant    ON evento_operativo(id_tenant);
CREATE INDEX idx_evento_ts        ON evento_operativo(ts);
CREATE INDEX idx_evento_type      ON evento_operativo(type);
CREATE INDEX idx_evento_sync      ON evento_operativo(sync_status) WHERE sync_status = 'pending';

ALTER TABLE evento_operativo ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON evento_operativo
    USING (id_tenant = current_setting('app.tenant_id', true)::uuid);
