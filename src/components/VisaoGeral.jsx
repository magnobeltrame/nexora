import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import SeletorMes from './SeletorMes';
import IconeCategoria from './IconeCategoria';
import LinhaLancamento from './LinhaLancamento';
import { IconeAlerta } from './Icones';
import { estiloCategoria, ESTILO_RECEITA } from '../lib/categorias';
import { ESTILO_TOOLTIP } from '../lib/estilos';
import { formatarData, hojeISO, moeda } from '../lib/utils';

const comSinal = (valor) => (valor >= 0 ? moeda(valor) : `- ${moeda(Math.abs(valor))}`);

function Secao({ titulo, acao, aoAcionar, children }) {
  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-texto">{titulo}</h3>
        {acao && (
          <button onClick={aoAcionar} className="text-xs font-semibold text-marca">
            {acao}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

export default function VisaoGeral({
  saldoAcumulado = 0,
  receitas = [],
  despesas = [],
  mesTexto = '',
  limitesOrcamento = {},
  aoVoltarMes = () => {},
  aoAvancarMes = () => {},
  alternarPagamento = () => {},
  alternarRecebimento = () => {},
  abrirEdicao = () => {},
  irParaLancamentos = () => {},
  irParaOrcamento = () => {},
}) {
  const hoje = hojeISO();

  // ---- Números do mês
  const totalRecebido = receitas.filter((r) => r.recebido).reduce((acc, r) => acc + r.valor, 0);
  const totalPago = despesas.filter((d) => d.pago).reduce((acc, d) => acc + d.valor, 0);
  const resultadoMes = totalRecebido - totalPago;

  const despesasPendentes = despesas.filter((d) => !d.pago).sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  const receitasPendentes = receitas.filter((r) => !r.recebido).sort((a, b) => a.data.localeCompare(b.data));
  const aPagarTotal = despesasPendentes.reduce((acc, d) => acc + d.valor, 0);
  const aReceberTotal = receitasPendentes.reduce((acc, r) => acc + r.valor, 0);

  // ---- Gastos por categoria
  const totalDespesasMes = despesas.reduce((acc, d) => acc + d.valor, 0);
  const gastosPorCategoria = despesas.reduce((acc, d) => {
    const cat = d.categoria || 'Outros';
    acc[cat] = (acc[cat] || 0) + d.valor;
    return acc;
  }, {});
  const dadosCategorias = Object.entries(gastosPorCategoria)
    .sort((a, b) => b[1] - a[1])
    .map(([nome, valor]) => ({ nome, valor, cor: estiloCategoria(nome).cor }));

  // ---- Categorias que passaram do limite
  const estouradas = Object.entries(limitesOrcamento).filter(([cat, limite]) => limite > 0 && (gastosPorCategoria[cat] || 0) > limite);

  const subtituloDespesa = (d) => {
    if (d.vencimento < hoje) return `Vencida em ${formatarData(d.vencimento)} • ${d.categoria}`;
    if (d.vencimento === hoje) return `Vence hoje • ${d.categoria}`;
    return `Vence em ${formatarData(d.vencimento)} • ${d.categoria}`;
  };

  return (
    <div className="pb-4">
      <SeletorMes texto={mesTexto} aoVoltar={aoVoltarMes} aoAvancar={aoAvancarMes} />

      {/* SALDO EM DESTAQUE */}
      <div className="mt-3 overflow-hidden rounded-3xl border border-linha bg-gradient-to-br from-marca/15 via-cartao to-cartao p-5">
        <p className="text-xs font-medium text-suave">Saldo disponível</p>
        <p className={`mt-1 text-3xl font-bold tracking-tight ${saldoAcumulado >= 0 ? 'text-texto' : 'text-despesa'}`}>
          {comSinal(saldoAcumulado)}
        </p>
        <p className="mt-0.5 text-[11px] text-suave">Tudo que já entrou e saiu, até o fim deste mês</p>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-linha pt-4">
          <div>
            <p className="text-[11px] text-suave">Recebido</p>
            <p className="mt-0.5 text-sm font-semibold text-receita">{moeda(totalRecebido)}</p>
          </div>
          <div>
            <p className="text-[11px] text-suave">Pago</p>
            <p className="mt-0.5 text-sm font-semibold text-despesa">{moeda(totalPago)}</p>
          </div>
          <div>
            <p className="text-[11px] text-suave">Resultado</p>
            <p className={`mt-0.5 text-sm font-semibold ${resultadoMes >= 0 ? 'text-receita' : 'text-despesa'}`}>
              {resultadoMes >= 0 ? `+ ${moeda(resultadoMes)}` : `- ${moeda(Math.abs(resultadoMes))}`}
            </p>
          </div>
        </div>
      </div>

      {/* AVISO DE ORÇAMENTO ESTOURADO */}
      {estouradas.length > 0 && (
        <button
          onClick={irParaOrcamento}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-despesa/30 bg-despesa/10 px-4 py-3 text-left"
        >
          <IconeAlerta className="shrink-0 text-despesa" width={22} height={22} />
          <span className="text-xs text-texto">
            {estouradas.length === 1
              ? `${estouradas[0][0]} passou do limite do mês.`
              : `${estouradas.length} categorias passaram do limite do mês.`}{' '}
            <span className="font-semibold text-despesa">Ver orçamento</span>
          </span>
        </button>
      )}

      {/* PRÓXIMOS VENCIMENTOS */}
      <Secao titulo={`A pagar · ${moeda(aPagarTotal)}`} acao={despesasPendentes.length > 5 ? 'Ver todas' : null} aoAcionar={irParaLancamentos}>
        {despesasPendentes.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-cartao2 px-4 py-4 text-center text-xs text-suave">
            {despesas.length === 0 ? 'Nenhuma despesa neste mês. Toque no + para lançar.' : 'Tudo pago por aqui. 🎉'}
          </p>
        ) : (
          <div className="mt-1 divide-y divide-linha">
            {despesasPendentes.slice(0, 5).map((d) => (
              <LinhaLancamento
                key={d.id}
                icone={<IconeCategoria {...estiloCategoria(d.categoria)} />}
                titulo={d.nome}
                subtitulo={subtituloDespesa(d)}
                corSubtitulo={d.vencimento < hoje ? 'text-despesa' : 'text-suave'}
                valor={moeda(d.valor)}
                corValor="text-despesa"
                concluido={false}
                rotuloMarcar="Marcar como pago"
                aoAlternar={() => alternarPagamento(d.id)}
                aoAbrir={() => abrirEdicao(d, 'despesa')}
              />
            ))}
          </div>
        )}
      </Secao>

      {/* A RECEBER */}
      {receitasPendentes.length > 0 && (
        <Secao titulo={`A receber · ${moeda(aReceberTotal)}`}>
          <div className="mt-1 divide-y divide-linha">
            {receitasPendentes.slice(0, 3).map((r) => (
              <LinhaLancamento
                key={r.id}
                icone={<IconeCategoria {...ESTILO_RECEITA} />}
                titulo={r.nome}
                subtitulo={`Previsto para ${formatarData(r.data)}`}
                valor={moeda(r.valor)}
                corValor="text-receita"
                concluido={false}
                rotuloMarcar="Marcar como recebido"
                aoAlternar={() => alternarRecebimento(r.id)}
                aoAbrir={() => abrirEdicao(r, 'receita')}
              />
            ))}
          </div>
        </Secao>
      )}

      {/* GASTOS POR CATEGORIA */}
      <Secao titulo="Gastos por categoria" acao={dadosCategorias.length > 0 ? 'Orçamento' : null} aoAcionar={irParaOrcamento}>
        {dadosCategorias.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-cartao2 px-4 py-4 text-center text-xs text-suave">Os gastos do mês aparecem aqui.</p>
        ) : (
          <>
            <div className="relative mt-2 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dadosCategorias} dataKey="valor" nameKey="nome" innerRadius={58} outerRadius={82} paddingAngle={2} stroke="none">
                    {dadosCategorias.map((item) => (
                      <Cell key={item.nome} fill={item.cor} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(valor) => moeda(valor)} {...ESTILO_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-[11px] text-suave">Despesas do mês</p>
                  <p className="text-base font-bold text-texto">{moeda(totalDespesasMes)}</p>
                </div>
              </div>
            </div>

            <ul className="mt-2 divide-y divide-linha">
              {dadosCategorias.map((item) => (
                <li key={item.nome} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.cor }}></span>
                  <span className="flex-1 text-texto">{item.nome}</span>
                  <span className="text-xs text-suave">{Math.round((item.valor / totalDespesasMes) * 100)}%</span>
                  <span className="w-28 text-right font-medium text-texto">{moeda(item.valor)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Secao>
    </div>
  );
}
