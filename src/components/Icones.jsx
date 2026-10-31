// Ícones simples (traço), todos herdam a cor do texto ao redor.
const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const criar = (caminho) =>
  function Icone(props) {
    return (
      <svg {...base} {...props}>
        {caminho}
      </svg>
    );
  };

export const IconeInicio = criar(
  <>
    <path d="M3.5 11.2 12 4l8.5 7.2" />
    <path d="M5.5 9.8V20h13V9.8" />
    <path d="M10 20v-5.5h4V20" />
  </>
);
export const IconeLista = criar(
  <>
    <path d="M9 6.5h11M9 12h11M9 17.5h11" />
    <circle cx="4.5" cy="6.5" r="0.8" />
    <circle cx="4.5" cy="12" r="0.8" />
    <circle cx="4.5" cy="17.5" r="0.8" />
  </>
);
export const IconeMais = criar(<path d="M12 5v14M5 12h14" />);
export const IconeMeta = criar(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="0.8" />
  </>
);
export const IconeGrafico = criar(<path d="M5 20v-6M12 20V5M19 20v-10" />);
export const IconeSetaEsq = criar(<path d="m14.5 6-6 6 6 6" />);
export const IconeSetaDir = criar(<path d="m9.5 6 6 6-6 6" />);
export const IconeFechar = criar(<path d="M6 6l12 12M18 6 6 18" />);
export const IconeCheck = criar(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const IconeSol = criar(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
  </>
);
export const IconeLua = criar(<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />);
export const IconeAuto = criar(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5v17" />
    <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" />
  </>
);
export const IconeSair = criar(
  <>
    <path d="M10 4.5H5.5v15H10" />
    <path d="M14 8l4 4-4 4M18 12H9.5" />
  </>
);
export const IconeLixeira = criar(
  <>
    <path d="M4.5 7h15M10 7V4.5h4V7" />
    <path d="M6.5 7l.8 12.5h9.4L17.5 7" />
  </>
);
export const IconeLapis = criar(
  <>
    <path d="M4 20l1-4L16.5 4.5a1.8 1.8 0 0 1 2.5 0l.5.5a1.8 1.8 0 0 1 0 2.5L8 19Z" />
    <path d="m14.5 6.5 3 3" />
  </>
);
export const IconeAlerta = criar(
  <>
    <path d="M12 4 3 19.5h18Z" />
    <path d="M12 10v4.5M12 17.2v.1" />
  </>
);
