import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import NovaSenha from './components/NovaSenha';
import AreaLogada from './AreaLogada';

export default function App() {
  const [sessao, setSessao] = useState(null);
  const [verificando, setVerificando] = useState(true);
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
      setVerificando(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento, session) => {
      setSessao(session);
      if (evento === 'PASSWORD_RECOVERY') setRecuperandoSenha(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Evita piscar a tela de login enquanto verifica se a pessoa já estava logada
  if (verificando) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-fundo">
        <p className="text-sm text-suave">Carregando...</p>
      </div>
    );
  }

  if (sessao && recuperandoSenha) {
    return <NovaSenha aoConcluir={() => setRecuperandoSenha(false)} />;
  }

  if (!sessao) return <Login />;

  // "key" garante que, ao trocar de conta, nada da conta anterior fique na memória
  return <AreaLogada key={sessao.user.id} usuario={sessao.user} />;
}
