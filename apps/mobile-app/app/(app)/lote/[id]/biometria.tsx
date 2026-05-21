import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { calculateBiometrySample } from '@aquashell/shared';
import { saveEvent } from '../../../../src/db/eventStore';
import { useSession } from '../../../../src/hooks/useSession';
import { uuid } from '../../../../src/utils/uuid';
import { C, S } from '../../../../src/theme';

export default function BiometriaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { user } = useSession();

  const [rawInput, setRawInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Parse comma/newline separated weights
  const weights = rawInput
    .split(/[,\n\s]+/)
    .map(s => parseFloat(s.trim()))
    .filter(n => !isNaN(n) && n > 0);

  const sample = weights.length > 0 ? calculateBiometrySample(weights) : null;

  async function handleSave() {
    if (!sample) { Alert.alert('Error', 'Ingresa los pesos del muestreo.'); return; }
    if (!sample.valid && weights.length < 10) {
      Alert.alert('Error', sample.reason ?? 'Mínimo 10 peces requeridos.');
      return;
    }
    if (!user) return;

    if (!sample.valid) {
      const confirmed = await new Promise<boolean>(resolve => {
        Alert.alert(
          '⚠️ Alta variabilidad',
          `CV% = ${sample.cv_pct}%\n\n${sample.reason}\n\n¿Guardar de todas formas? NO actualizará el LMax.`,
          [
            { text: 'Cancelar', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Guardar', onPress: () => resolve(true) },
          ]
        );
      });
      if (!confirmed) return;
    }

    setSaving(true);
    await saveEvent(db, {
      id: uuid(),
      type: 'MUESTREO_BIOMETRICO',
      id_lote: id,
      id_tenant: user.id_tenant,
      id_usuario: user.id,
      ts: new Date().toISOString(),
      sync_status: 'pending',
      payload: {
        pesos_g: weights,
        peso_promedio_g: sample.mean_g,
        cv_pct: sample.cv_pct,
        valid: sample.valid,
        n: sample.n,
      },
    });
    setSaving(false);
    router.back();
  }

  const cvColor = !sample ? C.muted
    : sample.cv_pct > 25 ? C.danger
    : sample.cv_pct > 15 ? C.warn : C.ok;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.hint}>
        Ingresa los pesos individuales separados por comas o saltos de línea.{'\n'}
        Mínimo 10 peces. CV% ≤ 25% actualiza el LMax automáticamente.
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>Pesos (g)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          keyboardType="decimal-pad"
          value={rawInput}
          onChangeText={setRawInput}
          placeholder={'200, 215, 198, 210, 205,\n212, 195, 208, 203, 218…'}
          placeholderTextColor={C.muted}
          textAlignVertical="top"
        />
        <Text style={styles.counter}>{weights.length} peces ingresados</Text>
      </View>

      {sample && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Estadísticas del Muestreo</Text>
          <View style={styles.statsGrid}>
            <StatRow label="N (peces)" value={String(sample.n)} />
            <StatRow label="Peso promedio" value={`${sample.mean_g} g`} />
            <StatRow label="Desv. estándar" value={`${sample.std_g} g`} />
            <StatRow label="Mín / Máx" value={`${sample.min_g} / ${sample.max_g} g`} />
            <View style={styles.cvRow}>
              <Text style={styles.statLabel}>CV%</Text>
              <Text style={[styles.cvVal, { color: cvColor }]}>
                {sample.cv_pct}%
                {sample.cv_pct > 25 ? ' ⚠️ Alto' : sample.cv_pct > 15 ? ' ⚡ Aceptable' : ' ✅ Bueno'}
              </Text>
            </View>
          </View>

          <View style={[styles.validBanner, { backgroundColor: sample.valid ? C.okLight : C.dangerLight }]}>
            <Text style={[styles.validText, { color: sample.valid ? C.ok : C.danger }]}>
              {sample.valid
                ? '✅ Válido — actualizará el LMax y peso promedio del lote'
                : `⚠️ ${sample.reason}`}
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.disabled]}
        onPress={() => void handleSave()}
        disabled={saving || weights.length === 0}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Guardando…' : 'Guardar Muestreo'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statVal}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll:       { flex: 1 },
  container:    { padding: S.md, paddingBottom: S.xl },
  hint:         { color: C.muted, fontSize: 13, marginBottom: S.md, lineHeight: 18 },
  field:        { marginBottom: S.md },
  label:        { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: S.xs },
  input:        { backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.border, padding: S.sm, fontSize: 16, color: C.text },
  textArea:     { height: 140, fontFamily: 'monospace' },
  counter:      { fontSize: 12, color: C.muted, marginTop: 4, textAlign: 'right' },
  statsCard:    { backgroundColor: C.surface, borderRadius: 12, padding: S.md, borderWidth: 1, borderColor: C.border, marginBottom: S.md },
  statsTitle:   { fontSize: 13, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: S.sm },
  statsGrid:    { gap: S.xs },
  statRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  statLabel:    { fontSize: 13, color: C.muted },
  statVal:      { fontSize: 13, fontWeight: '600', color: C.text },
  cvRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  cvVal:        { fontSize: 15, fontWeight: '800' },
  validBanner:  { borderRadius: 8, padding: S.sm, marginTop: S.sm },
  validText:    { fontSize: 13, fontWeight: '600' },
  saveBtn:      { backgroundColor: C.primary, borderRadius: 10, padding: S.md, alignItems: 'center', marginTop: S.sm },
  saveBtnText:  { color: C.white, fontWeight: '700', fontSize: 16 },
  disabled:     { opacity: 0.5 },
});
