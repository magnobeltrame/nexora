// Círculo colorido com o ícone da categoria
export default function IconeCategoria({ emoji, cor, tamanho = 40 }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full"
      style={{ width: tamanho, height: tamanho, backgroundColor: `${cor}26`, fontSize: tamanho * 0.45 }}
      aria-hidden="true"
    >
      {emoji}
    </span>
  );
}
