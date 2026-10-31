// Ícone e cor de cada categoria de despesa
export const ESTILO_CATEGORIA = {
  Moradia: { emoji: '🏠', cor: '#3B82F6' },
  Alimentação: { emoji: '🍽️', cor: '#F97316' },
  Transporte: { emoji: '🚗', cor: '#8B5CF6' },
  Educação: { emoji: '🎓', cor: '#06B6D4' },
  Cartões: { emoji: '💳', cor: '#EC4899' },
  Saúde: { emoji: '🩺', cor: '#14B8A6' },
  Lazer: { emoji: '🎉', cor: '#EAB308' },
  Investimentos: { emoji: '📈', cor: '#22C55E' },
  Outros: { emoji: '📦', cor: '#94A3B8' },
};

export const ESTILO_RECEITA = { emoji: '💰', cor: '#10B981' };

export const estiloCategoria = (categoria) => ESTILO_CATEGORIA[categoria] || ESTILO_CATEGORIA.Outros;
