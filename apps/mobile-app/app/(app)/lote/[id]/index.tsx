import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { calculateLMax, estimateHarvestDate } from '@aquashell/shared';
import { useLote } from '../../../../src/hooks/useLote';
import { C, S } from '../../../../src/theme';

const ACTIONS = [
  { key: 'agua',       label: 'Calidad\ndel Agua',   icon: '💧', color: '#0284c7' },
  { key: 'alimento',   label: 'Suministro\nAlimento', icon: '🌾', color: '#059669' },
  { key: 'mortalidad', label: 'Mortalidad',           icon: '💀', color: '#dc2626' },
  { key: 'biometria',  label: 'Biometría',            icon: '📏', color: '#7c3aed' },
  { key: 'insumo',     label: 'Insumo\nAplicado',    icon: '💊', color: '#b45309' },
  { key: 'historial',  label: 'Historial\nEventos',  icon: '📋', color: '#475569' },
  { key: 'cosecha',    label: 'Registrar\nCosecha',  icon: '🎣', color: '#16a34a' },
] as const;

export default function LoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { state, loading } = useLote(id);
  const [archiving, setArchiving] = useState(false);

  async function handleArchive() {
    const confirmed = await new Promise<boolean>(resolve =>
      Alert.alert(
        'Archivar lote',
        'El lote dejará de aparecer en el dashboard. Asegúrate de que el evento de cosecha ya esté sincronizado.',
        [
          { text: 'Cancelar', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Archivar', onPress: () => resolve(true), style: 'destructive' },
        ]
      )
    );
    if (!confirmed) return;
    setArchiving(true);
    await db.runAsync('UPDATE lotes_local SET activo=0 WHERE id=?', [id]);
    router.replace('/(app)');
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={C.primary} /></View>;
  }
  if (!state) {
    return <View style={styles.center}><Text style={styles.empty}>Lote sin datos</Text></View>;
  }

  const lmax = calculateLMax(state.biomasa_kg, 27, state.especie);
  const harvestEst = estimateHarvestDate(
    state.peso_actual_g, state.dias_transcurridos, new Date(), state.especie
  );

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {state.cosechado && (
        <View style={styles.cosechadoBanner}>
          <Text style={styles.cosechadoTitle}>
            🎣 Ciclo cerrado{state.biomasa_cosechada_kg != null ? ` · ${state.biomasa_cosechada_kg} kg cosechados` : ''}
          </Text>
          <TouchableOpacity
            style={[styles.archiveBtn, archiving && styles.disabled]}
            onPress={() => void handleArchive()}
            disabled={archiving}
          >
            <Text style={styles.archiveBtnText}>{archiving ? 'Archivando…' : 'Archivar lote'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {state.retiro_activo && (
        <View style={styles.retiroBanner}>
          <Text style={styles.retiroText}>
            ⛔ PERÍODO DE RETIRO — No cosechar hasta {state.fecha_fin_retiro}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado del Ciclo</Text>
        <View style={styles.grid}>
          <Stat label="Días en ciclo" value={`${state.dias_transcurridos} d`} />
          <Stat label="Peces actuales" value={state.count_actual.toLocaleString()} />
          <Stat label="Biomasa" value={`${state.biomasa_kg.toFixed(1)} kg`} />
          <Stat label="Peso promedio" value={`${state.peso_actual_g.toFixed(0)} g`} />
          <Stat label="LMax hoy" value={`${lmax.lmax_kg} kg`} highlight />
          <Stat label="FCA acumulado" value={state.fca_acumulado ? state.fca_acumulado.toFixed(2) : '—'} />
          <Stat label="Cosecha estimada"
            value={harvestEst.days_remaining != null ? `~${harvestEst.days_remaining} d` : 'N/D'} />
          <Stat label="Alimento total" value={`${state.total_alimento_kg.toFixed(1)} kg`} />
        </View>
      </View>

      {state.ultimo_muestreo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Último Muestreo Biométrico</Text>
          <Text style={styles.muestreoText}>
            {state.ultimo_muestreo.fecha} · {state.ultimo_muestreo.peso_promedio_g} g promedio
            · CV {state.ultimo_muestreo.cv_pct}%
            {!state.ultimo_muestreo.valid && ' ⚠️ Alta variabilidad'}
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Acciones</Text>
      <View style={styles.actions}>
        {ACTIONS.map(a => (
          <TouchableOpacity
            key={a.key}
            style={[styles.actionBtn, { backgroundColor: a.color }]}
            onPress={() => router.push(`/(app)/lote/${id}/${a.key}`)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>{a.icon}</Text>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statVal, highlight && { color: C.primary }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll:        { flex: 1 },
  container:     { padding: S.md, paddingBottom: S.xl },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty:         { color: C.muted, fontSize: 16 },
  cosechadoBanner: { backgroundColor: C.okLight, borderRadius: 8, padding: S.sm, marginBottom: S.md },
  cosechadoTitle:  { color: C.ok, fontWeight: '700', textAlign: 'center', marginBottom: S.xs },
  archiveBtn:      { backgroundColor: C.ok, borderRadius: 6, paddingVertical: 6, paddingHorizontal: S.md, alignSelf: 'center' },
  archiveBtnText:  { color: C.white, fontWeight: '700', fontSize: 13 },
  disabled:        { opacity: 0.5 },
  retiroBanner:  { backgroundColor: C.dangerLight, borderRadius: 8, padding: S.sm, marginBottom: S.md },
  retiroText:    { color: C.danger, fontWeight: '700', textAlign: 'center' },
  section:       { backgroundColor: C.surface, borderRadius: 12, padding: S.md,
                   borderWidth: 1, borderColor: C.border, marginBottom: S.md },
  sectionTitle:  { fontSize: 13, fontWeight: '700', color: C.muted, textTransform: 'uppercase',
                   letterSpacing: 0.5, marginBottom: S.sm },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  stat:          { width: '45%' },
  statVal:       { fontSize: 18, fontWeight: '700', color: C.text },
  statLabel:     { fontSize: 12, color: C.muted, marginTop: 2 },
  muestreoText:  { fontSize: 13, color: C.text },
  actions:       { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  actionBtn:     { flex: 1, minWidth: '44%', borderRadius: 12, padding: S.md,
                   alignItems: 'center', justifyContent: 'center', minHeight: 90 },
  actionIcon:    { fontSize: 28, marginBottom: S.xs },
  actionLabel:   { color: C.white, fontWeight: '700', fontSize: 13, textAlign: 'center' },
});
