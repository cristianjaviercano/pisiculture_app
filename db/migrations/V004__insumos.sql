-- V004: Catálogo de insumos y aplicaciones (medicamentos, acondicionadores)

CREATE TABLE insumos (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_tenant            UUID REFERENCES tenants(id),   -- NULL = catálogo global
    nombre_producto      TEXT NOT NULL,
    principio_activo     TEXT NOT NULL,
    tipo                 TEXT NOT NULL CHECK (tipo IN ('medicamento','acondicionador','probiotico','fertilizante','otro')),
    registro_ica         TEXT,
    periodo_retiro_dias  INTEGER NOT NULL DEFAULT 0 CHECK (periodo_retiro_dias >= 0),
    unidad_medida        TEXT NOT NULL,
    dosis_referencia     TEXT,
    activo               BOOLEAN NOT NULL DEFAULT true,
    nivel_catalogo       TEXT NOT NULL DEFAULT 'global'
                         CHECK (nivel_catalogo IN ('global','tenant')),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vista de aplicaciones (los eventos INSUMO_APLICADO en evento_operativo son la fuente de verdad;
-- esta tabla es una proyección desnormalizada para consultas rápidas de retiro)
CREATE TABLE aplic_insumos (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_evento            UUID NOT NULL REFERENCES evento_operativo(id),
    id_lote              UUID NOT NULL REFERENCES lotes(id),
    id_insumo            UUID NOT NULL REFERENCES insumos(id),
    id_tenant            UUID NOT NULL REFERENCES tenants(id),
    cantidad_aplicada    NUMERIC(10,3) NOT NULL,
    unidad               TEXT NOT NULL,
    motivo_aplicacion    TEXT NOT NULL,
    fecha_aplicacion     DATE NOT NULL,
    periodo_retiro_dias  INTEGER NOT NULL DEFAULT 0,
    fecha_fin_retiro     DATE,
    notas                TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_insumos_tenant    ON insumos(id_tenant);
CREATE INDEX idx_aplic_lote        ON aplic_insumos(id_lote);
CREATE INDEX idx_aplic_retiro      ON aplic_insumos(fecha_fin_retiro) WHERE fecha_fin_retiro IS NOT NULL;

ALTER TABLE insumos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE aplic_insumos ENABLE ROW LEVEL SECURITY;

-- Insumos globales son visibles por todos; los de tenant, solo por su tenant
CREATE POLICY insumo_visibility ON insumos
    USING (
        id_tenant IS NULL
        OR id_tenant = current_setting('app.tenant_id', true)::uuid
    );

CREATE POLICY tenant_isolation ON aplic_insumos
    USING (id_tenant = current_setting('app.tenant_id', true)::uuid);
