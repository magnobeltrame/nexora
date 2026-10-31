import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const identidade = (x) => x;

/**
 * Cuida de uma tabela do Supabase: carregar, inserir, editar, excluir e alternar (marcar/desmarcar).
 * A tela atualiza na hora; se o banco recusar, avisa o usuário.
 */
export default function useTabela(
  tabela,
  userId,
  { ordenarPor = 'created_at', ascendente = false, converter = identidade, paraBanco = identidade, aoErro } = {}
) {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from(tabela)
      .select('*')
      .order(ordenarPor, { ascending: ascendente });
    if (error) {
      console.error(error);
      aoErro?.('Não foi possível carregar seus dados. Verifique a conexão e tente de novo.');
    } else {
      setItens(data.map(converter));
    }
    setCarregando(false);
  }, [tabela, ordenarPor, ascendente, converter, aoErro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const falhar = (error, mensagem) => {
    console.error(error);
    aoErro?.(mensagem);
    return false;
  };

  const inserir = async (dados, mensagem = 'Não foi possível salvar.') => {
    const { data, error } = await supabase
      .from(tabela)
      .insert({ ...paraBanco(dados), user_id: userId })
      .select()
      .single();
    if (error) return falhar(error, mensagem);
    setItens((prev) => [converter(data), ...prev]);
    return true;
  };

  // Se "conflito" for informado (ex.: 'user_id,nome'), itens repetidos são atualizados em vez de dar erro.
  const inserirVarios = async (lista, mensagem = 'Não foi possível salvar.', conflito) => {
    if (!lista.length) return true;
    const linhas = lista.map((item) => ({ ...paraBanco(item), user_id: userId }));
    if (conflito) {
      const { error } = await supabase.from(tabela).upsert(linhas, { onConflict: conflito });
      if (error) return falhar(error, mensagem);
      await carregar();
      return true;
    }
    const { data, error } = await supabase.from(tabela).insert(linhas).select();
    if (error) return falhar(error, mensagem);
    setItens((prev) => [...data.map(converter), ...prev]);
    return true;
  };

  const editar = async (id, campos, mensagem = 'Não foi possível salvar.') => {
    const { data, error } = await supabase
      .from(tabela)
      .update(paraBanco(campos))
      .eq('id', id)
      .select()
      .single();
    if (error) return falhar(error, mensagem);
    setItens((prev) => prev.map((item) => (item.id === id ? converter(data) : item)));
    return true;
  };

  const excluir = async (id, mensagem = 'Não foi possível excluir.') => {
    const { error } = await supabase.from(tabela).delete().eq('id', id);
    if (error) return falhar(error, mensagem);
    setItens((prev) => prev.filter((item) => item.id !== id));
    return true;
  };

  const alternar = async (id, campo, mensagem = 'Não foi possível atualizar.') => {
    const atual = itens.find((item) => item.id === id);
    if (!atual) return;
    const novo = !atual[campo];
    setItens((prev) => prev.map((item) => (item.id === id ? { ...item, [campo]: novo } : item)));
    const { error } = await supabase.from(tabela).update({ [campo]: novo }).eq('id', id);
    if (error) {
      setItens((prev) => prev.map((item) => (item.id === id ? { ...item, [campo]: !novo } : item)));
      falhar(error, mensagem);
    }
  };

  return { itens, carregando, carregar, inserir, inserirVarios, editar, excluir, alternar };
}
