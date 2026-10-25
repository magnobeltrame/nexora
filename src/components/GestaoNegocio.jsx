import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function GestaoNegocio({
  abaNegocio,
  lancamentosNegocio = [],
  setLancamentosNegocio = () => {},
  filtroLancamentos = 'todos',
  setFiltroLancamentos = () => {},
  removerLancamentoNegocio = () => {},
  metaMensal = null,
  setMetaMensal = () => {},
  mesNegocioTexto = 'Outubro de 2026',
  voltarMesNegocio = () => {},
  avancarMesNegocio = () => {},
  lancamentosNegocioFiltradosMes = [],
  statsNegocio = { bruto: 0, custos: 0, taxas: 0, liquido: 0 },
  mixServicos = [],
  equipeNegocio = [],
  catalogoNegocio = [],
  adicionarMembroEquipa = () => {},
  removerMembroEquipa = () => {},
  adicionarItemCatalogo = () => {},
  removerItemCatalogo = () => {},
  modalNegocioAberto = false,
  setModalNegocioAberto = () => {},
  taxaPadraoNegocio = 20,
  setTaxaPadraoNegocio = () => {}
}) {
  
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [inputMeta, setInputMeta] = useState('');

  // Estados locais do formulário do modal
  const [tipoLancamentoNegocio, setTipoLancamentoNegocio] = useState('receita');
  const [nomeCliente, setNomeCliente] = useState('');
  const [servicoInput, setServicoInput] = useState('');
  const [salvarNoCatalogo, setSalvarNoCatalogo] = useState(false);
  const [novoValorNegocio, setNovoValorNegocio] = useState('');
  const [novoCategoriaNegocio, setNovoCategoriaNegocio] = useState('Serviço Principal');
  const [aplicarTaxa, setAplicarTaxa] = useState(true);
  
  const dataHojeStr = `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
  const [novaDataNegocio, setNovaDataNegocio] = useState(dataHojeStr);
  const [responsavelSelecionado, setResponsavelSelecionado] = useState(equipeNegocio[0] || 'Magno');
  const [observacaoNegocio, setObservacaoNegocio] = useState('');

  // Estados para gerir equipa e catálogo (excluir ou adicionar)
  const [mostrarGestao, setMostrarGestao] = useState(false);
  const [nomeNovoProfissional, setNomeNovoProfissional] = useState('');

  const liquidoMes = statsNegocio.liquido;

  const lancamentosFiltrados = lancamentosNegocioFiltradosMes.filter(item => {
    if (filtroLancamentos === 'receitas') return item.tipo === 'receita';
    if (filtroLancamentos === 'despesas') return item.tipo === 'despesa';
    return true;
  });

  const despesasDoMes = lancamentosNegocioFiltradosMes.filter(i => i.tipo === 'despesa');
  const receitasDoMes = lancamentosNegocioFiltradosMes.filter(i => i.tipo === 'receita');

  const resumoDespesasPorCat = despesasDoMes.reduce((acc, curr) => {
    const cat = curr.categoria || 'Geral';
    acc[cat] = (acc[cat] || 0) + Number(curr.valor || 0);
    return acc;
  }, {});
  const maiorCategoriaGasto = Object.entries(resumoDespesasPorCat).sort((a, b) => b[1] - a[1])[0] || ['Nenhuma', 0];

  const resumoReceitasPorDesc = receitasDoMes.reduce((acc, curr) => {
    const desc = curr.servico || curr.descricao || 'Serviço';
    acc[desc] = (acc[desc] || 0) + Number(curr.valor || 0);
    return acc;
  }, {});
  const carroChefeMes = Object.entries(resumoReceitasPorDesc).sort((a, b) => b[1] - a[1])[0] || ['Nenhum', 0];

  const salvarNovaMeta = () => {
    const valorNum = Number(inputMeta);
    if (valorNum > 0) {
      setMetaMensal(valorNum);
    } else {
      setMetaMensal(null);
    }
    setEditandoMeta(false);
  };

  const progressoMeta = metaMensal ? Math.min((liquidoMes / metaMensal) * 100, 100) : 0;
  const faltaParaMeta = metaMensal ? metaMensal - liquidoMes : 0;

  const hoje = new Date();
  const diaAtualDoMes = hoje.getDate();
  const totalDiasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const diasRestantes = Math.max(totalDiasNoMes - diaAtualDoMes, 0);
  const mediaDiariaNecessaria = diasRestantes > 0 && faltaParaMeta > 0 ? faltaParaMeta / diasRestantes : 0;

  let corBarra = 'from-red-500 to-orange-500';
  if (progressoMeta >= 50 && progressoMeta < 80) corBarra = 'from-orange-500 to-yellow-400';
  if (progressoMeta >= 80) corBarra = 'from-emerald-400 to-teal-400';

  // Quando seleciona um item do catálogo existente no dropdown
  const handleSelecionarCatalogo = (e) => {
    const nomeItem = e.target.value;
    if (!nomeItem) return;
    setServicoInput(nomeItem);
    const encontrado = catalogoNegocio.find(c => c.nome === nomeItem);
    if (encontrado) {
      setNovoValorNegocio(encontrado.valor.toString());
      setNovoCategoriaNegocio(encontrado.categoria);
    }
  };

  const salvarLancamentoNegocio = (e) => {
    e.preventDefault();
    if (!novoValorNegocio || !servicoInput) return;
    
    const valorNum = parseFloat(novoValorNegocio);
    let taxaCalculada = 0;
    
    if (tipoLancamentoNegocio === 'receita' && aplicarTaxa) {
      taxaCalculada = valorNum * (taxaPadraoNegocio / 100);
    }

    // Se o utilizador marcou para salvar no catálogo, adiciona automaticamente
    if (salvarNoCatalogo) {
      adicionarItemCatalogo({
        nome: servicoInput,
        valor: valorNum,
        tipo: tipoLancamentoNegocio,
        categoria: novoCategoriaNegocio
      });
    }

    const descricaoFinal = tipoLancamentoNegocio === 'receita' 
      ? `Cliente: ${nomeCliente || 'Balcão'} (${servicoInput})` 
      : servicoInput;

    const novoItem = { 
      id: Date.now(), 
      data: novaDataNegocio || dataHojeStr, 
      descricao: descricaoFinal, 
      cliente: nomeCliente,
      servico: servicoInput,
      categoria: novoCategoriaNegocio, 
      valor: valorNum, 
      tipo: tipoLancamentoNegocio,
      aplicarTaxa: aplicarTaxa,
      taxaAplicada: taxaCalculada,
      responsavel: responsavelSelecionado,
      observacao: observacaoNegocio
    };

    setLancamentosNegocio([novoItem, ...lancamentosNegocio]);
    
    // Limpar formulário
    setModalNegocioAberto(false); 
    setNomeCliente('');
    setServicoInput('');
    setNovoValorNegocio('');
    setObservacaoNegocio('');
    setSalvarNoCatalogo(false);
    setNovaDataNegocio(dataHojeStr);
  };

  return (
    <div className="animate-fade-in flex flex-col gap-4 pb-28">
      {abaNegocio === 'dashboard_negocio' && (
        <>
          <div className="bg-[#1F122B] p-4 rounded-2xl border border-purple-500/20 shadow-md flex justify-between items-center">
            <button onClick={voltarMesNegocio} className="text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-xl text-xs font-bold transition-all">
              ← Mês Anterior
            </button>
            <div className="text-center">
              <h2 className="text-sm font-bold text-white capitalize">{mesNegocioTexto}</h2>
              <p className="text-[10px] text-purple-300">Painel Profissional</p>
            </div>
            <button onClick={avancarMesNegocio} className="text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-xl text-xs font-bold transition-all">
              Próximo →
            </button>
          </div>

          {!metaMensal && !editandoMeta ? (
            <button onClick={() => { setInputMeta(''); setEditandoMeta(true); }} className="w-full bg-[#1F122B] border border-purple-500/30 border-dashed p-3 rounded-2xl text-purple-400 font-bold hover:bg-purple-500/25 transition-all flex items-center justify-center gap-2 text-xs">
              🎯 Definir Meta de Lucro Líquido Mensal
            </button>
          ) : (
            <div className="bg-[#1F122B] p-4 rounded-2xl border border-purple-500/30 shadow-md">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-purple-300 font-bold uppercase tracking-wider">🎯 Meta de Resultado (Lucro Líquido)</p>
                {metaMensal && !editandoMeta && (
                  <div className="flex gap-3">
                    <button onClick={() => { setInputMeta(metaMensal); setEditandoMeta(true); }} className="text-gray-400 hover:text-white transition-colors" title="Editar Meta">✏️</button>
                    <button onClick={() => setMetaMensal(null)} className="text-gray-400 hover:text-red-400 transition-colors" title="Excluir Meta">🗑️</button>
                  </div>
                )}
              </div>

              {editandoMeta ? (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-white font-bold text-sm">R$</span>
                  <input type="number" step="0.01" value={inputMeta} onChange={e => setInputMeta(e.target.value)} placeholder="0.00" className="flex-1 bg-[#2A1B38] border border-purple-500/50 rounded-lg px-3 py-2 text-white text-sm outline-none" autoFocus />
                  <button onClick={salvarNovaMeta} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all">Salvar</button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      {faltaParaMeta > 0 ? (
                        <p className="text-xs text-white">Faltam <strong className="text-purple-400">R$ {faltaParaMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> de lucro</p>
                      ) : (
                        <p className="text-xs text-emerald-400 font-bold">🏆 Meta de Lucro Atingida!</p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white">{progressoMeta.toFixed(1)}%</span>
                  </div>
                  
                  <div className="w-full bg-slate-800 rounded-full h-2.5 mb-3">
                    <div className={`bg-gradient-to-r ${corBarra} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${progressoMeta}%` }}></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-500/10 text-[11px] text-gray-300">
                    <div>📅 Dias restantes: <b className="text-white">{diasRestantes} dias</b></div>
                    <div>⚡ Média diária necessária: <b className="text-purple-400">R$ {mediaDiariaNecessaria.toFixed(2)}/dia</b></div>
                  </div>
                </>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-[#1F122B] p-3.5 rounded-2xl border border-purple-500/20 shadow-sm">
              <p className="text-[10px] text-gray-400 uppercase font-medium">Faturamento Bruto</p>
              <p className="text-base font-bold text-emerald-400 truncate mt-1">R$ {statsNegocio.bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-[#1F122B] p-3.5 rounded-2xl border border-purple-500/20 shadow-sm">
              <p className="text-[10px] text-gray-400 uppercase font-medium">Custos Operacionais</p>
              <p className="text-base font-bold text-pink-400 truncate mt-1">R$ {statsNegocio.custos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-[#1F122B] p-3.5 rounded-2xl border border-purple-500/20 shadow-sm">
              <p className="text-[10px] text-gray-400 uppercase font-medium">Repasses / Taxas</p>
              <p className="text-base font-bold text-red-400 truncate mt-1">R$ {statsNegocio.taxas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-[#1F122B] p-3.5 rounded-2xl border border-purple-500/20 shadow-sm">
              <p className="text-[10px] text-gray-400 uppercase font-medium">Lucro Líquido</p>
              <p className={`text-base font-bold truncate mt-1 ${liquidoMes >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                R$ {liquidoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="bg-[#1F122B] p-4 rounded-2xl border border-purple-500/20 shadow-md flex flex-col gap-2">
            <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">💡 Destaques do Período</p>
            <div className="text-xs text-gray-300 flex flex-col gap-1.5 pt-1 border-t border-purple-500/10">
              <p>📦 <b>Maior Categoria de Custo:</b> <span className="text-pink-400">{maiorCategoriaGasto[0]}</span> (R$ {Number(maiorCategoriaGasto[1] || 0).toFixed(2)})</p>
              <p>⭐ <b>Destaque de Faturamento:</b> <span className="text-emerald-400">{carroChefeMes[0]}</span> (R$ {Number(carroChefeMes[1] || 0).toFixed(2)})</p>
            </div>
          </div>

          {mixServicos.length > 0 && (
            <section className="bg-[#1F122B] p-4 rounded-2xl shadow-md border border-purple-500/20">
              <h3 className="text-center text-xs font-bold text-purple-300 mb-3">Composição de Receitas</h3>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mixServicos} innerRadius={40} outerRadius={65} paddingAngle={5} dataKey="quantidade" stroke="none">
                      {mixServicos.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.cor} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-col gap-1.5">
                {mixServicos.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.cor }}></div>
                      <span className="text-gray-300">{item.nome}</span>
                    </div>
                    <span className="font-semibold text-white">{item.quantidade} un.</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {abaNegocio === 'extrato_negocio' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Extrato do Negócio</h2>
            <span className="text-xs text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30 capitalize">{mesNegocioTexto}</span>
          </div>
          
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            <button onClick={() => setFiltroLancamentos('todos')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${filtroLancamentos === 'todos' ? 'bg-purple-600 text-white' : 'bg-[#1F122B] text-purple-300 border border-purple-500/30'}`}>Tudo</button>
            <button onClick={() => setFiltroLancamentos('receitas')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${filtroLancamentos === 'receitas' ? 'bg-emerald-600 text-white' : 'bg-[#1F122B] text-emerald-300 border border-emerald-500/30'}`}>Clientes/Receitas</button>
            <button onClick={() => setFiltroLancamentos('despesas')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${filtroLancamentos === 'despesas' ? 'bg-red-600 text-white' : 'bg-[#1F122B] text-red-300 border border-red-500/30'}`}>Despesas Operacionais</button>
          </div>

          <div className="flex flex-col gap-2.5">
            {lancamentosFiltrados.length === 0 ? (
              <p className="text-center text-purple-400 mt-4 text-xs">Nenhum lançamento neste mês.</p>
            ) : (
              lancamentosFiltrados.map((item) => {
                const valorNum = Number(item.valor || 0);
                const taxaNum = Number(item.taxaAplicada || 0);
                const liquidoNum = valorNum - taxaNum;

                return (
                  <div key={item.id} className="bg-[#1F122B] p-3.5 rounded-2xl border border-purple-500/20 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-bold text-white text-xs truncate">{item.descricao}</p>
                        <p className="text-[10px] text-purple-300">
                          {item.categoria} • Dia {item.data} {item.responsavel ? `• 👤 ${item.responsavel}` : ''}
                        </p>
                        {item.observacao && (
                          <p className="text-[10px] text-gray-400 italic mt-0.5">💬 "{item.observacao}"</p>
                        )}
                      </div>
                      <button onClick={() => removerLancamentoNegocio(item.id)} className="text-gray-500 hover:text-red-400 transition-all p-1">
                        🗑️
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-purple-500/10 text-center text-[11px]">
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase">Bruto</p>
                        <p className={`font-bold ${item.tipo === 'receita' ? 'text-emerald-400' : 'text-red-400'}`}>R$ {valorNum.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase">Taxas</p>
                        <p className="font-bold text-red-400">{taxaNum > 0 ? `- R$ ${taxaNum.toFixed(2)}` : 'R$ 0,00'}</p>
                      </div>
                      <div className="bg-slate-800/40 rounded-lg py-0.5">
                        <p className="text-[9px] text-gray-400 uppercase">Líquido</p>
                        <p className={`font-bold ${item.tipo === 'receita' ? 'text-emerald-400' : 'text-red-400'}`}>R$ {liquidoNum.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* MODAL COMERCIAL REFINADO */}
      {modalNegocioAberto && (
        <div className="absolute inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModalNegocioAberto(false)}></div>
          <div className="relative w-full bg-[#2A1B38] rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-purple-500/30 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-bold text-center flex-1">Novo Lançamento Comercial</h3>
              <button type="button" onClick={() => setMostrarGestao(!mostrarGestao)} className="text-purple-300 hover:text-white bg-purple-500/20 px-2.5 py-1 rounded-xl text-xs flex items-center gap-1">
                ⚙️ Gerir
              </button>
            </div>

            {/* PAINEL DE GESTÃO PARA EXCLUIR ITENS OU EQUIPA */}
            {mostrarGestao && (
              <div className="mb-4 bg-[#1F122B] p-3 rounded-2xl border border-purple-500/40 text-xs flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-purple-300 uppercase">⚙️ Gestão de Equipa e Catálogo</span>
                  <button onClick={() => setMostrarGestao(false)} className="text-gray-400 hover:text-white font-bold">✕ Fechar</button>
                </div>

                {/* Secção Equipa */}
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">Membros da Equipa:</p>
                  <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                    {equipeNegocio.map(membro => (
                      <div key={membro} className="flex justify-between items-center bg-[#2A1B38] px-2.5 py-1 rounded-lg">
                        <span className="text-white">{membro}</span>
                        {equipeNegocio.length > 1 && (
                          <button onClick={() => removerMembroEquipa(membro)} className="text-red-400 hover:text-red-300">🗑️</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input type="text" placeholder="Novo colaborador..." value={nomeNovoProfissional} onChange={e => setNomeNovoProfissional(e.target.value)} className="flex-1 bg-[#2A1B38] px-2 py-1 rounded text-white text-xs outline-none" />
                    <button type="button" onClick={() => {
                      if (nomeNovoProfissional) {
                        adicionarMembroEquipa(nomeNovoProfissional);
                        setNomeNovoProfissional('');
                      }
                    }} className="bg-purple-600 px-3 py-1 rounded text-white font-bold">Adicionar</button>
                  </div>
                </div>

                {/* Secção Catálogo */}
                <div className="border-t border-purple-500/20 pt-2">
                  <p className="text-[10px] text-gray-400 mb-1">Serviços / Itens Cadastrados:</p>
                  <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
                    {catalogoNegocio.map(cat => (
                      <div key={cat.nome} className="flex justify-between items-center bg-[#2A1B38] px-2.5 py-1 rounded-lg">
                        <span className="text-white">{cat.nome} <span className="text-purple-300">(R$ {cat.valor})</span></span>
                        <button onClick={() => removerItemCatalogo(cat.nome)} className="text-red-400 hover:text-red-300">🗑️</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 mb-4">
              <button onClick={() => setTipoLancamentoNegocio('receita')} className={`flex-1 py-2 rounded-lg font-semibold transition-all ${tipoLancamentoNegocio === 'receita' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-[#1F122B] text-gray-400 border border-purple-500/30'}`}>Receita (+)</button>
              <button onClick={() => setTipoLancamentoNegocio('despesa')} className={`flex-1 py-2 rounded-lg font-semibold transition-all ${tipoLancamentoNegocio === 'despesa' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-[#1F122B] text-gray-400 border border-purple-500/30'}`}>Despesa (-)</button>
            </div>

            <form onSubmit={salvarLancamentoNegocio} className="flex flex-col gap-3">
              
              {tipoLancamentoNegocio === 'receita' && (
                <input 
                  type="text" 
                  value={nomeCliente} 
                  onChange={e => setNomeCliente(e.target.value)} 
                  placeholder="Nome da Cliente (ex: Maria)" 
                  className="bg-[#1F122B] border border-purple-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-400 text-sm" 
                  required 
                />
              )}

              {/* SERVIÇO / ITEM MANUAL OU VIA CATÁLOGO + BOTÃO DE SALVAR */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={servicoInput} 
                    onChange={e => setServicoInput(e.target.value)} 
                    placeholder="Nome do serviço ou item..." 
                    className="flex-1 bg-[#1F122B] border border-purple-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-400 text-sm" 
                    required 
                  />
                  <select 
                    onChange={handleSelecionarCatalogo} 
                    defaultValue=""
                    className="w-1/3 bg-[#1F122B] border border-purple-500/30 rounded-xl px-2 py-3 text-purple-300 outline-none text-xs"
                    title="Carregar de um serviço salvo"
                  >
                    <option value="" disabled>⚡ Catálogo</option>
                    {catalogoNegocio.filter(c => c.tipo === tipoLancamentoNegocio).map((cat, idx) => (
                      <option key={idx} value={cat.nome}>{cat.nome} (R$ {cat.valor})</option>
                    ))}
                  </select>
                </div>

                {/* Checkbox para salvar automaticamente no catálogo */}
                <div className="flex items-center gap-2 pl-1">
                  <input 
                    type="checkbox" 
                    id="salvarCatalogoCheck" 
                    checked={salvarNoCatalogo} 
                    onChange={e => setSalvarNoCatalogo(e.target.checked)} 
                    className="w-4 h-4 accent-purple-600 cursor-pointer" 
                  />
                  <label htmlFor="salvarCatalogoCheck" className="text-xs text-purple-300 cursor-pointer select-none font-medium">
                    Salvar este item no catálogo para futuros lançamentos
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <input type="number" step="0.01" value={novoValorNegocio} onChange={e => setNovoValorNegocio(e.target.value)} placeholder="Valor Bruto (R$)" className="w-full bg-[#1F122B] border border-purple-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-400 text-sm" required />
                <input type="text" value={novaDataNegocio} onChange={e => setNovaDataNegocio(e.target.value)} placeholder="DD/MM/AAAA" className="w-1/2 bg-[#1F122B] border border-purple-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-400 text-sm" required />
              </div>
              
              <div className="flex gap-3">
                <select value={novoCategoriaNegocio} onChange={e => setNovoCategoriaNegocio(e.target.value)} className="flex-1 bg-[#1F122B] border border-purple-500/30 rounded-xl px-3 py-3 text-white outline-none focus:border-purple-400 text-sm">
                  {tipoLancamentoNegocio === 'receita' ? (
                    ['Serviço Principal', 'Consultoria / Avaliação', 'Venda de Produto', 'Outros'].map(cat => <option key={cat} value={cat}>{cat}</option>)
                  ) : (
                    <>
                      <option value="Insumos/Materiais">Insumos/Materiais</option>
                      <option value="Transporte/Combustível">Transporte/Combustível</option>
                      <option value="Impostos/Taxas">Impostos/Taxas Administrativas</option>
                      <option value="Outros Custos">Outros Custos</option>
                    </>
                  )}
                </select>

                <select value={responsavelSelecionado} onChange={e => setResponsavelSelecionado(e.target.value)} className="w-1/3 bg-[#1F122B] border border-purple-500/30 rounded-xl px-3 py-3 text-white outline-none focus:border-purple-400 text-sm">
                  {equipeNegocio.map(resp => <option key={resp} value={resp}>{resp}</option>)}
                </select>
              </div>

              <input 
                type="text" 
                value={observacaoNegocio} 
                onChange={e => setObservacaoNegocio(e.target.value)} 
                placeholder="Observação opcional (ex: Forma de pagamento, detalhes...)" 
                className="bg-[#1F122B] border border-purple-500/30 rounded-xl px-4 py-2.5 text-white outline-none focus:border-purple-400 text-xs" 
              />

              {tipoLancamentoNegocio === 'receita' && (
                <div className="flex items-center justify-between bg-[#1F122B] p-3 rounded-xl border border-purple-500/30">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="aplicarTaxa" checked={aplicarTaxa} onChange={e => setAplicarTaxa(e.target.checked)} className="w-4 h-4 accent-purple-600 cursor-pointer" />
                    <label htmlFor="aplicarTaxa" className="text-xs text-gray-300 cursor-pointer select-none">Descontar taxa (%)</label>
                  </div>
                  {aplicarTaxa && (
                    <div className="flex items-center gap-1">
                      <input type="number" value={taxaPadraoNegocio} onChange={e => setTaxaPadraoNegocio(Number(e.target.value))} className="w-14 bg-[#2A1B38] border border-purple-500/50 rounded-lg px-2 py-1 text-white text-center font-bold outline-none text-xs" />
                      <span className="text-gray-400 text-xs">%</span>
                    </div>
                  )}
                </div>
              )}

              <button type="submit" className={`mt-2 w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all text-sm ${tipoLancamentoNegocio === 'receita' ? 'bg-emerald-600 shadow-emerald-600/40 hover:bg-emerald-500' : 'bg-red-600 shadow-red-600/40 hover:bg-red-500'}`}>
                Lançar no Negócio
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}