/** @type {import('tailwindcss').Config} */

// As cores vêm de variáveis definidas em src/index.css.
// É assim que o mesmo código funciona nos modos claro e escuro.
const cor = (nome) => `rgb(var(--${nome}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        fundo: cor('fundo'),
        cartao: cor('cartao'),
        cartao2: cor('cartao2'),
        linha: cor('linha'),
        texto: cor('texto'),
        suave: cor('suave'),
        marca: cor('marca'),
        sobremarca: cor('sobre-marca'),
        receita: cor('receita'),
        despesa: cor('despesa'),
        sobredespesa: cor('sobre-despesa'),
        alerta: cor('alerta'),
      },
    },
  },
  plugins: [],
};
