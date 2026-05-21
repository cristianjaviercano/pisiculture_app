import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { evaluateWaterReading, type WaterReadingInput } from '@aquashell/shared';
import { saveEvent } from '../../../../src/db/eventStore';
import { useSession } from '../../../../src/hooks/useSession';
import { CTQAlert } from '../../../../src/components/CTQAlert';
import { uuid } from '../../../../src/utils/uuid';
import { C, S } from '../../../../src/theme';

const PARAMS: { key: keyof WaterReadingInput; label: string; unit: string; placeholder: string }[] = [
  { key: 'temperatura',      label: 'Temperatura',       unit: '°C',          placeholder: '25–30' },
  { key: 'oxigeno_disuelto', label: 'Oxígeno Disuelto',  unit: 'mg/L',        placeholder: '>6' },
  { key: 'ph',               label: 'pH',                unit: 'pH',          placeholder: '6.5–8.5' },
  { key: 'tan',              label: 'TAN (Amoniaco)',     unit: 'mg/L',        placeholder: '<1.0' },
  { key: 'nitrito',          label: 'Nitrito (NO₂⁻)',    unit: 'mg/L',        placeholder: '<0.1' },
  { key: 'alcalinidad',      label: 'Alcalinidad',       unit: 'mg/L CaCO₃',  placeholder: '100–300' },
  { key: 'disco_secchi',     label: 'Disco Secchi',      unit: 'cm',          placeholder: '40–80' },
];

type FieldValues = Partial<Record<keyof WaterReadingInput, string>>;

export default function AguaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { user } = useSession();
  const [values, setValues] = useState<FieldValues>({});
  const [saving, setSaving] = useState(false);

  const reading: WaterReadingInput = Object.fromEntries(
    Object.entries(values)
      .map(([k, v]) => [k, v && v !== '' ? parseFloat(v) : undefined])
      .filter(([, v]) => v !== undefined && !isNaN(v as number))
  ) as WaterReadingInput;

  const hasAny = Object.keys(reading).length > 0;
  const evaluation = hasAny ? evaluateWaterReading(reading) : null;

  async function handleSave() {
    if (!hasAny) {
      Alert.alert('Atención', 'Ingresa al menos un parámetro.');
      return;
    }
    if (!user) return;
    setSaving(true);
    await saveEvent(db, {
      id: uuid(),
      type: 'AGUA_REGISTRADA',
      id_lote: id,
      id_tenant: user.id_tenant,
      id_usuario: user.id,
      ts: new Date().toISOString(),
      sync_status: 'pending',
      payload: reading,
    });
    setSaving(false);
    router.back();
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.hint}>Registra los parámetros medidos. Deja en blanco los no medidos.</Text>

      {evaluation && evaluation.alerts.map(a => (
        <CTQAlert key={a.key} status={a.status} message={a.message} blocking={a.blocking} />
      ))}

      {PARAMS.map(p => (
        <View key={p.key} style={styles.field}>
          <Text style={styles.label}>{p.label} <Text style={styles.unit}>({p.unit})</Text></Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder={p.placeholder}
            placeholderTextColor={C.muted}
            value={values[p.key] ?? ''}
            onChangeText={v => setValues(prev => ({ ...prev, [p.key]: v }))}
          />
        </View>
      ))}

      {evaluation && (
        <View style={[styles.statusRow, { backgroundColor: evaluation.systemStatus === 'critical' ? C.dangerLight : evaluation.systemStatus === 'warn' ? C.warnLight : C.okLight }]}>
          <Text style={[styles.statusText, { color: evaluation.systemStatus === 'critical' ? C.danger : evaluation.systemStatus === 'warn' ? C.warn : C.ok }]}>
            Estado general: {evaluation.systemStatus.toUpperCase()}
            {evaluation.hasBlocking ? ' — ALIMENTACIÓN BLOQUEADA' : ''}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.disabled]}
        onPress={() => void handleSave()}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Guardando…' : 'Guardar Lectura'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:     { flex: 1 },
  container:  { padding: S.md, paddingBottom: S.xl },
  hint:       { color: C.muted, fontSize: 13, marginBottom: S.md },
  field:      { marginBottom: S.md },
  label:      { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: S.xs },
  unit:       { fontWeight: '400', color: C.muted },
  input:      { backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.border,
                padding: S.sm, fontSize: 16, color: C.text },
  statusRow:  { borderRadius: 8, padding: S.sm, marginBottom: S.md },
  statusText: { fontWeight: '700', textAlign: 'center' },
  saveBtn:    { backgroundColor: C.primary, borderRadius: 10, padding: S.md, alignItems: 'center', marginTop: S.sm },
  saveBtnText:{ color: C.white, fontWeight: '700', fontSize: 16 },
  disabled:   { opacity: 0.5 },
});
