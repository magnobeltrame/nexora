import { useMemo, useState } from 'react';
import SeletorMes from './SeletorMes';
import IconeCategoria from './IconeCategoria';
import { BOTAO_PRINCIPAL, CAMPO } from '../lib/estilos';
import { chaveMes, moeda, nomeDiaSemana, nomeMes } from '../lib/utils';

const FILTROS = [
  { id: 'todos', rotulo: 'Tudo' },
  { id: 'entradas', rotulo: 'Entradas' },
  { id: 'saidas', rotulo: 'Saídas' },
  { id: 'lixeira', rotulo: 'Lixeira' },
];

const PASSO = 50;
const normalizar = (t) => (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function GestaoPai({
  aba = 'resumo',
  ativos = [],
  excluidos = [],
  filtro = 'todos',
  setFiltro = () => {},
  busca = '',
  setBusca = () => {},
  abrirEdicao = () => {},
  restaurar = () => {},
  aoGerarRelatorio = () => {},
}) {
  const [limite, setLimite] = useState(PASSO);

  // ==========================================
  // RESUMO
  // ==========================================
  const totais = useMemo(() => {
    const entradas = ativos.filter((l) => l.tipo === 'entrada').reduce((acc, l) => acc + l.valor, 0);
    const saidas = ativos.filter((l) => l.tipo === 'saida').reduce((acc, l) => acc + l.valor, 0);
    return { entradas, saidas, caixa: entradas - saidas };
  }, [ativos]);

  const porMes = useMemo(() => {
    const mapa = {};
    ativos.forEach((l) => {
      const chave = l.data.slice(0, 7);
      if (!mapa[chave]) mapa[chave] = { chave, entradas: 0, saidas: 0 };
      if (l.tipo === 'entrada') mapa[chave].entradas += l.valor;
      else mapa[chave].saidas += l.valor;
    });
    return Object.values(mapa).sort((a, b) => b.chave.localeCompare(a.chave));
  }, [ativos]);

  const maioresDestinos = useMemo(() => {
    const mapa = {};
    ativos
      .filter((l) => l.tipo === 'saida')
      .forEach((l) => {
        mapa[l.nome] = (mapa[l.nome] || 0) + l.valor;
      });
    return Object.entries(mapa)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [ativos]);

  // ==========================================
  // EXTRATO
  // ==========================================
  const termo = normalizar(busca.trim());
  const base = filtro === 'lixeira' ? excluidos : ativos;
  const filtrados = base
    .filter((l) => {
      if (filtro === 'entradas') return l.tipo === 'entrada';
      if (filtro === 'saidas') return l.tipo === 'saida';
      return true;
    })
    .filter((l) => !termo || normalizar(`${l.nome} ${l.descricao || ''} ${l.observacao || ''}`).includes(termo))
    .sort((a, b) => b.data.localeCompare(a.data));

  const visiveis = filtrados.slice(0, limite);
  const porDia = {};
  visiveis.forEach((l) => {
    if (!porDia[l.data]) porDia[l.data] = [];
    porDia[l.data].push(l);
  });
  const dias = Object.keys(porDia).sort().reverse();

  const mudarFiltro = (id) => {
    setFiltro(id);
    setLimite(PASSO);
  };

  return (
    <div className="pb-4">
      {aba === 'resumo' && (
        <>
          <div className="mt-2 rounded-3xl border border-linha bg-gradient-to-br from-marca/15 via-cartao to-cartao p-5">
            <p className="text-xs font-medium text-suave">Caixa disponível</p>
            <p className={`mt-1 text-3xl font-bold tracking-tight ${totais.caixa >= 0 ? 'text-texto' : 'text-despesa'}`}>
              {totais.caixa >= 0 ? moeda(totais.caixa) : `- ${moeda(Math.abs(totais.caixa))}`}
            </p>
            <p className="mt-0.5 text-[11px] text-suave">Tudo que entrou menos tudo que saiu</p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-linha pt-4">
              <div>
                <p className="text-[11px] text-suave">Total de entradas</p>
                <p className="mt-0.5 text-sm font-semibold text-receita">{moeda(totais.entradas)}</p>
              </div>
              <div>
                <p className="text-[11px] text-suave">Total de saídas</p>
                <p className="mt-0.5 text-sm font-semibold text-despesa">{moeda(totais.saidas)}</p>
              </div>
            </div>
          </div>

          <button onClick={aoGerarRelatorio} className={`${BOTAO_PRINCIPAL} mt-3`}>
            Gerar relatório (imprimir ou salvar PDF)
          </button>

          {ativos.length === 0 && <p className="mt-8 text-center text-sm text-suave">Nenhum lançamento ainda. Toque no + para começar.</p>}

          {porMes.length > 0 && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-texto">Mês a mês</h3>
              <ul className="mt-1 divide-y divide-linha">
                {porMes.slice(0, 8).map((m) => {
                  const saldo = m.entradas - m.saidas;
                  const [ano, mes] = m.chave.split('-');
                  return (
                    <li key={m.chave} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                      <span className="w-28 capitalize text-texto">{nomeMes(new Date(Number(ano), Number(mes) - 1, 1))}</span>
                      <span className="flex-1 text-right text-[11px] text-suave">
                        +{moeda(m.entradas)} / −{moeda(m.saidas)}
                      </span>
                      <span className={`w-28 text-right font-semibold ${saldo >= 0 ? 'text-receita' : 'text-despesa'}`}>
                        {saldo >= 0 ? moeda(saldo) : `- ${moeda(Math.abs(saldo))}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {porMes.length > 8 && <p className="mt-1 text-[11px] text-suave">Mostrando os 8 meses mais recentes. O relatório traz o período completo.</p>}
            </section>
          )}

          {maioresDestinos.length > 0 && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-texto">Para onde mais saiu dinheiro</h3>
              <ul className="mt-1 divide-y divide-linha">
                {maioresDestinos.map(([nome, valor]) => (
                  <li key={nome} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0 flex-1 truncate text-texto">{nome}</span>
                    <span className="text-xs text-suave">{Math.round((valor / totais.saidas) * 100)}%</span>
                    <span className="w-28 text-right font-medium text-texto">{moeda(valor)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {aba === 'extrato' && (
        <>
          <div className="mt-2">
            <label htmlFor="buscaPai" className="sr-only">
              Pesquisar
            </label>
            <input
              id="buscaPai"
              type="search"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setLimite(PASSO);
              }}
              placeholder="Pesquisar por nome ou descrição"
              className={CAMPO}
            />
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar lançamentos">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                onClick={() => mudarFiltro(f.id)}
                aria-pressed={filtro === f.id}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  filtro === f.id ? 'bg-marca text-sobremarca' : 'bg-cartao2 text-suave'
                }`}
              >
                {f.rotulo}
                {f.id === 'lixeira' && excluidos.length > 0 ? ` (${excluidos.length})` : ''}
              </button>
            ))}
          </div>

          {filtro === 'lixeira' && <p className="mt-3 text-[11px] text-suave">Lançamentos excluídos ficam guardados aqui e podem ser restaurados.</p>}

          {dias.length === 0 ? (
            <p className="mt-8 text-center text-sm text-suave">
              {base.length === 0 ? (filtro === 'lixeira' ? 'A lixeira está vazia.' : 'Nenhum lançamento ainda. Toque no + para começar.') : 'Nada encontrado.'}
            </p>
          ) : (
            dias.map((dia) => (
              <section key={dia} className="mt-4">
                <div className="flex items-baseline gap-2 border-b border-linha pb-1.5">
                  <span className="text-lg font-bold text-texto">{dia.slice(8, 10)}</span>
                  <span className="text-xs capitalize text-suave">
                    {nomeDiaSemana(dia)} · {chaveMes(new Date(`${dia}T12:00:00`)).split('-').reverse().join('/')}
                  </span>
                </div>
                <div className="divide-y divide-linha">
                  {porDia[dia].map((l) => {
                    const entrada = l.tipo === 'entrada';
                    const detalhe = [l.descricao, l.observacao].filter(Boolean).join(' • ');
                    return (
                      <div key={l.id} className="flex items-center gap-3 py-3">
                        <button onClick={() => abrirEdicao(l)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                          <IconeCategoria emoji={entrada ? '📥' : '📤'} cor={entrada ? '#10B981' : '#F43F5E'} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-texto">{l.nome}</span>
                            {detalhe && <span className="block truncate text-xs text-suave">{detalhe}</span>}
                          </span>
                          <span className={`whitespace-nowrap text-sm font-semibold ${entrada ? 'text-receita' : 'text-despesa'}`}>
                            {entrada ? '+' : '-'} {moeda(l.valor)}
                          </span>
                        </button>
                        {filtro === 'lixeira' && (
                          <button onClick={() => restaurar(l.id)} className="rounded-lg bg-marca/15 px-3 py-1.5 text-xs font-semibold text-marca">
                            Restaurar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}

          {filtrados.length > limite && (
            <button onClick={() => setLimite(limite + PASSO)} className="mt-5 w-full rounded-xl border border-linha bg-cartao2 py-3 text-sm font-semibold text-texto">
              Mostrar mais {Math.min(PASSO, filtrados.length - limite)} de {filtrados.length - limite} restantes
            </button>
          )}
          {filtro !== 'lixeira' && dias.length > 0 && <p className="mt-4 text-center text-[11px] text-suave">Toque em um lançamento para editar ou excluir.</p>}
        </>
      )}
    </div>
  );
}
