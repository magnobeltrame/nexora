import { IconeCheck } from './Icones';

// Uma linha de lançamento: marcador de pago/recebido + ícone + nome + valor
export default function LinhaLancamento({
  icone,
  titulo,
  subtitulo,
  corSubtitulo = 'text-suave',
  valor,
  corValor,
  concluido,
  rotuloMarcar,
  aoAlternar,
  aoAbrir,
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <button
        type="button"
        onClick={aoAlternar}
        aria-pressed={concluido}
        aria-label={rotuloMarcar}
        title={rotuloMarcar}
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${
          concluido ? 'border-marca bg-marca text-sobremarca' : 'border-linha text-transparent hover:border-suave'
        }`}
      >
        <IconeCheck width={14} height={14} strokeWidth={2.6} />
      </button>
      <button type="button" onClick={aoAbrir} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        {icone}
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-sm font-medium ${concluido ? 'text-suave' : 'text-texto'}`}>{titulo}</span>
          <span className={`block truncate text-xs ${corSubtitulo}`}>{subtitulo}</span>
        </span>
        <span className={`whitespace-nowrap text-sm font-semibold ${corValor}`}>{valor}</span>
      </button>
    </div>
  );
}
