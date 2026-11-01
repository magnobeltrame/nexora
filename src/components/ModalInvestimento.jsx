import { useMemo, useState } from 'react';
import FolhaModal from './FolhaModal';
import { BOTAO_PRINCIPAL, CAMPO, ROTULO } from '../lib/estilos';
import { normalizarTicker, posicoes } from '../lib/investimentos';

const TIPOS = [
  { id: 'compra', rotulo: 'Compra' },
  { id: 'venda', rotulo: 'Venda' },
  { id: 'provento', rotulo: 'Provento' },
  { id: 'rf', rotulo: 'Renda fixa' },
];

const ROTULO_PROVENTO = { dividendo: 'Dividendo', jcp: 'JCP (juros sobre capital próprio)', rendimento: 'Rendimento de FII' };

// Um só formulário para tudo: compra, venda, provento e saldo de renda fixa.
export default function ModalInvestimento({
  tipoInicial = 'compra',
  tickerInicial = '',
  nomeRfInicial = '',
  ativos = [],
  operacoes = [],
  nomesRf = [],
  dataPadrao,
  aoFechar,
  aoSalvar,
}) {
  const [tipo, setTipo] = useState(tipoInicial);
  const [ticker, setTicker] = useState(tickerInicial);
  const [classe, setClasse] = useState('acao');
  const [cnpj, setCnpj] = useState('');
  const [data, setData] = useState(dataPadrao);
  const [quantidade, setQuantidade] = useState('');
  const [preco, setPreco] = useState('');
  const [custos, setCustos] = useState('');
  const [tipoProvento, setTipoProvento] = useState('dividendo');
  const [valor, setValor] = useState('');
  const [irRetido, setIrRetido] = useState('');
  const [nomeRf, setNomeRf] = useState(nomeRfInicial);
  const [saldo, setSaldo] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const t = normalizarTicker(ticker);
  const conhecido = ativos.find((a) => a.ticker === t);
  const classeEfetiva = conhecido ? conhecido.classe : classe;
  const disponivel = useMemo(() => posicoes(operacoes).find((p) => p.ticker === t)?.quantidade || 0, [operacoes, t]);

  const opcoesProvento = classeEfetiva === 'fii' ? ['rendimento'] : ['dividendo', 'jcp'];
  const tipoProventoEfetivo = opcoesProvento.includes(tipoProvento) ? tipoProvento : opcoesProvento[0];

  const enviar = async (e) => {
    e.preventDefault();
    setErro('');

    let payload;
    if (tipo === 'rf') {
      const s = parseFloat(saldo);
      if (!nomeRf.trim() || !Number.isFinite(s) || s < 0 || !data) return;
      payload = { kind: 'rf', nome: nomeRf.trim(), data, saldo: s };
    } else {
      if (!t) return setErro('Informe o código do ativo.');
      if (!/^[A-Z][A-Z0-9]{3,5}$/.test(t) || !/\d/.test(t)) return setErro('Código inválido. Exemplos: PETR4, MXRF11.');
      if (tipo === 'provento') {
        const v = parseFloat(valor);
        const ir = parseFloat(irRetido) || 0;
        if (!Number.isFinite(v) || v < 0 || !data) return setErro('Informe o valor recebido.');
        payload = { kind: 'provento', ticker: t, classe: classeEfetiva, cnpj, tipo: tipoProventoEfetivo, data, valor: v, ir_retido: ir };
      } else {
        const q = parseFloat(quantidade);
        const p = parseFloat(preco);
        const c = parseFloat(custos) || 0;
        if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(p) || p < 0 || !data) return setErro('Confira a quantidade e o preço.');
        if (tipo === 'venda' && q > disponivel + 1e-9) {
          return setErro(`Você só tem ${disponivel} em carteira de ${t}. Para lançar essa venda, antes registre a compra que falta.`);
        }
        payload = { kind: 'operacao', ticker: t, classe: classeEfetiva, cnpj, tipo, data, quantidade: q, preco: p, custos: c };
      }
    }

    setSalvando(true);
    await aoSalvar(payload);
    setSalvando(false);
  };

  const classeTipo = (id) =>
    `rounded-lg py-2.5 text-sm font-semibold transition-colors ${tipo === id ? 'bg-cartao text-marca shadow-sm' : 'text-suave'}`;

  return (
    <FolhaModal titulo="Novo lançamento" aoFechar={aoFechar}>
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-cartao2 p-1" role="group" aria-label="Tipo de lançamento">
        {TIPOS.map((x) => (
          <button key={x.id} type="button" aria-pressed={tipo === x.id} onClick={() => { setTipo(x.id); setErro(''); }} className={classeTipo(x.id)}>
            {x.rotulo}
          </button>
        ))}
      </div>

      <form onSubmit={enviar} className="mt-4 flex flex-col gap-4">
        {tipo !== 'rf' && (
          <>
            <div>
              <label htmlFor="invTicker" className={ROTULO}>
                Código do ativo
              </label>
              <input
                id="invTicker"
                type="text"
                list="invTickers"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="Ex.: PETR4 ou MXRF11"
                autoCapitalize="characters"
                autoComplete="off"
                className={CAMPO}
                required
              />
              <datalist id="invTickers">
                {ativos.map((a) => (
                  <option key={a.ticker} value={a.ticker} />
                ))}
              </datalist>
              {conhecido && (
                <p className="mt-1.5 text-[11px] text-suave">
                  {conhecido.classe === 'fii' ? 'Fundo imobiliário' : 'Ação'}
                  {tipo === 'venda' ? ` • em carteira: ${disponivel}` : ''}
                </p>
              )}
            </div>

            {!conhecido && t && (
              <div>
                <label htmlFor="invClasse" className={ROTULO}>
                  Ativo novo: que tipo é?
                </label>
                <select id="invClasse" value={classe} onChange={(e) => setClasse(e.target.value)} className={CAMPO}>
                  <option value="acao">Ação (inclui units, como TAEE11)</option>
                  <option value="fii">Fundo imobiliário (FII)</option>
                </select>
              </div>
            )}
          </>
        )}

        {(tipo === 'compra' || tipo === 'venda') && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="invQtd" className={ROTULO}>
                  Quantidade
                </label>
                <input id="invQtd" type="number" min="1" step="1" inputMode="numeric" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className={CAMPO} required />
              </div>
              <div>
                <label htmlFor="invPreco" className={ROTULO}>
                  Preço unitário (R$)
                </label>
                <input id="invPreco" type="number" min="0" step="0.01" inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} className={CAMPO} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="invData" className={ROTULO}>
                  Data
                </label>
                <input id="invData" type="date" value={data} onChange={(e) => setData(e.target.value)} className={CAMPO} required />
              </div>
              <div>
                <label htmlFor="invCustos" className={ROTULO}>
                  Taxas e corretagem (R$)
                </label>
                <input id="invCustos" type="number" min="0" step="0.01" inputMode="decimal" value={custos} onChange={(e) => setCustos(e.target.value)} placeholder="0,00" className={CAMPO} />
              </div>
            </div>
          </>
        )}

        {tipo === 'provento' && (
          <>
            <div>
              <label htmlFor="invTipoProv" className={ROTULO}>
                Tipo de provento
              </label>
              <select id="invTipoProv" value={tipoProventoEfetivo} onChange={(e) => setTipoProvento(e.target.value)} className={CAMPO}>
                {opcoesProvento.map((o) => (
                  <option key={o} value={o}>
                    {ROTULO_PROVENTO[o]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="invValor" className={ROTULO}>
                  Valor recebido (R$)
                </label>
                <input id="invValor" type="number" min="0" step="0.01" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} className={CAMPO} required />
              </div>
              <div>
                <label htmlFor="invDataProv" className={ROTULO}>
                  Data
                </label>
                <input id="invDataProv" type="date" value={data} onChange={(e) => setData(e.target.value)} className={CAMPO} required />
              </div>
            </div>
            {tipoProventoEfetivo === 'jcp' && (
              <div>
                <label htmlFor="invIr" className={ROTULO}>
                  IR retido na fonte (R$, opcional)
                </label>
                <input id="invIr" type="number" min="0" step="0.01" inputMode="decimal" value={irRetido} onChange={(e) => setIrRetido(e.target.value)} placeholder="0,00" className={CAMPO} />
                <p className="mt-1.5 text-[11px] text-suave">Informe o valor líquido recebido acima. O IR retido ajuda a conferir com o informe.</p>
              </div>
            )}
          </>
        )}

        {tipo !== 'rf' && t && !conhecido?.cnpj && (
          <div>
            <label htmlFor="invCnpj" className={ROTULO}>
              CNPJ do ativo (opcional agora, necessário para o IR)
            </label>
            <input id="invCnpj" type="text" inputMode="numeric" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className={CAMPO} />
          </div>
        )}

        {tipo === 'rf' && (
          <>
            <div>
              <label htmlFor="rfNome" className={ROTULO}>
                Nome da aplicação
              </label>
              <input id="rfNome" type="text" list="rfNomes" value={nomeRf} onChange={(e) => setNomeRf(e.target.value)} placeholder="Ex.: CDB C6 pós-fixado" className={CAMPO} required />
              <datalist id="rfNomes">
                {nomesRf.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="rfSaldo" className={ROTULO}>
                  Saldo (R$)
                </label>
                <input id="rfSaldo" type="number" min="0" step="0.01" inputMode="decimal" value={saldo} onChange={(e) => setSaldo(e.target.value)} className={CAMPO} required />
              </div>
              <div>
                <label htmlFor="rfData" className={ROTULO}>
                  Saldo em
                </label>
                <input id="rfData" type="date" value={data} onChange={(e) => setData(e.target.value)} className={CAMPO} required />
              </div>
            </div>
            <p className="text-[11px] text-suave">Cada saldo fica guardado com a data. Para o IR, o app usa o último saldo até 31/12 de cada ano.</p>
          </>
        )}

        {erro && (
          <p role="alert" className="rounded-xl bg-despesa/10 px-3 py-2 text-xs text-despesa">
            {erro}
          </p>
        )}

        <button type="submit" disabled={salvando} className={BOTAO_PRINCIPAL}>
          {salvando ? 'Salvando...' : 'Salvar lançamento'}
        </button>
      </form>
    </FolhaModal>
  );
}
