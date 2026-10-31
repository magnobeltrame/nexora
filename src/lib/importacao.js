import { hojeISO } from './utils';

// Lê os dados que a versão antiga do app guardava no navegador (localStorage)
// e converte para o formato novo do banco de dados.

const lerLocal = (chave, padrao) => {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? JSON.parse(bruto) : padrao;
  } catch {
    return padrao;
  }
};

const lista = (x) => (Array.isArray(x) ? x : []);
const objeto = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});

const chaveFlag = (parte, userId) => `nexora_importado_${parte}_${userId}`;
const jaTratado = (parte, userId) => {
  try {
    return !!localStorage.getItem(chaveFlag(parte, userId));
  } catch {
    return false;
  }
};

export const marcarComoTratado = (parte, userId) => {
  try {
    localStorage.setItem(chaveFlag(parte, userId), '1');
  } catch {
    /* sem problema se não for possível gravar */
  }
};

// Retorna null se não houver nada para importar
export function lerDadosLocais(userId) {
  const receitas = lista(lerLocal('nexora_receitas_pessoal', []));
  const despesas = lista(lerLocal('nexora_despesas_pessoal', []));
  const limites = objeto(lerLocal('nexora_limites_orcamento', {}));

  const lancamentos = lista(lerLocal('nexora_lancamentos_negocio', []));
  const equipe = lista(lerLocal('nexora_equipe_negocio', []));
  const catalogo = lista(lerLocal('nexora_catalogo_negocio', []));
  const meta = Number(localStorage.getItem('nexora_meta_mensal')) || null;
  const taxaSalva = localStorage.getItem('nexora_taxa_padrao');
  const taxa = taxaSalva !== null && taxaSalva !== '' ? Number(taxaSalva) : null;

  const temPessoal =
    receitas.length + despesas.length + Object.keys(limites).length > 0 && !jaTratado('pessoal', userId);
  const temNegocio =
    lancamentos.length + equipe.length + catalogo.length > 0 && !jaTratado('negocio', userId);

  if (!temPessoal && !temNegocio) return null;

  return {
    pessoal: temPessoal ? { receitas, despesas, limites } : null,
    negocio: temNegocio ? { lancamentos, equipe, catalogo, meta, taxa } : null,
  };
}

const dois = (n) => String(n).padStart(2, '0');

// "25/10/2026" -> "2026-10-25". Aceita também "25/10" (usa o ano atual). Retorna null se for inválida.
function dataBRparaISO(texto) {
  if (typeof texto !== 'string') return null;
  const partes = texto.trim().split('/');
  if (partes.length < 2) return null;
  const dia = Number(partes[0]);
  const mes = Number(partes[1]);
  let ano = partes.length >= 3 ? Number(partes[2]) : new Date().getFullYear();
  if (ano > 0 && ano < 100) ano += 2000;
  if (!dia || !mes || !ano || mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return `${ano}-${dois(mes)}-${dois(Math.min(dia, ultimoDia))}`;
}

export function prepararImportacao(dados) {
  let datasCorrigidas = 0;
  let ignorados = 0;

  const dataOuHoje = (texto) => {
    const iso = dataBRparaISO(texto);
    if (iso) return iso;
    datasCorrigidas += 1;
    return hojeISO();
  };

  const valorValido = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) {
      ignorados += 1;
      return null;
    }
    return n;
  };

  let pessoal = null;
  if (dados.pessoal) {
    const receitas = dados.pessoal.receitas
      .map((r) => {
        const valor = valorValido(r?.valor);
        if (valor === null) return null;
        return {
          nome: String(r.nome || 'Sem nome'),
          valor,
          data: dataOuHoje(r.data),
          recebido: r.recebido !== false,
        };
      })
      .filter(Boolean);

    const despesas = dados.pessoal.despesas
      .map((d) => {
        const valor = valorValido(d?.valor);
        if (valor === null) return null;
        return {
          nome: String(d.nome || 'Sem nome'),
          categoria: d.categoria || 'Outros',
          valor,
          vencimento: dataOuHoje(d.vencimento),
          pago: !!d.pago,
        };
      })
      .filter(Boolean);

    const limites = Object.entries(dados.pessoal.limites)
      .map(([categoria, v]) => ({ categoria, valor: Number(v) }))
      .filter((l) => Number.isFinite(l.valor) && l.valor >= 0);

    pessoal = { receitas, despesas, limites };
  }

  let negocio = null;
  if (dados.negocio) {
    const lancamentos = dados.negocio.lancamentos
      .map((l) => {
        const valor = valorValido(l?.valor);
        if (valor === null) return null;
        return {
          tipo: l.tipo === 'despesa' ? 'despesa' : 'receita',
          data: dataOuHoje(l.data),
          cliente: l.cliente || null,
          servico: l.servico || null,
          descricao: l.descricao || null,
          categoria: l.categoria || null,
          valor,
          taxaAplicada: Number(l.taxaAplicada) || 0,
          responsavel: l.responsavel || null,
          observacao: l.observacao || null,
        };
      })
      .filter(Boolean);

    // Remove nomes repetidos (o banco não aceita dois iguais)
    const equipe = [...new Set(dados.negocio.equipe.map((n) => String(n).trim()).filter(Boolean))];

    const mapaCatalogo = new Map();
    dados.negocio.catalogo.forEach((c) => {
      const nome = String(c?.nome || '').trim();
      const valor = Number(c?.valor);
      if (!nome || !Number.isFinite(valor)) return;
      mapaCatalogo.set(nome, {
        nome,
        valor,
        tipo: c.tipo === 'despesa' ? 'despesa' : 'receita',
        categoria: c.categoria || null,
      });
    });

    negocio = {
      lancamentos,
      equipe,
      catalogo: [...mapaCatalogo.values()],
      meta: dados.negocio.meta,
      taxa: dados.negocio.taxa,
    };
  }

  return { pessoal, negocio, datasCorrigidas, ignorados };
}
