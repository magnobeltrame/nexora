import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import useTabela from './useTabela';

const converterValor = (linha) => ({ ...linha, valor: Number(linha.valor) });

// No banco a coluna é "taxa_aplicada"; no app usamos "taxaAplicada"
const converterLancamento = (linha) => ({
  ...linha,
  valor: Number(linha.valor),
  taxaAplicada: Number(linha.taxa_aplicada || 0),
});

const lancamentoParaBanco = ({ taxaAplicada, ...resto }) =>
  taxaAplicada === undefined ? resto : { ...resto, taxa_aplicada: taxaAplicada };

export default function useDadosNegocio(userId, aoErro) {
  const lancamentosT = useTabela('negocio_lancamentos', userId, {
    ordenarPor: 'data',
    converter: converterLancamento,
    paraBanco: lancamentoParaBanco,
    aoErro,
  });
  const equipeT = useTabela('negocio_equipe', userId, { ordenarPor: 'nome', ascendente: true, aoErro });
  const catalogoT = useTabela('negocio_catalogo', userId, {
    ordenarPor: 'nome',
    ascendente: true,
    converter: converterValor,
    aoErro,
  });

  const [config, setConfig] = useState({ metaMensal: null, taxaPadrao: 20 });
  const [configCarregada, setConfigCarregada] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const { data, error } = await supabase.from('negocio_config').select('*').maybeSingle();
      if (!ativo) return;
      if (error) {
        console.error(error);
        aoErro?.('Não foi possível carregar as configurações do negócio.');
      } else if (data) {
        setConfig({
          metaMensal: data.meta_mensal != null ? Number(data.meta_mensal) : null,
          taxaPadrao: Number(data.taxa_padrao),
        });
      }
      setConfigCarregada(true);
    })();
    return () => {
      ativo = false;
    };
  }, [aoErro]);

  const salvarConfig = async (campos, aplicar, mensagem) => {
    const { error } = await supabase
      .from('negocio_config')
      .upsert({ user_id: userId, ...campos }, { onConflict: 'user_id' });
    if (error) {
      console.error(error);
      aoErro?.(mensagem);
      return false;
    }
    setConfig((prev) => ({ ...prev, ...aplicar }));
    return true;
  };

  const salvarMeta = (valor) =>
    salvarConfig({ meta_mensal: valor }, { metaMensal: valor }, 'Não foi possível salvar a meta.');

  const salvarTaxa = (valor) =>
    salvarConfig({ taxa_padrao: valor }, { taxaPadrao: valor }, 'Não foi possível salvar a taxa padrão.');

  const salvarLancamento = (id, dados) =>
    id
      ? lancamentosT.editar(id, dados, 'Não foi possível salvar o lançamento.')
      : lancamentosT.inserir(dados, 'Não foi possível salvar o lançamento.');

  const adicionarMembro = async (nome) => {
    const limpo = (nome || '').trim();
    if (!limpo) return false;
    if (equipeT.itens.some((m) => m.nome.toLowerCase() === limpo.toLowerCase())) return false;
    return equipeT.inserir({ nome: limpo }, 'Não foi possível adicionar o colaborador.');
  };

  const removerMembro = async (nome) => {
    const membro = equipeT.itens.find((m) => m.nome === nome);
    if (membro) await equipeT.excluir(membro.id, 'Não foi possível remover o colaborador.');
  };

  // Se o item já existe no catálogo, atualiza o preço em vez de duplicar
  const salvarNoCatalogo = async ({ nome, valor, tipo, categoria }) => {
    const existente = catalogoT.itens.find((c) => c.nome.toLowerCase() === nome.toLowerCase());
    if (existente) {
      return catalogoT.editar(existente.id, { valor, tipo, categoria }, 'Não foi possível atualizar o catálogo.');
    }
    return catalogoT.inserir({ nome, valor, tipo, categoria }, 'Não foi possível salvar no catálogo.');
  };

  const removerItemCatalogo = async (nome) => {
    const item = catalogoT.itens.find((c) => c.nome === nome);
    if (item) await catalogoT.excluir(item.id, 'Não foi possível remover o item do catálogo.');
  };

  const importar = async ({ lancamentos = [], equipe = [], catalogo = [], meta = null, taxa = null }) => {
    const a = await lancamentosT.inserirVarios(lancamentos, 'Não foi possível importar os lançamentos do negócio.');
    const b = await equipeT.inserirVarios(
      equipe.map((nome) => ({ nome })),
      'Não foi possível importar a equipe.',
      'user_id,nome'
    );
    const c = await catalogoT.inserirVarios(catalogo, 'Não foi possível importar o catálogo.', 'user_id,nome');
    let d = true;
    if (meta != null || taxa != null) {
      const campos = {};
      const aplicar = {};
      if (meta != null) {
        campos.meta_mensal = meta;
        aplicar.metaMensal = meta;
      }
      if (taxa != null) {
        campos.taxa_padrao = taxa;
        aplicar.taxaPadrao = taxa;
      }
      d = await salvarConfig(campos, aplicar, 'Não foi possível importar as configurações do negócio.');
    }
    return a && b && c && d;
  };

  return {
    carregando: lancamentosT.carregando || equipeT.carregando || catalogoT.carregando || !configCarregada,
    lancamentos: lancamentosT.itens,
    equipe: equipeT.itens.map((m) => m.nome),
    catalogo: catalogoT.itens,
    config,
    salvarLancamento,
    removerLancamento: (id) => lancamentosT.excluir(id, 'Não foi possível excluir o lançamento.'),
    adicionarMembro,
    removerMembro,
    salvarNoCatalogo,
    removerItemCatalogo,
    salvarMeta,
    salvarTaxa,
    importar,
  };
}
