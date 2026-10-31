import { MARCA } from '../lib/marca';

// Topo do app: logo e nome (levam ao início), conta e troca de área
export default function Cabecalho({ modos, modo, aoMudarModo, aoIrParaInicio, aoAbrirConta, inicial }) {
  return (
    <header className="shrink-0 px-5 pb-2 pt-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={aoIrParaInicio}
          aria-label={`${MARCA.nome}: voltar ao início`}
          className="-ml-1 flex items-center gap-2.5 rounded-xl p-1 pr-3 text-left transition-opacity active:opacity-70"
        >
          <img src={MARCA.logo} alt="" className="h-9 w-9 rounded-xl" />
          <span className="text-lg font-bold tracking-tight text-texto">{MARCA.nome}</span>
        </button>
        <button
          type="button"
          onClick={aoAbrirConta}
          aria-label="Abrir conta e configurações"
          className="grid h-10 w-10 place-items-center rounded-full bg-marca/15 text-sm font-bold uppercase text-marca"
        >
          {inicial}
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Área do app"
        className="mt-3 grid gap-1 rounded-xl bg-cartao2 p-1"
        style={{ gridTemplateColumns: `repeat(${modos.length}, minmax(0, 1fr))` }}
      >
        {modos.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={modo === m.id}
            onClick={() => aoMudarModo(m.id)}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              modo === m.id ? 'bg-cartao text-texto shadow-sm' : 'text-suave'
            }`}
          >
            {m.rotulo}
          </button>
        ))}
      </div>
    </header>
  );
}
