import { useState } from 'react';
import FolhaModal from './FolhaModal';
import { IconeLixeira } from './Icones';
import { BOTAO_PRINCIPAL, CAMPO, ROTULO } from '../lib/estilos';
import { formatarData, moeda } from '../lib/utils';

const ROTULO_PROVENTO = { dividendo: 'Dividendo', jcp: 'JCP', rendimento: 'Rendimento' };

// Histórico de um ativo: operações, proventos, CNPJ e onde está guardado
export default function ModalAtivo({ ticker, ativo, posicao, operacoes, proventos, aoFechar, aoSalvarAtivo, aoRemoverOperacao, aoRemoverProvento }) {
  const [cnpj, setCnpj] = useState(ativo?.cnpj || '');
  const [custodia, setCustodia] = useState(ativo?.custodia || '');
  const [salvando, setSalvando] = useState(false);

  const mudou = (cnpj.trim() || '') !== (ativo?.cnpj || '') || (custodia.trim() || '') !== (ativo?.custodia || '');
  const ops = [...operacoes].sort((a, b) => b.data.localeCompare(a.data));
  const provs = [...proventos].sort((a, b) => b.data.localeCompare(a.data));

  const salvar = async () => {
    setSalvando(true);
    await aoSalvarAtivo(ativo.id, { cnpj: cnpj.trim() || null, custodia: custodia.trim() || null });
    setSalvando(false);
  };

  return (
    <FolhaModal titulo={ticker} aoFechar={aoFechar}>
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-linha bg-cartao2 p-3 text-center">
        <div>
          <p className="text-[11px] text-suave">Quantidade</p>
          <p className="mt-0.5 text-sm font-semibold text-texto">{posicao ? posicao.quantidade : 0}</p>
        </div>
        <div>
          <p className="text-[11px] text-suave">Preço médio</p>
          <p className="mt-0.5 text-sm font-semibold text-texto">{posicao ? moeda(posicao.pm) : '-'}</p>
        </div>
        <div>
          <p className="text-[11px] text-suave">Custo total</p>
          <p className="mt-0.5 text-sm font-semibold text-texto">{posicao ? moeda(posicao.custo) : '-'}</p>
        </div>
      </div>

      {ativo && (
        <div className="mt-4 grid gap-3">
          <div>
            <label htmlFor="ativoCnpj" className={ROTULO}>
              CNPJ (usado no relatório de IR)
            </label>
            <input id="ativoCnpj" type="text" inputMode="numeric" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className={CAMPO} />
          </div>
          <div>
            <label htmlFor="ativoCustodia" className={ROTULO}>
              Onde está guardado (corretora)
            </label>
            <input id="ativoCustodia" type="text" value={custodia} onChange={(e) => setCustodia(e.target.value)} placeholder="Ex.: Banco Inter" className={CAMPO} />
          </div>
          {mudou && (
            <button onClick={salvar} disabled={salvando} className={BOTAO_PRINCIPAL}>
              {salvando ? 'Salvando...' : 'Salvar dados do ativo'}
            </button>
          )}
        </div>
      )}

      <h4 className="mt-6 text-sm font-semibold text-texto">Operações</h4>
      {ops.length === 0 ? (
        <p className="mt-1 text-xs text-suave">Nenhuma operação.</p>
      ) : (
        <ul className="mt-1 divide-y divide-linha">
          {ops.map((o) => (
            <li key={o.id} className="flex items-center gap-2 py-2.5 text-sm">
              <span className="min-w-0 flex-1">
                <span className="block text-texto">
                  {formatarData(o.data)} · <span className={o.tipo === 'compra' ? 'text-receita' : 'text-despesa'}>{o.tipo === 'compra' ? 'Compra' : 'Venda'}</span>
                </span>
                <span className="block text-xs text-suave">
                  {o.quantidade} × {moeda(o.preco)}
                  {o.custos > 0 ? ` + ${moeda(o.custos)} de taxas` : ''}
                </span>
              </span>
              <button onClick={() => aoRemoverOperacao(o)} aria-label="Excluir operação" className="grid h-9 w-9 place-items-center rounded-full text-suave hover:bg-cartao2">
                <IconeLixeira width={17} height={17} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <h4 className="mt-5 text-sm font-semibold text-texto">Proventos</h4>
      {provs.length === 0 ? (
        <p className="mt-1 text-xs text-suave">Nenhum provento.</p>
      ) : (
        <ul className="mt-1 divide-y divide-linha">
          {provs.map((p) => (
            <li key={p.id} className="flex items-center gap-2 py-2.5 text-sm">
              <span className="min-w-0 flex-1 text-texto">
                {formatarData(p.data)} · {ROTULO_PROVENTO[p.tipo]}
              </span>
              <span className="font-semibold text-receita">{moeda(p.valor)}</span>
              <button onClick={() => aoRemoverProvento(p)} aria-label="Excluir provento" className="grid h-9 w-9 place-items-center rounded-full text-suave hover:bg-cartao2">
                <IconeLixeira width={17} height={17} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </FolhaModal>
  );
}
