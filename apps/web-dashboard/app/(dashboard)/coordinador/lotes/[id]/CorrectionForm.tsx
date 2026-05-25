'use client';

import { useState, useTransition } from 'react';
import { saveCorrectionAction } from './actions';
import { VoiceButton } from '../../../../../components/VoiceButton';

interface Props {
  eventId: string;
  loteId: string;
  eventType: string;
}

export function CorrectionForm({ eventId, loteId, eventType }: Props) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [payloadJson, setPayloadJson] = useState('{}');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleOpen() {
    setOpen(true);
    setError(null);
    setSaved(false);
  }

  function handleClose() {
    setOpen(false);
    setMotivo('');
    setPayloadJson('{}');
    setError(null);
  }

  function handleSubmit() {
    setError(null);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(payloadJson) as Record<string, unknown>;
    } catch {
      setError('JSON inválido. Revisa el formato.');
      return;
    }

    startTransition(async () => {
      const result = await saveCorrectionAction({
        eventId,
        loteId,
        motivo,
        payloadCorregido: parsed,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setOpen(false);
      }
    });
  }

  if (saved) {
    return (
      <span className="text-xs text-green-600 font-medium">✓ Guardado</span>
    );
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="text-xs text-slate-500 hover:text-primary-600 border border-slate-200 hover:border-primary-300 rounded-lg px-2 py-1 transition-colors"
      >
        ✏️ Corregir
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Corregir evento</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-slate-500">
          Tipo: <span className="font-medium text-slate-700">{eventType}</span>
          <span className="ml-2 text-xs text-slate-400">({eventId.slice(0, 8)}…)</span>
        </p>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">
              Motivo de corrección <span className="text-red-500">*</span>
            </label>
            <VoiceButton onResult={text => setMotivo(v => v ? v + ' ' + text : text)} />
          </div>
          <input
            type="text"
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Ej: Error de digitación en cantidad"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Campos corregidos (JSON) <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-400">
            Solo incluye los campos que necesitan corrección, p.ej.{' '}
            <code className="bg-slate-100 px-1 rounded">{'{"cantidad": 25}'}</code>
          </p>
          <textarea
            value={payloadJson}
            onChange={e => setPayloadJson(e.target.value)}
            rows={5}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={pending}
            className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {pending ? 'Guardando…' : 'Guardar corrección'}
          </button>
        </div>
      </div>
    </div>
  );
}
