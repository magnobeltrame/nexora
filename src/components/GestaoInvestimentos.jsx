import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import ModalAtivo from './ModalAtivo';
import RelatorioIR from './RelatorioIR';
import { CAMPO, ESTILO_TOOLTIP } from '../lib/estilos';
import { dySobreCusto, encerrados, matrizProventos, posicoes, reproduzir, saldosRendaFixa } from '../lib/investimentos';
import { formatarData, hojeISO, moeda } from '../lib/utils';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const COR = { acao: '#38BDF8', fii: '#A78BFA', rf: '#FBBF24' };
const NOME_CLASSE = { acao: 'Ações', fii: 'Fundos imobiliários', rf: 'Renda fixa' };
const decimal = (v) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function GestaoInvestimentos({
  aba = 'carteira',
  ativos = [],
  operacoes = [],
  proventos = [],
  rendaFixa = [],
  aoNovoLancamento = () => {},
  aoSalvarAtivo = async () => false,
  pedirConfirmacao = () => {},
  removerOperacao = async () => false,
  removerProvento = async () => false,
}) {
  const hoje = hojeISO();
  const anoAtual = Number(hoje.slice(0, 4));
  const [anoProventos, setAnoProventos] = useState(anoAtual);
  const [ativoAberto, setAtivoAberto] = useState(null);

  const ativosPorTicker = useMemo(() => Object.fromEntries(ativos.map((a) => [a.ticker, a])), [ativos]);
  const pos = useMemo(() => posicoes(operacoes), [operacoes]);
  const zerados = useMemo(() => encerrados(operacoes), [operacoes]);
  const avisos = useMemo(() => reproduzir(operacoes).avisos, [operacoes]);
  const saldosAtuais = useMemo(() => saldosRendaFixa(rendaFixa, null), [rendaFixa]);

  const posAcoes = pos.filter((p) => (ativosPorTicker[p.ticker]?.classe || 'acao') === 'acao');
  const posFiis = pos.filter((p) => ativosPorTicker[p.ticker]?.classe === 'fii');
  const totalAcoes = posAcoes.reduce((a, p) => a + p.custo, 0);
  const totalFiis = posFiis.reduce((a, p) => a + p.custo, 0);
  const totalRf = saldosAtuais.reduce((a, r) => a + r.saldo, 0);
  const patrimonio = totalAcoes + totalFiis + totalRf;
  const semCnpj = ativos.filter((a) => pos.some((p) => p.ticker === a.ticker) && !a.cnpj).length;

  const matriz = useMemo(() => matrizProventos(proventos, anoProventos), [proventos, anoProventos]);
  const proventosAnoAtual = useMemo(() => matrizProventos(proventos, anoAtual).total, [proventos, anoAtual]);

  const anosProventos = useMemo(() => {
    const anos = new Set([anoAtual, ...proventos.map((p) => Number(p.data.slice(0, 4)))]);
    return [...anos].sort((a, b) => b - a);
  }, [proventos, anoAtual]);

  const classes = [
    { id: 'acao', valor: totalAcoes },
    { id: 'fii', valor: totalFiis },
    { id: 'rf', valor: totalRf },
  ].filter((c) => c.valor > 0);

  const abrir = ativoAberto && {
    ativo: ativosPorTicker[ativoAberto],
    posicao: pos.find((p) => p.ticker === ativoAberto),
    ops: operacoes.filter((o) => o.ticker === ativoAberto),
    provs: proventos.filter((p) => p.ticker === ativoAberto),
  };

  const confirmarRemocao = (titulo, mensagem, acao) =>
    pedirConfirmacao({ titulo, mensagem, rotulo: 'Excluir', aoConfirmar: acao });

  const blocoClasse = (classe, itens, total) =>
    itens.length === 0 ? null : (
      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-texto">{NOME_CLASSE[classe]}</h3>
          <span className="text-xs font-semibold text-suave">{moeda(total)}</span>
        </div>
        <ul className="mt-1 divide-y divide-linha">
          {itens.map((p) => {
            const dy = dySobreCusto(p.ticker, p.custo, proventos, hoje);
            return (
              <li key={p.ticker}>
                <button onClick={() => setAtivoAberto(p.ticker)} className="flex w-full items-center gap-3 py-3 text-left">
                  <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: COR[classe] }}></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-texto">{p.ticker}</span>
                    <span className="block text-xs text-suave">
                      {p.quantidade} × {moeda(p.pm)}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-semibold text-texto">{moeda(p.custo)}</span>
                    <span className="block text-[11px] text-suave">{dy > 0 ? `DY ${decimal(dy)}%` : 'sem proventos'}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );

  return (
    <div className="pb-4">
      {aba === 'carteira' && (
        <>
          <div className="mt-2 rounded-3xl border border-linha bg-gradient-to-br from-marca/15 via-cartao to-cartao p-5">
            <p className="text-xs font-medium text-suave">Valor investido (pelo custo)</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-texto">{moeda(patrimonio)}</p>
            <p className="mt-0.5 text-[11px] text-suave">Quantidade × preço médio pago. Não é o valor de mercado de hoje.</p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-linha pt-4">
              <div>
                <p className="text-[11px] text-suave">Proventos em {anoAtual}</p>
                <p className="mt-0.5 text-sm font-semibold text-receita">{moeda(proventosAnoAtual)}</p>
              </div>
              <div>
                <p className="text-[11px] text-suave">Ativos em carteira</p>
                <p className="mt-0.5 text-sm font-semibold text-texto">{pos.length + saldosAtuais.length}</p>
              </div>
            </div>
          </div>

          {(semCnpj > 0 || avisos.length > 0) && (
            <div className="mt-3 rounded-2xl border border-alerta/40 bg-alerta/10 px-4 py-3 text-xs text-texto">
              {semCnpj > 0 && (
                <p>
                  <strong>{semCnpj}</strong> ativo{semCnpj === 1 ? '' : 's'} sem CNPJ (necessário para o IR). Toque no ativo para informar.
                </p>
              )}
              {avisos.map((a) => (
                <p key={`${a.ticker}-${a.data}`} className="mt-1">
                  {a.ticker}: {a.mensagem}
                </p>
              ))}
            </div>
          )}

          {classes.length > 0 && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-texto">Distribuição</h3>
              <div className="mt-2 flex items-center gap-4">
                <div className="h-32 w-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={classes} dataKey="valor" nameKey="id" innerRadius={34} outerRadius={56} paddingAngle={2} stroke="none">
                        {classes.map((c) => (
                          <Cell key={c.id} fill={COR[c.id]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [moeda(v), NOME_CLASSE[n]]} {...ESTILO_TOOLTIP} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex-1 space-y-2">
                  {classes.map((c) => (
                    <li key={c.id} className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COR[c.id] }}></span>
                      <span className="flex-1 text-texto">{NOME_CLASSE[c.id]}</span>
                      <span className="text-xs text-suave">{Math.round((c.valor / patrimonio) * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {pos.length === 0 && saldosAtuais.length === 0 && (
            <p className="mt-8 text-center text-sm text-suave">Sua carteira está vazia. Toque no + para lançar a primeira compra.</p>
          )}

          {blocoClasse('acao', posAcoes, totalAcoes)}
          {blocoClasse('fii', posFiis, totalFiis)}

          {saldosAtuais.length > 0 && (
            <section className="mt-6">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold text-texto">Renda fixa</h3>
                <span className="text-xs font-semibold text-suave">{moeda(totalRf)}</span>
              </div>
              <ul className="mt-1 divide-y divide-linha">
                {saldosAtuais.map((r) => (
                  <li key={r.nome} className="flex items-center gap-3 py-3">
                    <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: COR.rf }}></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-texto">{r.nome}</span>
                      <span className="block text-xs text-suave">Saldo em {formatarData(r.data)}</span>
                    </span>
                    <span className="text-sm font-semibold text-texto">{moeda(r.saldo)}</span>
                    <button onClick={() => aoNovoLancamento('rf', r.nome)} className="rounded-lg bg-marca/15 px-3 py-1.5 text-xs font-semibold text-marca">
                      Atualizar
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {zerados.length > 0 && (
            <details className="mt-6 rounded-2xl border border-linha bg-cartao px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-texto">Posições encerradas ({zerados.length})</summary>
              <p className="mt-1 text-[11px] text-suave">Ativos que você já vendeu por completo. Ficam aqui e no relatório de IR.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {zerados.map((t) => (
                  <button key={t} onClick={() => setAtivoAberto(t)} className="rounded-full bg-cartao2 px-3 py-1.5 text-xs font-semibold text-texto">
                    {t}
                  </button>
                ))}
              </div>
            </details>
          )}
        </>
      )}

      {aba === 'proventos' && (
        <>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-texto">Proventos</h2>
              <p className="text-xs text-suave">Dividendos, JCP e rendimentos de FII</p>
            </div>
            <div className="w-28">
              <label htmlFor="anoProv" className="sr-only">
                Ano
              </label>
              <select id="anoProv" value={anoProventos} onChange={(e) => setAnoProventos(Number(e.target.value))} className={CAMPO}>
                {anosProventos.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-linha bg-gradient-to-br from-marca/15 via-cartao to-cartao p-5">
            <p className="text-xs font-medium text-suave">Recebido em {anoProventos}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-receita">{moeda(matriz.total)}</p>
            <p className="mt-0.5 text-[11px] text-suave">Média de {moeda(matriz.total / 12)} por mês</p>
          </div>

          {matriz.total > 0 ? (
            <>
              <div className="mt-5 h-44 w-full text-suave">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MESES.map((m, i) => ({ mes: m, valor: matriz.totaisMes[i] }))} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="mes" tick={{ fill: 'currentColor', fontSize: 10 }} tickLine={false} axisLine={false} interval={0} />
                    <Tooltip cursor={{ fill: 'currentColor', fillOpacity: 0.08 }} formatter={(v) => [moeda(v), 'Proventos']} {...ESTILO_TOOLTIP} />
                    <Bar dataKey="valor" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <h3 className="mt-5 text-sm font-semibold text-texto">Por ativo, mês a mês</h3>
              <div className="mt-2 overflow-x-auto rounded-2xl border border-linha">
                <table className="min-w-[760px] w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-cartao2 text-suave">
                      <th className="sticky left-0 z-10 bg-cartao2 px-3 py-2 text-left font-semibold">Ativo</th>
                      {MESES.map((m) => (
                        <th key={m} className="px-2 py-2 text-right font-semibold">
                          {m}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right font-semibold text-texto">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matriz.linhas.map((l) => (
                      <tr key={l.ticker} className="border-t border-linha">
                        <td className="sticky left-0 z-10 bg-cartao px-3 py-2 font-semibold text-texto">{l.ticker}</td>
                        {l.meses.map((v, i) => (
                          <td key={i} className={`px-2 py-2 text-right ${v > 0 ? 'bg-receita/10 font-medium text-receita' : 'text-suave/60'}`}>
                            {v > 0 ? decimal(v) : '–'}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right font-semibold text-texto">{decimal(l.total)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-linha bg-cartao2 font-semibold text-texto">
                      <td className="sticky left-0 z-10 bg-cartao2 px-3 py-2">Total</td>
                      {matriz.totaisMes.map((v, i) => (
                        <td key={i} className="px-2 py-2 text-right">
                          {decimal(v)}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right">{decimal(matriz.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[11px] text-suave">Arraste a tabela para o lado para ver todos os meses.</p>
            </>
          ) : (
            <p className="mt-8 text-center text-sm text-suave">Nenhum provento em {anoProventos}. Toque no + e escolha &ldquo;Provento&rdquo;.</p>
          )}
        </>
      )}

      {aba === 'ir' && <RelatorioIR operacoes={operacoes} ativos={ativos} proventos={proventos} rendaFixa={rendaFixa} />}

      {ativoAberto && (
        <ModalAtivo
          ticker={ativoAberto}
          ativo={abrir.ativo}
          posicao={abrir.posicao}
          operacoes={abrir.ops}
          proventos={abrir.provs}
          aoFechar={() => setAtivoAberto(null)}
          aoSalvarAtivo={aoSalvarAtivo}
          aoRemoverOperacao={(o) =>
            confirmarRemocao(
              'Excluir esta operação?',
              `${o.tipo === 'compra' ? 'Compra' : 'Venda'} de ${o.quantidade} ${o.ticker} em ${formatarData(o.data)}. O preço médio será recalculado.`,
              () => removerOperacao(o.id)
            )
          }
          aoRemoverProvento={(p) =>
            confirmarRemocao('Excluir este provento?', `${moeda(p.valor)} de ${p.ticker} em ${formatarData(p.data)}.`, () => removerProvento(p.id))
          }
        />
      )}
    </div>
  );
}
