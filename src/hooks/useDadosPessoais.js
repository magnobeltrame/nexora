import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import useTabela from './useTabela';

const converterValor = (linha) => ({ ...linha, valor: Number(linha.valor) });

export default function useDadosPessoais(userId, aoErro) {
  const receitasT = useTabela('receitas', userId, { ordenarPor: 'data', converter: converterValor, aoErro });
  const despesasT = useTabela('despesas', userId, { ordenarPor: 'vencimento', converter: converterValor, aoErro });

  const [limites, setLimites] = useState({});
  const [limitesCarregados, setLimitesCarregados] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const { data, error } = await supabase.from('limites_orcamento').select('categoria, valor');
      if (!ativo) return;
      if (error) {
        console.error(error);
        aoErro?.('Não foi possível carregar seus limites de orçamento.');
      } else {
        setLimites(Object.fromEntries(data.map((l) => [l.categoria, Number(l.valor)])));
      }
      setLimitesCarregados(true);
    })();
    return () => {
      ativo = false;
    };
  }, [aoErro]);

  const definirLimite = async (categoria, valor) => {
    const { error } = await supabase
      .from('limites_orcamento')
      .upsert({ user_id: userId, categoria, valor }, { onConflict: 'user_id,categoria' });
    if (error) {
      console.error(error);
      aoErro?.('Não foi possível salvar o limite.');
      return false;
    }
    setLimites((prev) => ({ ...prev, [categoria]: valor }));
    return true;
  };

  const removerLimite = async (categoria) => {
    const { error } = await supabase.from('limites_orcamento').delete().eq('categoria', categoria);
    if (error) {
      console.error(error);
      aoErro?.('Não foi possível remover o limite.');
      return false;
    }
    setLimites((prev) => {
      const novo = { ...prev };
      delete novo[categoria];
      return novo;
    });
    return true;
  };

  const salvarReceita = (id, dados) =>
    id
      ? receitasT.editar(id, dados, 'Não foi possível salvar a receita.')
      : receitasT.inserir(dados, 'Não foi possível salvar a receita.');

  const salvarDespesa = (id, dados) =>
    id
      ? despesasT.editar(id, dados, 'Não foi possível salvar a despesa.')
      : despesasT.inserir(dados, 'Não foi possível salvar a despesa.');

  // Usado na importação do navegador e ao importar o mês anterior
  const importar = async ({ receitas = [], despesas = [], limites: listaLimites = [] }) => {
    const r = await receitasT.inserirVarios(receitas, 'Não foi possível importar as receitas.');
    const d = await despesasT.inserirVarios(despesas, 'Não foi possível importar as despesas.');
    let l = true;
    if (listaLimites.length) {
      const { error } = await supabase.from('limites_orcamento').upsert(
        listaLimites.map((x) => ({ user_id: userId, categoria: x.categoria, valor: x.valor })),
        { onConflict: 'user_id,categoria' }
      );
      if (error) {
        console.error(error);
        aoErro?.('Não foi possível importar os limites de orçamento.');
        l = false;
      } else {
        setLimites((prev) => ({
          ...prev,
          ...Object.fromEntries(listaLimites.map((x) => [x.categoria, x.valor])),
        }));
      }
    }
    return r && d && l;
  };

  return {
    carregando: receitasT.carregando || despesasT.carregando || !limitesCarregados,
    receitas: receitasT.itens,
    despesas: despesasT.itens,
    limites,
    salvarReceita,
    salvarDespesa,
    removerReceita: (id) => receitasT.excluir(id, 'Não foi possível excluir a receita.'),
    removerDespesa: (id) => despesasT.excluir(id, 'Não foi possível excluir a despesa.'),
    alternarRecebimento: (id) => receitasT.alternar(id, 'recebido', 'Não foi possível atualizar a receita.'),
    alternarPagamento: (id) => despesasT.alternar(id, 'pago', 'Não foi possível atualizar a despesa.'),
    definirLimite,
    removerLimite,
    importar,
  };
}
