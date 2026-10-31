import { useEffect } from 'react';
import { IconeFechar } from './Icones';

// Janela que sobe da parte de baixo da tela (usada nos formulários)
export default function FolhaModal({ titulo, aoFechar, children }) {
  useEffect(() => {
    const aoApertar = (e) => {
      // Se houver uma janela de confirmação aberta, ela é quem responde ao Esc
      if (e.key === 'Escape' && !document.querySelector('[role="alertdialog"]')) aoFechar();
    };
    window.addEventListener('keydown', aoApertar);
    return () => window.removeEventListener('keydown', aoApertar);
  }, [aoFechar]);

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={aoFechar}></div>
      <div className="relative flex max-h-[92%] w-full flex-col rounded-t-3xl border-t border-linha bg-cartao shadow-2xl">
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-linha"></div>
        <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-3">
          <h3 className="text-base font-semibold text-texto">{titulo}</h3>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="grid h-9 w-9 place-items-center rounded-full text-suave hover:bg-cartao2"
          >
            <IconeFechar width={20} height={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}
