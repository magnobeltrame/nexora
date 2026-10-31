import { useEffect, useRef, useState } from 'react';
import { supabase } from './lib/supabase';
import { chaveMes, diaNoMes, hojeISO, moverMes, nomeMes, primeiroDiaDoMesAtual } from './lib/utils';
import { lerDadosLocais, marcarComoTratado, prepararImportacao } from './lib/importacao';
import useDadosPessoais from './hooks/useDadosPessoais';
import useDadosNegocio from './hooks/useDadosNegocio';
import useTema from './hooks/useTema';

import Cabecalho from './components/Cabecalho';
import BarraAbas from './components/BarraAbas';
import FolhaConta from './components/FolhaConta';
import ConfirmarExclusao from './components/ConfirmarExclusao';
import VisaoGeral from './components/VisaoGeral';
import ControleGastos from './components/ControleGastos';
import Orcamento from './components/Orcamento';
import EvolucaoDetalhada from './components/EvolucaoDetalhada';
import GestaoNegocio from './components/GestaoNegocio';
import ModalLancamentoPessoal from './components/ModalLancamentoPessoal';
import ModalNegocio from './components/ModalNegocio';
import ImportarDados from './components/ImportarDados';
import { IconeGrafico, IconeInicio, IconeLista, IconeMeta } from './components/Icones';

// Para criar uma nova área no futuro (ex.: investimentos), é só acrescentar aqui e criar as telas dela.
const MODOS = [
  { id: 'pessoal', rotulo: 'Pessoal' },
  { id: 'negocio', rotulo: 'Negócio' },
];

const ABAS_PESSOAL = [
  { id: 'resumo', rotulo: 'Resumo', icone: IconeInicio },
  { id: 'lancamentos', rotulo: 'Lançamentos', icone: IconeLista },
  { id: 'orcamento', rotulo: 'Orçamento', icone: IconeMeta },
  { id: 'evolucao', rotulo: 'Evolução', icone: IconeGrafico },
];

const ABAS_NEGOCIO = [
  { id: 'painel', rotulo: 'Painel', icone: IconeInicio },
  { id: 'extrato', rotulo: 'Extrato', icone: IconeLista },
];

export default function AreaLogada({ usuario }) {
  // ==========================================
  // AVISOS NA TELA
  // ==========================================
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  // ==========================================
  // DADOS (vêm do Supabase) E TEMA
  // ==========================================
  const pessoal = useDadosPessoais(usuario.id, setErro);
  const negocio = useDadosNegocio(usuario.id, setErro);
  const tema = useTema();
  const carregando = pessoal.carregando || negocio.carregando;

  // ==========================================
  // NAVEGAÇÃO
  // ==========================================
  const [modoAtual, setModoAtual] = useState('pessoal');
  const [abaPessoal, setAbaPessoal] = useState('resumo');
  const [abaNegocio, setAbaNegocio] = useState('painel');
  const [filtroPessoal, setFiltroPessoal] = useState('todos');
  const [filtroNegocio, setFiltroNegocio] = useState('todos');
  const [contaAberta, setContaAberta] = useState(false);

  // Sempre que mudar de tela, volta ao topo
  const areaRef = useRef(null);
  useEffect(() => {
    areaRef.current?.scrollTo({ top: 0 });
  }, [modoAtual, abaPessoal, abaNegocio]);

  // ==========================================
  // MÊS EM EXIBIÇÃO (começa no mês de hoje)
  // ==========================================
  const [dataRef, setDataRef] = useState(primeiroDiaDoMesAtual);
  const [dataRefNegocio, setDataRefNegocio] = useState(primeiroDiaDoMesAtual);
  const chave = chaveMes(dataRef);
  const chaveNegocio = chaveMes(dataRefNegocio);

  // ==========================================
  // JANELA "TEM CERTEZA?"
  // ==========================================
  const [confirmacao, setConfirmacao] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  const pedirConfirmacao = (dados) => setConfirmacao(dados);

  const executarConfirmacao = async () => {
    setConfirmando(true);
    try {
      await confirmacao.aoConfirmar();
    } finally {
      setConfirmando(false);
      setConfirmacao(null);
    }
  };

  // ==========================================
  // FINANÇAS PESSOAIS: dados do mês
  // ==========================================
  const receitasDoMes = pessoal.receitas.filter((r) => r.data.startsWith(chave));
  const despesasDoMes = pessoal.despesas.filter((d) => d.vencimento.startsWith(chave));

  // Saldo acumulado: tudo que entrou e saiu até o fim do mês exibido
  const saldoAcumulado =
    pessoal.receitas.filter((r) => r.recebido && r.data.slice(0, 7) <= chave).reduce((acc, r) => acc + r.valor, 0) -
    pessoal.despesas.filter((d) => d.pago && d.vencimento.slice(0, 7) <= chave).reduce((acc, d) => acc + d.valor, 0);

  // ==========================================
  // TRAZER LANÇAMENTOS DO MÊS ANTERIOR
  // ==========================================
  const [importandoMes, setImportandoMes] = useState(false);
  const chaveAnterior = chaveMes(moverMes(dataRef, -1));

  const despesasParaImportar = pessoal.despesas
    .filter((d) => d.vencimento.startsWith(chaveAnterior))
    .map((d) => ({
      nome: d.nome,
      categoria: d.categoria,
      valor: d.valor,
      vencimento: diaNoMes(chave, Number(d.vencimento.slice(8, 10))),
      pago: false,
    }))
    .filter((n) => !despesasDoMes.some((x) => x.nome === n.nome && x.vencimento === n.vencimento));

  const receitasParaImportar = pessoal.receitas
    .filter((r) => r.data.startsWith(chaveAnterior))
    .map((r) => ({
      nome: r.nome,
      valor: r.valor,
      data: diaNoMes(chave, Number(r.data.slice(8, 10))),
      recebido: false,
    }))
    .filter((n) => !receitasDoMes.some((x) => x.nome === n.nome && x.data === n.data));

  const qtdParaImportar = despesasParaImportar.length + receitasParaImportar.length;

  const importarMesAnterior = async () => {
    setImportandoMes(true);
    await pessoal.importar({ receitas: receitasParaImportar, despesas: despesasParaImportar });
    setImportandoMes(false);
  };

  // ==========================================
  // FORMULÁRIO PESSOAL (novo / edição)
  // ==========================================
  const [modalPessoal, setModalPessoal] = useState(null); // { item, tipo }
  const dataPadraoPessoal = hojeISO().startsWith(chave) ? hojeISO() : `${chave}-01`;

  const salvarPessoal = async (tipo, dados) => {
    const id = modalPessoal?.item?.id ?? null;
    const ok = tipo === 'despesa' ? await pessoal.salvarDespesa(id, dados) : await pessoal.salvarReceita(id, dados);
    if (ok) setModalPessoal(null);
  };

  const excluirPessoal = () => {
    const { item, tipo } = modalPessoal;
    pedirConfirmacao({
      titulo: tipo === 'despesa' ? 'Excluir esta despesa?' : 'Excluir esta receita?',
      mensagem: `“${item.nome}” será removida. Isso não pode ser desfeito.`,
      rotulo: 'Excluir',
      aoConfirmar: async () => {
        const ok = tipo === 'despesa' ? await pessoal.removerDespesa(item.id) : await pessoal.removerReceita(item.id);
        if (ok) setModalPessoal(null);
      },
    });
  };

  // ==========================================
  // NEGÓCIO
  // ==========================================
  const [modalNegocio, setModalNegocio] = useState(null); // { item }
  const lancamentosDoMesNegocio = negocio.lancamentos.filter((l) => l.data.startsWith(chaveNegocio));
  const dataPadraoNegocio = hojeISO().startsWith(chaveNegocio) ? hojeISO() : `${chaveNegocio}-01`;

  const salvarNegocio = async (dados, extras) => {
    const id = modalNegocio?.item?.id ?? null;
    const ok = await negocio.salvarLancamento(id, dados);
    if (!ok) return;
    if (extras.salvarNoCatalogo) {
      await negocio.salvarNoCatalogo({ nome: dados.servico, valor: dados.valor, tipo: dados.tipo, categoria: dados.categoria });
    }
    // Novo lançamento com taxa diferente da padrão: guarda como nova taxa padrão
    if (!id && extras.taxa !== null && extras.taxa !== negocio.config.taxaPadrao) {
      await negocio.salvarTaxa(extras.taxa);
    }
    setModalNegocio(null);
  };

  const excluirNegocio = () => {
    const { item } = modalNegocio;
    pedirConfirmacao({
      titulo: 'Excluir este lançamento?',
      mensagem: `“${item.servico || item.descricao}” será removido. Isso não pode ser desfeito.`,
      rotulo: 'Excluir',
      aoConfirmar: async () => {
        if (await negocio.removerLancamento(item.id)) setModalNegocio(null);
      },
    });
  };

  // ==========================================
  // IMPORTAÇÃO DOS DADOS ANTIGOS (navegador -> conta)
  // ==========================================
  const [dadosLocais, setDadosLocais] = useState(() => lerDadosLocais(usuario.id));
  const [bannerAdiado, setBannerAdiado] = useState(false);
  const [importandoLocal, setImportandoLocal] = useState(false);

  const importarDoNavegador = async () => {
    setImportandoLocal(true);
    const prep = prepararImportacao(dadosLocais);
    let restante = { ...dadosLocais };
    let totalImportado = 0;

    if (prep.pessoal) {
      if (await pessoal.importar(prep.pessoal)) {
        marcarComoTratado('pessoal', usuario.id);
        totalImportado += prep.pessoal.receitas.length + prep.pessoal.despesas.length;
        restante = { ...restante, pessoal: null };
      }
    }
    if (prep.negocio) {
      if (await negocio.importar(prep.negocio)) {
        marcarComoTratado('negocio', usuario.id);
        totalImportado += prep.negocio.lancamentos.length;
        restante = { ...restante, negocio: null };
      }
    }
    setImportandoLocal(false);

    if (!restante.pessoal && !restante.negocio) setDadosLocais(null);
    else setDadosLocais(restante);

    if (totalImportado > 0) {
      let msg = `Importação concluída: ${totalImportado} lançamento${totalImportado === 1 ? '' : 's'} trazido${totalImportado === 1 ? '' : 's'} para sua conta.`;
      if (prep.datasCorrigidas > 0) msg += ` ${prep.datasCorrigidas} com data inválida ficaram na data de hoje; vale conferir.`;
      if (prep.ignorados > 0) msg += ` ${prep.ignorados} com valor inválido foram ignorados.`;
      setAviso(msg);
    }
  };

  const descartarDadosLocais = () =>
    pedirConfirmacao({
      titulo: 'Não importar os dados antigos?',
      mensagem: 'Eles continuam neste aparelho, mas o app não vai mais oferecer a importação.',
      rotulo: 'Não importar',
      aoConfirmar: () => {
        marcarComoTratado('pessoal', usuario.id);
        marcarComoTratado('negocio', usuario.id);
        setDadosLocais(null);
      },
    });

  // ==========================================
  // ATALHOS
  // ==========================================
  // Toque na logo/nome: volta à tela inicial da área atual, no mês de hoje
  const irParaInicio = () => {
    setContaAberta(false);
    setModalPessoal(null);
    setModalNegocio(null);
    setConfirmacao(null);
    setDataRef(primeiroDiaDoMesAtual());
    setDataRefNegocio(primeiroDiaDoMesAtual());
    if (modoAtual === 'pessoal') setAbaPessoal('resumo');
    else setAbaNegocio('painel');
    areaRef.current?.scrollTo({ top: 0 });
  };

  const adicionar = () => (modoAtual === 'pessoal' ? setModalPessoal({ item: null, tipo: 'despesa' }) : setModalNegocio({ item: null }));

  const nomeUsuario = usuario.user_metadata?.nome || usuario.email?.split('@')[0] || 'Usuário';

  // ==========================================
  // TELA
  // ==========================================
  return (
    <div data-modo={modoAtual} className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-fundo md:border-x md:border-linha">
      {erro && (
        <div role="alert" className="absolute inset-x-3 top-3 z-[60] flex items-start justify-between gap-3 rounded-xl bg-despesa px-4 py-3 text-xs font-medium text-sobredespesa shadow-lg">
          <span>{erro}</span>
          <button onClick={() => setErro('')} aria-label="Fechar aviso" className="font-bold">
            ✕
          </button>
        </div>
      )}
      {!erro && aviso && (
        <div role="status" className="absolute inset-x-3 top-3 z-[60] flex items-start justify-between gap-3 rounded-xl bg-marca px-4 py-3 text-xs font-medium text-sobremarca shadow-lg">
          <span>{aviso}</span>
          <button onClick={() => setAviso('')} aria-label="Fechar aviso" className="font-bold">
            ✕
          </button>
        </div>
      )}

      <Cabecalho
        modos={MODOS}
        modo={modoAtual}
        aoMudarModo={setModoAtual}
        aoIrParaInicio={irParaInicio}
        aoAbrirConta={() => setContaAberta(true)}
        inicial={nomeUsuario.charAt(0)}
      />

      <main ref={areaRef} className="flex-1 overflow-y-auto px-5 pb-6 pt-2">
        {dadosLocais && !bannerAdiado && !carregando && (
          <ImportarDados
            dados={dadosLocais}
            importando={importandoLocal}
            aoImportar={importarDoNavegador}
            aoAdiar={() => setBannerAdiado(true)}
            aoDescartar={descartarDadosLocais}
          />
        )}

        {carregando ? (
          <p className="mt-16 text-center text-sm text-suave">Carregando seus dados...</p>
        ) : (
          <>
            {modoAtual === 'pessoal' && abaPessoal === 'resumo' && (
              <VisaoGeral
                saldoAcumulado={saldoAcumulado}
                receitas={receitasDoMes}
                despesas={despesasDoMes}
                mesTexto={nomeMes(dataRef)}
                limitesOrcamento={pessoal.limites}
                aoVoltarMes={() => setDataRef(moverMes(dataRef, -1))}
                aoAvancarMes={() => setDataRef(moverMes(dataRef, 1))}
                alternarPagamento={pessoal.alternarPagamento}
                alternarRecebimento={pessoal.alternarRecebimento}
                abrirEdicao={(item, tipo) => setModalPessoal({ item, tipo })}
                irParaLancamentos={() => {
                  setFiltroPessoal('pendentes');
                  setAbaPessoal('lancamentos');
                }}
                irParaOrcamento={() => setAbaPessoal('orcamento')}
              />
            )}

            {modoAtual === 'pessoal' && abaPessoal === 'lancamentos' && (
              <ControleGastos
                receitas={receitasDoMes}
                despesas={despesasDoMes}
                filtro={filtroPessoal}
                setFiltro={setFiltroPessoal}
                alternarPagamento={pessoal.alternarPagamento}
                alternarRecebimento={pessoal.alternarRecebimento}
                mesTexto={nomeMes(dataRef)}
                aoVoltarMes={() => setDataRef(moverMes(dataRef, -1))}
                aoAvancarMes={() => setDataRef(moverMes(dataRef, 1))}
                importarMesAnterior={importarMesAnterior}
                qtdParaImportar={qtdParaImportar}
                importando={importandoMes}
                abrirEdicao={(item, tipo) => setModalPessoal({ item, tipo })}
              />
            )}

            {modoAtual === 'pessoal' && abaPessoal === 'orcamento' && (
              <Orcamento
                despesas={despesasDoMes}
                limitesOrcamento={pessoal.limites}
                definirLimite={pessoal.definirLimite}
                removerLimite={pessoal.removerLimite}
                mesTexto={nomeMes(dataRef)}
                aoVoltarMes={() => setDataRef(moverMes(dataRef, -1))}
                aoAvancarMes={() => setDataRef(moverMes(dataRef, 1))}
              />
            )}

            {modoAtual === 'pessoal' && abaPessoal === 'evolucao' && (
              <EvolucaoDetalhada receitas={pessoal.receitas} despesas={pessoal.despesas} />
            )}

            {modoAtual === 'negocio' && (
              <GestaoNegocio
                aba={abaNegocio}
                lancamentosDoMes={lancamentosDoMesNegocio}
                filtro={filtroNegocio}
                setFiltro={setFiltroNegocio}
                abrirEdicao={(item) => setModalNegocio({ item })}
                metaMensal={negocio.config.metaMensal}
                salvarMeta={negocio.salvarMeta}
                pedirConfirmacao={pedirConfirmacao}
                mesTexto={nomeMes(dataRefNegocio)}
                dataRef={dataRefNegocio}
                aoVoltarMes={() => setDataRefNegocio(moverMes(dataRefNegocio, -1))}
                aoAvancarMes={() => setDataRefNegocio(moverMes(dataRefNegocio, 1))}
              />
            )}
          </>
        )}
      </main>

      <BarraAbas
        itens={modoAtual === 'pessoal' ? ABAS_PESSOAL : ABAS_NEGOCIO}
        ativo={modoAtual === 'pessoal' ? abaPessoal : abaNegocio}
        aoSelecionar={modoAtual === 'pessoal' ? setAbaPessoal : setAbaNegocio}
        aoAdicionar={adicionar}
        rotuloAdicionar="Novo lançamento"
      />

      {contaAberta && (
        <FolhaConta
          nome={nomeUsuario}
          email={usuario.email}
          preferenciaTema={tema.preferencia}
          aoEscolherTema={tema.escolher}
          aoSair={() => supabase.auth.signOut()}
          aoFechar={() => setContaAberta(false)}
        />
      )}

      {modalPessoal && (
        <ModalLancamentoPessoal
          item={modalPessoal.item}
          tipoInicial={modalPessoal.tipo}
          dataPadrao={dataPadraoPessoal}
          aoFechar={() => setModalPessoal(null)}
          aoSalvar={salvarPessoal}
          aoExcluir={excluirPessoal}
        />
      )}

      {modalNegocio && (
        <ModalNegocio
          key={modalNegocio.item?.id ?? 'novo'}
          item={modalNegocio.item}
          equipe={negocio.equipe}
          catalogo={negocio.catalogo}
          taxaPadrao={negocio.config.taxaPadrao}
          dataPadrao={dataPadraoNegocio}
          aoFechar={() => setModalNegocio(null)}
          aoSalvar={salvarNegocio}
          aoExcluir={excluirNegocio}
          pedirConfirmacao={pedirConfirmacao}
          adicionarMembro={negocio.adicionarMembro}
          removerMembro={negocio.removerMembro}
          removerItemCatalogo={negocio.removerItemCatalogo}
        />
      )}

      {confirmacao && (
        <ConfirmarExclusao
          titulo={confirmacao.titulo}
          mensagem={confirmacao.mensagem}
          rotulo={confirmacao.rotulo}
          ocupado={confirmando}
          aoConfirmar={executarConfirmacao}
          aoCancelar={() => setConfirmacao(null)}
        />
      )}
    </div>
  );
}
