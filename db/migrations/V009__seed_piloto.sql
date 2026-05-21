-- V009: Seed de datos piloto — dos fincas (Montería / Espinal)
-- Solo ejecutar en entornos dev/staging

DO $$
DECLARE
    t_id  UUID := 'a0000000-0000-0000-0000-000000000001';
    f1_id UUID := 'b0000000-0000-0000-0000-000000000001';
    f2_id UUID := 'b0000000-0000-0000-0000-000000000002';
    e1_id UUID := 'c0000000-0000-0000-0000-000000000001';
    e2_id UUID := 'c0000000-0000-0000-0000-000000000002';
    e3_id UUID := 'c0000000-0000-0000-0000-000000000003';
    l1_id UUID := 'd0000000-0000-0000-0000-000000000001';
    l2_id UUID := 'd0000000-0000-0000-0000-000000000002';
    u_op  UUID := 'e0000000-0000-0000-0000-000000000001';
    u_co  UUID := 'e0000000-0000-0000-0000-000000000002';
    u_ge  UUID := 'e0000000-0000-0000-0000-000000000003';
BEGIN

-- Tenant
INSERT INTO tenants (id, nombre, nit, perfil_conectividad)
VALUES (t_id, 'Piscícola Los Laureles S.A.S.', '900.123.456-7', 'estandar')
ON CONFLICT (id) DO NOTHING;

-- Fincas
INSERT INTO fincas (id, id_tenant, nombre, municipio, departamento, hectareas)
VALUES
    (f1_id, t_id, 'La Esperanza', 'Espinal',  'Tolima',  4.5),
    (f2_id, t_id, 'El Palmar',   'Montería', 'Córdoba', 8.0)
ON CONFLICT (id) DO NOTHING;

-- Usuarios (password_hash = bcrypt de '123')
INSERT INTO usuarios (id, id_tenant, nombre, email, rol, password_hash, id_finca)
VALUES
    (u_op, t_id, 'Carlos Medina',  'operario@aquashell.co',    'operario',    '$2b$10$placeholder_hash_op', f1_id),
    (u_co, t_id, 'Laura Ospina',   'coordinador@aquashell.co', 'coordinador', '$2b$10$placeholder_hash_co', NULL),
    (u_ge, t_id, 'Hernán Cárdenas','gerente@aquashell.co',     'gerente',     '$2b$10$placeholder_hash_ge', NULL)
ON CONFLICT (id_tenant, email) DO NOTHING;

-- Estanques finca 1
INSERT INTO estanques (id, id_finca, id_tenant, nombre, codigo_qr, volumen_m3, area_m2, tipo)
VALUES
    (e1_id, f1_id, t_id, 'Estanque 1-A', 'AQ-F1-001', 120, 400, 'tierra'),
    (e2_id, f1_id, t_id, 'Estanque 1-B', 'AQ-F1-002', 120, 400, 'tierra'),
    (e3_id, f1_id, t_id, 'Estanque 1-C', 'AQ-F1-003',  80, 260, 'geomembrana')
ON CONFLICT (id) DO NOTHING;

-- Lotes activos
INSERT INTO lotes (id, id_estanque, id_finca, id_tenant, especie, estado, fecha_inicio,
                   count_inicial, count_actual, peso_inicial_g, peso_actual_g,
                   total_alimento_kg, unidad_costo_cop)
VALUES
    (l1_id, e1_id, f1_id, t_id, 'tilapia_nilotica', 'activo',
     CURRENT_DATE - INTERVAL '68 days',
     1200, 1163, 5, 198, 142, 350),
    (l2_id, e2_id, f1_id, t_id, 'tilapia_nilotica', 'activo',
     CURRENT_DATE - INTERVAL '42 days',
     1000, 978, 8, 105, 74, 350)
ON CONFLICT (id) DO NOTHING;

-- Insumos globales
INSERT INTO insumos (nombre_producto, principio_activo, tipo, registro_ica, periodo_retiro_dias, unidad_medida, dosis_referencia, nivel_catalogo)
VALUES
    ('Florfenicol 50%',     'Florfenicol',        'medicamento',   'ICA-MVET-2021-0045', 12, 'g',  '10 mg/kg pv/día por 5 días', 'global'),
    ('Oxitetraciclina 20%', 'Oxitetraciclina',    'medicamento',   'ICA-MVET-2019-0123', 30, 'g',  '75 mg/kg pv/día por 10 días','global'),
    ('Cal Agrícola (CaO)',  'Óxido de calcio',    'acondicionador', NULL,                 0, 'kg', '50-100 kg/1000 m³',          'global'),
    ('Sal Marina NaCl',     'Cloruro de sodio',   'acondicionador', NULL,                 0, 'kg', '1-3 kg/m³',                  'global')
ON CONFLICT DO NOTHING;

-- Evento de inicio para lote 1
INSERT INTO evento_operativo (type, id_lote, id_tenant, id_usuario, ts, payload, sync_status)
VALUES (
    'LOTE_INICIADO', l1_id, t_id, u_co,
    (CURRENT_DATE - INTERVAL '68 days')::TIMESTAMPTZ,
    jsonb_build_object(
        'especie', 'tilapia_nilotica',
        'count_inicial', 1200,
        'peso_inicial_g', 5,
        'id_estanque', e1_id,
        'id_finca', f1_id,
        'unidad_costo_cop', 350
    ),
    'synced'
);

END $$;
