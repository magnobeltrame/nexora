import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatarData, hojeISO, moeda } from '../lib/utils';

// Relatório de prestação de contas, pronto para imprimir ou salvar como PDF.
// Sempre em fundo branco, independente do tema claro/escuro do app.
export default function RelatorioPai({ lancamentos = [], nomeResponsavel = '', aoFechar }) {
  const primeira = lancamentos.reduce((min, l) => (l.data < min ? l.data : min), hojeISO());
  const [de, setDe] = useState(primeira);
  const [ate, setAte] = useState(hojeISO());

  // Enquanto o relatório está aberto, a impressão mostra só ele
  useEffect(() => {
    document.body.classList.add('imprimindo-relatorio');
    return () => document.body.classList.remove('imprimindo-relatorio');
  }, []);

  const dados = useMemo(() => {
    const sinal = (l) => (l.tipo === 'entrada' ? l.valor : -l.valor);
    const anterior = lancamentos.filter((l) => l.data < de).reduce((acc, l) => acc + sinal(l), 0);
    const periodo = lancamentos.filter((l) => l.data >= de && l.data <= ate).sort((a, b) => a.data.localeCompare(b.data));
    const entradas = periodo.filter((l) => l.tipo === 'entrada').reduce((acc, l) => acc + l.valor, 0);
    const saidas = periodo.filter((l) => l.tipo === 'saida').reduce((acc, l) => acc + l.valor, 0);
    return { anterior, periodo, entradas, saidas, final: anterior + entradas - saidas };
  }, [lancamentos, de, ate]);

  const comSinal = (v) => (v >= 0 ? moeda(v) : `- ${moeda(Math.abs(v))}`);
  const campo = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900';

  return createPortal(
    <div className="relatorio-pai fixed inset-0 z-[100] overflow-y-auto bg-white text-slate-900 print:static print:overflow-visible">
      <div className="sticky top-0 z-10 flex flex-wrap items-end gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 print:hidden">
        <div>
          <label htmlFor="relDe" className="mb-1 block text-xs font-medium text-slate-600">
            De
          </label>
          <input id="relDe" type="date" value={de} onChange={(e) => setDe(e.target.value)} className={campo} />
        </div>
        <div>
          <label htmlFor="relAte" className="mb-1 block text-xs font-medium text-slate-600">
            Até
          </label>
          <input id="relAte" type="date" value={ate} onChange={(e) => setAte(e.target.value)} className={campo} />
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => window.print()} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Imprimir / Salvar PDF
          </button>
          <button onClick={aoFechar} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
            Fechar
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-6">
        <h1 className="text-xl font-bold">Prestação de contas: caixa do pai</h1>
        <p className="mt-1 text-sm text-slate-600">
          Período: {formatarData(de)} a {formatarData(ate)}
          {nomeResponsavel ? ` • Responsável: ${nomeResponsavel}` : ''} • Gerado em {formatarData(hojeISO())}
        </p>

        <table className="mt-4 w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="py-2">Saldo no início do período</td>
              <td className="py-2 text-right font-semibold">{comSinal(dados.anterior)}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2">Total de entradas</td>
              <td className="py-2 text-right font-semibold text-emerald-700">{moeda(dados.entradas)}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2">Total de saídas</td>
              <td className="py-2 text-right font-semibold text-rose-700">{moeda(dados.saidas)}</td>
            </tr>
            <tr>
              <td className="py-2 font-bold">Saldo no fim do período</td>
              <td className="py-2 text-right font-bold">{comSinal(dados.final)}</td>
            </tr>
          </tbody>
        </table>

        <h2 className="mt-6 text-base font-bold">Lançamentos ({dados.periodo.length})</h2>
        {dados.periodo.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Nenhum lançamento neste período.</p>
        ) : (
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-300 text-left text-xs uppercase text-slate-600">
                <th className="py-2 pr-2">Data</th>
                <th className="py-2 pr-2">Tipo</th>
                <th className="py-2 pr-2">Nome</th>
                <th className="py-2 pr-2">Descrição</th>
                <th className="py-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {dados.periodo.map((l) => (
                <tr key={l.id} className="break-inside-avoid border-b border-slate-200 align-top">
                  <td className="whitespace-nowrap py-1.5 pr-2">{formatarData(l.data)}</td>
                  <td className={`py-1.5 pr-2 ${l.tipo === 'entrada' ? 'text-emerald-700' : 'text-rose-700'}`}>{l.tipo === 'entrada' ? 'Entrada' : 'Saída'}</td>
                  <td className="py-1.5 pr-2">{l.nome}</td>
                  <td className="py-1.5 pr-2 text-slate-600">{[l.descricao, l.observacao].filter(Boolean).join(' • ')}</td>
                  <td className="whitespace-nowrap py-1.5 text-right font-medium">{moeda(l.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>,
    document.body
  );
}
