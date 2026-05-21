-- V002: Estanques y lotes de cultivo

CREATE TABLE estanques (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_finca    UUID NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
    id_tenant   UUID NOT NULL REFERENCES tenants(id),
    nombre      TEXT NOT NULL,
    codigo_qr   TEXT UNIQUE,
    volumen_m3  NUMERIC(10,2),
    area_m2     NUMERIC(10,2),
    tipo        TEXT NOT NULL DEFAULT 'tierra'
                CHECK (tipo IN ('tierra','geomembrana','tanque','jaula')),
    activo      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lotes (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_estanque      UUID NOT NULL REFERENCES estanques(id),
    id_finca         UUID NOT NULL REFERENCES fincas(id),
    id_tenant        UUID NOT NULL REFERENCES tenants(id),
    especie          TEXT NOT NULL CHECK (especie IN ('tilapia_nilotica','cachama','trucha')),
    estado           TEXT NOT NULL DEFAULT 'activo'
                     CHECK (estado IN ('activo','cosechado','vacio','perdido')),
    fecha_inicio     DATE,
    count_inicial    INTEGER NOT NULL DEFAULT 0 CHECK (count_inicial >= 0),
    count_actual     INTEGER NOT NULL DEFAULT 0 CHECK (count_actual >= 0),
    peso_inicial_g   NUMERIC(8,2) NOT NULL DEFAULT 0,
    peso_actual_g    NUMERIC(8,2) NOT NULL DEFAULT 0,
    total_alimento_kg NUMERIC(10,3) NOT NULL DEFAULT 0,
    unidad_costo_cop  NUMERIC(10,2),
    retiro_activo    BOOLEAN NOT NULL DEFAULT false,
    fecha_fin_retiro DATE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_estanques_finca  ON estanques(id_finca);
CREATE INDEX idx_estanques_tenant ON estanques(id_tenant);
CREATE INDEX idx_lotes_estanque   ON lotes(id_estanque);
CREATE INDEX idx_lotes_tenant     ON lotes(id_tenant);
CREATE INDEX idx_lotes_estado     ON lotes(estado);

ALTER TABLE estanques ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes     ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON estanques
    USING (id_tenant = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON lotes
    USING (id_tenant = current_setting('app.tenant_id', true)::uuid);
