'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveEventAction } from './actions';
import { VoiceButton } from '../../../../../components/VoiceButton';

interface Props {
  loteId: string;
}

type EventType =
  | 'ALIMENTO_SUMINISTRADO'
  | 'AGUA_REGISTRADA'
  | 'MORTALIDAD_REGISTRADA'
  | 'MUESTREO_BIOMETRICO'
  | 'LOTE_COSECHADO';

const EVENT_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'ALIMENTO_SUMINISTRADO', label: '🌾 Alimento suministrado' },
  { value: 'AGUA_REGISTRADA',       label: '💧 Calidad del agua' },
  { value: 'MORTALIDAD_REGISTRADA', label: '💀 Mortalidad' },
  { value: 'MUESTREO_BIOMETRICO',   label: '📏 Muestreo biométrico' },
  { value: 'LOTE_COSECHADO',        label: '🎣 Cosecha' },
];

function parsePesos(raw: string): number[] {
  return raw
    .split(/[\s,;]+/)
    .map(s => parseFloat(s.trim()))
    .filter(n => !isNaN(n) && n > 0);
}

function calcMuestreo(pesos: number[]) {
  const n = pesos.length;
  const avg = pesos.reduce((a, b) => a + b, 0) / n;
  const variance = pesos.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / n;
  const cv = (Math.sqrt(variance) / avg) * 100;
  return {
    pesos_g: pesos,
    peso_promedio_g: Math.round(avg * 10) / 10,
    cv_pct: Math.round(cv * 10) / 10,
    valid: n >= 15,
    n,
  };
}

function Field({
  label, unit, value, onChange, placeholder, required, type = 'number',
}: {
  label: string; unit?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">
        {label}{unit && <span className="text-slate-400 font-normal"> ({unit})</span>}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400"
      />
    </div>
  );
}

export function EventForm({ loteId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<EventType>('ALIMENTO_SUMINISTRADO');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // ALIMENTO
  const [kg, setKg] = useState('');
  const [lmax, setLmax] = useState('');
  const [raciones, setRaciones] = useState('2');
  const [tempAlim, setTempAlim] = useState('');

  // AGUA
  const [temp, setTemp] = useState('');
  const [od, setOd] = useState('');
  const [ph, setPh] = useState('');
  const [tan, setTan] = useState('');
  const [nitrito, setNitrito] = useState('');
  const [alc, setAlc] = useState('');
  const [secchi, setSecchi] = useState('');

  // MORTALIDAD
  const [cantidad, setCantidad] = useState('');
  const [causa, setCausa] = useState('');
  const [notasMort, setNotasMort] = useState('');

  // MUESTREO
  const [pesosRaw, setPesosRaw] = useState('');

  // COSECHA
  const [biomasa, setBiomasa] = useState('');
  const [precio, setPrecio] = useState('');
  const [notasCosecha, setNotasCosecha] = useState('');

  function reset() {
    setKg(''); setLmax(''); setRaciones('2'); setTempAlim('');
    setTemp(''); setOd(''); setPh(''); setTan(''); setNitrito(''); setAlc(''); setSecchi('');
    setCantidad(''); setCausa(''); setNotasMort('');
    setPesosRaw('');
    setBiomasa(''); setPrecio(''); setNotasCosecha('');
    setError(null);
  }

  function handleClose() { setOpen(false); reset(); }

  function buildPayload(): { payload: Record<string, unknown> } | { error: string } {
    if (type === 'ALIMENTO_SUMINISTRADO') {
      const kgN = parseFloat(kg);
      const lmaxN = parseFloat(lmax);
      const racN = parseInt(raciones, 10);
      if (!kg || isNaN(kgN) || kgN <= 0) return { error: 'Ingresa los kg suministrados.' };
      if (!lmax || isNaN(lmaxN) || lmaxN <= 0) return { error: 'Ingresa el Lmax (kg).' };
      if (!raciones || isNaN(racN) || racN < 1) return { error: 'Ingresa el número de raciones.' };
      const p: Record<string, unknown> = { kg_suministrado: kgN, lmax_kg: lmaxN, n_raciones: racN };
      if (tempAlim && !isNaN(parseFloat(tempAlim))) p.temperatura_agua = parseFloat(tempAlim);
      return { payload: p };
    }

    if (type === 'AGUA_REGISTRADA') {
      const p: Record<string, unknown> = {};
      if (temp) p.temperatura = parseFloat(temp);
      if (od)   p.oxigeno_disuelto = parseFloat(od);
      if (ph)   p.ph = parseFloat(ph);
      if (tan)  p.tan = parseFloat(tan);
      if (nitrito) p.nitrito = parseFloat(nitrito);
      if (alc) p.alcalinidad = parseFloat(alc);
      if (secchi) p.disco_secchi = parseFloat(secchi);
      if (!Object.keys(p).length) return { error: 'Ingresa al menos un parámetro.' };
      return { payload: p };
    }

    if (type === 'MORTALIDAD_REGISTRADA') {
      const c = parseInt(cantidad, 10);
      if (!cantidad || isNaN(c) || c <= 0) return { error: 'Ingresa la cantidad de muertes.' };
      const p: Record<string, unknown> = { cantidad: c };
      if (causa.trim()) p.causa_presunta = causa.trim();
      if (notasMort.trim()) p.notas = notasMort.trim();
      return { payload: p };
    }

    if (type === 'MUESTREO_BIOMETRICO') {
      const pesos = parsePesos(pesosRaw);
      if (pesos.length < 15) return { error: 'Se requieren mínimo 15 pesos para un muestreo válido (separados por coma o espacio).' };
      return { payload: calcMuestreo(pesos) };
    }

    // LOTE_COSECHADO
    const bioN = parseFloat(biomasa);
    const precN = parseFloat(precio);
    if (!biomasa || isNaN(bioN) || bioN <= 0) return { error: 'Ingresa la biomasa cosechada (kg).' };
    if (!precio || isNaN(precN) || precN <= 0) return { error: 'Ingresa el precio de venta (COP/kg).' };
    const p: Record<string, unknown> = { biomasa_cosechada_kg: bioN, precio_venta_cop_kg: precN };
    if (notasCosecha.trim()) p.notas = notasCosecha.trim();
    return { payload: p };
  }

  function handleSubmit() {
    setError(null);
    const result = buildPayload();
    if ('error' in result) { setError(result.error); return; }

    startTransition(async () => {
      const res = await saveEventAction({ type, loteId, payload: result.payload });
      if (res.error) {
        setError(res.error);
      } else {
        handleClose();
        router.refresh();
      }
    });
  }

  const pesos = parsePesos(pesosRaw);
  const muestreoPreview = pesos.length >= 3 ? calcMuestreo(pesos) : null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors"
      >
        + Registrar evento
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">Registrar evento</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>

        {/* Event type selector */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Tipo de evento</label>
          <select
            value={type}
            onChange={e => { setType(e.target.value as EventType); setError(null); }}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            {EVENT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Dynamic fields */}
        {type === 'ALIMENTO_SUMINISTRADO' && (
          <div className="space-y-3">
            <Field label="Alimento suministrado" unit="kg" value={kg} onChange={setKg} required placeholder="2.4" />
            <Field label="Lmax" unit="kg" value={lmax} onChange={setLmax} required placeholder="6.91" />
            <Field label="N° de raciones" value={raciones} onChange={setRaciones} required placeholder="2" />
            <Field label="Temperatura del agua" unit="°C" value={tempAlim} onChange={setTempAlim} placeholder="27" />
          </div>
        )}

        {type === 'AGUA_REGISTRADA' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Completa los parámetros medidos. Al menos uno es obligatorio.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Temperatura" unit="°C"        value={temp}    onChange={setTemp}    placeholder="28" />
              <Field label="OD"          unit="mg/L"       value={od}      onChange={setOd}      placeholder="7.2" />
              <Field label="pH"          unit="pH"         value={ph}      onChange={setPh}      placeholder="7.5" />
              <Field label="TAN"         unit="mg/L"       value={tan}     onChange={setTan}     placeholder="0.4" />
              <Field label="Nitrito"     unit="mg/L"       value={nitrito} onChange={setNitrito} placeholder="0.05" />
              <Field label="Alcalinidad" unit="mg/L CaCO₃" value={alc}     onChange={setAlc}     placeholder="150" />
              <Field label="Disco Secchi" unit="cm"        value={secchi}  onChange={setSecchi}  placeholder="45" />
            </div>
          </div>
        )}

        {type === 'MORTALIDAD_REGISTRADA' && (
          <div className="space-y-3">
            <Field label="Cantidad de muertes" value={cantidad} onChange={setCantidad} required placeholder="12" />
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Causa presunta <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <VoiceButton onResult={text => setCausa(v => v ? v + ' ' + text : text)} />
              </div>
              <input
                type="text"
                value={causa}
                onChange={e => setCausa(e.target.value)}
                placeholder="hipoxia, infección…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Notas <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <VoiceButton onResult={text => setNotasMort(v => v ? v + ' ' + text : text)} />
              </div>
              <textarea
                value={notasMort}
                onChange={e => setNotasMort(e.target.value)}
                rows={2}
                placeholder="Observaciones adicionales"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>
        )}

        {type === 'MUESTREO_BIOMETRICO' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Pesos individuales <span className="text-slate-400 font-normal">(g, separados por coma o espacio)</span>
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                value={pesosRaw}
                onChange={e => setPesosRaw(e.target.value)}
                rows={4}
                placeholder="120, 118, 125, 115, 130, 122..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            {muestreoPreview && (
              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1">
                <div className="flex gap-4">
                  <span>n = <strong>{muestreoPreview.n}</strong></span>
                  <span>Promedio = <strong>{muestreoPreview.peso_promedio_g} g</strong></span>
                  <span>CV = <strong>{muestreoPreview.cv_pct}%</strong></span>
                  <span className={muestreoPreview.valid ? 'text-green-600' : 'text-amber-600'}>
                    {muestreoPreview.valid ? '✓ válido' : '⚠ n < 15'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {type === 'LOTE_COSECHADO' && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
              ⚠ Esta acción cierra el ciclo del lote.
            </div>
            <Field label="Biomasa cosechada" unit="kg" value={biomasa} onChange={setBiomasa} required placeholder="850" />
            <Field label="Precio de venta" unit="COP/kg" value={precio} onChange={setPrecio} required placeholder="9500" />
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Notas <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <VoiceButton onResult={text => setNotasCosecha(v => v ? v + ' ' + text : text)} />
              </div>
              <textarea
                value={notasCosecha}
                onChange={e => setNotasCosecha(e.target.value)}
                rows={2}
                placeholder="Comprador, destino, calidad…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Actions */}
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
            className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {pending ? 'Guardando…' : 'Guardar evento'}
          </button>
        </div>
      </div>
    </div>
  );
}
