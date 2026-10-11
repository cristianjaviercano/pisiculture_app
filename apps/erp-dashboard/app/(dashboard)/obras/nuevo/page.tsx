'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NuevaObraPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: '', cliente: '', valor_contrato: '',
    fecha_inicio: '', fecha_fin_proyectada: '', jefe_obra: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 800)); // demo delay
    router.push('/obras');
  };

  const label: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 500,
    color: 'var(--tx2)', marginBottom: '6px',
  };
  const input: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    border: '1px solid var(--brd)', borderRadius: 'var(--radius-sm)',
    fontSize: '13px', color: 'var(--tx)', background: 'var(--bg)',
    outline: 'none',
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ fontSize: '12px', color: 'var(--tx3)', marginBottom: '16px' }}>
        <Link href="/obras" style={{ color: 'var(--ac)' }}>Obras</Link> / Nueva obra
      </div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 600, marginBottom: '24px' }}>
        Nueva obra
      </h1>

      <form onSubmit={handleSubmit}>
        <div style={{
          background: 'var(--sur)', border: '1px solid var(--brd)',
          borderRadius: 'var(--radius)', padding: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label}>Nombre de la obra *</label>
              <input required style={input} value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Hospital Regional de Montería" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label}>Cliente *</label>
              <input required style={input} value={form.cliente} onChange={e => set('cliente', e.target.value)} placeholder="Ej: Gobernación de Córdoba" />
            </div>
            <div>
              <label style={label}>Valor del contrato (COP) *</label>
              <input required type="number" min="0" style={input} value={form.valor_contrato} onChange={e => set('valor_contrato', e.target.value)} placeholder="1850000000" />
            </div>
            <div>
              <label style={label}>Jefe de obra</label>
              <input style={input} value={form.jefe_obra} onChange={e => set('jefe_obra', e.target.value)} placeholder="Nombre del responsable" />
            </div>
            <div>
              <label style={label}>Fecha de inicio *</label>
              <input required type="date" style={input} value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} />
            </div>
            <div>
              <label style={label}>Fecha de entrega estimada *</label>
              <input required type="date" style={input} value={form.fecha_fin_proyectada} onChange={e => set('fecha_fin_proyectada', e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button type="submit" disabled={saving} style={{
            padding: '10px 20px', background: saving ? 'var(--tx4)' : 'var(--ac)',
            color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
            fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Guardando…' : 'Crear obra'}
          </button>
          <Link href="/obras" style={{
            padding: '10px 20px', background: 'transparent',
            border: '1px solid var(--brd)', borderRadius: 'var(--radius-sm)',
            fontSize: '13px', color: 'var(--tx2)',
          }}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
