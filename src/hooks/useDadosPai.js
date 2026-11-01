import useTabela from './useTabela';

const converter = (linha) => ({ ...linha, valor: Number(linha.valor) });

// Caixa do pai. Só carrega se a área estiver liberada para o usuário.
// "Excluir" não apaga de vez: o lançamento vai para a lixeira e pode ser restaurado.
export default function useDadosPai(userId, aoErro, habilitado) {
  const t = useTabela('pai_lancamentos', userId, { ordenarPor: 'data', converter, aoErro, habilitado });

  const salvar = (id, dados) =>
    id
      ? t.editar(id, dados, 'Não foi possível salvar o lançamento.')
      : t.inserir(dados, 'Não foi possível salvar o lançamento.');

  const mandarParaLixeira = (id) => t.editar(id, { excluido_em: new Date().toISOString() }, 'Não foi possível excluir o lançamento.');
  const restaurar = (id) => t.editar(id, { excluido_em: null }, 'Não foi possível restaurar o lançamento.');

  return {
    carregando: habilitado && t.carregando,
    ativos: t.itens.filter((l) => !l.excluido_em),
    excluidos: t.itens.filter((l) => l.excluido_em),
    salvar,
    mandarParaLixeira,
    restaurar,
  };
}
