import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { calculateCycleROI } from '@aquashell/shared';
import { useLote } from '../../../../src/hooks/useLote';
import { useSession } from '../../../../src/hooks/useSession';
import { saveEvent } from '../../../../src/db/eventStore';
import { uuid } from '../../../../src/utils/uuid';
import { C, S } from '../../../../src/theme';

function fmtCOP(n: number) {
  return `$${new Intl.NumberFormat('es-CO').format(Math.round(n))}`;
}

export default function CosechaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { state, loading } = useLote(id);
  const { user } = useSession();

  const [biomasaInput, setBiomasaInput] = useState('');
  const [precioInput, setPrecioInput] = useState('');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={C.primary} /></View>;
  }
  if (!state) {
    return <View style={styles.center}><Text style={{ color: C.muted }}>Lote sin datos</Text></View>;
  }
  if (state.cosechado) {
    return (
      <View style={styles.center}>
        <Text style={styles.cosechadoIcon}>🎣</Text>
        <Text style={styles.cosechadoText}>Este lote ya fue cosechado</Text>
        {state.biomasa_cosechada_kg != null && (
          <Text style={styles.cosechadoSub}>{state.biomasa_cosechada_kg} kg cosechados</Text>
        )}
      </View>
    );
  }

  const biomasaNum = parseFloat(biomasaInput) || 0;
  const precioNum = parseFloat(precioInput) || 0;
  const showRoi = biomasaNum > 0 && precioNum > 0;

  const roi = showRoi ? calculateCycleROI({
    seed_count: state.count_inicial,
    seed_unit_cost_cop: 350,
    total_feed_kg: state.total_alimento_kg,
    feed_cost_per_kg_cop: 2_800,
    harvest_biomass_kg: biomasaNum,
    sale_price_cop_per_kg: precioNum,
  }) : null;

  async function handleSave() {
    if (!biomasaInput || biomasaNum <= 0) {
      Alert.alert('Error', 'Ingresa la biomasa cosechada.');
      return;
    }
    if (!precioInput || precioNum <= 0) {
      Alert.alert('Error', 'Ingresa el precio de venta.');
      return;
    }
    if (!user || !state) return;

    if (state.retiro_activo) {
      const confirmed = await new Promise<boolean>(resolve =>
        Alert.alert(
          '⛔ Período de retiro activo',
          `El lote tiene retiro hasta ${state.fecha_fin_retiro}.\n¿Confirmas la cosecha de todos modos?`,
          [
            { text: 'Cancelar', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Cosechar', onPress: () => resolve(true), style: 'destructive' },
          ]
        )
      );
      if (!confirmed) return;
    }

    setSaving(true);
    await saveEvent(db, {
      id: uuid(),
      type: 'LOTE_COSECHADO',
      id_lote: id,
      id_tenant: user.id_tenant,
      id_usuario: user.id,
      ts: new Date().toISOString(),
      sync_status: 'pending',
      payload: {
        biomasa_cosechada_kg: biomasaNum,
        precio_venta_cop_kg: precioNum,
        notas: notas.trim() || undefined,
      },
    });
    setSaving(false);
    router.back();
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {state.retiro_activo && (
        <View style={styles.retiroBanner}>
          <Text style={styles.retiroText}>⛔ Retiro activo hasta {state.fecha_fin_retiro}</Text>
        </View>
      )}

      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Estado actual del lote</Text>
        <View style={styles.row}>
          <StatMini label="Peces" value={state.count_actual.toLocaleString()} />
          <StatMini label="Biomasa" value={`${state.biomasa_kg.toFixed(1)} kg`} />
          <StatMini label="Días ciclo" value={`${state.dias_transcurridos} d`} />
          <StatMini label="Alimento" value={`${state.total_alimento_kg.toFixed(1)} kg`} />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Biomasa cosechada (kg)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={biomasaInput}
          onChangeText={setBiomasaInput}
          placeholder={state.biomasa_kg.toFixed(1)}
          placeholderTextColor={C.muted}
        />
        <Text style={styles.hint}>Peso neto entregado al comprador</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Precio de venta (COP / kg)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={precioInput}
          onChangeText={setPrecioInput}
          placeholder="8000"
          placeholderTextColor={C.muted}
        />
      </View>

      {roi && (
        <View style={[styles.roiCard, { borderColor: roi.profitable ? C.ok : C.danger }]}>
          <Text style={styles.sectionTitle}>Proyección ROI</Text>
          <View style={styles.roiGrid}>
            <RoiRow label="Ingresos brutos" value={fmtCOP(roi.gross_income)} />
            <RoiRow label="Costo semilla" value={`-${fmtCOP(roi.seed_cost)}`} />
            <RoiRow label="Costo alimento" value={`-${fmtCOP(roi.feed_cost)}`} />
            <View style={styles.divider} />
            <RoiRow
              label="Margen bruto"
              value={fmtCOP(roi.gross_margin)}
              bold
              color={roi.profitable ? C.ok : C.danger}
            />
            <RoiRow
              label="ROI"
              value={roi.roi_pct != null ? `${roi.roi_pct}%` : 'N/D'}
              bold
              color={roi.profitable ? C.ok : C.danger}
            />
          </View>
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Notas (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={2}
          value={notas}
          onChangeText={setNotas}
          placeholder="Comprador, calidad, observaciones…"
          placeholderTextColor={C.muted}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.disabled]}
        onPress={() => void handleSave()}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Guardando…' : '🎣 Registrar Cosecha'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statMini}>
      <Text style={styles.statMiniVal}>{value}</Text>
      <Text style={styles.statMiniLabel}>{label}</Text>
    </View>
  );
}

function RoiRow({
  label, value, bold, color,
}: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <View style={styles.roiRow}>
      <Text style={styles.roiLabel}>{label}</Text>
      <Text style={[styles.roiValue, bold && styles.roiBold, color ? { color } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll:         { flex: 1 },
  container:      { padding: S.md, paddingBottom: S.xl },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cosechadoIcon:  { fontSize: 48, marginBottom: S.sm },
  cosechadoText:  { fontSize: 18, fontWeight: '700', color: C.text },
  cosechadoSub:   { fontSize: 14, color: C.muted, marginTop: 4 },
  retiroBanner:   { backgroundColor: C.dangerLight, borderRadius: 8, padding: S.sm, marginBottom: S.md },
  retiroText:     { color: C.danger, fontWeight: '700', textAlign: 'center' },
  summaryCard:    { backgroundColor: C.surface, borderRadius: 12, padding: S.md,
                    borderWidth: 1, borderColor: C.border, marginBottom: S.md },
  sectionTitle:   { fontSize: 13, fontWeight: '700', color: C.muted, textTransform: 'uppercase',
                    letterSpacing: 0.5, marginBottom: S.sm },
  row:            { flexDirection: 'row', gap: S.sm },
  statMini:       { flex: 1, alignItems: 'center' },
  statMiniVal:    { fontSize: 16, fontWeight: '700', color: C.text },
  statMiniLabel:  { fontSize: 11, color: C.muted, marginTop: 2 },
  field:          { marginBottom: S.md },
  label:          { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: S.xs },
  hint:           { fontSize: 11, color: C.muted, marginTop: 4 },
  input:          { backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.border,
                    padding: S.sm, fontSize: 16, color: C.text },
  textArea:       { height: 70 },
  roiCard:        { backgroundColor: C.surface, borderRadius: 12, padding: S.md,
                    borderWidth: 2, marginBottom: S.md },
  roiGrid:        { gap: 2 },
  roiRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  roiLabel:       { fontSize: 13, color: C.muted },
  roiValue:       { fontSize: 13, color: C.text },
  roiBold:        { fontWeight: '700' },
  divider:        { height: 1, backgroundColor: C.border, marginVertical: 4 },
  saveBtn:        { backgroundColor: C.primary, borderRadius: 10, padding: S.md,
                    alignItems: 'center', marginTop: S.sm },
  saveBtnText:    { color: C.white, fontWeight: '700', fontSize: 16 },
  disabled:       { opacity: 0.5 },
});
