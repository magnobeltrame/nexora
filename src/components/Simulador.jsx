import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { CAMPO, CAMPO_AUTO, ESTILO_TOOLTIP, ROTULO } from '../lib/estilos';
import { moeda } from '../lib/utils';
import { projetar, tempoParaMeta } from '../lib/simulador';

const lerNumero = (texto) => {
  const n = parseFloat(String(texto).replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const duracao = (meses) => {
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  const partes = [];
  if (anos > 0) partes.push(`${anos} ano${anos === 1 ? '' : 's'}`);
  if (resto > 0) partes.push(`${resto} ${resto === 1 ? 'mês' : 'meses'}`);
  return partes.length ? partes.join(' e ') : 'agora mesmo';
};

function Campo({ id, rotulo, valor, aoMudar, prefixo, sufixo, passo = '0.01', larguraTotal = false }) {
  return (
    <div className={larguraTotal ? 'col-span-2' : ''}>
      <label htmlFor={id} className={ROTULO}>
        {rotulo}
      </label>
      <div className="relative">
        {prefixo && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-suave">{prefixo}</span>}
        <input
          id={id}
          type="number"
          min="0"
          step={passo}
          inputMode="decimal"
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          placeholder="0"
          className={`${CAMPO} ${prefixo ? 'pl-11' : ''} ${sufixo ? 'pr-12' : ''}`}
        />
        {sufixo && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-suave">{sufixo}</span>}
      </div>
    </div>
  );
}

// Calculadora de juros compostos. Não guarda nada: é só cálculo.
export default function Simulador() {
  const [modo, setModo] = useState('final'); // 'final' | 'tempo'
  const [inicial, setInicial] = useState('');
  const [aporte, setAporte] = useState('');
  const [taxa, setTaxa] = useState('12');
  const [periodo, setPeriodo] = useState('anual');
  const [anos, setAnos] = useState('5');
  const [meta, setMeta] = useState('');

  const base = { inicial: lerNumero(inicial), aporte: lerNumero(aporte), taxa: lerNumero(taxa), periodo };

  const resultado = useMemo(() => {
    if (modo === 'final') {
      const anosNum = Math.min(lerNumero(anos), 100);
      return { tipo: 'final', anos: anosNum, ...projetar({ ...base, anos: anosNum }) };
    }
    const metaNum = lerNumero(meta);
    if (metaNum <= 0) return { tipo: 'tempo', vazio: true };
    const meses = tempoParaMeta({ ...base, meta: metaNum });
    if (meses === null) return { tipo: 'tempo', nunca: true, meta: metaNum };
    return { tipo: 'tempo', meses, meta: metaNum, ...projetar({ ...base, anos: meses / 12 }) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, inicial, aporte, taxa, periodo, anos, meta]);

  const temGrafico = resultado.pontos && resultado.pontos.length > 1;
  const classeModo = (id) => `rounded-lg py-2.5 text-sm font-semibold transition-colors ${modo === id ? 'bg-cartao text-marca shadow-sm' : 'text-suave'}`;

  return (
    <div className="pb-4">
      <div className="mt-2">
        <h2 className="text-xl font-bold text-texto">Simulador de juros compostos</h2>
        <p className="text-xs text-suave">Veja quanto seu dinheiro pode render, ou quanto tempo leva para chegar a uma meta.</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-cartao2 p-1" role="group" aria-label="O que você quer saber">
        <button onClick={() => setModo('final')} aria-pressed={modo === 'final'} className={classeModo('final')}>
          Valor final
        </button>
        <button onClick={() => setModo('tempo')} aria-pressed={modo === 'tempo'} className={classeModo('tempo')}>
          Tempo para a meta
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Campo id="simInicial" rotulo="Valor inicial" valor={inicial} aoMudar={setInicial} prefixo="R$" />
        <Campo id="simAporte" rotulo="Aporte mensal" valor={aporte} aoMudar={setAporte} prefixo="R$" />
      </div>

      {/* Taxa (campo largo + ao ano/ao mês) na mesma barra do período */}
      <div className={`mt-3 grid gap-3 ${modo === 'final' ? 'grid-cols-[1.7fr_1fr]' : 'grid-cols-1'}`}>
        <div>
          <label htmlFor="simTaxa" className={ROTULO}>
            Taxa de juros
          </label>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <input
                id="simTaxa"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={taxa}
                onChange={(e) => setTaxa(e.target.value)}
                placeholder="12"
                className={`${CAMPO} pr-8 font-semibold`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-suave">%</span>
            </div>
            <select
              aria-label="A taxa é ao ano ou ao mês?"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className={`${CAMPO_AUTO} w-24 shrink-0 px-2`}
            >
              <option value="anual">ao ano</option>
              <option value="mensal">ao mês</option>
            </select>
          </div>
        </div>
        {modo === 'final' ? (
          <Campo id="simAnos" rotulo="Período" valor={anos} aoMudar={setAnos} sufixo="anos" passo="1" />
        ) : (
          <Campo id="simMeta" rotulo="Meta (quanto quer juntar)" valor={meta} aoMudar={setMeta} prefixo="R$" />
        )}
      </div>

      <div className="mt-5 rounded-3xl border border-linha bg-gradient-to-br from-marca/15 via-cartao to-cartao p-5" aria-live="polite">
        {resultado.tipo === 'final' && (
          <>
            <p className="text-xs font-medium text-suave">
              Em {resultado.anos} ano{resultado.anos === 1 ? '' : 's'} você terá
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-texto">{moeda(resultado.total)}</p>
          </>
        )}
        {resultado.tipo === 'tempo' && resultado.vazio && <p className="text-sm text-suave">Informe a meta para calcular o tempo.</p>}
        {resultado.tipo === 'tempo' && resultado.nunca && (
          <p className="text-sm text-texto">Com esses valores você não chega a {moeda(resultado.meta)} em 100 anos. Aumente o aporte ou a taxa.</p>
        )}
        {resultado.tipo === 'tempo' && resultado.meses !== undefined && (
          <>
            <p className="text-xs font-medium text-suave">Para juntar {moeda(resultado.meta)} você precisa de</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-texto">{duracao(resultado.meses)}</p>
          </>
        )}

        {(resultado.total !== undefined && !resultado.nunca && !resultado.vazio) && (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-linha pt-4">
            <div>
              <p className="text-[11px] text-suave">Total que você coloca</p>
              <p className="mt-0.5 text-sm font-semibold text-texto">{moeda(resultado.investido)}</p>
            </div>
            <div>
              <p className="text-[11px] text-suave">Ganho com juros</p>
              <p className="mt-0.5 text-sm font-semibold text-receita">{moeda(resultado.juros)}</p>
            </div>
          </div>
        )}
      </div>

      {temGrafico && (
        <section className="mt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-texto">Evolução</h3>
            <div className="flex items-center gap-4 text-[11px] text-suave">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-marca"></span>Total
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-400"></span>O que você colocou
              </span>
            </div>
          </div>
          <div className="mt-2 h-52 w-full text-suave">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart accessibilityLayer={false} data={resultado.pontos} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <XAxis dataKey="ano" tick={{ fill: 'currentColor', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}a`} />
                <Tooltip
                  formatter={(v, nome) => [moeda(v), nome === 'total' ? 'Total' : 'Você colocou']}
                  labelFormatter={(v) => `Ano ${v}`}
                  {...ESTILO_TOOLTIP}
                />
                <Area type="monotone" dataKey="investido" stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.25} strokeWidth={2} />
                <Area type="monotone" dataKey="total" stroke="rgb(var(--marca))" fill="rgb(var(--marca))" fillOpacity={0.25} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <p className="mt-5 text-[11px] text-suave">
        Simulação simples: o aporte entra no fim de cada mês e a taxa não muda. Não considera inflação nem imposto de renda, e rendimentos passados não garantem os futuros.
      </p>
    </div>
  );
}
