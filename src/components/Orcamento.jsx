import { useState } from 'react';
import SeletorMes from './SeletorMes';
import IconeCategoria from './IconeCategoria';
import { IconeFechar } from './Icones';
import { estiloCategoria } from '../lib/categorias';
import { BOTAO_PRINCIPAL, CAMPO, ROTULO } from '../lib/estilos';
import { CATEGORIAS_DESPESA, moeda } from '../lib/utils';

export default function Orcamento({
  despesas = [],
  limitesOrcamento = {},
  definirLimite = async () => false,
  removerLimite = async () => false,
  mesTexto = '',
  aoVoltarMes = () => {},
  aoAvancarMes = () => {},
}) {
  const [formAberto, setFormAberto] = useState(false);
  const [categoria, setCategoria] = useState(CATEGORIAS_DESPESA[0]);
  const [valor, setValor] = useState('');

  const gastos = despesas.reduce((acc, d) => {
    const cat = d.categoria || 'Outros';
    acc[cat] = (acc[cat] || 0) + d.valor;
    return acc;
  }, {});

  const categoriasComLimite = Object.keys(limitesOrcamento).filter((c) => limitesOrcamento[c] > 0);
  const categoriasSemLimite = Object.keys(gastos).filter((c) => !categoriasComLimite.includes(c));

  const totalLimites = categoriasComLimite.reduce((acc, c) => acc + limitesOrcamento[c], 0);
  const gastoComLimite = categoriasComLimite.reduce((acc, c) => acc + (gastos[c] || 0), 0);
  const percentualGeral = totalLimites > 0 ? Math.round((gastoComLimite / totalLimites) * 100) : 0;

  const corDaBarra = (pct) => (pct > 100 ? 'bg-despesa' : pct >= 85 ? 'bg-alerta' : 'bg-marca');

  const salvar = async (e) => {
    e.preventDefault();
    const numero = parseFloat(valor);
    if (!Number.isFinite(numero) || numero <= 0) return;
    if (await definirLimite(categoria, numero)) {
      setValor('');
      setFormAberto(false);
    }
  };

  const abrirFormPara = (cat) => {
    setCategoria(cat);
    setValor(limitesOrcamento[cat] ? String(limitesOrcamento[cat]) : '');
    setFormAberto(true);
  };

  return (
    <div className="pb-4">
      <SeletorMes texto={mesTexto} aoVoltar={aoVoltarMes} aoAvancar={aoAvancarMes} />

      {/* RESUMO GERAL DOS LIMITES */}
      <div className="mt-3 rounded-3xl border border-linha bg-gradient-to-br from-marca/15 via-cartao to-cartao p-5">
        {categoriasComLimite.length === 0 ? (
          <>
            <p className="text-sm font-semibold text-texto">Defina limites de gasto</p>
            <p className="mt-1 text-xs text-suave">
              Escolha quanto quer gastar por categoria no mês e acompanhe o quanto já usou.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-medium text-suave">Usado dos limites definidos</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-texto">{percentualGeral}%</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-cartao2">
              <div className={`h-full rounded-full ${corDaBarra(percentualGeral)}`} style={{ width: `${Math.min(percentualGeral, 100)}%` }}></div>
            </div>
            <p className="mt-2 text-xs text-suave">
              {moeda(gastoComLimite)} de {moeda(totalLimites)}
            </p>
          </>
        )}
        {!formAberto && (
          <button onClick={() => abrirFormPara(categoria)} className={`${BOTAO_PRINCIPAL} mt-4`}>
            Definir limite
          </button>
        )}
      </div>

      {/* FORMULÁRIO */}
      {formAberto && (
        <form onSubmit={salvar} className="mt-3 rounded-2xl border border-linha bg-cartao p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="limCat" className={ROTULO}>
                Categoria
              </label>
              <select id="limCat" value={categoria} onChange={(e) => setCategoria(e.target.value)} className={CAMPO}>
                {CATEGORIAS_DESPESA.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="limValor" className={ROTULO}>
                Limite (R$)
              </label>
              <input
                id="limValor"
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className={CAMPO}
                required
                autoFocus
              />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setFormAberto(false)} className="rounded-xl border border-linha bg-cartao2 py-3 text-sm font-semibold text-texto">
              Cancelar
            </button>
            <button type="submit" className="rounded-xl bg-marca py-3 text-sm font-semibold text-sobremarca">
              Salvar limite
            </button>
          </div>
        </form>
      )}

      {/* CATEGORIAS COM LIMITE */}
      {categoriasComLimite.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-texto">Com limite</h3>
          <div className="mt-1 divide-y divide-linha">
            {categoriasComLimite.map((cat) => {
              const gasto = gastos[cat] || 0;
              const limite = limitesOrcamento[cat];
              const pct = Math.round((gasto / limite) * 100);
              const passou = gasto > limite;
              return (
                <div key={cat} className="py-3">
                  <div className="flex items-center gap-3">
                    <IconeCategoria {...estiloCategoria(cat)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <button onClick={() => abrirFormPara(cat)} className="truncate text-left text-sm font-medium text-texto">
                          {cat}
                        </button>
                        <span className={`text-xs font-semibold ${passou ? 'text-despesa' : 'text-suave'}`}>{pct}%</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-cartao2">
                        <div className={`h-full rounded-full transition-all ${corDaBarra(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                      </div>
                      <p className="mt-1 text-xs text-suave">
                        {moeda(gasto)} de {moeda(limite)}
                        {passou && <span className="font-semibold text-despesa"> • passou {moeda(gasto - limite)}</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => removerLimite(cat)}
                      aria-label={`Remover limite de ${cat}`}
                      title="Remover limite"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-suave hover:bg-cartao2"
                    >
                      <IconeFechar width={16} height={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CATEGORIAS SEM LIMITE */}
      {categoriasSemLimite.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-texto">Sem limite</h3>
          <div className="mt-1 divide-y divide-linha">
            {categoriasSemLimite.map((cat) => (
              <div key={cat} className="flex items-center gap-3 py-3">
                <IconeCategoria {...estiloCategoria(cat)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-texto">{cat}</p>
                  <p className="text-xs text-suave">{moeda(gastos[cat])} no mês</p>
                </div>
                <button onClick={() => abrirFormPara(cat)} className="text-xs font-semibold text-marca">
                  Definir limite
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {categoriasComLimite.length === 0 && categoriasSemLimite.length === 0 && (
        <p className="mt-8 text-center text-sm text-suave">Ainda não há gastos neste mês.</p>
      )}
    </div>
  );
}
