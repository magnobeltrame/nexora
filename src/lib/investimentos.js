// ============================================================
// CÁLCULOS DE INVESTIMENTOS (preço médio, posição, proventos e IR)
// Tudo é calculado a partir das MOVIMENTAÇÕES lançadas: você só lança
// compras, vendas e proventos, e o resto sai daqui.
// ============================================================
import { paraISO } from './utils';

// Mercado fracionário: BBDC4F é o mesmo ativo que BBDC4
export const normalizarTicker = (t) =>
  String(t || '').trim().toUpperCase().replace(/^([A-Z]{4}\d{1,2})F$/, '$1');

export const LIMITE_ISENCAO_ACOES = 20000; // vendas de ações no mês, por CPF
export const ALIQUOTA = { acao: 0.15, fii: 0.2 };

const ordenar = (operacoes) =>
  [...operacoes].sort((a, b) => a.data.localeCompare(b.data) || (a.tipo === b.tipo ? 0 : a.tipo === 'compra' ? -1 : 1));

// Refaz toda a história das operações (custo médio ponderado)
export function reproduzir(operacoes, ate = null) {
  const estado = {};
  const vendas = [];
  const avisos = [];
  const lista = ate ? operacoes.filter((o) => o.data <= ate) : operacoes;

  ordenar(lista).forEach((op) => {
    const ticker = normalizarTicker(op.ticker);
    const e = estado[ticker] || (estado[ticker] = { quantidade: 0, custo: 0 });
    const qtd = Number(op.quantidade);
    const preco = Number(op.preco);
    const custos = Number(op.custos || 0);

    if (op.tipo === 'compra') {
      e.quantidade += qtd;
      e.custo += qtd * preco + custos;
    } else {
      if (qtd > e.quantidade + 1e-9) {
        avisos.push({ ticker, data: op.data, mensagem: `Venda de ${qtd} maior que a posição de ${e.quantidade}.` });
      }
      const pm = e.quantidade > 0 ? e.custo / e.quantidade : 0;
      vendas.push({
        ticker,
        data: op.data,
        quantidade: qtd,
        preco,
        valorVenda: qtd * preco,
        custoMedio: pm,
        resultado: qtd * preco - custos - pm * qtd,
      });
      e.quantidade -= qtd;
      e.custo -= pm * qtd;
      if (e.quantidade < 1e-9) {
        e.quantidade = 0;
        e.custo = 0;
      }
    }
  });
  return { estado, vendas, avisos };
}

// Posições com quantidade maior que zero
export function posicoes(operacoes, ate = null) {
  const { estado } = reproduzir(operacoes, ate);
  return Object.entries(estado)
    .filter(([, e]) => e.quantidade > 0)
    .map(([ticker, e]) => ({ ticker, quantidade: e.quantidade, custo: e.custo, pm: e.custo / e.quantidade }))
    .sort((a, b) => a.ticker.localeCompare(b.ticker));
}

// Ativos que já foram negociados mas hoje estão zerados
export function encerrados(operacoes) {
  const { estado } = reproduzir(operacoes);
  return Object.entries(estado)
    .filter(([, e]) => e.quantidade === 0)
    .map(([ticker]) => ticker)
    .sort();
}

// ---------- Proventos ----------
export function matrizProventos(proventos, ano) {
  const linhas = {};
  const totaisMes = Array(12).fill(0);
  proventos.forEach((p) => {
    if (Number(p.data.slice(0, 4)) !== ano) return;
    const ticker = normalizarTicker(p.ticker);
    const mes = Number(p.data.slice(5, 7)) - 1;
    if (!linhas[ticker]) linhas[ticker] = { ticker, meses: Array(12).fill(0), total: 0 };
    linhas[ticker].meses[mes] += Number(p.valor);
    linhas[ticker].total += Number(p.valor);
    totaisMes[mes] += Number(p.valor);
  });
  return {
    linhas: Object.values(linhas).sort((a, b) => a.ticker.localeCompare(b.ticker)),
    totaisMes,
    total: totaisMes.reduce((a, b) => a + b, 0),
  };
}

// Proventos dos últimos 12 meses ÷ custo atual (yield sobre o que você pagou)
export function dySobreCusto(ticker, custo, proventos, hoje) {
  if (!custo) return 0;
  const [a, m, d] = hoje.split('-').map(Number);
  const inicio = paraISO(new Date(a - 1, m - 1, d));
  const soma = proventos
    .filter((p) => normalizarTicker(p.ticker) === ticker && p.data > inicio && p.data <= hoje)
    .reduce((acc, p) => acc + Number(p.valor), 0);
  return (soma / custo) * 100;
}

// ---------- Imposto de renda ----------
// Último dia útil do mês seguinte (não considera feriados)
export function prazoDarf(chaveMesVenda) {
  const [a, m] = chaveMesVenda.split('-').map(Number);
  const d = new Date(a, m + 1, 0);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
  return paraISO(d);
}

// Apuração mês a mês, com prejuízo acumulado por categoria (ações e FIIs separados)
export function apurarMeses(operacoes, ativosPorTicker) {
  const { vendas } = reproduzir(operacoes);
  const porMes = {};
  vendas.forEach((v) => {
    const classe = ativosPorTicker[v.ticker]?.classe || 'acao';
    const chave = `${v.data.slice(0, 7)}|${classe}`;
    if (!porMes[chave]) porMes[chave] = { mes: v.data.slice(0, 7), classe, totalVendido: 0, resultado: 0 };
    porMes[chave].totalVendido += v.valorVenda;
    porMes[chave].resultado += v.resultado;
  });

  const lista = Object.values(porMes).sort((a, b) => a.mes.localeCompare(b.mes) || a.classe.localeCompare(b.classe));
  const prejuizo = { acao: 0, fii: 0 };

  return lista.map((m) => {
    let situacao;
    let base = 0;
    let imposto = 0;
    let isento = 0;

    if (m.classe === 'acao' && m.totalVendido <= LIMITE_ISENCAO_ACOES) {
      if (m.resultado >= 0) {
        situacao = 'isento';
        isento = m.resultado;
      } else {
        situacao = 'prejuizo';
        prejuizo.acao += -m.resultado;
      }
    } else if (m.resultado < 0) {
      situacao = 'prejuizo';
      prejuizo[m.classe] += -m.resultado;
    } else {
      const compensado = Math.min(prejuizo[m.classe], m.resultado);
      prejuizo[m.classe] -= compensado;
      base = m.resultado - compensado;
      imposto = base * ALIQUOTA[m.classe];
      situacao = imposto > 0.005 ? 'tributavel' : 'sem-imposto';
    }
    return { ...m, situacao, base, imposto, isento, prejuizoAcumulado: prejuizo[m.classe], prazo: prazoDarf(m.mes) };
  });
}

// Datas com compra e venda do mesmo ativo no mesmo dia (day trade não é tratado aqui)
export function possiveisDayTrade(operacoes, ano) {
  const mapa = {};
  operacoes.forEach((o) => {
    if (Number(o.data.slice(0, 4)) !== ano) return;
    const chave = `${normalizarTicker(o.ticker)}|${o.data}`;
    (mapa[chave] || (mapa[chave] = new Set())).add(o.tipo);
  });
  return Object.entries(mapa)
    .filter(([, tipos]) => tipos.size === 2)
    .map(([chave]) => chave.split('|'));
}

const numero = (v) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Bens e Direitos em 31/12 (custo de aquisição), com o texto pronto para a declaração
export function bensEDireitos(operacoes, ativosPorTicker, ano) {
  return posicoes(operacoes, `${ano}-12-31`).map((p) => {
    const a = ativosPorTicker[p.ticker] || {};
    const classe = a.classe || 'acao';
    const unidade = classe === 'fii' ? 'cotas' : 'ações';
    const qtd = Number.isInteger(p.quantidade) ? p.quantidade : numero(p.quantidade);
    return {
      ticker: p.ticker,
      classe,
      quantidade: p.quantidade,
      custo: p.custo,
      pm: p.pm,
      cnpj: a.cnpj || '',
      grupo: classe === 'fii' ? '07' : '03',
      codigo: classe === 'fii' ? '03' : '01',
      texto: `${qtd} ${unidade} de ${p.ticker} ao custo médio de R$ ${numero(p.pm)}. CNPJ: ${a.cnpj || '(informe o CNPJ)'}.${
        a.custodia ? ` Custódia: ${a.custodia}.` : ''
      }`,
    };
  });
}

// Rendimentos do ano por tipo: dividendos (cód. 09), FII (cód. 26) e JCP (cód. 10)
export function rendimentosAno(proventos, ano) {
  const somar = (tipo) => {
    const mapa = {};
    proventos
      .filter((p) => p.tipo === tipo && Number(p.data.slice(0, 4)) === ano)
      .forEach((p) => {
        const t = normalizarTicker(p.ticker);
        if (!mapa[t]) mapa[t] = { ticker: t, valor: 0, irRetido: 0 };
        mapa[t].valor += Number(p.valor);
        mapa[t].irRetido += Number(p.ir_retido || 0);
      });
    return Object.values(mapa).sort((a, b) => a.ticker.localeCompare(b.ticker));
  };
  const soma = (l) => l.reduce((acc, x) => acc + x.valor, 0);
  const dividendos = somar('dividendo');
  const fii = somar('rendimento');
  const jcp = somar('jcp');
  return { dividendos, fii, jcp, totalDividendos: soma(dividendos), totalFii: soma(fii), totalJcp: soma(jcp) };
}

// Saldo de renda fixa em uma data (último saldo informado até ela)
export function saldosRendaFixa(registros, ate) {
  const mapa = {};
  [...registros]
    .filter((r) => !ate || r.data <= ate)
    .sort((a, b) => a.data.localeCompare(b.data))
    .forEach((r) => {
      mapa[r.nome] = { nome: r.nome, data: r.data, saldo: Number(r.saldo) };
    });
  return Object.values(mapa).sort((a, b) => a.nome.localeCompare(b.nome));
}
