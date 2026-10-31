import { useState } from 'react';
import FolhaModal from './FolhaModal';
import { IconeLixeira } from './Icones';
import { BOTAO_PRINCIPAL, CAMPO, ROTULO } from '../lib/estilos';
import { CATEGORIAS_RECEITA_NEGOCIO, CATEGORIAS_DESPESA_NEGOCIO, moeda } from '../lib/utils';

const categoriasDoTipo = (tipo) => (tipo === 'receita' ? CATEGORIAS_RECEITA_NEGOCIO : CATEGORIAS_DESPESA_NEGOCIO);

// Só existe na tela enquanto está aberto, então os campos sempre começam do zero (ou com o item em edição).
export default function ModalNegocio({
  item,
  equipe,
  catalogo,
  taxaPadrao,
  dataPadrao,
  aoFechar,
  aoSalvar,
  aoExcluir,
  pedirConfirmacao,
  adicionarMembro,
  removerMembro,
  removerItemCatalogo,
}) {
  const editando = !!item;

  // Se estiver editando, recupera a taxa em % a partir do valor guardado
  const taxaDoItem =
    item && item.valor > 0 && item.taxaAplicada > 0 ? Math.round((item.taxaAplicada / item.valor) * 10000) / 100 : taxaPadrao;

  const [tipo, setTipo] = useState(item?.tipo ?? 'receita');
  const [cliente, setCliente] = useState(item?.cliente ?? '');
  const [servico, setServico] = useState(item?.servico ?? (item?.tipo === 'despesa' ? item?.descricao ?? '' : ''));
  const [salvarNoCatalogo, setSalvarNoCatalogo] = useState(false);
  const [valor, setValor] = useState(item ? String(item.valor) : '');
  const [categoria, setCategoria] = useState(item?.categoria ?? CATEGORIAS_RECEITA_NEGOCIO[0]);
  const [aplicarTaxa, setAplicarTaxa] = useState(item ? item.taxaAplicada > 0 : true);
  const [taxa, setTaxa] = useState(taxaDoItem);
  const [data, setData] = useState(item?.data ?? dataPadrao);
  const [responsavel, setResponsavel] = useState(item?.responsavel ?? equipe[0] ?? '');
  const [observacao, setObservacao] = useState(item?.observacao ?? '');
  const [mostrarGestao, setMostrarGestao] = useState(false);
  const [novoColaborador, setNovoColaborador] = useState('');
  const [salvando, setSalvando] = useState(false);

  const opcoesResponsavel = [...new Set([...equipe, ...(item?.responsavel ? [item.responsavel] : [])])];

  const trocarTipo = (novoTipo) => {
    if (novoTipo === tipo) return;
    setTipo(novoTipo);
    setCategoria(categoriasDoTipo(novoTipo)[0]); // evita ficar com categoria do tipo errado
  };

  const escolherDoCatalogo = (e) => {
    const encontrado = catalogo.find((c) => c.nome === e.target.value);
    if (!encontrado) return;
    setServico(encontrado.nome);
    setValor(String(encontrado.valor));
    if (encontrado.categoria) setCategoria(encontrado.categoria);
  };

  const enviar = async (e) => {
    e.preventDefault();
    const valorNum = parseFloat(valor);
    if (!servico.trim() || !Number.isFinite(valorNum) || valorNum < 0 || !data) return;

    const taxaNum = Number(taxa) || 0;
    const usaTaxa = tipo === 'receita' && aplicarTaxa;
    const taxaAplicada = usaTaxa ? Math.round(valorNum * taxaNum) / 100 : 0;

    const dados = {
      tipo,
      data,
      cliente: tipo === 'receita' ? cliente.trim() || null : null,
      servico: servico.trim(),
      descricao: tipo === 'receita' ? `Cliente: ${cliente.trim() || 'Balcão'} (${servico.trim()})` : servico.trim(),
      categoria,
      valor: valorNum,
      taxaAplicada,
      responsavel: responsavel || null,
      observacao: observacao.trim() || null,
    };

    setSalvando(true);
    await aoSalvar(dados, { salvarNoCatalogo, taxa: usaTaxa ? taxaNum : null });
    setSalvando(false);
  };

  const classeTipo = (id, corAtiva) =>
    `rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
      tipo === id ? `bg-cartao shadow-sm ${corAtiva}` : 'text-suave'
    } ${editando && tipo !== id ? 'opacity-40' : ''}`;

  return (
    <FolhaModal titulo={editando ? 'Editar lançamento' : 'Novo lançamento do negócio'} aoFechar={aoFechar}>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-cartao2 p-1" role="group" aria-label="Tipo de lançamento">
        <button type="button" disabled={editando} aria-pressed={tipo === 'receita'} onClick={() => trocarTipo('receita')} className={classeTipo('receita', 'text-receita')}>
          Receita
        </button>
        <button type="button" disabled={editando} aria-pressed={tipo === 'despesa'} onClick={() => trocarTipo('despesa')} className={classeTipo('despesa', 'text-despesa')}>
          Despesa
        </button>
      </div>

      <form onSubmit={enviar} className="mt-4 flex flex-col gap-4">
        {tipo === 'receita' && (
          <div>
            <label htmlFor="nCliente" className={ROTULO}>
              Cliente (opcional)
            </label>
            <input id="nCliente" type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nome do cliente" className={CAMPO} />
          </div>
        )}

        <div>
          <label htmlFor="nServico" className={ROTULO}>
            {tipo === 'receita' ? 'Serviço ou produto' : 'Descrição do custo'}
          </label>
          <input
            id="nServico"
            type="text"
            value={servico}
            onChange={(e) => setServico(e.target.value)}
            placeholder={tipo === 'receita' ? 'Ex.: Instalação elétrica' : 'Ex.: Material de obra'}
            className={CAMPO}
            required
          />
          {catalogo.filter((c) => c.tipo === tipo).length > 0 && (
            <select value="" onChange={escolherDoCatalogo} aria-label="Preencher com um item do catálogo" className={`${CAMPO} mt-2`}>
              <option value="" disabled>
                Preencher com item do catálogo…
              </option>
              {catalogo
                .filter((c) => c.tipo === tipo)
                .map((c) => (
                  <option key={c.nome} value={c.nome}>
                    {c.nome} ({moeda(c.valor)})
                  </option>
                ))}
            </select>
          )}
          <label htmlFor="nCatalogo" className="mt-2 flex cursor-pointer items-center gap-2">
            <input
              id="nCatalogo"
              type="checkbox"
              checked={salvarNoCatalogo}
              onChange={(e) => setSalvarNoCatalogo(e.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--marca))]"
            />
            <span className="text-xs text-suave">Salvar no catálogo para usar de novo</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="nValor" className={ROTULO}>
              {tipo === 'receita' ? 'Valor bruto (R$)' : 'Valor (R$)'}
            </label>
            <input
              id="nValor"
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
            <label htmlFor="nData" className={ROTULO}>
              Data
            </label>
            <input id="nData" type="date" value={data} onChange={(e) => setData(e.target.value)} className={CAMPO} required />
          </div>
        </div>

        <div className={`grid gap-3 ${opcoesResponsavel.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div>
            <label htmlFor="nCategoria" className={ROTULO}>
              Categoria
            </label>
            <select id="nCategoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} className={CAMPO}>
              {[...new Set([...categoriasDoTipo(tipo), categoria])].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          {opcoesResponsavel.length > 0 && (
            <div>
              <label htmlFor="nResp" className={ROTULO}>
                Responsável
              </label>
              <select id="nResp" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className={CAMPO}>
                {opcoesResponsavel.map((resp) => (
                  <option key={resp} value={resp}>
                    {resp}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="nObs" className={ROTULO}>
            Observação (opcional)
          </label>
          <input id="nObs" type="text" value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex.: pago no Pix" className={CAMPO} />
        </div>

        {tipo === 'receita' && (
          <div className="rounded-xl border border-linha bg-cartao2 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="nTaxa" className="flex cursor-pointer items-center gap-3">
                <input
                  id="nTaxa"
                  type="checkbox"
                  checked={aplicarTaxa}
                  onChange={(e) => setAplicarTaxa(e.target.checked)}
                  className="h-4 w-4 accent-[rgb(var(--marca))]"
                />
                <span className="text-sm text-texto">Descontar taxa ou repasse</span>
              </label>
              {aplicarTaxa && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxa}
                    onChange={(e) => setTaxa(e.target.value)}
                    aria-label="Porcentagem da taxa"
                    className="w-16 rounded-lg border border-linha bg-cartao px-2 py-1.5 text-center text-sm font-semibold text-texto outline-none focus:border-marca"
                  />
                  <span className="text-sm text-suave">%</span>
                </div>
              )}
            </div>
          </div>
        )}

        <button type="submit" disabled={salvando} className={BOTAO_PRINCIPAL}>
          {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Lançar no negócio'}
        </button>

        {editando && (
          <button type="button" onClick={aoExcluir} className="w-full rounded-xl py-3 text-sm font-semibold text-despesa hover:bg-despesa/10">
            Excluir lançamento
          </button>
        )}
      </form>

      {/* EQUIPE E CATÁLOGO */}
      <div className="mt-5 border-t border-linha pt-4">
        <button
          type="button"
          onClick={() => setMostrarGestao(!mostrarGestao)}
          aria-expanded={mostrarGestao}
          className="flex w-full items-center justify-between text-sm font-semibold text-texto"
        >
          Equipe e catálogo
          <span className="text-xs font-medium text-marca">{mostrarGestao ? 'Ocultar' : 'Gerenciar'}</span>
        </button>

        {mostrarGestao && (
          <div className="mt-3 flex flex-col gap-5">
            <div>
              <p className="text-xs font-medium text-suave">Equipe</p>
              {equipe.length === 0 && <p className="mt-1 text-xs text-suave">Ninguém cadastrado. Se você trabalha sozinho, pode deixar assim.</p>}
              <ul className="mt-1 divide-y divide-linha">
                {equipe.map((membro) => (
                  <li key={membro} className="flex items-center justify-between py-2 text-sm text-texto">
                    {membro}
                    <button
                      type="button"
                      onClick={() =>
                        pedirConfirmacao({
                          titulo: `Remover ${membro}?`,
                          mensagem: 'Os lançamentos antigos continuam com esse nome.',
                          rotulo: 'Remover',
                          aoConfirmar: () => removerMembro(membro),
                        })
                      }
                      aria-label={`Remover ${membro}`}
                      className="grid h-8 w-8 place-items-center rounded-full text-suave hover:bg-cartao2"
                    >
                      <IconeLixeira width={16} height={16} />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Nome do colaborador"
                  aria-label="Nome do novo colaborador"
                  value={novoColaborador}
                  onChange={(e) => setNovoColaborador(e.target.value)}
                  className={CAMPO}
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (await adicionarMembro(novoColaborador)) setNovoColaborador('');
                  }}
                  className="rounded-xl bg-marca px-4 text-sm font-semibold text-sobremarca"
                >
                  Adicionar
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-suave">Catálogo de serviços e itens</p>
              {catalogo.length === 0 && <p className="mt-1 text-xs text-suave">Nenhum item salvo ainda.</p>}
              <ul className="mt-1 divide-y divide-linha">
                {catalogo.map((c) => (
                  <li key={c.nome} className="flex items-center justify-between gap-2 py-2 text-sm text-texto">
                    <span className="min-w-0 truncate">
                      {c.nome} <span className="text-suave">({moeda(c.valor)})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        pedirConfirmacao({
                          titulo: `Remover "${c.nome}"?`,
                          mensagem: 'O item sai do catálogo, mas os lançamentos já feitos não mudam.',
                          rotulo: 'Remover',
                          aoConfirmar: () => removerItemCatalogo(c.nome),
                        })
                      }
                      aria-label={`Remover ${c.nome} do catálogo`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-suave hover:bg-cartao2"
                    >
                      <IconeLixeira width={16} height={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </FolhaModal>
  );
}
