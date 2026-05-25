'use server';

import { createSupabaseServerClient, isSupabaseConfigured } from '../../../../../lib/supabase/server';

const ALLOWED_EVENT_TYPES = new Set([
  'ALIMENTO_SUMINISTRADO',
  'AGUA_REGISTRADA',
  'MORTALIDAD_REGISTRADA',
  'MUESTREO_BIOMETRICO',
  'LOTE_COSECHADO',
]);

function uuid() {
  return crypto.randomUUID();
}

async function resolveUser(supabase: ReturnType<typeof createSupabaseServerClient>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;
  const { data } = await supabase
    .from('usuarios')
    .select('id, id_tenant')
    .eq('auth_uid', user.id)
    .single();
  if (!data) return null;
  return { userId: data.id as string, tenantId: data.id_tenant as string };
}

// ── Corrección ────────────────────────────────────────────────────────────────

export interface SaveCorrectionInput {
  eventId: string;
  loteId: string;
  motivo: string;
  payloadCorregido: Record<string, unknown>;
}

export async function saveCorrectionAction(
  input: SaveCorrectionInput,
): Promise<{ error?: string }> {
  if (!input.motivo.trim()) return { error: 'El motivo es obligatorio.' };
  if (!Object.keys(input.payloadCorregido).length) {
    return { error: 'El payload corregido no puede estar vacío.' };
  }

  if (!isSupabaseConfigured()) return {};

  const supabase = createSupabaseServerClient();
  const resolved = await resolveUser(supabase);
  if (!resolved) return { error: 'Sesión no válida. Vuelve a iniciar sesión.' };

  const { userId, tenantId } = resolved;
  const { error } = await supabase.from('evento_operativo').insert({
    id: uuid(),
    type: 'CORRECCION_REGISTRADA',
    id_lote: input.loteId,
    id_tenant: tenantId,
    id_usuario: userId,
    ts: new Date().toISOString(),
    sync_status: 'synced',
    payload: {
      evento_original_id: input.eventId,
      motivo: input.motivo.trim(),
      payload_corregido: input.payloadCorregido,
    },
  });

  if (error) return { error: error.message };
  return {};
}

// ── Nuevo evento ──────────────────────────────────────────────────────────────

export interface SaveEventInput {
  type: string;
  loteId: string;
  payload: Record<string, unknown>;
}

export async function saveEventAction(
  input: SaveEventInput,
): Promise<{ error?: string }> {
  if (!ALLOWED_EVENT_TYPES.has(input.type)) {
    return { error: 'Tipo de evento no permitido.' };
  }
  if (!Object.keys(input.payload).length) return { error: 'Payload vacío.' };

  if (!isSupabaseConfigured()) return {};

  const supabase = createSupabaseServerClient();
  const resolved = await resolveUser(supabase);
  if (!resolved) return { error: 'Sesión no válida. Vuelve a iniciar sesión.' };

  const { userId, tenantId } = resolved;

  // Verify the lote belongs to this tenant before inserting
  const { data: lote } = await supabase
    .from('lotes')
    .select('id')
    .eq('id', input.loteId)
    .eq('id_tenant', tenantId)
    .single();
  if (!lote) return { error: 'Lote no encontrado en tu cuenta.' };

  const { error } = await supabase.from('evento_operativo').insert({
    id: uuid(),
    type: input.type,
    id_lote: input.loteId,
    id_tenant: tenantId,
    id_usuario: userId,
    ts: new Date().toISOString(),
    sync_status: 'synced',
    payload: input.payload,
  });

  if (error) return { error: error.message };
  return {};
}
