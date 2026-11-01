import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconeCopiar } from './Icones';
import { CAMPO } from '../lib/estilos';
import { apurarMeses, bensEDireitos, possiveisDayTrade, rendimentosAno, reproduzir, saldosRendaFixa } from '../lib/investimentos';
import { formatarData, hojeISO, moeda } from '../lib/utils';

const SITUACAO = {
  isento: 'Isento (vendas até R$ 20 mil)',
  tributavel: 'Tributável: pagar DARF',
  prejuizo: 'Prejuízo (compensar depois)',
  'sem-imposto': 'Sem imposto (compensado)',
};
const NOME_MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const rotuloMes = (chave) => `${NOME_MES[Number(chave.slice(5, 7)) - 1]}/${chave.slice(0, 4)}`;

function BotaoCopiar({ texto }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      window.prompt('Copie o texto abaixo:', texto);
    }
  };
  return (
    <button onClick={copiar} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 print:hidden">
      <IconeCopiar width={13} height={13} />
      {copiado ? 'Copiado!' : 'Copiar texto'}
    </button>
  );
}

const Titulo = ({ children }) => <h3 className="mt-6 border-b-2 border-sky-600 pb-1 text-sm font-bold uppercase tracking-wide text-slate-800">{children}</h3>;

function Itens({ lista, grupo, codigo, ano }) {
  return (
  lista.length === 0 ? (
    <p className="mt-2 text-xs text-slate-500">Nenhuma posição em 31/12/{ano}.</p>
  ) : (
    <div className="mt-2 space-y-2">
      <p className="text-[11px] text-slate-500">
        Bens e Direitos: Grupo {grupo}, Código {codigo}. Valor: custo de aquisição.
      </p>
      {lista.map((b) => (
        <div key={b.ticker} className="break-inside-avoid rounded-lg bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-slate-900">
              {b.ticker} <span className="font-normal text-slate-500">· {b.quantidade} un.</span>
            </p>
            <p className="font-semibold text-slate-900">{moeda(b.custo)}</p>
          </div>
          <p className="mt-1 text-xs text-slate-600">{b.texto}</p>
          {!b.cnpj && <p className="mt-1 text-[11px] font-semibold text-rose-600">Falta o CNPJ deste ativo.</p>}
          <div className="mt-1.5">
            <BotaoCopiar texto={b.texto} />
          </div>
        </div>
      ))}
    </div>
  )
  );
}

function Tabela({ itens, colunas }) {
  return (
  <table className="mt-2 w-full text-xs">
    <thead>
      <tr className="border-b border-slate-300 text-left text-slate-500">
        {colunas.map((c, i) => (
          <th key={c} className={`py-1.5 ${i === colunas.length - 1 ? 'text-right' : ''}`}>
            {c}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>{itens}</tbody>
  </table>
);
}

// Corpo do relatório: sempre em "papel branco", igual ao que sai impresso
function Corpo({ ano, dados }) {
  const { bens, meses, rend, rf, dayTrade, avisos, prejuizoFinal } = dados;
  const acoes = bens.filter((b) => b.classe === 'acao');
  const fiis = bens.filter((b) => b.classe === 'fii');
  const totalIsento = meses.reduce((a, m) => a + m.isento, 0);
  const semCnpj = bens.filter((b) => !b.cnpj);

  return (
    <div className="text-sm text-slate-900">
      <p className="text-xs text-slate-500">
        Apoio para a declaração do ano-calendário {ano}. Gerado em {formatarData(hojeISO())}. Confira sempre com o programa da Receita e, se tiver dúvida, com um contador.
      </p>

      {(semCnpj.length > 0 || dayTrade.length > 0 || avisos.length > 0) && (
        <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          {semCnpj.length > 0 && <p>Faltam CNPJs: {semCnpj.map((b) => b.ticker).join(', ')}.</p>}
          {dayTrade.length > 0 && (
            <p className="mt-1">
              Compra e venda no mesmo dia ({dayTrade.map(([t, d]) => `${t} em ${formatarData(d)}`).join('; ')}): isso é day trade (20%, sem isenção) e NÃO é tratado neste relatório.
            </p>
          )}
          {avisos.map((a) => (
            <p key={`${a.ticker}${a.data}`} className="mt-1">
              {a.ticker}: {a.mensagem}
            </p>
          ))}
        </div>
      )}

      <Titulo>1. Bens e Direitos (posição em 31/12/{ano})</Titulo>
      <h4 className="mt-3 text-sm font-bold">Ações</h4>
      <Itens lista={acoes} grupo="03" codigo="01" ano={ano} />
      <h4 className="mt-4 text-sm font-bold">Fundos imobiliários</h4>
      <Itens lista={fiis} grupo="07" codigo="03" ano={ano} />
      <h4 className="mt-4 text-sm font-bold">Renda fixa (CDB)</h4>
      {rf.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">Nenhum saldo informado até 31/12/{ano}. Lance o saldo pelo + &gt; Renda fixa.</p>
      ) : (
        <div className="mt-2 space-y-2">
          <p className="text-[11px] text-slate-500">Bens e Direitos: Grupo 04, Código 02 (CDB). Use o saldo do informe do banco.</p>
          {rf.map((r) => (
            <div key={r.nome} className="break-inside-avoid rounded-lg bg-amber-50 p-3">
              <div className="flex justify-between gap-2">
                <p className="font-bold">{r.nome}</p>
                <p className="font-semibold">{moeda(r.saldo)}</p>
              </div>
              <p className="text-xs text-slate-600">Saldo informado em {formatarData(r.data)}. Aplicação de renda fixa.</p>
            </div>
          ))}
        </div>
      )}

      <Titulo>2. Ganhos na venda (renda variável, mês a mês)</Titulo>
      <p className="mt-1 text-[11px] text-slate-500">Ações: 15%, com isenção se as vendas do mês somarem até R$ 20 mil. FIIs: 20%, sem isenção. DARF código 6015, até o último dia útil do mês seguinte.</p>
      {meses.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">Nenhuma venda em {ano}.</p>
      ) : (
        <>
          <Tabela
            colunas={['Mês', 'Classe', 'Vendido', 'Resultado', 'Situação', 'Imposto']}
            itens={meses.map((m) => (
              <tr key={m.mes + m.classe} className="break-inside-avoid border-b border-slate-200 align-top">
                <td className="py-1.5 pr-1">{rotuloMes(m.mes)}</td>
                <td className="pr-1">{m.classe === 'fii' ? 'FIIs' : 'Ações'}</td>
                <td className="pr-1">{moeda(m.totalVendido)}</td>
                <td className={`pr-1 font-semibold ${m.resultado >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{moeda(m.resultado)}</td>
                <td className="pr-1 text-slate-600">{SITUACAO[m.situacao]}</td>
                <td className="text-right font-semibold">
                  {m.imposto > 0 ? (
                    <>
                      {moeda(m.imposto)}
                      <span className="block text-[10px] font-normal text-rose-700">vence {formatarData(m.prazo)}</span>
                    </>
                  ) : (
                    '–'
                  )}
                </td>
              </tr>
            ))}
          />
          <p className="mt-2 text-xs text-slate-600">
            Prejuízo acumulado para compensar no futuro: ações {moeda(prejuizoFinal.acao)} · FIIs {moeda(prejuizoFinal.fii)}.
          </p>
        </>
      )}

      <Titulo>3. Rendimentos isentos</Titulo>
      <h4 className="mt-3 text-sm font-bold">Lucros e dividendos (código 09)</h4>
      {rend.dividendos.length === 0 ? (
        <p className="mt-1 text-xs text-slate-500">Nenhum dividendo em {ano}.</p>
      ) : (
        <Tabela
          colunas={['Ativo', 'Valor']}
          itens={[
            ...rend.dividendos.map((d) => (
              <tr key={d.ticker} className="border-b border-slate-200">
                <td className="py-1.5">{d.ticker}</td>
                <td className="text-right">{moeda(d.valor)}</td>
              </tr>
            )),
            <tr key="t" className="font-bold">
              <td className="py-1.5">Total</td>
              <td className="text-right">{moeda(rend.totalDividendos)}</td>
            </tr>,
          ]}
        />
      )}
      <p className="mt-1 text-[11px] text-slate-500">
        Desde 2026, se uma mesma empresa pagar mais de R$ 50 mil a você em um mês, há retenção de 10% na fonte. Se for o seu caso, confira com o informe.
      </p>

      <h4 className="mt-4 text-sm font-bold">Rendimentos de FII (código 26)</h4>
      {rend.fii.length === 0 ? (
        <p className="mt-1 text-xs text-slate-500">Nenhum rendimento de FII em {ano}.</p>
      ) : (
        <Tabela
          colunas={['Fundo', 'Valor']}
          itens={[
            ...rend.fii.map((d) => (
              <tr key={d.ticker} className="border-b border-slate-200">
                <td className="py-1.5">{d.ticker}</td>
                <td className="text-right">{moeda(d.valor)}</td>
              </tr>
            )),
            <tr key="t" className="font-bold">
              <td className="py-1.5">Total</td>
              <td className="text-right">{moeda(rend.totalFii)}</td>
            </tr>,
          ]}
        />
      )}

      <h4 className="mt-4 text-sm font-bold">Ganhos líquidos em vendas de ações até R$ 20 mil/mês (código 20)</h4>
      <p className="mt-1 text-xs">{totalIsento > 0 ? <strong>{moeda(totalIsento)}</strong> : 'Nenhum valor em ' + ano + '.'}</p>

      <Titulo>4. Tributação exclusiva: JCP (código 10)</Titulo>
      {rend.jcp.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">Nenhum JCP em {ano}.</p>
      ) : (
        <Tabela
          colunas={['Ativo', 'Valor líquido', 'IR retido']}
          itens={[
            ...rend.jcp.map((d) => (
              <tr key={d.ticker} className="border-b border-slate-200">
                <td className="py-1.5">{d.ticker}</td>
                <td>{moeda(d.valor)}</td>
                <td className="text-right">{d.irRetido > 0 ? moeda(d.irRetido) : '–'}</td>
              </tr>
            )),
            <tr key="t" className="font-bold">
              <td className="py-1.5">Total</td>
              <td>{moeda(rend.totalJcp)}</td>
              <td></td>
            </tr>,
          ]}
        />
      )}

      <p className="mt-6 border-t border-slate-200 pt-3 text-[11px] text-slate-500">
        Regras usadas: custo médio ponderado por ativo; ações e FIIs com prejuízos compensados separadamente; day trade fora do cálculo; prazo do DARF sem considerar feriados. Os códigos podem mudar a cada ano: confira no programa da Receita.
      </p>
    </div>
  );
}

export default function RelatorioIR({ operacoes = [], ativos = [], proventos = [], rendaFixa = [], anoInicial = null }) {
  const anoAtual = Number(hojeISO().slice(0, 4));
  const [ano, setAno] = useState(anoInicial ?? anoAtual);
  const [imprimindo, setImprimindo] = useState(false);

  const anos = useMemo(() => {
    const todos = [...operacoes.map((o) => o.data), ...proventos.map((p) => p.data), ...rendaFixa.map((r) => r.data)].map((d) => Number(d.slice(0, 4)));
    const primeiro = Math.min(anoAtual, ...todos);
    const lista = [];
    for (let a = anoAtual; a >= primeiro; a -= 1) lista.push(a);
    return lista;
  }, [operacoes, proventos, rendaFixa, anoAtual]);

  const dados = useMemo(() => {
    const porTicker = Object.fromEntries(ativos.map((a) => [a.ticker, a]));
    const todosMeses = apurarMeses(operacoes, porTicker);
    const prejuizoFinal = { acao: 0, fii: 0 };
    todosMeses.filter((m) => m.mes <= `${ano}-12`).forEach((m) => (prejuizoFinal[m.classe] = m.prejuizoAcumulado));
    return {
      bens: bensEDireitos(operacoes, porTicker, ano),
      meses: todosMeses.filter((m) => m.mes.startsWith(String(ano))),
      prejuizoFinal,
      rend: rendimentosAno(proventos, ano),
      rf: saldosRendaFixa(rendaFixa, `${ano}-12-31`),
      dayTrade: possiveisDayTrade(operacoes, ano),
      avisos: reproduzir(operacoes).avisos,
    };
  }, [operacoes, ativos, proventos, rendaFixa, ano]);

  useEffect(() => {
    if (!imprimindo) return undefined;
    document.body.classList.add('imprimindo-relatorio');
    return () => document.body.classList.remove('imprimindo-relatorio');
  }, [imprimindo]);

  return (
    <div className="pb-4">
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-texto">Imposto de renda</h2>
          <p className="text-xs text-suave">Tudo calculado pelos seus lançamentos</p>
        </div>
        <div className="w-28">
          <label htmlFor="anoIr" className="sr-only">
            Ano-calendário
          </label>
          <select id="anoIr" value={ano} onChange={(e) => setAno(Number(e.target.value))} className={CAMPO}>
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button onClick={() => setImprimindo(true)} className="mt-3 w-full rounded-xl bg-marca px-4 py-3 text-sm font-semibold text-sobremarca">
        Imprimir ou salvar em PDF
      </button>

      <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
        <Corpo ano={ano} dados={dados} />
      </div>

      {imprimindo &&
        createPortal(
          <div className="relatorio-pai fixed inset-0 z-[100] overflow-y-auto bg-white text-slate-900 print:static print:overflow-visible">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3 print:hidden">
              <span className="text-sm font-semibold">Relatório de IR · {ano}</span>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                  Imprimir / Salvar PDF
                </button>
                <button onClick={() => setImprimindo(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                  Fechar
                </button>
              </div>
            </div>
            <div className="mx-auto max-w-3xl px-5 py-6">
              <h1 className="mb-2 text-xl font-bold">Informe de investimentos · ano-calendário {ano}</h1>
              <Corpo ano={ano} dados={dados} />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
