import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { SpeciesKey } from '@aquashell/shared';
import { saveEvent } from '../../../src/db/eventStore';
import { useSession } from '../../../src/hooks/useSession';
import { uuid } from '../../../src/utils/uuid';
import { C, S } from '../../../src/theme';

const ESPECIES: { key: SpeciesKey; label: string; icon: string }[] = [
  { key: 'tilapia_nilotica', label: 'Tilapia Nilótica', icon: '🐟' },
  { key: 'cachama',          label: 'Cachama',          icon: '🐠' },
  { key: 'trucha',           label: 'Trucha',           icon: '🐡' },
];

interface EstanqueRow {
  id: string;
  nombre: string;
  id_finca: string;
  area_m2: number;
  volumen_m3: number;
}

export default function NuevoLoteScreen() {
  const db = useSQLiteContext();
  const { user } = useSession();

  const [estanques, setEstanques] = useState<EstanqueRow[]>([]);
  const [estanque, setEstanque] = useState<EstanqueRow | null>(null);
  const [especie, setEspecie] = useState<SpeciesKey>('tilapia_nilotica');
  const [nombre, setNombre] = useState('');
  const [countInput, setCountInput] = useState('');
  const [pesoInput, setPesoInput] = useState('');
  const [costoInput, setCostoInput] = useState('350');
  const [saving, setSaving] = useState(false);

  const loadEstanques = useCallback(async () => {
    const rows = await db.getAllAsync<EstanqueRow>(
      'SELECT id, nombre, id_finca, area_m2, volumen_m3 FROM estanques_local'
    );
    setEstanques(rows);
    if (rows.length === 1) setEstanque(rows[0]);
  }, [db]);

  useEffect(() => { void loadEstanques(); }, [loadEstanques]);

  async function handleSave() {
    if (!estanque) { Alert.alert('Error', 'Selecciona un estanque.'); return; }
    if (!nombre.trim()) { Alert.alert('Error', 'Escribe un nombre para el lote.'); return; }
    const count = parseInt(countInput, 10);
    if (!count || count <= 0) { Alert.alert('Error', 'Ingresa la cantidad inicial de peces.'); return; }
    const peso = parseFloat(pesoInput);
    if (!peso || peso <= 0) { Alert.alert('Error', 'Ingresa el peso inicial por pez.'); return; }
    const costo = parseFloat(costoInput) || 350;
    if (!user) return;

    setSaving(true);
    const loteId = uuid();
    const now = new Date().toISOString();

    await db.runAsync(
      'INSERT INTO lotes_local VALUES (?,?,?,?,?,?,?,?)',
      [loteId, estanque.id, estanque.id_finca, user.id_tenant, especie, nombre.trim(), 1, now]
    );
    await saveEvent(db, {
      id: uuid(),
      type: 'LOTE_INICIADO',
      id_lote: loteId,
      id_tenant: user.id_tenant,
      id_usuario: user.id,
      ts: now,
      sync_status: 'pending',
      payload: {
        especie,
        count_inicial: count,
        peso_inicial_g: peso,
        id_estanque: estanque.id,
        id_finca: estanque.id_finca,
        unidad_costo_cop: costo,
      },
    });

    setSaving(false);
    router.replace(`/(app)/lote/${loteId}`);
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.sectionLabel}>Estanque</Text>
      {estanques.length === 0 ? (
        <Text style={styles.noEstanques}>No hay estanques disponibles en la base local.</Text>
      ) : (
        estanques.map(e => (
          <TouchableOpacity
            key={e.id}
            style={[styles.optCard, estanque?.id === e.id && styles.optCardActive]}
            onPress={() => setEstanque(estanque?.id === e.id ? null : e)}
            activeOpacity={0.8}
          >
            <Text style={[styles.optName, estanque?.id === e.id && styles.optNameActive]}>
              {e.nombre}
            </Text>
            <Text style={styles.optDetail}>{e.area_m2} m² · {e.volumen_m3} m³</Text>
          </TouchableOpacity>
        ))
      )}

      <Text style={[styles.sectionLabel, { marginTop: S.md }]}>Especie</Text>
      <View style={styles.especieRow}>
        {ESPECIES.map(s => (
          <TouchableOpacity
            key={s.key}
            style={[styles.especieBtn, especie === s.key && styles.especieBtnActive]}
            onPress={() => setEspecie(s.key)}
          >
            <Text style={styles.especieIcon}>{s.icon}</Text>
            <Text style={[styles.especieLabel, especie === s.key && styles.especieLabelActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Nombre del lote</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej: Lote 2-A Tilapia"
          placeholderTextColor={C.muted}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Peces iniciales</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={countInput}
          onChangeText={setCountInput}
          placeholder="1000"
          placeholderTextColor={C.muted}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Peso inicial por pez (g)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={pesoInput}
          onChangeText={setPesoInput}
          placeholder="5"
          placeholderTextColor={C.muted}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Costo por alevino (COP)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={costoInput}
          onChangeText={setCostoInput}
          placeholder="350"
          placeholderTextColor={C.muted}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.disabled]}
        onPress={() => void handleSave()}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>
          {saving ? 'Iniciando ciclo…' : '🐣 Iniciar Ciclo de Producción'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:            { flex: 1 },
  container:         { padding: S.md, paddingBottom: S.xl },
  sectionLabel:      { fontSize: 13, fontWeight: '700', color: C.muted,
                       textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: S.xs },
  noEstanques:       { color: C.muted, fontSize: 13, marginBottom: S.md },
  optCard:           { backgroundColor: C.surface, borderRadius: 10, padding: S.sm,
                       marginBottom: S.xs, borderWidth: 1, borderColor: C.border },
  optCardActive:     { borderColor: C.primary, backgroundColor: C.primaryLight },
  optName:           { fontSize: 15, fontWeight: '600', color: C.text },
  optNameActive:     { color: C.primaryDark },
  optDetail:         { fontSize: 12, color: C.muted, marginTop: 1 },
  especieRow:        { flexDirection: 'row', gap: S.sm, marginBottom: S.md },
  especieBtn:        { flex: 1, alignItems: 'center', padding: S.sm, borderRadius: 10,
                       borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  especieBtnActive:  { borderColor: C.primary, backgroundColor: C.primaryLight },
  especieIcon:       { fontSize: 24, marginBottom: 2 },
  especieLabel:      { fontSize: 11, color: C.muted, textAlign: 'center' },
  especieLabelActive:{ color: C.primaryDark, fontWeight: '600' },
  field:             { marginBottom: S.md },
  label:             { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: S.xs },
  input:             { backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.border,
                       padding: S.sm, fontSize: 16, color: C.text },
  saveBtn:           { backgroundColor: C.primary, borderRadius: 10, padding: S.md,
                       alignItems: 'center', marginTop: S.sm },
  saveBtnText:       { color: C.white, fontWeight: '700', fontSize: 16 },
  disabled:          { opacity: 0.5 },
});
