import React, { useState } from 'react';

export default function VisaoGeral({
  stats = { saldo: 0 },
  receitas = [],
  despesas = [],
  mesAtualTexto = 'Outubro de 2026',
  limitesOrcamento = {},
  setLimitesOrcamento = () => {},
  irParaEvolucao = () => {}
}) {
  const [editandoLimites, setEditandoLimites] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Alimentação');
  const [valorNovoLimite, setValorNovoLimite] = useState('');

  const listaCategoriasDisponiveis = [
    'Alimentação', 'Moradia', 'Transporte', 'Educação', 'Cartões', 'Lazer', 'Investimentos', 'Outros'
  ];

  // ==========================================
  // CÁLCULOS FINANCEIROS DINÂMICOS
  // ==========================================
  // Receitas efetivamente recebidas (onde recebido !== false)
  const receitasRecebidas = receitas.filter(r => r.recebido !== false);
  const totalReceitasMes = receitasRecebidas.reduce((acc, curr) => acc + curr.valor, 0);

  // Receitas pendentes (A Receber) unificadas pelo status
  const receitasPendentes = receitas.filter(r => r.recebido === false);
  const aReceberTotal = receitasPendentes.reduce((acc, curr) => acc + curr.valor, 0);
  const qtdAReceber = receitasPendentes.length;

  // Despesas pagas
  const despesasPagas = despesas.filter(d => d.pago).reduce((acc, curr) => acc + curr.valor, 0);
  
  // Despesas pendentes (A Pagar)
  const despesasPendentes = despesas.filter(d => !d.pago);
  const aPagarTotal = despesasPendentes.reduce((acc, curr) => acc + curr.valor, 0);
  const qtdAPagar = despesasPendentes.length;

  const resultadoMes = totalReceitasMes - despesasPagas;
  const saldoDisponivel = stats.saldo !== undefined ? stats.saldo : (totalReceitasMes - despesasPagas);

  // Mapear gastos reais por categoria a partir das despesas do mês
  const gastosPorCategoria = despesas.reduce((acc, curr) => {
    const cat = curr.categoria || 'Outros';
    acc[cat] = (acc[cat] || 0) + curr.valor;
    return acc;
  }, {});

  // Categorias ativas
  const categoriasAtivas = Array.from(new Set([...Object.keys(gastosPorCategoria), ...Object.keys(limitesOrcamento)]));

  const salvarLimiteUnico = (e) => {
    e.preventDefault();
    if (!valorNovoLimite || isNaN(valorNovoLimite)) return;
    setLimitesOrcamento({
      ...limitesOrcamento,
      [categoriaSelecionada]: parseFloat(valorNovoLimite)
    });
    setValorNovoLimite('');
  };

  const removerLimite = (cat) => {
    const novosLimites = { ...limitesOrcamento };
    delete novosLimites[cat];
    setLimitesOrcamento(novosLimites);
  };

  const totalDespesasMes = despesas.reduce((a, b) => a + b.valor, 0);
  const maiorValor = Math.max(totalReceitasMes, totalDespesasMes, 1);

  return (
    <div className="animate-fade-in flex flex-col gap-4 pb-24">
      {/* Cabeçalho Compacto */}
      <div className="flex justify-between items-center bg-[#1F122B] p-4 rounded-2xl border border-purple-500/20 shadow-md">
        <div>
          <h2 className="text-lg font-bold text-white">Visão Geral</h2>
          <p className="text-[11px] text-purple-300 capitalize">{mesAtualTexto}</p>
        </div>
        <span className="bg-purple-500/20 text-purple-300 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-purple-500/30">Dashboard</span>
      </div>

      {/* Grid de Cards Principais */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-[#1F122B] p-3.5 rounded-2xl border border-purple-500/20 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] text-gray-400 uppercase font-medium">Saldo disponível</p>
          <p className={`text-base font-bold truncate mt-1 ${saldoDisponivel >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {saldoDisponivel >= 0 ? `R$ ${saldoDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `- R$ ${Math.abs(saldoDisponivel).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </p>
        </div>

        <div className="bg-[#1F122B] p-3.5 rounded-2xl border border-purple-500/20 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] text-gray-400 uppercase font-medium">Receitas recebidas</p>
          <p className="text-base font-bold text-emerald-400 truncate mt-1">
            R$ {totalReceitasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-[#1F122B] p-3.5 rounded-2xl border border-purple-500/20 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] text-gray-400 uppercase font-medium">Despesas pagas</p>
          <p className="text-base font-bold text-pink-400 truncate mt-1">
            R$ {despesasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-[#1F122B] p-3.5 rounded-2xl border border-purple-500/20 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] text-gray-400 uppercase font-medium">Resultado do mês</p>
          <p className={`text-base font-bold truncate mt-1 ${resultadoMes >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {resultadoMes >= 0 ? `+ R$ ${resultadoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `- R$ ${Math.abs(resultadoMes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </p>
        </div>
      </div>

      {/* Cards de Pendências (A Pagar e A Receber dinâmico e funcional) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-[#1F122B] p-3.5 rounded-2xl border border-red-500/20 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-red-400 uppercase font-semibold">A pagar</p>
            <p className="text-sm font-bold text-white truncate mt-1">
              R$ {aPagarTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 pt-1 border-t border-purple-500/10">
            {qtdAPagar} pendente{qtdAPagar === 1 ? '' : 's'}
          </p>
        </div>

        <div className="bg-[#1F122B] p-3.5 rounded-2xl border border-emerald-500/20 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-emerald-400 uppercase font-semibold">A receber</p>
            <p className="text-sm font-bold text-white truncate mt-1">
              R$ {aReceberTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 pt-1 border-t border-purple-500/10">
            {qtdAReceber} pendente{qtdAReceber === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* SEÇÃO: ORÇAMENTO MENSAL */}
      <div className="bg-[#1F122B] p-5 rounded-3xl border border-purple-500/20 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Orçamento mensal</h3>
            <p className="text-[11px] text-purple-300">Acompanhamento por categoria</p>
          </div>
          <button 
            onClick={() => setEditandoLimites(!editandoLimites)}
            className="text-xs text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-xl border border-purple-500/30 transition-all font-semibold"
          >
            ⚙️ {editandoLimites ? 'Concluir' : 'Gerenciar Limites'}
          </button>
        </div>

        {editandoLimites && (
          <div className="bg-[#2A1B38] p-3.5 rounded-2xl border border-purple-500/40 mb-4 flex flex-col gap-3">
            <p className="text-[11px] font-bold text-purple-200">Definir limite opcional por categoria:</p>
            <form onSubmit={salvarLimiteUnico} className="flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-2">
                <select 
                  value={categoriaSelecionada} 
                  onChange={e => setCategoriaSelecionada(e.target.value)}
                  className="bg-[#1F122B] border border-purple-500/30 rounded-lg px-2.5 py-2 text-white text-xs outline-none"
                >
                  {listaCategoriasDisponiveis.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Valor limite (R$)"
                  value={valorNovoLimite} 
                  onChange={e => setValorNovoLimite(e.target.value)}
                  className="bg-[#1F122B] border border-purple-500/30 rounded-lg px-2.5 py-2 text-white text-xs outline-none"
                  required
                />
              </div>
              <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-xs shadow-md transition-all">
                Salvar Limite
              </button>
            </form>

            <div className="mt-1 pt-2 border-t border-purple-500/20">
              <p className="text-[10px] text-gray-400 uppercase mb-1.5 font-semibold">Limites Salvos:</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(limitesOrcamento).length === 0 ? (
                  <span className="text-[11px] text-gray-400">Nenhum limite fixo definido.</span>
                ) : (
                  Object.keys(limitesOrcamento).map(cat => (
                    <span key={cat} className="bg-[#1F122B] text-[11px] text-purple-200 px-2 py-1 rounded-lg border border-purple-500/30 flex items-center gap-1.5">
                      {cat}: <b>R$ {limitesOrcamento[cat]?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b>
                      <button type="button" onClick={() => removerLimite(cat)} className="text-red-400 font-bold">×</button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lista de Categorias Ativas */}
        <div className="flex flex-col gap-3">
          {categoriasAtivas.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">Nenhum gasto registrado neste mês ainda.</p>
          ) : (
            categoriasAtivas.map((cat) => {
              const gasto = gastosPorCategoria[cat] || 0;
              const temLimite = limitesOrcamento[cat] !== undefined;
              const limite = temLimite ? limitesOrcamento[cat] : null;
              const percentual = limite ? Math.round((gasto / limite) * 100) : 0;
              const ultrapassou = limite && gasto > limite;
              const diferenca = limite ? Math.abs(gasto - limite) : 0;

              return (
                <div key={cat} className="flex flex-col gap-1 bg-[#251733] p-3 rounded-xl border border-purple-500/10">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{cat}</span>
                    {temLimite ? (
                      <span className={`font-bold ${ultrapassou ? 'text-red-400' : 'text-purple-300'}`}>
                        {percentual}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">Sem limite definido</span>
                    )}
                  </div>

                  {temLimite && (
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden my-0.5">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${ultrapassou ? 'bg-red-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.min(percentual, 100)}%` }}
                      ></div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[11px] text-gray-400 mt-0.5">
                    <span>Gasto: <b className="text-white">R$ {gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></span>
                    {temLimite ? (
                      <span>Limite: R$ {limite.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    ) : (
                      <button 
                        onClick={() => { setCategoriaSelecionada(cat); setEditandoLimites(true); }}
                        className="text-purple-400 hover:text-purple-300 text-[10px] underline"
                      >
                        + Definir Limite
                      </button>
                    )}
                  </div>

                  {ultrapassou && (
                    <p className="text-[10px] text-red-400 font-medium mt-0.5">
                      Ultrapassado em R$ {diferenca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MINI-CARD DE EVOLUÇÃO */}
      <div 
        onClick={irParaEvolucao}
        className="bg-[#1F122B] p-4 rounded-3xl border border-purple-500/20 shadow-md cursor-pointer hover:border-purple-400/50 transition-all group"
      >
        <div className="flex justify-between items-center mb-2.5">
          <div>
            <h3 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">Evolução Histórica & Histórico</h3>
            <p className="text-[10px] text-purple-300">Relatório dos últimos meses</p>
          </div>
          <span className="text-purple-400 text-xs font-bold group-hover:translate-x-1 transition-transform">Ver Mais →</span>
        </div>

        <div className="flex flex-col gap-1.5 pt-2 border-t border-purple-500/10">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-14 text-gray-400 text-[10px]">Entradas</span>
            <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(totalReceitasMes / maiorValor) * 100}%` }}></div>
            </div>
            <span className="text-emerald-400 font-bold w-18 text-right text-[10px]">R$ {totalReceitasMes.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="w-14 text-gray-400 text-[10px]">Saídas</span>
            <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-pink-500 h-1.5 rounded-full" style={{ width: `${(totalDespesasMes / maiorValor) * 100}%` }}></div>
            </div>
            <span className="text-pink-400 font-bold w-18 text-right text-[10px]">R$ {totalDespesasMes.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}