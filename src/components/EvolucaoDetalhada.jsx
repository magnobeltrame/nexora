import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { CAMPO, ESTILO_TOOLTIP } from '../lib/estilos';
import { moeda } from '../lib/utils';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const COR_RECEITA = '#10B981';
const COR_DESPESA = '#F43F5E';

export default function EvolucaoDetalhada({ receitas = [], despesas = [] }) {
  const anoAtual = new Date().getFullYear();
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);

  // Anos disponíveis: do mais antigo com lançamentos (ou 2 anos atrás) até o ano que vem
  const anosDisponiveis = useMemo(() => {
    const anosComDados = [...receitas.map((r) => r.data), ...despesas.map((d) => d.vencimento)]
      .map((iso) => Number(iso?.slice(0, 4)))
      .filter(Boolean);
    const primeiro = Math.min(anoAtual - 2, ...anosComDados);
    const ultimo = Math.max(anoAtual + 1, ...anosComDados);
    const lista = [];
    for (let ano = ultimo; ano >= primeiro; ano -= 1) lista.push(ano);
    return lista;
  }, [receitas, despesas, anoAtual]);

  // Considera apenas o que já foi recebido e já foi pago
  const dadosAnuais = useMemo(() => {
    const base = MESES.map((mes) => ({ mes, receitas: 0, despesas: 0 }));

    receitas.forEach((r) => {
      if (!r.recebido || Number(r.data.slice(0, 4)) !== anoSelecionado) return;
      base[Number(r.data.slice(5, 7)) - 1].receitas += r.valor;
    });

    despesas.forEach((d) => {
      if (!d.pago || Number(d.vencimento.slice(0, 4)) !== anoSelecionado) return;
      base[Number(d.vencimento.slice(5, 7)) - 1].despesas += d.valor;
    });

    return base;
  }, [receitas, despesas, anoSelecionado]);

  const totalGanhos = dadosAnuais.reduce((acc, m) => acc + m.receitas, 0);
  const totalGastos = dadosAnuais.reduce((acc, m) => acc + m.despesas, 0);
  const saldoDoAno = totalGanhos - totalGastos;
  const temDados = totalGanhos > 0 || totalGastos > 0;

  return (
    <div className="pb-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-texto">Evolução</h2>
          <p className="text-xs text-suave">Considera só o que já foi recebido e pago</p>
        </div>
        <div className="w-28">
          <label htmlFor="anoEvolucao" className="sr-only">
            Ano
          </label>
          <select id="anoEvolucao" value={anoSelecionado} onChange={(e) => setAnoSelecionado(Number(e.target.value))} className={CAMPO}>
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SALDO DO ANO */}
      <div className="mt-4 rounded-3xl border border-linha bg-gradient-to-br from-marca/15 via-cartao to-cartao p-5">
        <p className="text-xs font-medium text-suave">Saldo de {anoSelecionado}</p>
        <p className={`mt-1 text-3xl font-bold tracking-tight ${saldoDoAno >= 0 ? 'text-texto' : 'text-despesa'}`}>
          {saldoDoAno >= 0 ? moeda(saldoDoAno) : `- ${moeda(Math.abs(saldoDoAno))}`}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-linha pt-4">
          <div>
            <p className="text-[11px] text-suave">Total recebido</p>
            <p className="mt-0.5 text-sm font-semibold text-receita">{moeda(totalGanhos)}</p>
          </div>
          <div>
            <p className="text-[11px] text-suave">Total pago</p>
            <p className="mt-0.5 text-sm font-semibold text-despesa">{moeda(totalGastos)}</p>
          </div>
        </div>
      </div>

      {/* GRÁFICO */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-texto">Mês a mês</h3>
          <div className="flex items-center gap-4 text-[11px] text-suave">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COR_RECEITA }}></span>Receitas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COR_DESPESA }}></span>Despesas
            </span>
          </div>
        </div>

        {temDados ? (
          <div className="mt-3 h-60 w-full text-suave">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosAnuais} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="currentColor" strokeOpacity={0.2} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'currentColor', fontSize: 10 }} tickLine={false} axisLine={false} interval={0} />
                <Tooltip
                  cursor={{ fill: 'currentColor', fillOpacity: 0.08 }}
                  formatter={(valor, nome) => [moeda(valor), nome === 'receitas' ? 'Receitas' : 'Despesas']}
                  {...ESTILO_TOOLTIP}
                />
                <Bar dataKey="receitas" fill={COR_RECEITA} radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" fill={COR_DESPESA} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-3 rounded-2xl bg-cartao2 px-4 py-6 text-center text-xs text-suave">
            Ainda não há valores recebidos ou pagos em {anoSelecionado}.
          </p>
        )}
      </section>

      {/* TABELA MÊS A MÊS */}
      {temDados && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-texto">Resultado por mês</h3>
          <ul className="mt-1 divide-y divide-linha">
            {dadosAnuais.map((m) => {
              const saldo = m.receitas - m.despesas;
              if (m.receitas === 0 && m.despesas === 0) return null;
              return (
                <li key={m.mes} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="w-12 font-medium text-texto">{m.mes}</span>
                  <span className="flex-1 text-xs text-suave">
                    {moeda(m.receitas)} − {moeda(m.despesas)}
                  </span>
                  <span className={`font-semibold ${saldo >= 0 ? 'text-receita' : 'text-despesa'}`}>
                    {saldo >= 0 ? moeda(saldo) : `- ${moeda(Math.abs(saldo))}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {saldoDoAno > 0 && (
        <p className="mt-6 rounded-2xl border border-receita/30 bg-receita/10 px-4 py-3 text-center text-sm text-texto">
          Em {anoSelecionado}, você fechou no azul: <strong className="text-receita">{moeda(saldoDoAno)}</strong> de saldo.
        </p>
      )}
      {saldoDoAno < 0 && (
        <p className="mt-6 rounded-2xl border border-despesa/30 bg-despesa/10 px-4 py-3 text-center text-sm text-texto">
          Em {anoSelecionado}, as saídas passaram das entradas em <strong className="text-despesa">{moeda(Math.abs(saldoDoAno))}</strong>.
        </p>
      )}
    </div>
  );
}
