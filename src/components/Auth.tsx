import React from 'react';
import { useToast } from '../lib/ToastContext';
import { LogIn } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';

export function Auth({ store }: { store: any }) {
  const { config } = store;
  const { showToast } = useToast();
  
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      showToast('Login efetuado com sucesso!');
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/unauthorized-domain') {
        showToast('Erro: Domínio da Vercel não autorizado no Firebase!', 'err');
        alert('Para funcionar na Vercel, você precisa adicionar o seu link da Vercel nos "Domínios Autorizados" dentro do painel do Firebase Authentication.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        showToast('Login cancelado.', 'info');
      } else {
        showToast(`Erro ao fazer login: ${error.message}`, 'err');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-surface border border-border rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        
        <div className="text-center mb-8">
          {config.logo ? (
            <img src={config.logo} alt="Logo" className="h-16 object-contain mx-auto mb-4" />
          ) : (
            <div className="font-serif text-2xl text-gold tracking-wide mb-2">
              {config.nome || '💈 Barber Manager'}
            </div>
          )}
          <h1 className="text-xl font-semibold">
            Acessar Sistema
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Faça login com sua conta Google para continuar
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={handleGoogleLogin}
            className="bg-white text-black border border-gray-300 px-5 py-3 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-3 mt-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Entrar com Google
          </button>
        </div>

      </div>
    </div>
  );
}
