import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { evaluateMortality } from '@aquashell/shared';
import { saveEvent } from '../../../../src/db/eventStore';
import { useLote } from '../../../../src/hooks/useLote';
import { useSession } from '../../../../src/hooks/useSession';
import { uuid } from '../../../../src/utils/uuid';
import { C, S } from '../../../../src/theme';

const CAUSAS = ['hipoxia', 'enfermedad', 'trauma', 'manejo', 'desconocida'] as const;
type Causa = typeof CAUSAS[number];

export default function MortalidadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { user } = useSession();
  const { state, loading } = useLote(id);

  const [cantidadStr, setCantidadStr] = useState('');
  const [causa, setCausa] = useState<Causa>('desconocida');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading || !state) {
    return <View style={styles.center}><Text style={styles.loadingText}>Cargando…</Text></View>;
  }

  const cantidad = parseInt(cantidadStr) || 0;
  const evaluation = cantidad > 0 ? evaluateMortality(cantidad, state.count_actual) : null;

  async function handleSave() {
    if (cantidad <= 0) { Alert.alert('Error', 'Ingresa la cantidad de peces muertos.'); return; }
    if (cantidad > state!.count_actual) {
      Alert.alert('Error', `No puedes registrar más de ${state!.count_actual} peces.`);
      return;
    }
    if (!user) return;

    if (evaluation?.status === 'critical') {
      await new Promise<void>((resolve, reject) => {
        Alert.alert(
          '⚠️ Mortalidad Crítica',
          `${evaluation.message}\n\n¿Confirmas el registro?`,
          [
            { text: 'Cancelar', onPress: () => reject(), style: 'cancel' },
            { text: 'Confirmar', onPress: () => resolve() },
          ]
        );
      }).catch(() => null);
      // if cancelled, state is not changed so we just return
    }

    setSaving(true);
    await saveEvent(db, {
      id: uuid(),
      type: 'MORTALIDAD_REGISTRADA',
      id_lote: id,
      id_tenant: user.id_tenant,
      id_usuario: user.id,
      ts: new Date().toISOString(),
      sync_status: 'pending',
      payload: {
        cantidad,
        causa_presunta: causa,
        notas: notas.trim() || undefined,
      },
    });
    setSaving(false);
    router.back();
  }

  const evalColor = evaluation?.status === 'critical' ? C.danger
    : evaluation?.status === 'warn' ? C.warn : C.ok;
  const evalBg = evaluation?.status === 'critical' ? C.dangerLight
    : evaluation?.status === 'warn' ? C.warnLight : C.okLight;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Peces en el lote</Text>
        <Text style={styles.infoVal}>{state.count_actual.toLocaleString()}</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Cantidad de peces muertos</Text>
        <TextInput
          style={[styles.input, evaluation?.status === 'critical' && { borderColor: C.danger }]}
          keyboardType="number-pad"
          value={cantidadStr}
          onChangeText={setCantidadStr}
          placeholder="0"
          placeholderTextColor={C.muted}
        />
      </View>

      {evaluation && (
        <View style={[styles.evalCard, { backgroundColor: evalBg, borderColor: evalColor }]}>
          <Text style={[styles.evalRate, { color: evalColor }]}>
            {evaluation.rate_pct.toFixed(3)}% / día
          </Text>
          <Text style={[styles.evalMsg, { color: evalColor }]}>{evaluation.message}</Text>
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Causa presunta</Text>
        <View style={styles.causaGrid}>
          {CAUSAS.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.causaBtn, causa === c && styles.causaBtnActive]}
              onPress={() => setCausa(c)}
            >
              <Text style={[styles.causaText, causa === c && styles.causaTextActive]}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Notas (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={3}
          value={notas}
          onChangeText={setNotas}
          placeholder="Observaciones adicionales…"
          placeholderTextColor={C.muted}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: evaluation?.status === 'critical' ? C.danger : C.primary }, saving && styles.disabled]}
        onPress={() => void handleSave()}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Guardando…' : 'Registrar Mortalidad'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:          { flex: 1 },
  container:       { padding: S.md, paddingBottom: S.xl },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:     { color: C.muted },
  infoCard:        { backgroundColor: C.surface, borderRadius: 10, padding: S.md, borderWidth: 1, borderColor: C.border, marginBottom: S.md, alignItems: 'center' },
  infoLabel:       { fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoVal:         { fontSize: 28, fontWeight: '800', color: C.text, marginTop: 4 },
  field:           { marginBottom: S.md },
  label:           { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: S.xs },
  input:           { backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.border, padding: S.sm, fontSize: 16, color: C.text },
  textArea:        { height: 80 },
  evalCard:        { borderRadius: 10, borderWidth: 1, padding: S.md, marginBottom: S.md, alignItems: 'center' },
  evalRate:        { fontSize: 28, fontWeight: '800' },
  evalMsg:         { fontSize: 13, textAlign: 'center', marginTop: 4 },
  causaGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: S.xs },
  causaBtn:        { paddingHorizontal: S.sm, paddingVertical: S.xs, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  causaBtnActive:  { backgroundColor: C.primary, borderColor: C.primary },
  causaText:       { fontSize: 13, color: C.muted },
  causaTextActive: { color: C.white, fontWeight: '600' },
  saveBtn:         { backgroundColor: C.primary, borderRadius: 10, padding: S.md, alignItems: 'center', marginTop: S.sm },
  saveBtnText:     { color: C.white, fontWeight: '700', fontSize: 16 },
  disabled:        { opacity: 0.5 },
});
