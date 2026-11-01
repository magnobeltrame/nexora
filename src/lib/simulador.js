// Simulador de juros compostos (aporte feito no fim de cada mês)

export const taxaMensal = (taxa, periodo) => {
  const i = Number(taxa) / 100;
  return periodo === 'anual' ? Math.pow(1 + i, 1 / 12) - 1 : i;
};

// Quanto você terá depois de N anos
export function projetar({ inicial, aporte, taxa, periodo, anos }) {
  const i = taxaMensal(taxa, periodo);
  const meses = Math.round(anos * 12);
  let saldo = inicial;
  const pontos = [{ ano: 0, investido: inicial, total: inicial }];
  for (let n = 1; n <= meses; n += 1) {
    saldo = saldo * (1 + i) + aporte;
    if (n % 12 === 0 || n === meses) {
      pontos.push({ ano: Math.round((n / 12) * 100) / 100, investido: inicial + aporte * n, total: saldo });
    }
  }
  const investido = inicial + aporte * meses;
  return { pontos, total: saldo, investido, juros: saldo - investido };
}

// Quanto tempo leva para chegar a uma meta (em meses). Retorna null se não chegar em 100 anos.
export function tempoParaMeta({ inicial, aporte, taxa, periodo, meta }) {
  const i = taxaMensal(taxa, periodo);
  let saldo = inicial;
  if (saldo >= meta) return 0;
  for (let n = 1; n <= 1200; n += 1) {
    saldo = saldo * (1 + i) + aporte;
    if (saldo >= meta) return n;
  }
  return null;
}
