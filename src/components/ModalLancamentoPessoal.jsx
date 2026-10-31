import { useState } from 'react';
import FolhaModal from './FolhaModal';
import { BOTAO_PRINCIPAL, CAMPO, ROTULO } from '../lib/estilos';
import { CATEGORIAS_DESPESA } from '../lib/utils';

// O componente só existe na tela enquanto o formulário está aberto,
// por isso os campos sempre começam limpos (ou com os dados do item em edição).
export default function ModalLancamentoPessoal({ item, tipoInicial, dataPadrao, aoFechar, aoSalvar, aoExcluir }) {
  const editando = !!item;
  const [tipo, setTipo] = useState(tipoInicial);
  const [nome, setNome] = useState(item?.nome ?? '');
  const [valor, setValor] = useState(item ? String(item.valor) : '');
  const [data, setData] = useState((tipoInicial === 'despesa' ? item?.vencimento : item?.data) ?? dataPadrao);
  const [categoria, setCategoria] = useState(item?.categoria ?? CATEGORIAS_DESPESA[0]);
  const [recebido, setRecebido] = useState(item ? item.recebido !== false : true);
  const [pago, setPago] = useState(item?.pago ?? false);
  const [salvando, setSalvando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    const valorNum = parseFloat(valor);
    if (!nome.trim() || !Number.isFinite(valorNum) || valorNum < 0 || !data) return;

    const dados =
      tipo === 'despesa'
        ? { nome: nome.trim(), categoria, valor: valorNum, vencimento: data, pago }
        : { nome: nome.trim(), valor: valorNum, data, recebido };

    setSalvando(true);
    await aoSalvar(tipo, dados);
    setSalvando(false);
  };

  const classeTipo = (id, corAtiva) =>
    `rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
      tipo === id ? `bg-cartao shadow-sm ${corAtiva}` : 'text-suave'
    } ${editando && tipo !== id ? 'opacity-40' : ''}`;

  return (
    <FolhaModal titulo={editando ? 'Editar lançamento' : 'Novo lançamento'} aoFechar={aoFechar}>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-cartao2 p-1" role="group" aria-label="Tipo de lançamento">
        <button type="button" disabled={editando} aria-pressed={tipo === 'despesa'} onClick={() => setTipo('despesa')} className={classeTipo('despesa', 'text-despesa')}>
          Despesa
        </button>
        <button type="button" disabled={editando} aria-pressed={tipo === 'receita'} onClick={() => setTipo('receita')} className={classeTipo('receita', 'text-receita')}>
          Receita
        </button>
      </div>

      <form onSubmit={enviar} className="mt-4 flex flex-col gap-4">
        <div>
          <label htmlFor="pNome" className={ROTULO}>
            Descrição
          </label>
          <input id="pNome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Aluguel" className={CAMPO} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pValor" className={ROTULO}>
              Valor (R$)
            </label>
            <input
              id="pValor"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className={CAMPO}
              required
            />
          </div>
          <div>
            <label htmlFor="pData" className={ROTULO}>
              {tipo === 'despesa' ? 'Vencimento' : 'Data'}
            </label>
            <input id="pData" type="date" value={data} onChange={(e) => setData(e.target.value)} className={CAMPO} required />
          </div>
        </div>

        {tipo === 'despesa' && (
          <>
            <div>
              <label htmlFor="pCategoria" className={ROTULO}>
                Categoria
              </label>
              <select id="pCategoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} className={CAMPO}>
                {CATEGORIAS_DESPESA.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <label htmlFor="pPago" className="flex cursor-pointer items-center gap-3 rounded-xl border border-linha bg-cartao2 px-4 py-3">
              <input id="pPago" type="checkbox" checked={pago} onChange={(e) => setPago(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--marca))]" />
              <span className="text-sm text-texto">Já está paga</span>
            </label>
          </>
        )}

        {tipo === 'receita' && (
          <label htmlFor="pRecebido" className="flex cursor-pointer items-center gap-3 rounded-xl border border-linha bg-cartao2 px-4 py-3">
            <input id="pRecebido" type="checkbox" checked={recebido} onChange={(e) => setRecebido(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--marca))]" />
            <span className="text-sm text-texto">Já recebi este valor</span>
          </label>
        )}

        <button
          type="submit"
          disabled={salvando}
          className={tipo === 'despesa' ? 'w-full rounded-xl bg-despesa px-4 py-3.5 text-sm font-semibold text-sobredespesa transition-transform active:scale-[0.99] disabled:opacity-60' : BOTAO_PRINCIPAL}
        >
          {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Salvar lançamento'}
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
