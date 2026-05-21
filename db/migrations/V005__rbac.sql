-- V005: RBAC — rol de aplicación con privilegios mínimos
-- El rol aquashell_app NUNCA puede UPDATE/DELETE en evento_operativo

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aquashell_app') THEN
        CREATE ROLE aquashell_app LOGIN PASSWORD 'change_in_production';
    END IF;
END $$;

-- Acceso de lectura al esquema
GRANT USAGE ON SCHEMA public TO aquashell_app;

-- Tablas de lectura/escritura normal
GRANT SELECT, INSERT, UPDATE ON tenants       TO aquashell_app;
GRANT SELECT, INSERT, UPDATE ON usuarios      TO aquashell_app;
GRANT SELECT, INSERT, UPDATE ON fincas        TO aquashell_app;
GRANT SELECT, INSERT, UPDATE ON estanques     TO aquashell_app;
GRANT SELECT, INSERT, UPDATE ON lotes         TO aquashell_app;
GRANT SELECT, INSERT, UPDATE ON insumos       TO aquashell_app;
GRANT SELECT, INSERT, UPDATE ON aplic_insumos TO aquashell_app;

-- evento_operativo: SOLO INSERT (append-only enforced also by trigger)
GRANT SELECT, INSERT ON evento_operativo TO aquashell_app;
REVOKE UPDATE, DELETE ON evento_operativo FROM aquashell_app;

-- Secuencias
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO aquashell_app;
