import { BOTAO_PRINCIPAL } from '../lib/estilos';

// Aviso mostrado quando existem dados da versão antiga guardados neste aparelho
export default function ImportarDados({ dados, importando, aoImportar, aoAdiar, aoDescartar }) {
  const p = dados.pessoal;
  const n = dados.negocio;

  const partes = [];
  if (p) {
    const qtd = p.receitas.length + p.despesas.length;
    if (qtd > 0) partes.push(qtd === 1 ? '1 lançamento pessoal' : `${qtd} lançamentos pessoais`);
  }
  if (n) {
    const qtd = n.lancamentos.length;
    if (qtd > 0) partes.push(`${qtd} lançamento${qtd === 1 ? '' : 's'} do negócio`);
  }
  const resumo = partes.length ? partes.join(' e ') : 'configurações salvas';

  return (
    <div className="mb-4 rounded-2xl border border-marca/40 bg-marca/10 p-4">
      <p className="text-sm font-semibold text-texto">Encontramos dados antigos neste aparelho</p>
      <p className="mt-1 text-xs text-suave">
        Foram encontrados {resumo} guardados no navegador. Importe para sua conta para não perder nada e acessar de qualquer aparelho. Os dados antigos
        continuam aqui como cópia de segurança.
      </p>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
        <button onClick={aoImportar} disabled={importando} className={BOTAO_PRINCIPAL}>
          {importando ? 'Importando...' : 'Importar para minha conta'}
        </button>
        <button
          onClick={aoAdiar}
          disabled={importando}
          className="rounded-xl border border-linha bg-cartao px-4 text-sm font-semibold text-texto disabled:opacity-60"
        >
          Agora não
        </button>
      </div>
      <button onClick={aoDescartar} disabled={importando} className="mt-3 text-[11px] text-suave underline">
        Não importar e não perguntar de novo
      </button>
    </div>
  );
}
