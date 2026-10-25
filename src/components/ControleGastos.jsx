import React from 'react';

export default function ControleGastos({
  receitas = [],
  despesas = [],
  totalReceitas = 0,
  totalPago = 0,
  totalPendente = 0,
  filtroDespesas = 'todos',
  setFiltroDespesas = () => {},
  alternarPagamento = () => {},
  alternarRecebimento = () => {},
  removerDespesa = () => {},
  removerReceita = () => {},
  mesAtualTexto = '',
  avancarMes = () => {},
  voltarMes = () => {},
  duplicarMesAnterior = () => {},
  temDadosNoMesAnterior = false,
  abrirEdicao = () => {}
}) {

  const despesasFiltradas = despesas.filter(d => {
    if (filtroDespesas === 'pagos') return d.pago;
    if (filtroDespesas === 'pendentes') return !d.pago;
    return true;
  });

  return (
    <div className="animate-fade-in flex flex-col gap-6 pb-28">
      {/* SELETOR DE MÊS */}
      <div className="bg-nexora-card p-4 rounded-2xl border border-slate-800 shadow-md flex justify-between items-center">
        <button onClick={voltarMes} className="text-gray-400 hover:text-white bg-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold transition-all">
          ← Mês Anterior
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-white capitalize">{mesAtualTexto}</h2>
          <p className="text-[10px] text-gray-400">Controlo Financeiro Pessoal</p>
        </div>
        <button onClick={avancarMes} className="text-gray-400 hover:text-white bg-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold transition-all">
          Próximo →
        </button>
      </div>

      {/* BOTÃO DUPLICAR MÊS ANTERIOR */}
      {temDadosNoMesAnterior && (
        <button onClick={duplicarMesAnterior} className="w-full bg-nexora-primary/10 border border-nexora-primary/30 py-2.5 rounded-xl text-nexora-primary font-bold text-xs hover:bg-nexora-primary/20 transition-all flex items-center justify-center gap-2">
          📥 Importar lançamentos do mês anterior
        </button>
      )}

      {/* SECÇÃO DE RECEITAS */}
      <div className="bg-nexora-card p-4 rounded-2xl border border-slate-800 shadow-md flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">💰 Receitas do Mês</h3>
          <span className="text-xs font-bold text-white">Total: R$ {receitas.reduce((acc, r) => acc + r.valor, 0).toFixed(2)}</span>
        </div>

        <div className="flex flex-col gap-2">
          {receitas.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">Nenhuma receita registada neste mês.</p>
          ) : (
            receitas.map(r => {
              const isRecebido = r.recebido !== false;
              return (
                <div key={r.id} className="flex justify-between items-center bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    {/* Checkbox pequeno e discreto */}
                    <button 
                      onClick={() => alternarRecebimento(r.id)} 
                      className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-all text-[10px] ${isRecebido ? 'bg-emerald-500 text-white' : 'bg-slate-800 border border-slate-700 text-transparent'}`}
                      title={isRecebido ? "Recebido" : "A Receber"}
                    >
                      ✓
                    </button>
                    <div>
                      <p className={`text-xs font-bold ${isRecebido ? 'text-white' : 'text-gray-400'}`}>{r.nome}</p>
                      <p className="text-[10px] text-gray-400">Data: {r.data} • <span className={isRecebido ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{isRecebido ? 'Recebido' : 'A Receber'}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-400">R$ {r.valor.toFixed(2)}</span>
                    {/* Ícones transparentes e juntos */}
                    <div className="flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
                      <button onClick={() => abrirEdicao(r, 'receita')} className="text-gray-300 hover:text-white p-1 text-xs" title="Editar">✏️</button>
                      <button onClick={() => removerReceita(r.id)} className="text-gray-400 hover:text-red-400 p-1 text-xs" title="Excluir">🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECÇÃO DE DESPESAS */}
      <div className="bg-nexora-card p-4 rounded-2xl border border-slate-800 shadow-md flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">📉 Despesas do Mês</h3>
          <div className="flex gap-1">
            <button onClick={() => setFiltroDespesas('todos')} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${filtroDespesas === 'todos' ? 'bg-slate-700 text-white' : 'text-gray-400'}`}>Todas</button>
            <button onClick={() => setFiltroDespesas('pendentes')} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${filtroDespesas === 'pendentes' ? 'bg-red-500/20 text-red-400' : 'text-gray-400'}`}>Pendentes</button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {despesasFiltradas.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">Nenhuma despesa encontrada.</p>
          ) : (
            despesasFiltradas.map(d => (
              <div key={d.id} className="flex justify-between items-center bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2.5">
                  {/* Checkbox pequeno e discreto */}
                  <button 
                    onClick={() => alternarPagamento(d.id)} 
                    className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-all text-[10px] ${d.pago ? 'bg-emerald-500 text-white' : 'bg-slate-800 border border-slate-700 text-transparent'}`}
                    title={d.pago ? "Pago" : "Pendente"}
                  >
                    ✓
                  </button>
                  <div>
                    <p className={`text-xs font-bold ${d.pago ? 'text-gray-400 line-through' : 'text-white'}`}>{d.nome}</p>
                    <p className="text-[10px] text-gray-400">{d.categoria} • Venc: {d.vencimento}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold ${d.pago ? 'text-gray-500' : 'text-red-400'}`}>R$ {d.valor.toFixed(2)}</span>
                  {/* Ícones transparentes e juntos */}
                  <div className="flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
                    <button onClick={() => abrirEdicao(d, 'despesa')} className="text-gray-300 hover:text-white p-1 text-xs" title="Editar">✏️</button>
                    <button onClick={() => removerDespesa(d.id)} className="text-gray-400 hover:text-red-400 p-1 text-xs" title="Excluir">🗑️</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}