import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { projectLote, calculateLMax } from '@aquashell/shared';
import { getEventsForLote, getPendingCount } from '../../src/db/eventStore';
import { useSession } from '../../src/hooks/useSession';
import { SyncBanner } from '../../src/components/SyncBanner';
import { C, S } from '../../src/theme';

interface LoteRow {
  id: string;
  nombre: string;
  especie: string;
  id_estanque: string;
}

interface LoteCardData extends LoteRow {
  dias: number;
  count: number;
  biomasa: number;
  pesoActual: number;
  lmax: number;
  retiro: boolean;
  pending: number;
}

function especie(key: string) {
  if (key === 'tilapia_nilotica') return 'Tilapia Nilótica';
  if (key === 'cachama') return 'Cachama';
  return 'Trucha';
}

export default function Dashboard() {
  const db = useSQLiteContext();
  const { user, logout } = useSession();
  const [lotes, setLotes] = useState<LoteCardData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const totalPending = lotes.reduce((s, l) => s + l.pending, 0);

  const load = useCallback(async () => {
    const rows = await db.getAllAsync<LoteRow>(
      'SELECT id, nombre, especie, id_estanque FROM lotes_local WHERE activo=1'
    );
    const cards: LoteCardData[] = [];
    for (const row of rows) {
      const events = await getEventsForLote(db, row.id);
      const state = projectLote(events);
      const pending = await getPendingCount(db, row.id);
      if (!state) continue;
      const lmax = calculateLMax(state.biomasa_kg, 27).lmax_kg;
      cards.push({
        ...row,
        dias: state.dias_transcurridos,
        count: state.count_actual,
        biomasa: state.biomasa_kg,
        pesoActual: state.peso_actual_g,
        lmax,
        retiro: state.retiro_activo,
        pending,
      });
    }
    setLotes(cards);
  }, [db]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => { void load(); }, [load]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.userBar}>
        <Text style={styles.greeting}>👋 {user?.nombre ?? ''}</Text>
        <TouchableOpacity onPress={() => { void logout().then(() => router.replace('/login')); }}>
          <Text style={styles.logoutBtn}>Salir</Text>
        </TouchableOpacity>
      </View>

      <SyncBanner pendingTotal={totalPending} onSynced={() => void load()} />

      <FlatList
        data={lotes}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[C.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🐠</Text>
            <Text style={styles.emptyText}>No hay lotes activos</Text>
            <Text style={styles.emptyHint}>Toca + para iniciar un nuevo ciclo</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(app)/lote/${item.id}`)}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.nombre}</Text>
              {item.pending > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.pending} pendiente{item.pending > 1 ? 's' : ''}</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardSub}>{especie(item.especie)}</Text>

            {item.retiro && (
              <View style={styles.retiroBanner}>
                <Text style={styles.retiroText}>⛔ PERÍODO DE RETIRO ACTIVO</Text>
              </View>
            )}

            <View style={styles.metrics}>
              <Metric label="Días" value={String(item.dias)} />
              <Metric label="Peces" value={item.count.toLocaleString()} />
              <Metric label="Biomasa" value={`${item.biomasa.toFixed(1)} kg`} />
              <Metric label="Peso" value={`${item.pesoActual.toFixed(0)} g`} />
              <Metric label="LMax hoy" value={`${item.lmax.toFixed(2)} kg`} />
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/lote/nuevo')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricVal}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  userBar:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingHorizontal: S.md, paddingVertical: S.sm, backgroundColor: C.primary },
  greeting:     { color: C.white, fontWeight: '600', fontSize: 14 },
  logoutBtn:    { color: C.primaryLight, fontSize: 13 },
  list:         { padding: S.md, gap: S.sm },
  card:         { backgroundColor: C.surface, borderRadius: 12, padding: S.md,
                  borderWidth: 1, borderColor: C.border,
                  shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  cardTitle:    { fontSize: 17, fontWeight: '700', color: C.text },
  cardSub:      { fontSize: 13, color: C.muted, marginBottom: S.sm },
  badge:        { backgroundColor: C.warn, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:    { color: C.white, fontSize: 11, fontWeight: '600' },
  retiroBanner: { backgroundColor: C.dangerLight, borderRadius: 6, padding: S.xs, marginBottom: S.sm },
  retiroText:   { color: C.danger, fontWeight: '700', fontSize: 12 },
  metrics:      { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.xs },
  metric:       { minWidth: 70 },
  metricVal:    { fontSize: 15, fontWeight: '700', color: C.primary },
  metricLabel:  { fontSize: 11, color: C.muted, marginTop: 1 },
  empty:        { alignItems: 'center', paddingTop: 80 },
  emptyIcon:    { fontSize: 48 },
  emptyText:    { color: C.muted, marginTop: S.md, fontSize: 15 },
  emptyHint:    { color: C.muted, marginTop: S.xs, fontSize: 13 },
  fab:          { position: 'absolute', bottom: 28, right: 24,
                  width: 56, height: 56, borderRadius: 28,
                  backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  fabText:      { color: C.white, fontSize: 30, lineHeight: 34, fontWeight: '300' },
});
