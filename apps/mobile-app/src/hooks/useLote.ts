import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect, useCallback } from 'react';
import { projectLote, type LoteState } from '@aquashell/shared';
import { getEventsForLote } from '../db/eventStore';

export function useLote(id_lote: string) {
  const db = useSQLiteContext();
  const [state, setState] = useState<LoteState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const events = await getEventsForLote(db, id_lote);
    setState(projectLote(events));
    setLoading(false);
  }, [db, id_lote]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { state, loading, refresh };
}
