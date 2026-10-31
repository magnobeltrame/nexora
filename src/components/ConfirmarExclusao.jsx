import { useEffect, useRef } from 'react';

// Janela "Tem certeza?" antes de apagar qualquer coisa
export default function ConfirmarExclusao({ titulo, mensagem, rotulo = 'Excluir', ocupado = false, aoConfirmar, aoCancelar }) {
  const botaoCancelar = useRef(null);

  useEffect(() => {
    botaoCancelar.current?.focus(); // o foco começa em "Cancelar", mais seguro contra toque sem querer
    const aoApertar = (e) => {
      if (e.key === 'Escape' && !ocupado) aoCancelar();
    };
    window.addEventListener('keydown', aoApertar);
    return () => window.removeEventListener('keydown', aoApertar);
  }, [aoCancelar, ocupado]);

  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center p-6" role="alertdialog" aria-modal="true" aria-label={titulo}>
      <div className="absolute inset-0 bg-black/70" onClick={ocupado ? undefined : aoCancelar}></div>
      <div className="relative w-full max-w-xs rounded-2xl border border-linha bg-cartao p-5 shadow-2xl">
        <h3 className="text-base font-semibold text-texto">{titulo}</h3>
        {mensagem && <p className="mt-2 text-sm text-suave">{mensagem}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            ref={botaoCancelar}
            type="button"
            onClick={aoCancelar}
            disabled={ocupado}
            className="rounded-xl border border-linha bg-cartao2 py-3 text-sm font-semibold text-texto disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={aoConfirmar}
            disabled={ocupado}
            className="rounded-xl bg-despesa py-3 text-sm font-semibold text-sobredespesa disabled:opacity-60"
          >
            {ocupado ? 'Aguarde...' : rotulo}
          </button>
        </div>
      </div>
    </div>
  );
}
