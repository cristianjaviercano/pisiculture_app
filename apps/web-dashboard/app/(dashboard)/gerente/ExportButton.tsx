'use client';

interface Row {
  estanque: string;
  finca: string;
  especie: string;
  dias: number;
  peces: number;
  biomasa: number;
  pesoPromG: number;
  lmax: number;
  fca: number | null;
  cosechaEstDias: number | null;
  alimentoKg: number;
  roiPct: number | null;
  margenCop: number;
  retiro: boolean;
}

interface Props {
  rows: Row[];
}

function escapeCsv(val: string | number | null | boolean): string {
  if (val === null || val === undefined) return '';
  const s = String(val);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export function ExportButton({ rows }: Props) {
  function handleExport() {
    const headers = [
      'Estanque', 'Finca', 'Especie', 'Días ciclo', 'Peces', 'Biomasa (kg)',
      'Peso prom (g)', 'LMax (kg)', 'FCA', 'Cosecha est (días)',
      'Alimento (kg)', 'ROI (%)', 'Margen (COP)', 'En retiro',
    ];

    const lines: string[] = [headers.map(escapeCsv).join(',')];
    for (const r of rows) {
      lines.push([
        r.estanque, r.finca, r.especie, r.dias, r.peces,
        r.biomasa.toFixed(2), r.pesoPromG.toFixed(0),
        r.lmax.toFixed(2), r.fca?.toFixed(2) ?? '',
        r.cosechaEstDias ?? '', r.alimentoKg.toFixed(1),
        r.roiPct?.toFixed(1) ?? '', Math.round(r.margenCop),
        r.retiro ? 'Sí' : 'No',
      ].map(escapeCsv).join(','));
    }

    const csv  = lines.join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `aquashell-gerente-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="bg-white border border-slate-200 hover:border-primary-400 text-slate-700 hover:text-primary-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
    >
      ⬇ Exportar CSV
    </button>
  );
}
