import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, FlatList,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { saveEvent } from '../../../../src/db/eventStore';
import { useSession } from '../../../../src/hooks/useSession';
import { INSUMOS_CATALOG, TIPO_LABELS, type InsumoLocal } from '../../../../src/db/insumosStore';
import { uuid } from '../../../../src/utils/uuid';
import { C, S } from '../../../../src/theme';

const MOTIVOS = ['tratamiento', 'prevención', 'acondicionamiento', 'corrección pH', 'otro'] as const;
type Motivo = typeof MOTIVOS[number];

function addDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function InsumoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { user } = useSession();

  const [selected, setSelected] = useState<InsumoLocal | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState<Motivo>('tratamiento');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  const fechaFinRetiro = selected && selected.periodo_retiro_dias > 0
    ? addDays(selected.periodo_retiro_dias)
    : null;

  async function handleSave() {
    if (!selected) { Alert.alert('Error', 'Selecciona un insumo.'); return; }
    if (!cantidad || parseFloat(cantidad) <= 0) {
      Alert.alert('Error', 'Ingresa la cantidad aplicada.');
      return;
    }
    if (!user) return;

    if (selected.periodo_retiro_dias > 0) {
      const confirmed = await new Promise<boolean>(resolve => {
        Alert.alert(
          '⛔ Período de retiro',
          `${selected.nombre_producto} tiene ${selected.periodo_retiro_dias} días de retiro.\nNo cosechar antes de: ${fechaFinRetiro ?? '—'}\n\n¿Confirmas la aplicación?`,
          [
            { text: 'Cancelar', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Confirmar', onPress: () => resolve(true) },
          ]
        );
      });
      if (!confirmed) return;
    }

    setSaving(true);
    await saveEvent(db, {
      id: uuid(),
      type: 'INSUMO_APLICADO',
      id_lote: id,
      id_tenant: user.id_tenant,
      id_usuario: user.id,
      ts: new Date().toISOString(),
      sync_status: 'pending',
      payload: {
        id_insumo: selected.id,
        cantidad_aplicada: parseFloat(cantidad),
        unidad: selected.unidad_medida,
        motivo_aplicacion: motivo,
        periodo_retiro_dias: selected.periodo_retiro_dias,
        fecha_fin_retiro: fechaFinRetiro ?? new Date().toISOString().slice(0, 10),
        notas: notas.trim() || undefined,
      },
    });
    setSaving(false);
    router.back();
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionLabel}>Selecciona el insumo</Text>

      {INSUMOS_CATALOG.map(ins => (
        <TouchableOpacity
          key={ins.id}
          style={[styles.insCard, selected?.id === ins.id && styles.insCardActive]}
          onPress={() => setSelected(selected?.id === ins.id ? null : ins)}
          activeOpacity={0.8}
        >
          <View style={styles.insHeader}>
            <Text style={[styles.insName, selected?.id === ins.id && styles.insNameActive]}>
              {ins.nombre_producto}
            </Text>
            {ins.periodo_retiro_dias > 0 && (
              <View style={styles.retiroBadge}>
                <Text style={styles.retiroBadgeText}>⛔ {ins.periodo_retiro_dias} d retiro</Text>
              </View>
            )}
          </View>
          <Text style={styles.insDetail}>
            {TIPO_LABELS[ins.tipo]} · {ins.dosis_referencia}
          </Text>
        </TouchableOpacity>
      ))}

      {selected && (
        <>
          <View style={styles.divider} />

          {fechaFinRetiro && (
            <View style={styles.retiroAlert}>
              <Text style={styles.retiroAlertText}>
                ⛔ Al aplicar este insumo, el lote entrará en período de retiro hasta el{' '}
                <Text style={{ fontWeight: '800' }}>{fechaFinRetiro}</Text>.{'\n'}
                No podrá cosechar durante este período.
              </Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>
              Cantidad ({selected.unidad_medida})
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={cantidad}
              onChangeText={setCantidad}
              placeholder="0.00"
              placeholderTextColor={C.muted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Motivo de aplicación</Text>
            <View style={styles.motivoGrid}>
              {MOTIVOS.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.motivoBtn, motivo === m && styles.motivoBtnActive]}
                  onPress={() => setMotivo(m)}
                >
                  <Text style={[styles.motivoText, motivo === m && styles.motivoTextActive]}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
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
              numberOfLines={2}
              value={notas}
              onChangeText={setNotas}
              placeholder="Observaciones adicionales…"
              placeholderTextColor={C.muted}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: fechaFinRetiro ? C.danger : C.primary }, saving && styles.disabled]}
            onPress={() => void handleSave()}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Guardando…' : 'Registrar Aplicación'}</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:          { flex: 1 },
  container:       { padding: S.md, paddingBottom: S.xl },
  sectionLabel:    { fontSize: 13, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: S.sm },
  insCard:         { backgroundColor: C.surface, borderRadius: 10, padding: S.sm, marginBottom: S.xs, borderWidth: 1, borderColor: C.border },
  insCardActive:   { borderColor: C.primary, backgroundColor: C.primaryLight },
  insHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  insName:         { fontSize: 14, fontWeight: '600', color: C.text, flex: 1 },
  insNameActive:   { color: C.primaryDark },
  insDetail:       { fontSize: 12, color: C.muted },
  retiroBadge:     { backgroundColor: C.dangerLight, borderRadius: 10, paddingHorizontal: S.xs, paddingVertical: 2 },
  retiroBadgeText: { fontSize: 11, color: C.danger, fontWeight: '700' },
  divider:         { height: 1, backgroundColor: C.border, marginVertical: S.md },
  retiroAlert:     { backgroundColor: C.dangerLight, borderRadius: 10, padding: S.sm, marginBottom: S.md, borderWidth: 1, borderColor: C.danger },
  retiroAlertText: { color: C.danger, fontSize: 13 },
  field:           { marginBottom: S.md },
  label:           { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: S.xs },
  input:           { backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.border, padding: S.sm, fontSize: 16, color: C.text },
  textArea:        { height: 70 },
  motivoGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: S.xs },
  motivoBtn:       { paddingHorizontal: S.sm, paddingVertical: S.xs, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  motivoBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  motivoText:      { fontSize: 13, color: C.muted },
  motivoTextActive:{ color: C.white, fontWeight: '600' },
  saveBtn:         { backgroundColor: C.primary, borderRadius: 10, padding: S.md, alignItems: 'center', marginTop: S.sm },
  saveBtnText:     { color: C.white, fontWeight: '700', fontSize: 16 },
  disabled:        { opacity: 0.5 },
});
