import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Descobre quais áreas restritas (ex.: 'pai', 'investimentos') foram liberadas para este usuário.
// Quem libera é você, direto no painel do Supabase (tabela "liberacoes").
export default function useLiberacoes(userId) {
  const [recursos, setRecursos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const { data, error } = await supabase.from('liberacoes').select('recurso');
      if (!ativo) return;
      // Se der erro (ex.: tabela ainda não criada), simplesmente nenhuma área restrita aparece.
      if (error) console.error(error);
      else setRecursos(data.map((l) => l.recurso));
      setCarregando(false);
    })();
    return () => {
      ativo = false;
    };
  }, [userId]);

  return { carregando, tem: (recurso) => recursos.includes(recurso) };
}
