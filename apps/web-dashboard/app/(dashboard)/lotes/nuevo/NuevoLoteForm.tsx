'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { crearLoteAction } from './actions';
import type { SpeciesKey } from '@aquashell/shared';

interface Estanque {
  id: string;
  nombre: string;
  id_finca: string;
  fincas: { nombre: string } | null;
}

interface Props {
  estanques: Estanque[];
}

const ESPECIES: { key: SpeciesKey; label: string; icon: string }[] = [
  { key: 'tilapia_nilotica', label: 'Tilapia Nilótica', icon: '🐟' },
  { key: 'cachama',          label: 'Cachama',          icon: '🐠' },
  { key: 'trucha',           label: 'Trucha',           icon: '🐡' },
];

export function NuevoLoteForm({ estanques }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [estanque, setEstanque] = useState(estanques[0]?.id ?? '');
  const [especie, setEspecie] = useState<SpeciesKey>('tilapia_nilotica');
  const [nombre, setNombre] = useState('');
  const [countInput, setCountInput] = useState('');
  const [pesoInput, setPesoInput] = useState('');
  const [costoInput, setCostoInput] = useState('350');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const count = parseInt(countInput, 10);
    const peso  = parseFloat(pesoInput);
    const costo = parseFloat(costoInput) || 350;

    if (!estanque)       { setError('Selecciona un estanque.');         return; }
    if (!nombre.trim())  { setError('Escribe un nombre para el lote.'); return; }
    if (!count || count <= 0) { setError('Cantidad de peces inválida.'); return; }
    if (!peso  || peso  <= 0) { setError('Peso inicial inválido.');      return; }

    const sel = estanques.find(e => e.id === estanque);
    if (!sel) return;

    startTransition(async () => {
      const result = await crearLoteAction({
        id_estanque: sel.id,
        id_finca:    sel.id_finca,
        especie,
        nombre:      nombre.trim(),
        count_inicial:    count,
        peso_inicial_g:   peso,
        unidad_costo_cop: costo,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/dashboard/lotes/${result.loteId}`);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {/* Estanque */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Estanque</label>
        <div className="space-y-2">
          {estanques.map(e => (
            <label
              key={e.id}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                estanque === e.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="estanque"
                value={e.id}
                checked={estanque === e.id}
                onChange={() => setEstanque(e.id)}
                className="accent-primary-600"
              />
              <div>
                <p className="font-medium text-slate-800 text-sm">{e.nombre}</p>
                {e.fincas && (
                  <p className="text-xs text-slate-500">{e.fincas.nombre}</p>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Especie */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Especie</label>
        <div className="flex gap-3">
          {ESPECIES.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => setEspecie(s.key)}
              className={`flex-1 flex flex-col items-center py-3 rounded-xl border text-sm font-medium transition-colors ${
                especie === s.key
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="text-2xl mb-1">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nombre */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre del lote</label>
        <input
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Ej: Lote 2-A Tilapia"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
      </div>

      {/* Grid: count + peso */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Peces iniciales</label>
          <input
            type="number"
            min="1"
            value={countInput}
            onChange={e => setCountInput(e.target.value)}
            placeholder="1000"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Peso inicial (g/pez)</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={pesoInput}
            onChange={e => setPesoInput(e.target.value)}
            placeholder="5"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
      </div>

      {/* Costo semilla */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Costo por alevino (COP)</label>
        <input
          type="number"
          min="1"
          value={costoInput}
          onChange={e => setCostoInput(e.target.value)}
          placeholder="350"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {pending ? 'Iniciando ciclo…' : '🐣 Iniciar Ciclo de Producción'}
      </button>
    </form>
  );
}
