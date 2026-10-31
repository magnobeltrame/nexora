// ==========================================
// CONSTANTES
// ==========================================
export const CATEGORIAS_DESPESA = [
  'Moradia', 'Alimentação', 'Transporte', 'Educação', 'Cartões',
  'Saúde', 'Lazer', 'Investimentos', 'Outros',
];

export const CATEGORIAS_RECEITA_NEGOCIO = [
  'Serviço Principal', 'Consultoria / Avaliação', 'Venda de Produto', 'Outros',
];

export const CATEGORIAS_DESPESA_NEGOCIO = [
  'Insumos/Materiais', 'Transporte/Combustível', 'Impostos/Taxas', 'Outros Custos',
];

// ==========================================
// DINHEIRO
// ==========================================
export const moeda = (valor) =>
  Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ==========================================
// DATAS (o banco guarda no formato AAAA-MM-DD)
// ==========================================
const pad = (n) => String(n).padStart(2, '0');

export const paraISO = (data) =>
  `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;

export const hojeISO = () => paraISO(new Date());

// Ex.: new Date(2026, 9, 1) -> "2026-10"
export const chaveMes = (data) => `${data.getFullYear()}-${pad(data.getMonth() + 1)}`;

// "2026-10-25" -> "25/10/2026"
export const formatarData = (iso) => {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
};

// Monta uma data dentro do mês, sem passar do último dia (ex.: dia 30 em fevereiro vira 28)
export const diaNoMes = (chave, dia) => {
  const [ano, mes] = chave.split('-').map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return `${chave}-${pad(Math.min(dia, ultimoDia))}`;
};

export const nomeMes = (data) =>
  data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export const primeiroDiaDoMesAtual = () => {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
};

export const moverMes = (data, quantidade) =>
  new Date(data.getFullYear(), data.getMonth() + quantidade, 1);

// "2026-10-25" -> "domingo"
export const nomeDiaSemana = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long' });
