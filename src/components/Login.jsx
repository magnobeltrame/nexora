import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { MARCA } from '../lib/marca';
import { BOTAO_PRINCIPAL, CAMPO, ROTULO } from '../lib/estilos';

const traduzirErro = (mensagem = '') => {
  const m = mensagem.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('already registered')) return 'Este e-mail já está cadastrado. Tente entrar.';
  if (m.includes('at least 6')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).';
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
  if (m.includes('network') || m.includes('fetch')) return 'Sem conexão. Verifique a internet e tente de novo.';
  return mensagem || 'Algo deu errado. Tente novamente.';
};

const classeLink = 'text-xs font-medium text-marca hover:underline';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [modoCadastro, setModoCadastro] = useState(false);
  const [modoRecuperacao, setModoRecuperacao] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  const limparMensagens = () => {
    setErro('');
    setSucesso('');
  };

  const entrarOuCadastrar = async (e) => {
    e.preventDefault();
    limparMensagens();
    setCarregando(true);

    if (modoCadastro) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome: nome.trim() } },
      });
      if (error) setErro(traduzirErro(error.message));
      else if (!data.session) {
        setSucesso('Conta criada! Enviamos um e-mail para confirmar seu cadastro. Depois, é só entrar.');
        setModoCadastro(false);
        setSenha('');
      }
      // Se já veio uma sessão, o app entra sozinho.
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) setErro(traduzirErro(error.message));
    }
    setCarregando(false);
  };

  const recuperarSenha = async (e) => {
    e.preventDefault();
    limparMensagens();
    setCarregando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) setErro(traduzirErro(error.message));
    else setSucesso('Enviamos o link de recuperação. Confira sua caixa de entrada (e o spam).');
    setCarregando(false);
  };

  const titulo = modoRecuperacao ? 'Recuperar senha' : modoCadastro ? 'Criar sua conta' : 'Entrar na sua conta';

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-fundo px-6 py-10">
      <img src={MARCA.logo} alt={`${MARCA.nome}: ${MARCA.slogan}`} className="mb-8 w-44 rounded-[2rem] shadow-2xl shadow-black/30" />

      <div className="w-full max-w-sm rounded-3xl border border-linha bg-cartao p-6">
        <h1 className="text-center text-lg font-bold text-texto">{titulo}</h1>

        {erro && (
          <p role="alert" className="mt-4 rounded-xl bg-despesa/10 px-3 py-2 text-center text-xs text-despesa">
            {erro}
          </p>
        )}
        {sucesso && (
          <p role="status" className="mt-4 rounded-xl bg-receita/10 px-3 py-2 text-center text-xs text-receita">
            {sucesso}
          </p>
        )}

        {modoRecuperacao ? (
          <form onSubmit={recuperarSenha} className="mt-5 flex flex-col gap-4">
            <p className="text-center text-xs text-suave">Digite seu e-mail para receber o link de recuperação.</p>
            <div>
              <label htmlFor="lgEmail" className={ROTULO}>
                E-mail
              </label>
              <input id="lgEmail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={CAMPO} required />
            </div>
            <button type="submit" disabled={carregando} className={BOTAO_PRINCIPAL}>
              {carregando ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
            <button
              type="button"
              onClick={() => {
                setModoRecuperacao(false);
                limparMensagens();
              }}
              className={classeLink}
            >
              Voltar ao login
            </button>
          </form>
        ) : (
          <form onSubmit={entrarOuCadastrar} className="mt-5 flex flex-col gap-4">
            {modoCadastro && (
              <div>
                <label htmlFor="lgNome" className={ROTULO}>
                  Como você quer ser chamado?
                </label>
                <input id="lgNome" type="text" autoComplete="given-name" value={nome} onChange={(e) => setNome(e.target.value)} className={CAMPO} required />
              </div>
            )}
            <div>
              <label htmlFor="lgEmail" className={ROTULO}>
                E-mail
              </label>
              <input id="lgEmail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={CAMPO} required />
            </div>
            <div>
              <label htmlFor="lgSenha" className={ROTULO}>
                {modoCadastro ? 'Crie uma senha (mínimo 6 caracteres)' : 'Senha'}
              </label>
              <input
                id="lgSenha"
                type="password"
                autoComplete={modoCadastro ? 'new-password' : 'current-password'}
                minLength={modoCadastro ? 6 : undefined}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className={CAMPO}
                required
              />
            </div>
            <button type="submit" disabled={carregando} className={BOTAO_PRINCIPAL}>
              {carregando ? 'Aguarde...' : modoCadastro ? 'Criar conta' : 'Entrar'}
            </button>
            {!modoCadastro && (
              <button
                type="button"
                onClick={() => {
                  setModoRecuperacao(true);
                  limparMensagens();
                }}
                className={classeLink}
              >
                Esqueceu a senha?
              </button>
            )}
          </form>
        )}

        {!modoRecuperacao && (
          <button
            type="button"
            onClick={() => {
              setModoCadastro(!modoCadastro);
              limparMensagens();
            }}
            className="mt-5 w-full text-center text-xs font-medium text-suave hover:text-texto"
          >
            {modoCadastro ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastre-se'}
          </button>
        )}
      </div>
    </div>
  );
}
