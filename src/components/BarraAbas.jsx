import { IconeMais } from './Icones';

// Barra de navegação fixa na parte de baixo, com o botão "+" no centro
export default function BarraAbas({ itens, ativo, aoSelecionar, aoAdicionar, rotuloAdicionar }) {
  const meio = Math.floor(itens.length / 2);

  const renderItem = (item) => {
    const selecionado = item.id === ativo;
    const Icone = item.icone;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => aoSelecionar(item.id)}
        aria-current={selecionado ? 'page' : undefined}
        className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] transition-colors ${
          selecionado ? 'font-semibold text-marca' : 'font-medium text-suave'
        }`}
      >
        <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${selecionado ? 'bg-marca/15' : ''}`}>
          <Icone width={22} height={22} />
        </span>
        {item.rotulo}
      </button>
    );
  };

  return (
    <nav
      className="relative z-20 flex shrink-0 items-end border-t border-linha bg-cartao px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))]"
      aria-label="Navegação principal"
    >
      {itens.slice(0, meio).map(renderItem)}
      <div className="flex flex-1 justify-center">
        <button
          type="button"
          onClick={aoAdicionar}
          aria-label={rotuloAdicionar}
          className="-mt-5 mb-1 grid h-14 w-14 place-items-center rounded-full bg-marca text-sobremarca shadow-lg shadow-marca/30 transition-transform active:scale-95"
        >
          <IconeMais width={26} height={26} strokeWidth={2.2} />
        </button>
      </div>
      {itens.slice(meio).map(renderItem)}
    </nav>
  );
}
