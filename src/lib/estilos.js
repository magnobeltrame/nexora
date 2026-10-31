// Classes reutilizadas em vários formulários e botões
export const CAMPO =
  'w-full rounded-xl border border-linha bg-cartao2 px-4 py-3 text-sm text-texto placeholder:text-suave/70 outline-none focus:border-marca focus:ring-2 focus:ring-marca/25';

export const ROTULO = 'mb-1.5 block text-xs font-medium text-suave';

export const BOTAO_PRINCIPAL =
  'w-full rounded-xl bg-marca px-4 py-3.5 text-sm font-semibold text-sobremarca transition-transform active:scale-[0.99] disabled:opacity-60';

export const BOTAO_SECUNDARIO =
  'rounded-xl border border-linha bg-cartao2 px-4 py-3 text-sm font-semibold text-texto transition-colors hover:bg-linha/40 disabled:opacity-60';

// Estilo dos balões de informação dos gráficos (seguem o tema)
export const ESTILO_TOOLTIP = {
  contentStyle: {
    backgroundColor: 'rgb(var(--cartao))',
    border: '1px solid rgb(var(--linha))',
    borderRadius: 12,
    color: 'rgb(var(--texto))',
    fontSize: 12,
  },
  itemStyle: { color: 'rgb(var(--texto))' },
  labelStyle: { color: 'rgb(var(--suave))' },
};
