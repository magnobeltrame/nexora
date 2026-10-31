import { useState, useEffect } from 'react';
import { aplicarTema, lerPreferenciaTema, salvarPreferenciaTema } from '../lib/tema';

export default function useTema() {
  const [preferencia, setPreferencia] = useState(lerPreferenciaTema);

  // No modo automático, acompanha quando o celular troca entre claro e escuro
  useEffect(() => {
    if (preferencia !== 'auto') return undefined;
    const consulta = window.matchMedia('(prefers-color-scheme: dark)');
    const aoMudar = () => aplicarTema('auto');
    consulta.addEventListener('change', aoMudar);
    return () => consulta.removeEventListener('change', aoMudar);
  }, [preferencia]);

  const escolher = (nova) => {
    salvarPreferenciaTema(nova);
    setPreferencia(nova);
  };

  return { preferencia, escolher };
}
