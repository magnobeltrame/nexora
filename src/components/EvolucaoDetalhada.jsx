import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

export default function EvolucaoDetalhada({ voltar, receitas, despesas }) {
  const [anoSelecionado, setAnoSelecionado] = useState('2026');
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const dadosAnuais = useMemo(() => {
    const base = meses.map(mes => ({ mes, receitas: 0, despesas: 0 }));

    const extrairMesAno = (dataString) => {
      if (!dataString) return { mesIdx: 9, ano: '2026' };
      const partes = dataString.split('/');
      const mesIdx = parseInt(partes[1], 10) - 1;
      const ano = partes.length === 3 ? partes[2] : '2026';
      return { mesIdx: isNaN(mesIdx) ? 9 : mesIdx, ano };
    };

    receitas.forEach(r => {
      const { mesIdx, ano } = extrairMesAno(r.data);
      if (ano === anoSelecionado && mesIdx >= 0 && mesIdx <= 11) base[mesIdx].receitas += r.valor;
    });

    despesas.forEach(d => {
      const { mesIdx, ano } = extrairMesAno(d.vencimento);
      if (ano === anoSelecionado && mesIdx >= 0 && mesIdx <= 11) base[mesIdx].despesas += d.valor;
    });

    return base;
  }, [receitas, despesas, anoSelecionado]);

  const totalGanhos = dadosAnuais.reduce((acc, curr) => acc + curr.receitas, 0);
  const totalGastos = dadosAnuais.reduce((acc, curr) => acc + curr.despesas, 0);
  const saldoAcumulado = totalGanhos - totalGastos;

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={voltar} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-slate-700 transition-colors">
          ←
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">Evolução Financeira</h2>
          <p className="text-sm text-gray-400">Relatório Anual Detalhado</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mb-8">
        <span className="text-gray-400 text-sm font-medium">Ano de Análise:</span>
        <select value={anoSelecionado} onChange={(e) => setAnoSelecionado(e.target.value)} className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg outline-none focus:border-nexora-primary">
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2027">2027</option>
        </select>
      </div>

      <div className="bg-nexora-card p-4 rounded-3xl shadow-lg border border-slate-800 mb-8">
        <div className="flex justify-center gap-6 mb-6">
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#10B981] rounded-sm"></div><span className="text-xs text-gray-400">Entradas (Receitas)</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#EF4444] rounded-sm"></div><span className="text-xs text-gray-400">Saídas (Despesas)</span></div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosAnuais} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              {/* interval={0} força todos os meses a aparecerem no eixo X */}
              <XAxis dataKey="mes" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} interval={0} />
              <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0a0f18', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
              <Bar dataKey="receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <div className="w-1 h-5 bg-nexora-primary rounded-full"></div>Resumo do Ano (Acumulado)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#10B981] p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg shadow-emerald-900/20">
          <p className="text-[10px] text-emerald-950 font-bold uppercase tracking-wider mb-1">Total Ganho em {anoSelecionado}</p>
          <p className="text-xl font-bold text-white">R$ {totalGanhos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-[#EF4444] p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg shadow-red-900/20">
          <p className="text-[10px] text-red-950 font-bold uppercase tracking-wider mb-1">Total Gasto em {anoSelecionado}</p>
          <p className="text-xl font-bold text-white">R$ {totalGastos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-slate-700 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg shadow-slate-900/50">
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider mb-1">Saldo Acumulado</p>
          <p className="text-xl font-bold text-white">R$ {saldoAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Renderização Condicional da Mensagem de Feedback */}
      {saldoAcumulado > 0 && (
        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 text-center">
          <p className="text-sm text-emerald-100">
            🎉 Parabéns! No ano de <strong className="text-white">{anoSelecionado}</strong>, você acumulou um saldo positivo de <strong className="text-emerald-400">R$ {saldoAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
          </p>
        </div>
      )}
      
      {saldoAcumulado < 0 && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-center">
          <p className="text-sm text-red-100">
            ⚠️ Atenção! No ano de <strong className="text-white">{anoSelecionado}</strong>, você fechou com um saldo negativo de <strong className="text-red-400">R$ {saldoAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
          </p>
        </div>
      )}

      {saldoAcumulado === 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-300">
            ⚖️ Tudo equilibrado. No ano de <strong className="text-white">{anoSelecionado}</strong>, seu saldo está exato em <strong className="text-gray-400">R$ 0,00</strong>.
          </p>
        </div>
      )}
    </div>
  );
}