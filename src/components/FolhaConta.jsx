import FolhaModal from './FolhaModal';
import { IconeAuto, IconeLua, IconeSair, IconeSol } from './Icones';
import { MARCA } from '../lib/marca';

const TEMAS = [
  { id: 'claro', rotulo: 'Claro', Icone: IconeSol },
  { id: 'escuro', rotulo: 'Escuro', Icone: IconeLua },
  { id: 'auto', rotulo: 'Automático', Icone: IconeAuto },
];

export default function FolhaConta({ nome, email, preferenciaTema, aoEscolherTema, aoSair, aoFechar }) {
  return (
    <FolhaModal titulo="Minha conta" aoFechar={aoFechar}>
      <div className="mb-5">
        <p className="text-sm font-semibold text-texto">{nome}</p>
        <p className="text-xs text-suave">{email}</p>
      </div>

      <p className="mb-2 text-xs font-medium text-suave">Aparência</p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Aparência">
        {TEMAS.map(({ id, rotulo, Icone }) => {
          const ativo = preferenciaTema === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => aoEscolherTema(id)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-colors ${
                ativo ? 'border-marca bg-marca/10 text-marca' : 'border-linha bg-cartao2 text-suave'
              }`}
            >
              <Icone width={20} height={20} />
              {rotulo}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-suave">No modo automático, o app acompanha a configuração do seu celular.</p>

      <button
        type="button"
        onClick={aoSair}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-linha bg-cartao2 py-3 text-sm font-semibold text-despesa"
      >
        <IconeSair width={18} height={18} />
        Sair da conta
      </button>

      <p className="mt-5 text-center text-[11px] text-suave">
        {MARCA.nome} · versão {MARCA.versao}
      </p>
    </FolhaModal>
  );
}
