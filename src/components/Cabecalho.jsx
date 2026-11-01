import { useState } from 'react';
import FolhaModal from './FolhaModal';
import { IconeCheck, IconeSetaDir } from './Icones';
import { MARCA } from '../lib/marca';

// Topo do app: logo e nome (levam ao início), conta e troca de área.
// Com até 3 áreas, as abas ficam à mostra; com mais, vira um menu de áreas.
export default function Cabecalho({ modos, modo, aoMudarModo, aoIrParaInicio, aoAbrirConta, inicial }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const atual = modos.find((m) => m.id === modo) || modos[0];

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

      {modos.length <= 3 ? (
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
              className={`rounded-lg py-2 text-sm font-semibold transition-colors ${modo === m.id ? 'bg-cartao text-texto shadow-sm' : 'text-suave'}`}
            >
              {m.rotulo}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setMenuAberto(true)}
          aria-haspopup="dialog"
          aria-label={`Área atual: ${atual.rotulo}. Trocar de área`}
          className="mt-3 flex w-full items-center justify-between rounded-xl bg-cartao2 px-4 py-2.5 text-left"
        >
          <span>
            <span className="block text-[11px] text-suave">Área</span>
            <span className="block text-sm font-semibold text-marca">{atual.rotulo}</span>
          </span>
          <IconeSetaDir width={18} height={18} className="rotate-90 text-suave" />
        </button>
      )}

      {menuAberto && (
        <FolhaModal titulo="Escolher área" aoFechar={() => setMenuAberto(false)}>
          <ul className="divide-y divide-linha">
            {modos.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    aoMudarModo(m.id);
                    setMenuAberto(false);
                  }}
                  aria-current={modo === m.id ? 'true' : undefined}
                  className="flex w-full items-center gap-3 py-3.5 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-semibold ${modo === m.id ? 'text-marca' : 'text-texto'}`}>{m.rotulo}</span>
                    {m.descricao && <span className="block text-xs text-suave">{m.descricao}</span>}
                  </span>
                  {modo === m.id && <IconeCheck width={18} height={18} className="text-marca" />}
                </button>
              </li>
            ))}
          </ul>
        </FolhaModal>
      )}
    </header>
  );
}
