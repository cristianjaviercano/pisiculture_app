-- V006: Supabase auth integration
-- Maps auth.users (Supabase JWT) → usuarios → tenants for RLS with the anon key.
-- Previously RLS used current_setting('app.tenant_id') which requires an explicit GUC
-- per connection (only works with the service role). This migration replaces that
-- pattern with auth.uid()-based lookup so the anon key enforces tenant isolation.

-- Link each app user to their Supabase auth identity
ALTER TABLE usuarios
    ADD COLUMN auth_uid UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_usuarios_auth_uid ON usuarios(auth_uid);

-- Stable helper: resolves the tenant for the current JWT bearer
CREATE FUNCTION fn_get_tenant_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
    SELECT id_tenant FROM usuarios WHERE auth_uid = auth.uid() LIMIT 1;
$$;

-- Replace current_setting-based policies (required explicit GUC, not viable for anon key)
-- with fn_get_tenant_id() which reads from the JWT automatically.

ALTER POLICY tenant_isolation ON tenants
    USING (id = fn_get_tenant_id());

ALTER POLICY tenant_isolation ON usuarios
    USING (id_tenant = fn_get_tenant_id());

ALTER POLICY tenant_isolation ON fincas
    USING (id_tenant = fn_get_tenant_id());

ALTER POLICY tenant_isolation ON estanques
    USING (id_tenant = fn_get_tenant_id());

ALTER POLICY tenant_isolation ON lotes
    USING (id_tenant = fn_get_tenant_id());

ALTER POLICY tenant_isolation ON evento_operativo
    USING (id_tenant = fn_get_tenant_id());

ALTER POLICY tenant_isolation ON aplic_insumos
    USING (id_tenant = fn_get_tenant_id());

-- Insumos: global catalogue (id_tenant IS NULL) visible to all; tenant items scoped
DROP POLICY insumo_visibility ON insumos;
CREATE POLICY insumo_visibility ON insumos
    USING (
        id_tenant IS NULL
        OR id_tenant = fn_get_tenant_id()
    );
