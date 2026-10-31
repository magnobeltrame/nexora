import { IconeSetaDir, IconeSetaEsq } from './Icones';

export default function SeletorMes({ texto, aoVoltar, aoAvancar }) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={aoVoltar} aria-label="Mês anterior" className="grid h-10 w-10 place-items-center rounded-full text-suave hover:bg-cartao2">
        <IconeSetaEsq />
      </button>
      <h2 className="text-base font-semibold capitalize text-texto">{texto}</h2>
      <button onClick={aoAvancar} aria-label="Próximo mês" className="grid h-10 w-10 place-items-center rounded-full text-suave hover:bg-cartao2">
        <IconeSetaDir />
      </button>
    </div>
  );
}
