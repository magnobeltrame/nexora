import React, { useState, useMemo, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import logoNexora from './assets/logo-nexora.jpeg';
import VisaoGeral from './components/VisaoGeral';
import EvolucaoDetalhada from './components/EvolucaoDetalhada';
import ControleGastos from './components/ControleGastos';
import GestaoNegocio from './components/GestaoNegocio';

// ==========================================
// CONFIGURAÇÃO DO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://wfuttjznskzvxgpalxlr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Jgyrv-de7yCFOdScIfMcWA_tTOIUb7S'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function App() {
  const [sessao, setSessao] = useState(null);
  const [emailAuth, setEmailAuth] = useState('');
  const [senhaAuth, setSenhaAuth] = useState('');
  const [nomeAuth, setNomeAuth] = useState('');
  const [modoCadastro, setModoCadastro] = useState(false);
  const [modoRecuperacao, setModoRecuperacao] = useState(false);
  const [erroAuth, setErroAuth] = useState('');
  const [sucessoAuth, setSucessoAuth] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  const [menuAberto, setMenuAberto] = useState(false);
  const [modoAtual, setModoAtual] = useState('pessoal'); 
  const [abaPessoal, setAbaPessoal] = useState('dashboard'); 

  const [abaNegocio, setAbaNegocio] = useState('dashboard_negocio');
  const [filtroDespesas, setFiltroDespesas] = useState('todos');
  const [filtroAtendimentos, setFiltroAtendimentos] = useState('todos'); 

  // Verificar sessão ativa do Supabase ao iniciar
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const lidarComAutenticacao = async (e) => {
    e.preventDefault();
    setErroAuth('');
    setSucessoAuth('');
    setLoadingAuth(true);

    if (modoCadastro) {
      const { error } = await supabase.auth.signUp({ 
        email: emailAuth, 
        password: senhaAuth,
        options: {
          data: { nome: nomeAuth }
        }
      });
      if (error) setErroAuth(error.message);
      else alert('Conta criada com sucesso! Faça login para entrar.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: emailAuth, password: senhaAuth });
      if (error) setErroAuth('E-mail ou palavra-passe incorretos.');
    }
    setLoadingAuth(false);
  };

  const lidarComRecuperacao = async (e) => {
    e.preventDefault();
    setErroAuth('');
    setSucessoAuth('');
    setLoadingAuth(true);

    const { error } = await supabase.auth.resetPasswordForEmail(emailAuth, {
      redirectTo: window.location.origin,
    });

    if (error) {
      setErroAuth(error.message);
    } else {
      setSucessoAuth('E-mail de recuperação enviado! Verifique a sua caixa de entrada.');
    }
    setLoadingAuth(false);
  };

  // ==========================================
  // CONTROLO DO TEMPO PESSOAL
  // ==========================================
  const [dataReferencia, setDataReferencia] = useState(new Date(2026, 9, 1));
  const strMesAnoFiltro = `${String(dataReferencia.getMonth() + 1).padStart(2, '0')}/${dataReferencia.getFullYear()}`;
  const mesAtualTexto = dataReferencia.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

  const avancarMes = () => setDataReferencia(new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() + 1, 1));
  const voltarMes = () => setDataReferencia(new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() - 1, 1));

  // ==========================================
  // BASE DE DADOS PESSOAL (INICIALIZADA A ZEROS)
  // ==========================================
  const [receitas, setReceitas] = useState(() => {
    const salvo = localStorage.getItem('nexora_receitas_pessoal');
    return salvo ? JSON.parse(salvo) : [];
  });

  const [despesas, setDespesas] = useState(() => {
    const salvo = localStorage.getItem('nexora_despesas_pessoal');
    return salvo ? JSON.parse(salvo) : [];
  });

  const [limitesOrcamento, setLimitesOrcamento] = useState(() => {
    const salvo = localStorage.getItem('nexora_limites_orcamento');
    return salvo ? JSON.parse(salvo) : {};
  });

  useEffect(() => {
    localStorage.setItem('nexora_receitas_pessoal', JSON.stringify(receitas));
  }, [receitas]);

  useEffect(() => {
    localStorage.setItem('nexora_despesas_pessoal', JSON.stringify(despesas));
  }, [despesas]);

  useEffect(() => {
    localStorage.setItem('nexora_limites_orcamento', JSON.stringify(limitesOrcamento));
  }, [limitesOrcamento]);

  const receitasDoMes = receitas.filter(r => r.data.endsWith(strMesAnoFiltro));
  const despesasDoMes = despesas.filter(d => d.vencimento.endsWith(strMesAnoFiltro));

  const receitasRecebidasDoMes = receitasDoMes.filter(r => r.recebido !== false);
  const totalReceitasRecebidas = receitasRecebidasDoMes.reduce((acc, curr) => acc + curr.valor, 0);

  const totalPago = despesasDoMes.filter(d => d.pago).reduce((acc, curr) => acc + curr.valor, 0);
  const totalPendente = despesasDoMes.filter(d => !d.pago).reduce((acc, curr) => acc + curr.valor, 0);
  
  const saldoAtual = totalReceitasRecebidas - totalPago;

  const alternarPagamento = (id) => setDespesas(despesas.map(d => d.id === id ? { ...d, pago: !d.pago } : d));
  const alternarRecebimento = (id) => setReceitas(receitas.map(r => r.id === id ? { ...r, recebido: r.recebido === false ? true : false } : r));
  
  const removerDespesa = (id) => setDespesas(despesas.filter(d => d.id !== id));
  const removerReceita = (id) => setReceitas(receitas.filter(r => r.id !== id));

  const mesAnteriorData = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() - 1, 1);
  const strMesAnterior = `${String(mesAnteriorData.getMonth() + 1).padStart(2, '0')}/${mesAnteriorData.getFullYear()}`;
  const temDadosNoMesAnterior = despesas.some(d => d.vencimento.endsWith(strMesAnterior)) || receitas.some(r => r.data.endsWith(strMesAnterior));

  const duplicarMesAnterior = () => {
    const despesasAntigas = despesas.filter(d => d.vencimento.endsWith(strMesAnterior));
    const receitasAntigas = receitas.filter(r => r.data.endsWith(strMesAnterior));

    const novasDespesas = despesasAntigas.map(d => ({
      ...d, id: Date.now() + Math.random(), pago: false, vencimento: d.vencimento.replace(strMesAnterior, strMesAnoFiltro)
    }));
    const novasReceitas = receitasAntigas.map(r => ({
      ...r, id: Date.now() + Math.random(), data: r.data.replace(strMesAnterior, strMesAnoFiltro), recebido: false
    }));

    setDespesas([...despesas, ...novasDespesas]);
    setReceitas([...receitas, ...novasReceitas]);
  };

  // ==========================================
  // EDIÇÃO E CADASTRO PESSOAL
  // ==========================================
  const [modalPessoalAberto, setModalPessoalAberto] = useState(false);
  const [tipoLancamentoPessoal, setTipoLancamentoPessoal] = useState('despesa');
  const [itemEmEdicao, setItemEmEdicao] = useState(null);
  const [novoNome, setNovoNome] = useState(''); 
  const [novoValor, setNovoValor] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('Moradia'); 
  const [novaDataPessoal, setNovaDataPessoal] = useState('');
  const [novoRecebido, setNovoRecebido] = useState(true);

  const abrirEdicao = (item, tipo) => {
    setTipoLancamentoPessoal(tipo);
    setItemEmEdicao(item);
    setNovoNome(item.nome);
    setNovoValor(item.valor.toString());
    setNovaDataPessoal(tipo === 'despesa' ? item.vencimento : item.data);
    if (tipo === 'despesa') setNovaCategoria(item.categoria);
    if (tipo === 'receita') setNovoRecebido(item.recebido !== false);
    setModalPessoalAberto(true);
  };

  const abrirNovoLancamento = () => {
    setItemEmEdicao(null);
    setNovoNome(''); setNovoValor(''); setNovaDataPessoal(''); setNovaCategoria('Moradia');
    setNovoRecebido(true);
    setModalPessoalAberto(true);
  };

  const salvarLancamentoPessoal = (e) => {
    e.preventDefault();
    if (!novoNome || !novoValor) return;
    let dataFinal = novaDataPessoal || `30/${strMesAnoFiltro}`;
    if (dataFinal.length === 5) dataFinal = `${dataFinal}/${dataReferencia.getFullYear()}`;

    if (itemEmEdicao) {
      if (tipoLancamentoPessoal === 'despesa') {
        setDespesas(despesas.map(d => d.id === itemEmEdicao.id ? { ...d, nome: novoNome, valor: parseFloat(novoValor), vencimento: dataFinal, categoria: novaCategoria } : d));
      } else {
        setReceitas(receitas.map(r => r.id === itemEmEdicao.id ? { ...r, nome: novoNome, valor: parseFloat(novoValor), data: dataFinal, recebido: novoRecebido } : r));
      }
    } else {
      if (tipoLancamentoPessoal === 'despesa') {
        setDespesas([...despesas, { id: Date.now(), nome: novoNome, categoria: novaCategoria, valor: parseFloat(novoValor), vencimento: dataFinal, pago: false }]);
      } else {
        setReceitas([...receitas, { id: Date.now(), nome: novoNome, valor: parseFloat(novoValor), data: dataFinal, recebido: novoRecebido }]);
      }
    }
    setModalPessoalAberto(false);
  };

  // ==========================================
  // NEGÓCIO
  // ==========================================
  const [taxaPadraoNegocio, setTaxaPadraoNegocio] = useState(() => Number(localStorage.getItem('nexora_taxa_padrao') || 20));
  const [lancamentosNegocio, setLancamentosNegocio] = useState(() => {
    const salvo = localStorage.getItem('nexora_lancamentos_negocio');
    return salvo ? JSON.parse(salvo) : [];
  });
  const [metaMensal, setMetaMensal] = useState(() => {
    const salvo = localStorage.getItem('nexora_meta_mensal');
    return salvo ? Number(salvo) : null;
  });

  const [equipeNegocio, setEquipeNegocio] = useState(() => {
    const salvo = localStorage.getItem('nexora_equipe_negocio');
    return salvo ? JSON.parse(salvo) : [];
  });

  const [catalogoNegocio, setCatalogoNegocio] = useState(() => {
    const salvo = localStorage.getItem('nexora_catalogo_negocio');
    return salvo ? JSON.parse(salvo) : [];
  });

  useEffect(() => {
    localStorage.setItem('nexora_lancamentos_negocio', JSON.stringify(lancamentosNegocio));
  }, [lancamentosNegocio]);

  useEffect(() => {
    if (metaMensal !== null) {
      localStorage.setItem('nexora_meta_mensal', metaMensal);
    } else {
      localStorage.removeItem('nexora_meta_mensal');
    }
  }, [metaMensal]);

  useEffect(() => {
    localStorage.setItem('nexora_equipe_negocio', JSON.stringify(equipeNegocio));
  }, [equipeNegocio]);

  useEffect(() => {
    localStorage.setItem('nexora_catalogo_negocio', JSON.stringify(catalogoNegocio));
  }, [catalogoNegocio]);

  const [dataRefNegocio, setDataRefNegocio] = useState(new Date(2026, 9, 1));
  const strMesAnoNegocioFiltro = `${String(dataRefNegocio.getMonth() + 1).padStart(2, '0')}/${dataRefNegocio.getFullYear()}`;
  const mesNegocioTexto = dataRefNegocio.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

  const voltarMesNegocio = () => setDataRefNegocio(new Date(dataRefNegocio.getFullYear(), dataRefNegocio.getMonth() - 1, 1));
  const avancarMesNegocio = () => setDataRefNegocio(new Date(dataRefNegocio.getFullYear(), dataRefNegocio.getMonth() + 1, 1));

  const lancamentosNegocioFiltradosMes = lancamentosNegocio.filter(item => {
    if (!item.data) return true;
    return item.data.endsWith(strMesAnoNegocioFiltro);
  });

  const [modalNegocioAberto, setModalNegocioAberto] = useState(false);

  const adicionarMembroEquipa = (nomeNovo) => {
    if (nomeNovo && !equipeNegocio.includes(nomeNovo)) {
      setEquipeNegocio([...equipeNegocio, nomeNovo]);
    }
  };

  const removerMembroEquipa = (nome) => {
    setEquipeNegocio(equipeNegocio.filter(m => m !== nome));
  };

  const adicionarItemCatalogo = (itemNovo) => {
    if (!catalogoNegocio.some(c => c.nome.toLowerCase() === itemNovo.nome.toLowerCase())) {
      setCatalogoNegocio([...catalogoNegocio, itemNovo]);
    }
  };

  const removerItemCatalogo = (nome) => {
    setCatalogoNegocio(catalogoNegocio.filter(c => c.nome !== nome));
  };

  const estatisticasNegocio = useMemo(() => {
    let bruto = 0, custos = 0, taxas = 0, liquido = 0;
    lancamentosNegocioFiltradosMes.forEach(item => {
      const val = Number(item.valor || 0);
      const tax = Number(item.taxaAplicada || 0);
      if (item.tipo === 'receita') {
        bruto += val;
        taxas += tax;
        liquido += (val - tax);
      } else {
        custos += val;
        liquido -= val;
      }
    });
    return { bruto, custos, taxas, liquido };
  }, [lancamentosNegocioFiltradosMes]);

  const mixServicos = useMemo(() => {
    const receitasMes = lancamentosNegocioFiltradosMes.filter(l => l.tipo === 'receita');
    const agrupado = receitasMes.reduce((acc, curr) => { 
      const chave = curr.servico || curr.descricao || 'Serviço';
      acc[chave] = (acc[chave] || 0) + 1; 
      return acc; 
    }, {});
    const coresFixas = ['#EC4899', '#F59E0B', '#06B6D4', '#10B981', '#8B5CF6'];
    return Object.keys(agrupado).map((cat, idx) => ({ 
      nome: cat, 
      quantidade: agrupado[cat], 
      cor: coresFixas[idx % coresFixas.length] 
    }));
  }, [lancamentosNegocioFiltradosMes]);

  const removerLancamentoNegocio = (id) => setLancamentosNegocio(lancamentosNegocio.filter(a => a.id !== id));

  // TELA DE LOGIN / CADASTRO / RECUPERAÇÃO DE SENHA
  if (!sessao) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d131f] p-6">
        <img src={logoNexora} alt="Nexora Logo" className="w-56 rounded-[2.5rem] shadow-2xl shadow-black/65 mb-8" />
        <div className="w-full max-w-sm bg-[#1F122B] p-6 rounded-3xl border border-purple-500/30 shadow-xl flex flex-col gap-4">
          <h2 className="text-white font-bold text-center text-lg">
            {modoRecuperacao ? 'Recuperar Palavra-passe' : (modoCadastro ? 'Criar Conta no Nexora' : 'Entrar na sua Conta')}
          </h2>
          
          {erroAuth && <p className="text-red-400 text-xs text-center bg-red-500/10 p-2 rounded-lg">{erroAuth}</p>}
          {sucessoAuth && <p className="text-emerald-400 text-xs text-center bg-emerald-500/10 p-2 rounded-lg">{sucessoAuth}</p>}

          {modoRecuperacao ? (
            <form onSubmit={lidarComRecuperacao} className="flex flex-col gap-3">
              <p className="text-purple-200 text-xs text-center mb-1">Insira o seu e-mail para receber as instruções de recuperação:</p>
              <input 
                type="email" 
                placeholder="O seu e-mail" 
                value={emailAuth} 
                onChange={e => setEmailAuth(e.target.value)} 
                className="bg-[#2A1B38] border border-purple-500/30 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-purple-400" 
                required 
              />
              <button 
                type="submit" 
                disabled={loadingAuth} 
                className="mt-2 w-full py-3.5 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-white text-xs shadow-lg transition-all"
              >
                {loadingAuth ? 'A enviar...' : 'Enviar Link de Recuperação'}
              </button>
              <button 
                type="button"
                onClick={() => { setModoRecuperacao(false); setErroAuth(''); setSucessoAuth(''); }} 
                className="text-[11px] text-purple-300 hover:text-white text-center mt-2 underline"
              >
                Voltar ao login
              </button>
            </form>
          ) : (
            <form onSubmit={lidarComAutenticacao} className="flex flex-col gap-3">
              {modoCadastro && (
                <input 
                  type="text" 
                  placeholder="Como você gostaria de ser chamado?" 
                  value={nomeAuth} 
                  onChange={e => setNomeAuth(e.target.value)} 
                  className="bg-[#2A1B38] border border-purple-500/30 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-purple-400" 
                  required={modoCadastro}
                />
              )}
              <input 
                type="email" 
                placeholder="O seu e-mail" 
                value={emailAuth} 
                onChange={e => setEmailAuth(e.target.value)} 
                className="bg-[#2A1B38] border border-purple-500/30 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-purple-400" 
                required 
              />
              <input 
                type="password" 
                placeholder="Palavra-passe" 
                value={senhaAuth} 
                onChange={e => setSenhaAuth(e.target.value)} 
                className="bg-[#2A1B38] border border-purple-500/30 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-purple-400" 
                required 
              />
              <button 
                type="submit" 
                disabled={loadingAuth} 
                className="mt-2 w-full py-3.5 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-white text-xs shadow-lg transition-all"
              >
                {loadingAuth ? 'A processar...' : (modoCadastro ? 'Registar Conta' : 'Entrar')}
              </button>

              {!modoCadastro && (
                <button 
                  type="button"
                  onClick={() => { setModoRecuperacao(true); setErroAuth(''); setSucessoAuth(''); }} 
                  className="text-[11px] text-purple-300 hover:text-white text-center mt-1 underline"
                >
                  Esqueceu-se da palavra-passe?
                </button>
              )}
            </form>
          )}

          {!modoRecuperacao && (
            <button 
              onClick={() => { setModoCadastro(!modoCadastro); setErroAuth(''); setSucessoAuth(''); }} 
              className="text-[11px] text-purple-300 hover:text-white text-center mt-2 underline"
            >
              {modoCadastro ? 'Já tem conta? Faça login' : 'Não tem conta? Registe-se aqui'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nexora-bg flex justify-center overflow-hidden">
      <div className="w-full max-w-md bg-[#0a0f18] relative shadow-2xl min-h-screen flex flex-col">
        
        {modalPessoalAberto && (
          <div className="absolute inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModalPessoalAberto(false)}></div>
            <div className="relative w-full bg-nexora-card rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
              <h3 className="text-white font-bold mb-4 text-center">{itemEmEdicao ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
              <div className="flex gap-4 mb-6">
                <button onClick={() => setTipoLancamentoPessoal('despesa')} className={`flex-1 py-2 rounded-lg font-semibold transition-all ${tipoLancamentoPessoal === 'despesa' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-slate-800 text-gray-400'}`}>Despesa (-)</button>
                <button onClick={() => setTipoLancamentoPessoal('receita')} className={`flex-1 py-2 rounded-lg font-semibold transition-all ${tipoLancamentoPessoal === 'receita' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-slate-800 text-gray-400'}`}>Receita (+)</button>
              </div>
              <form onSubmit={salvarLancamentoPessoal} className="flex flex-col gap-4">
                <input type="text" value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Descrição" className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" required />
                <div className="flex gap-4">
                  <input type="number" step="0.01" value={novoValor} onChange={e => setNovoValor(e.target.value)} placeholder="Valor" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" required />
                  <input type="text" value={novaDataPessoal} onChange={e => setNovaDataPessoal(e.target.value)} placeholder="DD/MM/AAAA" className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                </div>
                {tipoLancamentoPessoal === 'despesa' && (
                  <select value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                    {Object.keys({ 'Moradia': '#3B82F6', 'Alimentação': '#10B981', 'Transporte': '#F59E0B', 'Educação': '#8B5CF6', 'Cartões': '#06B6D4' }).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="Outros">Outros</option>
                  </select>
                )}
                {tipoLancamentoPessoal === 'receita' && (
                  <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3">
                    <input 
                      type="checkbox" 
                      id="recebidoCheckModal" 
                      checked={novoRecebido} 
                      onChange={e => setNovoRecebido(e.target.checked)} 
                      className="w-4 h-4 accent-emerald-500 cursor-pointer" 
                    />
                    <label htmlFor="recebidoCheckModal" className="text-sm text-gray-300 cursor-pointer select-none">
                      Valor já recebido / Disponível na conta
                    </label>
                  </div>
                )}
                <button type="submit" className={`mt-4 w-full py-4 rounded-xl font-bold text-white shadow-lg ${tipoLancamentoPessoal === 'despesa' ? 'bg-red-500 shadow-red-500/30' : 'bg-emerald-500 shadow-emerald-500/30'}`}>Salvar</button>
              </form>
            </div>
          </div>
        )}

        {menuAberto && (
          <div className="absolute inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMenuAberto(false)}></div>
            <div className={`relative w-64 h-full shadow-2xl flex flex-col p-6 ${modoAtual === 'negocio' ? 'bg-[#1F122B]' : 'bg-nexora-card'}`}>
              <div className="flex items-center gap-3 mb-10"><img src={logoNexora} alt="Logo" className="w-10 h-10 rounded-xl" /><h2 className="text-xl font-bold text-white">Nexora</h2></div>
              <nav className="flex flex-col gap-4">
                {modoAtual === 'pessoal' ? (
                  <>
                    <button onClick={() => { setAbaPessoal('dashboard'); setMenuAberto(false); }} className={`text-left text-lg font-medium p-3 rounded-xl ${abaPessoal === 'dashboard' ? 'bg-nexora-primary/20 text-nexora-primary' : 'text-gray-300'}`}>Visão Geral</button>
                    <button onClick={() => { setAbaPessoal('gastos'); setMenuAberto(false); }} className={`text-left text-lg font-medium p-3 rounded-xl ${abaPessoal === 'gastos' ? 'bg-nexora-primary/20 text-nexora-primary' : 'text-gray-300'}`}>Controlo de Gastos</button>
                  </>
                ) : (
                  <>
                    <div className="px-3 text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Modo Profissional</div>
                    <button onClick={() => { setAbaNegocio('dashboard_negocio'); setMenuAberto(false); }} className={`text-left text-lg font-medium p-3 rounded-xl ${abaNegocio === 'dashboard_negocio' ? 'bg-purple-600/30 text-purple-300' : 'text-gray-300'}`}>Dashboard</button>
                    <button onClick={() => { setAbaNegocio('extrato_negocio'); setMenuAberto(false); }} className={`text-left text-lg font-medium p-3 rounded-xl ${abaNegocio === 'extrato_negocio' ? 'bg-purple-600/30 text-purple-300' : 'text-gray-300'}`}>Extrato e Serviços</button>
                  </>
                )}
              </nav>
              <div className="mt-8 flex flex-col gap-2">
                <button onClick={() => { setModoAtual(modoAtual === 'pessoal' ? 'negocio' : 'pessoal'); setMenuAberto(false); }} className="w-full bg-purple-600/20 text-purple-400 border border-purple-500/30 p-3 rounded-xl font-bold text-sm flex justify-center gap-2">{modoAtual === 'pessoal' ? '💼 Acessar Meu Negócio' : '🏠 Voltar ao Pessoal'}</button>
                <button onClick={() => supabase.auth.signOut()} className="text-left text-nexora-danger font-medium p-3 rounded-xl">Sair da Conta</button>
              </div>
            </div>
          </div>
        )}

        {/* CABEÇALHO COM SAUDAÇÃO DINÂMICA */}
        <header className="flex justify-between items-center p-6 pb-2">
          <div className="flex items-center gap-4">
            <img src={logoNexora} alt="Logo" className="w-12 h-12 rounded-2xl shadow-md" />
            <div>
              <p className="text-xs text-gray-400">Bem-vindo de volta,</p>
              <h1 className="text-xl font-bold text-white">
                Olá, {sessao?.user?.user_metadata?.nome || sessao?.user?.email?.split('@')[0] || 'Utilizador'}
              </h1>
            </div>
          </div>
          <button onClick={() => setMenuAberto(true)} className={`text-3xl ${modoAtual === 'negocio' ? 'text-purple-400' : 'text-nexora-primary'}`}>☰</button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 pb-28">
          {modoAtual === 'pessoal' && abaPessoal === 'dashboard' && (
            <VisaoGeral 
              stats={{ saldo: saldoAtual }} 
              receitas={receitasDoMes} 
              despesas={despesasDoMes}
              mesAtualTexto={mesAtualTexto}
              limitesOrcamento={limitesOrcamento}
              setLimitesOrcamento={setLimitesOrcamento}
              irParaEvolucao={() => setAbaPessoal('evolucao')} 
            />
          )}
        
          {modoAtual === 'pessoal' && abaPessoal === 'evolucao' && (
            <EvolucaoDetalhada 
              voltar={() => setAbaPessoal('dashboard')} 
              receitas={receitas} 
              despesas={despesas} 
            />
          )}
          
          {modoAtual === 'pessoal' && abaPessoal === 'gastos' && (
            <ControleGastos 
              receitas={receitasDoMes} despesas={despesasDoMes} totalReceitas={totalReceitasRecebidas} totalPago={totalPago} totalPendente={totalPendente}
              filtroDespesas={filtroDespesas} setFiltroDespesas={setFiltroDespesas} alternarPagamento={alternarPagamento} alternarRecebimento={alternarRecebimento} removerDespesa={removerDespesa} removerReceita={removerReceita}
              mesAtualTexto={mesAtualTexto} avancarMes={avancarMes} voltarMes={voltarMes} duplicarMesAnterior={duplicarMesAnterior} temDadosNoMesAnterior={temDadosNoMesAnterior} abrirEdicao={abrirEdicao}
            />
          )}

          {modoAtual === 'negocio' && (
            <GestaoNegocio 
              abaNegocio={abaNegocio} 
              lancamentosNegocio={lancamentosNegocio} 
              setLancamentosNegocio={setLancamentosNegocio}
              filtroLancamentos={filtroAtendimentos} 
              setFiltroLancamentos={setFiltroAtendimentos} 
              removerLancamentoNegocio={removerLancamentoNegocio}
              metaMensal={metaMensal}
              setMetaMensal={setMetaMensal}
              mesNegocioTexto={mesNegocioTexto}
              voltarMesNegocio={voltarMesNegocio}
              avancarMesNegocio={avancarMesNegocio}
              lancamentosNegocioFiltradosMes={lancamentosNegocioFiltradosMes}
              statsNegocio={estatisticasNegocio}
              mixServicos={mixServicos}
              equipeNegocio={equipeNegocio}
              catalogoNegocio={catalogoNegocio}
              adicionarMembroEquipa={adicionarMembroEquipa}
              removerMembroEquipa={removerMembroEquipa}
              adicionarItemCatalogo={adicionarItemCatalogo}
              removerItemCatalogo={removerItemCatalogo}
              modalNegocioAberto={modalNegocioAberto}
              setModalNegocioAberto={setModalNegocioAberto}
              taxaPadraoNegocio={taxaPadraoNegocio}
              setTaxaPadraoNegocio={setTaxaPadraoNegocio}
            />
          )}
        </div>

        <button onClick={() => modoAtual === 'pessoal' ? abrirNovoLancamento() : setModalNegocioAberto(true)} className={`absolute bottom-6 right-6 w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center text-3xl transition-all hover:scale-110 z-10 pb-1 ${modoAtual === 'pessoal' ? 'bg-nexora-secondary' : 'bg-purple-600'}`}>+</button>
      </div>
    </div>
  );
}
export default App;