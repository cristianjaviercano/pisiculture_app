import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { OperationalEvent } from '@aquashell/shared';
import { getEventsForLote } from '../../../../src/db/eventStore';
import { useEffect } from 'react';
import { C, S } from '../../../../src/theme';

const TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  LOTE_INICIADO:          { icon: '🐣', label: 'Inicio de lote',        color: '#7c3aed' },
  AGUA_REGISTRADA:        { icon: '💧', label: 'Calidad del agua',       color: '#0284c7' },
  ALIMENTO_SUMINISTRADO:  { icon: '🌾', label: 'Alimento suministrado',  color: '#059669' },
  MORTALIDAD_REGISTRADA:  { icon: '💀', label: 'Mortalidad',             color: '#dc2626' },
  MUESTREO_BIOMETRICO:    { icon: '📏', label: 'Muestreo biométrico',    color: '#d97706' },
  INSUMO_APLICADO:        { icon: '💊', label: 'Insumo aplicado',        color: '#dc2626' },
  LOTE_COSECHADO:         { icon: '🎣', label: 'Cosecha',                color: '#16a34a' },
  CORRECCION_REGISTRADA:  { icon: '✏️', label: 'Corrección',            color: '#64748b' },
};

const SYNC_COLORS: Record<string, string> = {
  synced:   '#16a34a',
  pending:  '#d97706',
  conflict: '#dc2626',
};

function fmtDate(ts: string) {
  const d = new Date(ts);
  return `${d.toLocaleDateString('es-CO')} ${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
}

function payloadSummary(ev: OperationalEvent): string {
  const p = ev.payload as Record<string, unknown>;
  switch (ev.type) {
    case 'ALIMENTO_SUMINISTRADO':
      return `${p['kg_suministrado']} kg · ${p['n_raciones']} raciones · T° ${p['temperatura_agua'] ?? '—'}°C`;
    case 'AGUA_REGISTRADA':
      return Object.entries(p).filter(([, v]) => v != null)
        .map(([k, v]) => `${k}: ${v}`).join(' · ');
    case 'MORTALIDAD_REGISTRADA':
      return `${p['cantidad']} peces · causa: ${p['causa_presunta'] ?? '—'}`;
    case 'MUESTREO_BIOMETRICO':
      return `${p['n']} peces · prom. ${p['peso_promedio_g']} g · CV ${p['cv_pct']}%`;
    case 'INSUMO_APLICADO':
      return `${p['cantidad_aplicada']} ${p['unidad']} · retiro ${p['periodo_retiro_dias']} d`;
    case 'LOTE_INICIADO':
      return `${p['count_inicial']} peces · ${p['peso_inicial_g']} g/pez · ${p['especie']}`;
    default:
      return JSON.stringify(p).slice(0, 80);
  }
}

export default function HistorialScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [events, setEvents] = useState<OperationalEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    const evs = await getEventsForLote(db, id);
    setEvents([...evs].reverse()); // Most recent first
  }, [db, id]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => { void load(); }, [load]);

  const filtered = filter ? events.filter(e => e.type === filter) : events;
  const types = [...new Set(events.map(e => e.type))];

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <FlatList
        horizontal
        data={[null, ...types]}
        keyExtractor={item => item ?? 'all'}
        style={styles.filterList}
        contentContainerStyle={styles.filterContent}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const meta = item ? TYPE_META[item] : null;
          const active = filter === item;
          return (
            <TouchableOpacity
              style={[styles.chip, active && { backgroundColor: meta?.color ?? C.primary }]}
              onPress={() => setFilter(active ? null : item)}
            >
              <Text style={[styles.chipText, active && { color: C.white }]}>
                {meta ? `${meta.icon} ${meta.label}` : `Todos (${events.length})`}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Events list */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[C.primary]} />}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Sin eventos{filter ? ' de este tipo' : ''}</Text>
          </View>
        }
        renderItem={({ item: ev }) => {
          const meta = TYPE_META[ev.type] ?? { icon: '●', label: ev.type, color: C.muted };
          return (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconBox, { backgroundColor: meta.color + '20' }]}>
                  <Text style={styles.icon}>{meta.icon}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.typeLabel, { color: meta.color }]}>{meta.label}</Text>
                  <View style={[styles.syncDot, { backgroundColor: SYNC_COLORS[ev.sync_status] ?? C.muted }]} />
                </View>
                <Text style={styles.summary}>{payloadSummary(ev)}</Text>
                <Text style={styles.ts}>{fmtDate(ev.ts)}</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.bg },
  filterList:    { maxHeight: 48, backgroundColor: C.surface, borderBottomWidth: 1, borderColor: C.border },
  filterContent: { paddingHorizontal: S.sm, paddingVertical: S.xs, gap: S.xs, flexDirection: 'row' },
  chip:          { paddingHorizontal: S.sm, paddingVertical: S.xs, borderRadius: 20,
                   borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  chipText:      { fontSize: 12, color: C.text },
  listContent:   { padding: S.sm, gap: S.xs },
  emptyContainer:{ flex: 1 },
  empty:         { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyIcon:     { fontSize: 40 },
  emptyText:     { color: C.muted, marginTop: S.sm },
  card:          { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 10,
                   padding: S.sm, borderWidth: 1, borderColor: C.border, gap: S.sm },
  cardLeft:      { justifyContent: 'flex-start' },
  iconBox:       { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  icon:          { fontSize: 18 },
  cardBody:      { flex: 1 },
  cardHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  typeLabel:     { fontSize: 13, fontWeight: '700' },
  syncDot:       { width: 8, height: 8, borderRadius: 4 },
  summary:       { fontSize: 12, color: C.text, marginBottom: 2 },
  ts:            { fontSize: 11, color: C.muted },
});
