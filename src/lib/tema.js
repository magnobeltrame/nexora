// Controle do tema: 'claro', 'escuro' ou 'auto' (segue o celular).
const CHAVE = 'nexora_tema';
const OPCOES = ['claro', 'escuro', 'auto'];

export const lerPreferenciaTema = () => {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return OPCOES.includes(salvo) ? salvo : 'auto';
  } catch {
    return 'auto';
  }
};

const sistemaEscuro = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;

export const temaEfetivo = (preferencia) =>
  preferencia === 'auto' ? (sistemaEscuro() ? 'escuro' : 'claro') : preferencia;

export const aplicarTema = (preferencia) => {
  const escuro = temaEfetivo(preferencia) === 'escuro';
  document.documentElement.classList.toggle('dark', escuro);
  // Cor da barra do navegador no celular (só funciona se o index.html tiver a tag theme-color)
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', escuro ? '#070D0F' : '#F3F6F4');
};

export const salvarPreferenciaTema = (preferencia) => {
  try {
    localStorage.setItem(CHAVE, preferencia);
  } catch {
    /* sem problema se não for possível gravar */
  }
  aplicarTema(preferencia);
};
