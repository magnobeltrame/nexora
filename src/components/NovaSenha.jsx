import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { BOTAO_PRINCIPAL, CAMPO, ROTULO } from '../lib/estilos';

// Aparece quando a pessoa clica no link de "esqueci a senha" recebido por e-mail
export default function NovaSenha({ aoConcluir }) {
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const salvar = async (e) => {
    e.preventDefault();
    setErro('');
    if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.');
    if (senha !== confirmacao) return setErro('As duas senhas não são iguais.');

    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setCarregando(false);
    if (error) setErro('Não foi possível trocar a senha. Peça um novo link de recuperação.');
    else aoConcluir();
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-fundo px-6 py-10">
      <form onSubmit={salvar} className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-linha bg-cartao p-6">
        <h1 className="text-center text-lg font-bold text-texto">Crie sua nova senha</h1>
        {erro && (
          <p role="alert" className="rounded-xl bg-despesa/10 px-3 py-2 text-center text-xs text-despesa">
            {erro}
          </p>
        )}
        <div>
          <label htmlFor="nsSenha" className={ROTULO}>
            Nova senha (mínimo 6 caracteres)
          </label>
          <input id="nsSenha" type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} className={CAMPO} required />
        </div>
        <div>
          <label htmlFor="nsConf" className={ROTULO}>
            Repita a nova senha
          </label>
          <input id="nsConf" type="password" autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} className={CAMPO} required />
        </div>
        <button type="submit" disabled={carregando} className={BOTAO_PRINCIPAL}>
          {carregando ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  );
}
