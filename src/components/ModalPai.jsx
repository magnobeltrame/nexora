import { useState } from 'react';
import FolhaModal from './FolhaModal';
import { BOTAO_PRINCIPAL, CAMPO, ROTULO } from '../lib/estilos';

export default function ModalPai({ item, dataPadrao, aoFechar, aoSalvar, aoExcluir }) {
  const editando = !!item;
  const [tipo, setTipo] = useState(item?.tipo ?? 'saida');
  const [data, setData] = useState(item?.data ?? dataPadrao);
  const [valor, setValor] = useState(item ? String(item.valor) : '');
  const [nome, setNome] = useState(item?.nome ?? '');
  const [descricao, setDescricao] = useState(item?.descricao ?? '');
  const [observacao, setObservacao] = useState(item?.observacao ?? '');
  const [salvando, setSalvando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    const valorNum = parseFloat(valor);
    if (!nome.trim() || !Number.isFinite(valorNum) || valorNum <= 0 || !data) return;
    setSalvando(true);
    await aoSalvar({
      tipo,
      data,
      valor: valorNum,
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      observacao: observacao.trim() || null,
    });
    setSalvando(false);
  };

  const classeTipo = (id, corAtiva) =>
    `rounded-lg py-2.5 text-sm font-semibold transition-colors ${tipo === id ? `bg-cartao shadow-sm ${corAtiva}` : 'text-suave'}`;

  return (
    <FolhaModal titulo={editando ? 'Editar lançamento' : 'Novo lançamento no caixa'} aoFechar={aoFechar}>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-cartao2 p-1" role="group" aria-label="Tipo de lançamento">
        <button type="button" aria-pressed={tipo === 'entrada'} onClick={() => setTipo('entrada')} className={classeTipo('entrada', 'text-receita')}>
          Entrada
        </button>
        <button type="button" aria-pressed={tipo === 'saida'} onClick={() => setTipo('saida')} className={classeTipo('saida', 'text-despesa')}>
          Saída
        </button>
      </div>

      <form onSubmit={enviar} className="mt-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="paiValor" className={ROTULO}>
              Valor (R$)
            </label>
            <input
              id="paiValor"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className={CAMPO}
              required
            />
          </div>
          <div>
            <label htmlFor="paiData" className={ROTULO}>
              Data
            </label>
            <input id="paiData" type="date" value={data} onChange={(e) => setData(e.target.value)} className={CAMPO} required />
          </div>
        </div>

        <div>
          <label htmlFor="paiNome" className={ROTULO}>
            {tipo === 'entrada' ? 'Origem (quem pagou)' : 'Destino (para quem foi)'}
          </label>
          <input id="paiNome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" className={CAMPO} required />
        </div>

        <div>
          <label htmlFor="paiDesc" className={ROTULO}>
            Descrição (opcional)
          </label>
          <input id="paiDesc" type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Pagamento da 2ª parcela" className={CAMPO} />
        </div>

        <div>
          <label htmlFor="paiObs" className={ROTULO}>
            Observação (opcional)
          </label>
          <input id="paiObs" type="text" value={observacao} onChange={(e) => setObservacao(e.target.value)} className={CAMPO} />
        </div>

        <button type="submit" disabled={salvando} className={BOTAO_PRINCIPAL}>
          {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Lançar no caixa'}
        </button>

        {editando && (
          <button type="button" onClick={aoExcluir} className="w-full rounded-xl py-3 text-sm font-semibold text-despesa hover:bg-despesa/10">
            Excluir lançamento
          </button>
        )}
      </form>
    </FolhaModal>
  );
}
