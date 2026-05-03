/**
 * AQUASHELL — db.js v3.0
 * IndexedDB multi-tenant — refleja el esquema de los TDDs
 * 11 object stores, seeder con datos realistas de prueba
 */

const DB_NAME    = 'aquashell_v3';
const DB_VERSION = 1;
let _db = null;

// ── Open / init DB ─────────────────────────────────────────
export function openDB() {
  return new Promise((resolve, reject) => {
    if (_db) return resolve(_db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const db = e.target.result;

      const stores = [
        { name: 'tenants',        keyPath: 'id' },
        { name: 'usuarios',       keyPath: 'id' },
        { name: 'fincas',         keyPath: 'id' },
        { name: 'estanques',      keyPath: 'id' },
        { name: 'lotes',          keyPath: 'id' },
        { name: 'registros_agua', keyPath: 'id' },
        { name: 'registros_alim', keyPath: 'id' },
        { name: 'registros_mort', keyPath: 'id' },
        { name: 'muestreos_bio',  keyPath: 'id' },
        { name: 'insumos',        keyPath: 'id' },
        { name: 'aplic_insumos',  keyPath: 'id' },
      ];

      stores.forEach(s => {
        if (!db.objectStoreNames.contains(s.name)) {
          const store = db.createObjectStore(s.name, { keyPath: s.keyPath });
          if (s.name === 'registros_agua' || s.name === 'registros_alim' || s.name === 'registros_mort') {
            store.createIndex('by_lote', 'id_lote');
            store.createIndex('by_date', 'fecha');
          }
          if (s.name === 'lotes') { store.createIndex('by_estanque', 'id_estanque'); store.createIndex('by_estado', 'estado'); }
          if (s.name === 'muestreos_bio') store.createIndex('by_lote', 'id_lote');
          if (s.name === 'aplic_insumos') store.createIndex('by_lote', 'id_lote');
          if (s.name === 'estanques') store.createIndex('by_finca', 'id_finca');
          if (s.name === 'fincas') store.createIndex('by_tenant', 'id_tenant');
          if (s.name === 'usuarios') store.createIndex('by_tenant', 'id_tenant');
        }
      });
    };

    req.onsuccess = e => { _db = e.target.result; resolve(_db); };
    req.onerror   = e => reject(e.target.error);
  });
}

// ── Generic helpers ─────────────────────────────────────────
function tx(store, mode = 'readonly') {
  return _db.transaction(store, mode).objectStore(store);
}

export function getAll(storeName) {
  return new Promise((res, rej) => {
    const req = tx(storeName).getAll();
    req.onsuccess = e => res(e.target.result || []);
    req.onerror   = e => rej(e.target.error);
  });
}

export function getById(storeName, id) {
  return new Promise((res, rej) => {
    const req = tx(storeName).get(id);
    req.onsuccess = e => res(e.target.result || null);
    req.onerror   = e => rej(e.target.error);
  });
}

export function put(storeName, record) {
  return new Promise((res, rej) => {
    const req = tx(storeName, 'readwrite').put(record);
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  });
}

export function getByIndex(storeName, indexName, value) {
  return new Promise((res, rej) => {
    const req = tx(storeName).index(indexName).getAll(value);
    req.onsuccess = e => res(e.target.result || []);
    req.onerror   = e => rej(e.target.error);
  });
}

export function del(storeName, id) {
  return new Promise((res, rej) => {
    const req = tx(storeName, 'readwrite').delete(id);
    req.onsuccess = () => res();
    req.onerror   = e => rej(e.target.error);
  });
}

// ── Typed getters ───────────────────────────────────────────
export const getTenants    = () => getAll('tenants');
export const getFincas     = (id_tenant) => getByIndex('fincas', 'by_tenant', id_tenant);
export const getEstanques  = (id_finca)  => getByIndex('estanques', 'by_finca', id_finca);
export const getLotesByEstanque = (id_e) => getByIndex('lotes', 'by_estanque', id_e);
export const getRegistrosAgua   = (id_lote) => getByIndex('registros_agua', 'by_lote', id_lote);
export const getRegistrosAlim   = (id_lote) => getByIndex('registros_alim', 'by_lote', id_lote);
export const getRegistrosMort   = (id_lote) => getByIndex('registros_mort', 'by_lote', id_lote);
export const getMuestreos  = (id_lote) => getByIndex('muestreos_bio', 'by_lote', id_lote);
export const getAplicaciones = (id_lote) => getByIndex('aplic_insumos', 'by_lote', id_lote);
export const getInsumos    = () => getAll('insumos');
export const getUsuarios   = () => getAll('usuarios');

export async function getActiveLoteByEstanque(id_estanque) {
  const lotes = await getLotesByEstanque(id_estanque);
  return lotes.find(l => l.estado === 'activo') || null;
}

export async function getLatestWaterReading(id_lote) {
  const readings = await getRegistrosAgua(id_lote);
  if (!readings.length) return null;
  return readings.sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
}

export async function getFeedTodayKg(id_lote) {
  const today = new Date().toISOString().slice(0, 10);
  const alims = await getRegistrosAlim(id_lote);
  return alims.filter(a => a.fecha === today).reduce((s, a) => s + (a.kg_suministrado || 0), 0);
}

export async function getRetiroActivo(id_lote) {
  const hoy = new Date().toISOString().slice(0, 10);
  const apps = await getAplicaciones(id_lote);
  return apps.find(a => a.fecha_fin_retiro && a.fecha_fin_retiro >= hoy) || null;
}

// ── Seeder ──────────────────────────────────────────────────
export async function seedDemoData() {
  const existing = await getAll('tenants');
  if (existing.length > 0) return; // Ya sembrado

  const tenant = { id: 'tenant-001', nombre: 'Piscícola Los Laureles S.A.S.', nit: '900.123.456-7', perfil_conectividad: 'estandar' };
  await put('tenants', tenant);

  // Usuarios
  const usuarios = [
    { id: 'u-op1',  nombre: 'Carlos Medina',   email: 'operario@aquashell.co',    rol: 'operario',     password: '123', id_tenant: 'tenant-001', id_finca: 'finca-001' },
    { id: 'u-co1',  nombre: 'Laura Ospina',     email: 'coordinador@aquashell.co', rol: 'coordinador',  password: '123', id_tenant: 'tenant-001', id_finca: null },
    { id: 'u-ge1',  nombre: 'Hernán Cárdenas',  email: 'gerente@aquashell.co',     rol: 'gerente',      password: '123', id_tenant: 'tenant-001', id_finca: null },
    { id: 'u-as1',  nombre: 'Dra. Mónica Ruiz', email: 'asesor@aquashell.co',      rol: 'asesor',       password: '123', id_tenant: 'tenant-001', id_finca: null },
    { id: 'u-sa1',  nombre: 'Admin Aquashell',  email: 'admin@aquashell.co',       rol: 'superadmin',   password: 'admin123', id_tenant: 'tenant-001', id_finca: null },
  ];
  for (const u of usuarios) await put('usuarios', u);

  // Fincas
  const fincas = [
    { id: 'finca-001', nombre: 'La Esperanza',   municipio: 'Espinal',    departamento: 'Tolima',   hectareas: 4.5, id_tenant: 'tenant-001' },
    { id: 'finca-002', nombre: 'El Palmar',       municipio: 'Montería',   departamento: 'Córdoba',  hectareas: 8.0, id_tenant: 'tenant-001' },
  ];
  for (const f of fincas) await put('fincas', f);

  // Estanques
  const today = new Date();
  const daysBack = (d) => { const dt = new Date(today); dt.setDate(dt.getDate() - d); return dt.toISOString().slice(0, 10); };

  const estanques = [
    { id: 'est-001', nombre: 'Estanque 1-A', codigo_qr: 'AQ-F1-001', volumen_m3: 120, area_m2: 400, id_finca: 'finca-001', tipo: 'tierra' },
    { id: 'est-002', nombre: 'Estanque 1-B', codigo_qr: 'AQ-F1-002', volumen_m3: 120, area_m2: 400, id_finca: 'finca-001', tipo: 'tierra' },
    { id: 'est-003', nombre: 'Estanque 1-C', codigo_qr: 'AQ-F1-003', volumen_m3: 80,  area_m2: 260, id_finca: 'finca-001', tipo: 'geomembrana' },
    { id: 'est-004', nombre: 'Estanque 2-A', codigo_qr: 'AQ-F2-001', volumen_m3: 200, area_m2: 600, id_finca: 'finca-002', tipo: 'tierra' },
    { id: 'est-005', nombre: 'Estanque 2-B', codigo_qr: 'AQ-F2-002', volumen_m3: 200, area_m2: 600, id_finca: 'finca-002', tipo: 'tierra' },
    { id: 'est-006', nombre: 'Estanque 2-C', codigo_qr: 'AQ-F2-003', volumen_m3: 150, area_m2: 450, id_finca: 'finca-002', tipo: 'geomembrana' },
  ];
  for (const e of estanques) await put('estanques', e);

  // Lotes activos
  const lotes = [
    { id: 'lote-001', id_estanque: 'est-001', id_finca: 'finca-001', especie: 'tilapia_nilotica', estado: 'activo', fecha_inicio: daysBack(68), count_inicial: 1200, count_actual: 1163, peso_inicial_g: 5, peso_actual_g: 198, total_alimento_kg: 142, id_tenant: 'tenant-001', unidad_costo_cop: 350, retiro_activo: false },
    { id: 'lote-002', id_estanque: 'est-002', id_finca: 'finca-001', especie: 'tilapia_nilotica', estado: 'activo', fecha_inicio: daysBack(42), count_inicial: 1000, count_actual: 978,  peso_inicial_g: 8, peso_actual_g: 105, total_alimento_kg: 74,  id_tenant: 'tenant-001', unidad_costo_cop: 350, retiro_activo: false },
    { id: 'lote-003', id_estanque: 'est-003', id_finca: 'finca-001', especie: 'cachama',          estado: 'activo', fecha_inicio: daysBack(30), count_inicial: 600,  count_actual: 592,  peso_inicial_g: 20, peso_actual_g: 80, total_alimento_kg: 28,  id_tenant: 'tenant-001', unidad_costo_cop: 800, retiro_activo: true, fecha_fin_retiro: daysBack(-5) },
    { id: 'lote-004', id_estanque: 'est-004', id_finca: 'finca-002', especie: 'tilapia_nilotica', estado: 'activo', fecha_inicio: daysBack(90), count_inicial: 2000, count_actual: 1920, peso_inicial_g: 5, peso_actual_g: 265, total_alimento_kg: 360, id_tenant: 'tenant-001', unidad_costo_cop: 350, retiro_activo: false },
    { id: 'lote-005', id_estanque: 'est-005', id_finca: 'finca-002', especie: 'tilapia_nilotica', estado: 'vacio', fecha_inicio: null, count_inicial: 0, count_actual: 0, peso_inicial_g: 0, peso_actual_g: 0, total_alimento_kg: 0, id_tenant: 'tenant-001', retiro_activo: false },
    { id: 'lote-006', id_estanque: 'est-006', id_finca: 'finca-002', especie: 'tilapia_nilotica', estado: 'activo', fecha_inicio: daysBack(55), count_inicial: 1500, count_actual: 1462, peso_inicial_g: 5, peso_actual_g: 155, total_alimento_kg: 155, id_tenant: 'tenant-001', unidad_costo_cop: 350, retiro_activo: false },
  ];
  for (const l of lotes) await put('lotes', l);

  // Insumos sanitarios
  const insumos = [
    { id: 'ins-001', nombre_producto: 'Florfenicol 50%', principio_activo: 'Florfenicol', tipo: 'medicamento', registro_ica: 'ICA-MVET-2021-0045', periodo_retiro_dias: 12, unidad_medida: 'g', dosis_referencia: '10 mg/kg pv/día por 5 días', activo: true, nivel_catalogo: 'global' },
    { id: 'ins-002', nombre_producto: 'Oxitetraciclina 20%', principio_activo: 'Oxitetraciclina', tipo: 'medicamento', registro_ica: 'ICA-MVET-2019-0123', periodo_retiro_dias: 30, unidad_medida: 'g', dosis_referencia: '75 mg/kg pv/día por 10 días', activo: true, nivel_catalogo: 'global' },
    { id: 'ins-003', nombre_producto: 'Cal Agrícola (CaO)', principio_activo: 'Óxido de calcio', tipo: 'acondicionador', registro_ica: null, periodo_retiro_dias: 0, unidad_medida: 'kg', dosis_referencia: '50-100 kg/1000 m³', activo: true, nivel_catalogo: 'global' },
    { id: 'ins-004', nombre_producto: 'Sal Marina NaCl', principio_activo: 'Cloruro de sodio', tipo: 'acondicionador', registro_ica: null, periodo_retiro_dias: 0, unidad_medida: 'kg', dosis_referencia: '1-3 kg/m³', activo: true, nivel_catalogo: 'global' },
    { id: 'ins-005', nombre_producto: 'Probiótico AquaPro', principio_activo: 'Bacillus subtilis', tipo: 'probiotico', registro_ica: 'ICA-MVET-2022-0312', periodo_retiro_dias: 0, unidad_medida: 'mL', dosis_referencia: '1 mL/m³ agua', activo: true, nivel_catalogo: 'tenant' },
  ];
  for (const i of insumos) await put('insumos', i);

  // Aplicación de insumo en lote-003 (retiro activo = Florfenicol)
  await put('aplic_insumos', {
    id: 'aplic-001', id_lote: 'lote-003', id_insumo: 'ins-001', id_tenant: 'tenant-001',
    cantidad_aplicada: 500, unidad: 'g', dosis_descrita: '10 mg/kg/día por 5 días',
    motivo_aplicacion: 'Tratamiento curativo', fecha_aplicacion: daysBack(5),
    fecha_fin_retiro: daysBack(-5), notas: 'Episodio de columnaris detectado', sync_status: 'pending'
  });

  // Lecturas de agua históricas (últimos 7 días en lote-001)
  for (let i = 6; i >= 0; i--) {
    await put('registros_agua', {
      id: `agua-${i}`, id_lote: 'lote-001', id_tenant: 'tenant-001', fecha: daysBack(i),
      temperatura:      26.5 + Math.random() * 2,
      oxigeno_disuelto: 6.0  + Math.random() * 1.5,
      ph:               7.0  + Math.random() * 0.8,
      tan:              0.3  + Math.random() * 0.4,
      nitrito:          0.05 + Math.random() * 0.08,
      alcalinidad:      140  + Math.random() * 40,
      disco_secchi:     55   + Math.random() * 15,
      salinidad:        0.2  + Math.random() * 0.2,
      sync_status: 'synced'
    });
  }

  // Alimentaciones históricas lote-001
  for (let i = 6; i >= 0; i--) {
    const biomass = (1163 * 198 / 1000) - i * 0.5;
    await put('registros_alim', {
      id: `alim-${i}`, id_lote: 'lote-001', id_tenant: 'tenant-001', fecha: daysBack(i),
      kg_suministrado: parseFloat((biomass * 0.029).toFixed(1)),
      lmax_kg: parseFloat((biomass * 0.03).toFixed(1)),
      n_raciones: 3, sync_status: 'synced'
    });
  }

  console.log('✅ Aquashell v3: datos de prueba sembrados correctamente');
}
