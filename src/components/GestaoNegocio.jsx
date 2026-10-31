import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import SeletorMes from './SeletorMes';
import IconeCategoria from './IconeCategoria';
import { IconeLapis, IconeLixeira } from './Icones';
import { CAMPO, ESTILO_TOOLTIP } from '../lib/estilos';
import { moeda, nomeDiaSemana } from '../lib/utils';

const CORES = ['#22D3EE', '#10B981', '#F59E0B', '#A78BFA', '#F43F5E'];

const FILTROS = [
  { id: 'todos', rotulo: 'Tudo' },
  { id: 'receitas', rotulo: 'Receitas' },
  { id: 'despesas', rotulo: 'Despesas' },
];

export default function GestaoNegocio({
  aba = 'painel',
  lancamentosDoMes = [],
  filtro = 'todos',
  setFiltro = () => {},
  abrirEdicao = () => {},
  metaMensal = null,
  salvarMeta = async () => false,
  pedirConfirmacao = () => {},
  mesTexto = '',
  dataRef = new Date(),
  aoVoltarMes = () => {},
  aoAvancarMes = () => {},
}) {
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [inputMeta, setInputMeta] = useState('');

  // ==========================================
  // NÚMEROS DO MÊS
  // ==========================================
  const stats = useMemo(() => {
    let bruto = 0;
    let custos = 0;
    let taxas = 0;
    let liquido = 0;
    lancamentosDoMes.forEach((item) => {
      const valor = Number(item.valor || 0);
      const taxa = Number(item.taxaAplicada || 0);
      if (item.tipo === 'receita') {
        bruto += valor;
        taxas += taxa;
        liquido += valor - taxa;
      } else {
        custos += valor;
        liquido -= valor;
      }
    });
    return { bruto, custos, taxas, liquido };
  }, [lancamentosDoMes]);

  const { despesasPorCat, receitasPorServico } = useMemo(() => {
    const d = {};
    const r = {};
    lancamentosDoMes.forEach((item) => {
      const valor = Number(item.valor || 0);
      if (item.tipo === 'despesa') {
        const cat = item.categoria || 'Geral';
        d[cat] = (d[cat] || 0) + valor;
      } else {
        const nome = item.servico || item.descricao || 'Serviço';
        r[nome] = (r[nome] || 0) + valor;
      }
    });
    return { despesasPorCat: d, receitasPorServico: r };
  }, [lancamentosDoMes]);

  const maiorCusto = Object.entries(despesasPorCat).sort((a, b) => b[1] - a[1])[0];
  const maiorServico = Object.entries(receitasPorServico).sort((a, b) => b[1] - a[1])[0];

  const mixServicos = Object.entries(receitasPorServico)
    .sort((a, b) => b[1] - a[1])
    .map(([nome, valor], idx) => ({ nome, valor, cor: CORES[idx % CORES.length] }));
  const totalMix = mixServicos.reduce((acc, s) => acc + s.valor, 0) || 1;

  // ==========================================
  // META DO MÊS
  // ==========================================
  const liquidoMes = stats.liquido;
  const progressoMeta = metaMensal ? Math.max(Math.min((liquidoMes / metaMensal) * 100, 100), 0) : 0;
  const faltaParaMeta = metaMensal ? metaMensal - liquidoMes : 0;

  // Dias restantes do mês que está sendo exibido (não do mês de hoje)
  const hoje = new Date();
  const totalDiasNoMes = new Date(dataRef.getFullYear(), dataRef.getMonth() + 1, 0).getDate();
  const ehMesAtual = hoje.getFullYear() === dataRef.getFullYear() && hoje.getMonth() === dataRef.getMonth();
  let diasRestantes = 0;
  if (ehMesAtual) diasRestantes = totalDiasNoMes - hoje.getDate() + 1; // conta o dia de hoje
  else if (dataRef > hoje) diasRestantes = totalDiasNoMes;
  const mediaDiaria = diasRestantes > 0 && faltaParaMeta > 0 ? faltaParaMeta / diasRestantes : 0;

  const salvarNovaMeta = async () => {
    const valorNum = Number(inputMeta);
    if (await salvarMeta(valorNum > 0 ? valorNum : null)) setEditandoMeta(false);
  };

  const excluirMeta = () =>
    pedirConfirmacao({
      titulo: 'Excluir a meta mensal?',
      mensagem: 'Você poderá definir outra meta quando quiser.',
      rotulo: 'Excluir',
      aoConfirmar: () => salvarMeta(null),
    });

  // ==========================================
  // EXTRATO
  // ==========================================
  const visiveis = lancamentosDoMes.filter((item) => {
    if (filtro === 'receitas') return item.tipo === 'receita';
    if (filtro === 'despesas') return item.tipo === 'despesa';
    return true;
  });
  const porDia = {};
  visiveis.forEach((item) => {
    if (!porDia[item.data]) porDia[item.data] = [];
    porDia[item.data].push(item);
  });
  const dias = Object.keys(porDia).sort().reverse();

  return (
    <div className="pb-4">
      <SeletorMes texto={mesTexto} aoVoltar={aoVoltarMes} aoAvancar={aoAvancarMes} />

      {aba === 'painel' && (
        <>
          {/* LUCRO + META */}
          <div className="mt-3 rounded-3xl border border-linha bg-gradient-to-br from-marca/15 via-cartao to-cartao p-5">
            <p className="text-xs font-medium text-suave">Lucro líquido do mês</p>
            <p className={`mt-1 text-3xl font-bold tracking-tight ${liquidoMes >= 0 ? 'text-texto' : 'text-despesa'}`}>
              {liquidoMes >= 0 ? moeda(liquidoMes) : `- ${moeda(Math.abs(liquidoMes))}`}
            </p>

            {editandoMeta ? (
              <div className="mt-4 border-t border-linha pt-4">
                <label htmlFor="metaMensal" className="mb-1.5 block text-xs font-medium text-suave">
                  Meta de lucro líquido (R$)
                </label>
                <div className="flex gap-2">
                  <input
                    id="metaMensal"
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={inputMeta}
                    onChange={(e) => setInputMeta(e.target.value)}
                    placeholder="0,00"
                    className={CAMPO}
                    autoFocus
                  />
                  <button onClick={salvarNovaMeta} className="rounded-xl bg-marca px-4 text-sm font-semibold text-sobremarca">
                    Salvar
                  </button>
                </div>
                <button onClick={() => setEditandoMeta(false)} className="mt-2 text-xs font-medium text-suave">
                  Cancelar
                </button>
              </div>
            ) : metaMensal ? (
              <div className="mt-4 border-t border-linha pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-suave">Meta: {moeda(metaMensal)}</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setInputMeta(String(metaMensal));
                        setEditandoMeta(true);
                      }}
                      aria-label="Editar meta"
                      className="grid h-8 w-8 place-items-center rounded-full text-suave hover:bg-cartao2"
                    >
                      <IconeLapis width={16} height={16} />
                    </button>
                    <button onClick={excluirMeta} aria-label="Excluir meta" className="grid h-8 w-8 place-items-center rounded-full text-suave hover:bg-cartao2">
                      <IconeLixeira width={16} height={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-cartao2">
                  <div className="h-full rounded-full bg-marca transition-all duration-700" style={{ width: `${progressoMeta}%` }}></div>
                </div>
                <p className="mt-2 text-xs text-texto">
                  {faltaParaMeta > 0 ? (
                    <>
                      Faltam <strong>{moeda(faltaParaMeta)}</strong> ({progressoMeta.toFixed(0)}% da meta)
                    </>
                  ) : (
                    <strong className="text-marca">Meta atingida! 🏆</strong>
                  )}
                </p>
                {faltaParaMeta > 0 && diasRestantes > 0 && (
                  <p className="mt-1 text-[11px] text-suave">
                    {diasRestantes} dia{diasRestantes === 1 ? '' : 's'} restante{diasRestantes === 1 ? '' : 's'} • média de {moeda(mediaDiaria)} por dia
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setInputMeta('');
                  setEditandoMeta(true);
                }}
                className="mt-4 w-full rounded-xl border border-dashed border-marca/50 bg-marca/10 py-3 text-xs font-semibold text-marca"
              >
                Definir meta de lucro mensal
              </button>
            )}
          </div>

          {/* NÚMEROS */}
          <div className="mt-3 grid grid-cols-3 divide-x divide-linha rounded-2xl border border-linha bg-cartao py-3 text-center">
            <div>
              <p className="text-[11px] text-suave">Faturamento</p>
              <p className="mt-0.5 text-sm font-semibold text-receita">{moeda(stats.bruto)}</p>
            </div>
            <div>
              <p className="text-[11px] text-suave">Custos</p>
              <p className="mt-0.5 text-sm font-semibold text-despesa">{moeda(stats.custos)}</p>
            </div>
            <div>
              <p className="text-[11px] text-suave">Taxas</p>
              <p className="mt-0.5 text-sm font-semibold text-alerta">{moeda(stats.taxas)}</p>
            </div>
          </div>

          {lancamentosDoMes.length === 0 && (
            <p className="mt-8 text-center text-sm text-suave">Nenhum lançamento neste mês. Toque no + para registrar um serviço.</p>
          )}

          {/* DESTAQUES */}
          {(maiorServico || maiorCusto) && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-texto">Destaques do mês</h3>
              <div className="mt-1 divide-y divide-linha text-sm">
                {maiorServico && (
                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-xs text-suave">Serviço que mais faturou</p>
                      <p className="truncate font-medium text-texto">{maiorServico[0]}</p>
                    </div>
                    <span className="font-semibold text-receita">{moeda(maiorServico[1])}</span>
                  </div>
                )}
                {maiorCusto && (
                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-xs text-suave">Maior categoria de custo</p>
                      <p className="truncate font-medium text-texto">{maiorCusto[0]}</p>
                    </div>
                    <span className="font-semibold text-despesa">{moeda(maiorCusto[1])}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* COMPOSIÇÃO DO FATURAMENTO */}
          {mixServicos.length > 0 && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-texto">De onde vem o faturamento</h3>
              <div className="relative mt-2 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mixServicos} innerRadius={54} outerRadius={78} paddingAngle={2} dataKey="valor" nameKey="nome" stroke="none">
                      {mixServicos.map((entry) => (
                        <Cell key={entry.nome} fill={entry.cor} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(valor) => moeda(valor)} {...ESTILO_TOOLTIP} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="text-[11px] text-suave">Faturamento</p>
                    <p className="text-base font-bold text-texto">{moeda(stats.bruto)}</p>
                  </div>
                </div>
              </div>
              <ul className="mt-2 divide-y divide-linha">
                {mixServicos.map((item) => (
                  <li key={item.nome} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.cor }}></span>
                    <span className="min-w-0 flex-1 truncate text-texto">{item.nome}</span>
                    <span className="text-xs text-suave">{Math.round((item.valor / totalMix) * 100)}%</span>
                    <span className="w-24 text-right font-medium text-texto">{moeda(item.valor)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {aba === 'extrato' && (
        <>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar lançamentos">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                aria-pressed={filtro === f.id}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  filtro === f.id ? 'bg-marca text-sobremarca' : 'bg-cartao2 text-suave'
                }`}
              >
                {f.rotulo}
              </button>
            ))}
          </div>

          {dias.length === 0 ? (
            <p className="mt-8 text-center text-sm text-suave">
              {lancamentosDoMes.length === 0 ? 'Nenhum lançamento neste mês. Toque no + para começar.' : 'Nada encontrado com esse filtro.'}
            </p>
          ) : (
            dias.map((dia) => (
              <section key={dia} className="mt-4">
                <div className="flex items-baseline gap-2 border-b border-linha pb-1.5">
                  <span className="text-lg font-bold text-texto">{dia.slice(8, 10)}</span>
                  <span className="text-xs capitalize text-suave">{nomeDiaSemana(dia)}</span>
                </div>
                <div className="divide-y divide-linha">
                  {porDia[dia].map((item) => {
                    const valorNum = Number(item.valor || 0);
                    const taxaNum = Number(item.taxaAplicada || 0);
                    const ehReceita = item.tipo === 'receita';
                    return (
                      <button key={item.id} onClick={() => abrirEdicao(item)} className="flex w-full items-center gap-3 py-3 text-left">
                        <IconeCategoria emoji={ehReceita ? '💼' : '🧾'} cor={ehReceita ? '#22D3EE' : '#F43F5E'} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-texto">{item.servico || item.descricao}</span>
                          <span className="block truncate text-xs text-suave">
                            {[ehReceita ? item.cliente : null, item.categoria, item.responsavel].filter(Boolean).join(' • ')}
                          </span>
                          {item.observacao && <span className="block truncate text-[11px] italic text-suave">“{item.observacao}”</span>}
                        </span>
                        <span className="text-right">
                          <span className={`block text-sm font-semibold ${ehReceita ? 'text-receita' : 'text-despesa'}`}>
                            {ehReceita ? '+' : '-'} {moeda(valorNum)}
                          </span>
                          {taxaNum > 0 && <span className="block text-[11px] text-suave">líquido {moeda(valorNum - taxaNum)}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
          <p className="mt-6 text-center text-[11px] text-suave">Toque em um lançamento para editar ou excluir.</p>
        </>
      )}
    </div>
  );
}
