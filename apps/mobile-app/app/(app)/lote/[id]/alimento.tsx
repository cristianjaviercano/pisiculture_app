import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { calculateLMax, validateFeedAmount } from '@aquashell/shared';
import { saveEvent, getTodayFedKg } from '../../../../src/db/eventStore';
import { useLote } from '../../../../src/hooks/useLote';
import { useSession } from '../../../../src/hooks/useSession';
import { uuid } from '../../../../src/utils/uuid';
import { C, S } from '../../../../src/theme';

const RACIONES = [1, 2, 3, 4];

export default function AlimentoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { user } = useSession();
  const { state, loading } = useLote(id);

  const [kgStr, setKgStr] = useState('');
  const [tempStr, setTempStr] = useState('27');
  const [raciones, setRaciones] = useState(2);
  const [todayFed, setTodayFed] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getTodayFedKg(db, id).then(setTodayFed);
  }, [db, id]);

  if (loading || !state) {
    return <View style={styles.center}><Text style={styles.loadingText}>Cargando…</Text></View>;
  }

  const temp = parseFloat(tempStr) || 27;
  const lmaxResult = calculateLMax(state.biomasa_kg, temp, state.especie);
  const kg = parseFloat(kgStr) || 0;
  const validation = validateFeedAmount(kg, lmaxResult.lmax_kg, todayFed);

  async function handleSave() {
    if (kg <= 0) { Alert.alert('Error', 'Ingresa kg a suministrar.'); return; }
    if (validation.blocked) {
      Alert.alert(
        'Alimentación bloqueada',
        `Superarías el LMax (${lmaxResult.lmax_kg} kg). Exceso: ${validation.excess_kg} kg.`
      );
      return;
    }
    if (!user) return;
    setSaving(true);
    await saveEvent(db, {
      id: uuid(),
      type: 'ALIMENTO_SUMINISTRADO',
      id_lote: id,
      id_tenant: user.id_tenant,
      id_usuario: user.id,
      ts: new Date().toISOString(),
      sync_status: 'pending',
      payload: {
        kg_suministrado: kg,
        lmax_kg: lmaxResult.lmax_kg,
        n_raciones: raciones,
        temperatura_agua: temp,
      },
    });
    setSaving(false);
    router.back();
  }

  const pctBar = Math.min(100, validation.pct_consumed + (kg > 0 ? (kg / lmaxResult.lmax_kg) * 100 : 0));
  const barColor = validation.blocked ? C.danger : pctBar > 80 ? C.warn : C.ok;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.lmaxCard}>
        <Text style={styles.lmaxTitle}>LMax del día</Text>
        <Text style={styles.lmaxVal}>{lmaxResult.lmax_kg} kg</Text>
        <Text style={styles.lmaxSub}>
          Biomasa: {state.biomasa_kg.toFixed(1)} kg · Tasa: {lmaxResult.feeding_rate_pct}%
          {lmaxResult.adjusted ? ' (ajustado por temperatura)' : ''}
        </Text>

        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${Math.min(100, validation.pct_consumed)}%`, backgroundColor: C.ok }]} />
          {kg > 0 && (
            <View style={[styles.barFill, { width: `${Math.min(100, (kg / lmaxResult.lmax_kg) * 100)}%`, backgroundColor: barColor, opacity: 0.6 }]} />
          )}
        </View>
        <Text style={styles.barLabel}>
          Ya suministrado: {todayFed.toFixed(2)} kg · Restante: {validation.remaining_kg} kg
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Temperatura del agua (°C)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={tempStr}
          onChangeText={setTempStr}
          placeholder="27"
          placeholderTextColor={C.muted}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Kg a suministrar</Text>
        <TextInput
          style={[styles.input, validation.blocked && { borderColor: C.danger }]}
          keyboardType="decimal-pad"
          value={kgStr}
          onChangeText={setKgStr}
          placeholder="0.00"
          placeholderTextColor={C.muted}
        />
        {validation.blocked && (
          <Text style={styles.errorText}>⚠️ Supera el LMax por {validation.excess_kg} kg</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Número de raciones</Text>
        <View style={styles.racionRow}>
          {RACIONES.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.racionBtn, raciones === r && styles.racionBtnActive]}
              onPress={() => setRaciones(r)}
            >
              <Text style={[styles.racionText, raciones === r && styles.racionTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, (saving || validation.blocked) && styles.disabled]}
        onPress={() => void handleSave()}
        disabled={saving || validation.blocked}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Guardando…' : 'Registrar Suministro'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:          { flex: 1 },
  container:       { padding: S.md, paddingBottom: S.xl },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:     { color: C.muted },
  lmaxCard:        { backgroundColor: C.primaryLight, borderRadius: 12, padding: S.md, marginBottom: S.md, borderWidth: 1, borderColor: C.primary },
  lmaxTitle:       { fontSize: 12, color: C.primaryDark, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  lmaxVal:         { fontSize: 32, fontWeight: '800', color: C.primaryDark, marginTop: 2 },
  lmaxSub:         { fontSize: 12, color: C.primaryDark, marginTop: 2, marginBottom: S.sm },
  barBg:           { height: 10, backgroundColor: '#bae6fd', borderRadius: 5, flexDirection: 'row', overflow: 'hidden', marginBottom: 4 },
  barFill:         { height: 10, borderRadius: 5 },
  barLabel:        { fontSize: 12, color: C.primaryDark },
  field:           { marginBottom: S.md },
  label:           { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: S.xs },
  input:           { backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.border, padding: S.sm, fontSize: 16, color: C.text },
  errorText:       { color: C.danger, fontSize: 13, marginTop: 4 },
  racionRow:       { flexDirection: 'row', gap: S.sm },
  racionBtn:       { flex: 1, padding: S.sm, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: 'center', backgroundColor: C.surface },
  racionBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  racionText:      { fontSize: 18, fontWeight: '700', color: C.muted },
  racionTextActive:{ color: C.white },
  saveBtn:         { backgroundColor: C.primary, borderRadius: 10, padding: S.md, alignItems: 'center', marginTop: S.sm },
  saveBtnText:     { color: C.white, fontWeight: '700', fontSize: 16 },
  disabled:        { opacity: 0.5 },
});
