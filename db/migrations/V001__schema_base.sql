-- V001: Esquema base — tenants, usuarios, fincas
-- Multi-tenant con RLS. Rol de aplicación: aquashell_app

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE tenants (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre       TEXT NOT NULL,
    nit          TEXT UNIQUE,
    perfil_conectividad TEXT NOT NULL DEFAULT 'estandar'
                  CHECK (perfil_conectividad IN ('estandar', 'bajo', 'sin_red')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE usuarios (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_tenant    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nombre       TEXT NOT NULL,
    email        TEXT NOT NULL,
    rol          TEXT NOT NULL CHECK (rol IN ('operario','coordinador','gerente','asesor','superadmin')),
    password_hash TEXT NOT NULL,
    id_finca     UUID,   -- fk añadido en V002 para evitar dependencia circular
    activo       BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (id_tenant, email)
);

CREATE TABLE fincas (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_tenant     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nombre        TEXT NOT NULL,
    municipio     TEXT NOT NULL,
    departamento  TEXT NOT NULL,
    hectareas     NUMERIC(8,2),
    activa        BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FK diferida: usuario puede estar asignado a una finca
ALTER TABLE usuarios
    ADD CONSTRAINT fk_usuario_finca
    FOREIGN KEY (id_finca) REFERENCES fincas(id) ON DELETE SET NULL;

-- Índices frecuentes
CREATE INDEX idx_usuarios_tenant ON usuarios(id_tenant);
CREATE INDEX idx_fincas_tenant   ON fincas(id_tenant);

-- RLS
ALTER TABLE tenants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE fincas   ENABLE ROW LEVEL SECURITY;

-- Políticas básicas: la app sólo ve su propio tenant
CREATE POLICY tenant_isolation ON tenants
    USING (id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON usuarios
    USING (id_tenant = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON fincas
    USING (id_tenant = current_setting('app.tenant_id', true)::uuid);
