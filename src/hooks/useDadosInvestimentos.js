import useTabela from './useTabela';
import { normalizarTicker } from '../lib/investimentos';

const numeros = (campos) => (linha) => {
  const novo = { ...linha };
  campos.forEach((c) => {
    if (novo[c] != null) novo[c] = Number(novo[c]);
  });
  return novo;
};
const converterOperacao = numeros(['quantidade', 'preco', 'custos']);
const converterProvento = numeros(['valor', 'ir_retido']);
const converterRendaFixa = numeros(['saldo']);

// Carteira de investimentos. Só carrega se a área estiver liberada para o usuário.
export default function useDadosInvestimentos(userId, aoErro, habilitado) {
  const ativosT = useTabela('inv_ativos', userId, { ordenarPor: 'ticker', ascendente: true, aoErro, habilitado });
  const operacoesT = useTabela('inv_operacoes', userId, { ordenarPor: 'data', converter: converterOperacao, aoErro, habilitado });
  const proventosT = useTabela('inv_proventos', userId, { ordenarPor: 'data', converter: converterProvento, aoErro, habilitado });
  const rendaFixaT = useTabela('inv_renda_fixa', userId, { ordenarPor: 'data', converter: converterRendaFixa, aoErro, habilitado });

  // Cadastra o ativo se for novo e guarda o CNPJ quando informado
  const garantirAtivo = async ({ ticker, classe, cnpj }) => {
    const t = normalizarTicker(ticker);
    const limpo = (cnpj || '').trim();
    const existente = ativosT.itens.find((a) => a.ticker === t);
    if (!existente) return ativosT.inserir({ ticker: t, classe, cnpj: limpo || null, custodia: null }, 'Não foi possível cadastrar o ativo.');
    if (limpo && limpo !== existente.cnpj) return ativosT.editar(existente.id, { cnpj: limpo }, 'Não foi possível guardar o CNPJ.');
    return true;
  };

  const registrarOperacao = async ({ ticker, classe, cnpj, tipo, data, quantidade, preco, custos }) => {
    if (!(await garantirAtivo({ ticker, classe, cnpj }))) return false;
    return operacoesT.inserir(
      { ticker: normalizarTicker(ticker), tipo, data, quantidade, preco, custos: custos || 0 },
      'Não foi possível salvar a operação.'
    );
  };

  const registrarProvento = async ({ ticker, classe, cnpj, tipo, data, valor, ir_retido }) => {
    if (!(await garantirAtivo({ ticker, classe, cnpj }))) return false;
    return proventosT.inserir(
      { ticker: normalizarTicker(ticker), tipo, data, valor, ir_retido: ir_retido || 0 },
      'Não foi possível salvar o provento.'
    );
  };

  // Um saldo por nome e data: se já existir, atualiza
  const salvarSaldoRendaFixa = async ({ nome, data, saldo }) => {
    const existente = rendaFixaT.itens.find((r) => r.nome === nome && r.data === data);
    return existente
      ? rendaFixaT.editar(existente.id, { saldo }, 'Não foi possível salvar o saldo.')
      : rendaFixaT.inserir({ nome, data, saldo }, 'Não foi possível salvar o saldo.');
  };

  return {
    carregando: habilitado && (ativosT.carregando || operacoesT.carregando || proventosT.carregando || rendaFixaT.carregando),
    ativos: ativosT.itens,
    operacoes: operacoesT.itens,
    proventos: proventosT.itens,
    rendaFixa: rendaFixaT.itens,
    registrarOperacao,
    registrarProvento,
    salvarSaldoRendaFixa,
    atualizarAtivo: (id, campos) => ativosT.editar(id, campos, 'Não foi possível atualizar o ativo.'),
    removerOperacao: (id) => operacoesT.excluir(id, 'Não foi possível excluir a operação.'),
    removerProvento: (id) => proventosT.excluir(id, 'Não foi possível excluir o provento.'),
    removerSaldo: (id) => rendaFixaT.excluir(id, 'Não foi possível excluir o saldo.'),
  };
}
