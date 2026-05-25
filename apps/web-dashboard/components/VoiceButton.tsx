'use client';

import { useState, useEffect, useRef } from 'react';

// Web Speech API types not in all TS lib versions — use structural typing
interface SR {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void) | null;
  start(): void;
  stop(): void;
}

interface Props {
  onResult: (text: string) => void;
  lang?: string;
}

export function VoiceButton({ onResult, lang = 'es-CO' }: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SR | null>(null);

  useEffect(() => {
    setSupported(
      typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
    );
  }, []);

  if (!supported) return null;

  function toggle() {
    if (listening) {
      recRef.current?.stop();
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SRClass: new () => SR =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

    const rec = new SRClass();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onstart = () => setListening(true);
    rec.onend   = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? '';
      if (transcript) onResult(transcript);
    };

    recRef.current = rec;
    rec.start();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? 'Toca para detener' : 'Dictar por voz'}
      aria-label={listening ? 'Detener dictado' : 'Dictar por voz'}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors shrink-0 ${
        listening
          ? 'bg-red-100 text-red-600 animate-pulse'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-primary-600'
      }`}
    >
      {listening ? (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      )}
    </button>
  );
}
