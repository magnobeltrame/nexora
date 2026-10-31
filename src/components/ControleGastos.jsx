import SeletorMes from './SeletorMes';
import IconeCategoria from './IconeCategoria';
import LinhaLancamento from './LinhaLancamento';
import { estiloCategoria, ESTILO_RECEITA } from '../lib/categorias';
import { hojeISO, moeda, nomeDiaSemana } from '../lib/utils';

const FILTROS = [
  { id: 'todos', rotulo: 'Tudo' },
  { id: 'pendentes', rotulo: 'Pendentes' },
  { id: 'despesas', rotulo: 'Despesas' },
  { id: 'receitas', rotulo: 'Receitas' },
];

export default function ControleGastos({
  receitas = [],
  despesas = [],
  filtro = 'todos',
  setFiltro = () => {},
  alternarPagamento = () => {},
  alternarRecebimento = () => {},
  mesTexto = '',
  aoVoltarMes = () => {},
  aoAvancarMes = () => {},
  importarMesAnterior = () => {},
  qtdParaImportar = 0,
  importando = false,
  abrirEdicao = () => {},
}) {
  const hoje = hojeISO();

  const totalReceitas = receitas.reduce((acc, r) => acc + r.valor, 0);
  const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);
  const saldoPrevisto = totalReceitas - totalDespesas;

  // Junta receitas e despesas numa lista só
  const todos = [
    ...receitas.map((r) => ({ tipo: 'receita', id: r.id, nome: r.nome, valor: r.valor, data: r.data, concluido: r.recebido, original: r })),
    ...despesas.map((d) => ({
      tipo: 'despesa',
      id: d.id,
      nome: d.nome,
      valor: d.valor,
      data: d.vencimento,
      categoria: d.categoria,
      concluido: d.pago,
      original: d,
    })),
  ];

  const visiveis = todos.filter((item) => {
    if (filtro === 'receitas') return item.tipo === 'receita';
    if (filtro === 'despesas') return item.tipo === 'despesa';
    if (filtro === 'pendentes') return !item.concluido;
    return true;
  });

  // Agrupa por dia
  const porDia = {};
  visiveis.forEach((item) => {
    if (!porDia[item.data]) porDia[item.data] = [];
    porDia[item.data].push(item);
  });
  const dias = Object.keys(porDia).sort();

  const subtitulo = (item) => {
    if (item.tipo === 'receita') return item.concluido ? 'Receita • Recebida' : 'Receita • A receber';
    if (item.concluido) return `${item.categoria} • Paga`;
    return item.data < hoje ? `${item.categoria} • Vencida` : `${item.categoria} • Pendente`;
  };

  return (
    <div className="pb-4">
      <SeletorMes texto={mesTexto} aoVoltar={aoVoltarMes} aoAvancar={aoAvancarMes} />

      <div className="mt-3 grid grid-cols-3 divide-x divide-linha rounded-2xl border border-linha bg-cartao py-3 text-center">
        <div>
          <p className="text-[11px] text-suave">Receitas</p>
          <p className="mt-0.5 text-sm font-semibold text-receita">{moeda(totalReceitas)}</p>
        </div>
        <div>
          <p className="text-[11px] text-suave">Despesas</p>
          <p className="mt-0.5 text-sm font-semibold text-despesa">{moeda(totalDespesas)}</p>
        </div>
        <div>
          <p className="text-[11px] text-suave">Saldo previsto</p>
          <p className={`mt-0.5 text-sm font-semibold ${saldoPrevisto >= 0 ? 'text-texto' : 'text-despesa'}`}>
            {saldoPrevisto >= 0 ? moeda(saldoPrevisto) : `- ${moeda(Math.abs(saldoPrevisto))}`}
          </p>
        </div>
      </div>

      {qtdParaImportar > 0 && (
        <button
          onClick={importarMesAnterior}
          disabled={importando}
          className="mt-3 w-full rounded-xl border border-dashed border-marca/50 bg-marca/10 py-3 text-xs font-semibold text-marca disabled:opacity-60"
        >
          {importando ? 'Trazendo...' : `Trazer ${qtdParaImportar} lançamento${qtdParaImportar === 1 ? '' : 's'} do mês anterior`}
        </button>
      )}

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar lançamentos">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            aria-pressed={filtro === f.id}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filtro === f.id ? 'bg-marca text-sobremarca' : 'bg-cartao2 text-suave'
            }`}
          >
            {f.rotulo}
          </button>
        ))}
      </div>

      {dias.length === 0 ? (
        <p className="mt-8 text-center text-sm text-suave">
          {todos.length === 0 ? 'Nenhum lançamento neste mês. Toque no + para começar.' : 'Nada encontrado com esse filtro.'}
        </p>
      ) : (
        dias.map((dia) => (
          <section key={dia} className="mt-4">
            <div className="flex items-baseline gap-2 border-b border-linha pb-1.5">
              <span className="text-lg font-bold text-texto">{dia.slice(8, 10)}</span>
              <span className="text-xs capitalize text-suave">{nomeDiaSemana(dia)}</span>
              {dia === hoje && <span className="rounded-full bg-marca/15 px-2 py-0.5 text-[10px] font-semibold text-marca">Hoje</span>}
            </div>
            <div className="divide-y divide-linha">
              {porDia[dia].map((item) => (
                <LinhaLancamento
                  key={`${item.tipo}-${item.id}`}
                  icone={<IconeCategoria {...(item.tipo === 'receita' ? ESTILO_RECEITA : estiloCategoria(item.categoria))} />}
                  titulo={item.nome}
                  subtitulo={subtitulo(item)}
                  corSubtitulo={item.tipo === 'despesa' && !item.concluido && item.data < hoje ? 'text-despesa' : 'text-suave'}
                  valor={`${item.tipo === 'receita' ? '+' : '-'} ${moeda(item.valor)}`}
                  corValor={item.tipo === 'receita' ? 'text-receita' : 'text-despesa'}
                  concluido={item.concluido}
                  rotuloMarcar={
                    item.tipo === 'receita'
                      ? item.concluido ? 'Marcar como não recebida' : 'Marcar como recebida'
                      : item.concluido ? 'Marcar como não paga' : 'Marcar como paga'
                  }
                  aoAlternar={() => (item.tipo === 'receita' ? alternarRecebimento(item.id) : alternarPagamento(item.id))}
                  aoAbrir={() => abrirEdicao(item.original, item.tipo)}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
