import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm, SuapLoginForm } from '../features/auth/components';
import { LoginToggle } from '../shared/components/feedback';
import { AuthLayout } from '../shared/components/layout';
import { AuthLeftPanel, AuthRightPanel } from '../shared/components/feedback';
import { useAuth } from '../features/auth';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithSuap, isAuthenticated, isLoading: authLoading, clearError } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loginType, setLoginType] = useState(() => {
    // Restaurar preferência de login do localStorage
    try {
      const saved = localStorage.getItem('ifmeetup_preferred_login_type');
      return saved === 'suap' ? 'suap' : 'traditional';
    } catch (e) {
      return 'traditional';
    }
  });
  const [formData, setFormData] = useState({
    traditional: { email: '', password: '' },
    suap: { username: '', password: '' }
  });

  // redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const from = location.state?.from?.pathname || '/home';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location.state]);

  // limpar erros quando componente monta
  useEffect(() => {
    clearError();
  }, []); // removendo clearError das dependências

  // handler para alternar tipo de login
  const handleToggleLoginType = (type) => {
    // Não permitir troca durante loading
    if (isLoading) return;

    setLoginType(type);
    setError(null); // limpar erros ao trocar tipo

    // Salvar preferência no localStorage para próximas visitas
    try {
      localStorage.setItem('ifmeetup_preferred_login_type', type);
    } catch (e) {
      // Ignorar erros de localStorage (modo privado, etc.)
    }
  };

  // handler para atualizar dados do formulário
  const handleFormDataChange = useCallback((type, data) => {
    setFormData(prev => ({
      ...prev,
      [type]: { ...prev[type], ...data }
    }));
  }, []);

  // Memoizar as funções onDataChange para evitar loops infinitos
  const handleTraditionalDataChange = useCallback((data) => {
    handleFormDataChange('traditional', data);
  }, [handleFormDataChange]);

  const handleSuapDataChange = useCallback((data) => {
    handleFormDataChange('suap', data);
  }, [handleFormDataChange]);

  // handler unificado para login
  const handleLogin = async (credentials) => {
    setIsLoading(true);
    setError(null);

    try {
      // salvar dados do formulário para preservar estado
      handleFormDataChange(loginType, credentials);

      // escolher método de login baseado no tipo
      const loginMethod = loginType === 'suap' ? loginWithSuap : login;
      const result = await loginMethod(credentials);

      if (result.success) {
        // login bem-sucedido - navegação será tratada pelo useEffect
        const from = location.state?.from?.pathname || '/home';
        navigate(from, { replace: true });
      } else {
        // tratamento específico de erro baseado no tipo de login
        if (loginType === 'suap' && result.error?.type === 'suap_error') {
          // erro específico do SUAP - passar objeto estruturado
          setError({
            type: 'suap_error',
            errorCode: result.error.errorCode,
            message: result.error.message,
            suggestion: result.error.suggestion,
            showFallback: ['SUAP_TIMEOUT', 'SUAP_TEMPORARILY_UNAVAILABLE', 'SUAP_CONNECTION_ERROR'].includes(result.error.errorCode)
          });
        } else {
          // erro tradicional - passar string simples
          setError(typeof result.error === 'string' ? result.error : result.error?.message || 'Erro durante o login');
        }
      }
    } catch (err) {
      console.error('Erro inesperado durante o login:', err);

      // tratamento de erro específico por tipo de login
      if (loginType === 'suap') {
        setError({
          type: 'suap_error',
          message: 'Erro inesperado ao conectar com o SUAP',
          suggestion: 'Verifique sua conexão e tente novamente. Se o problema persistir, tente o login tradicional.',
          showFallback: true
        });
      } else {
        setError('Erro inesperado durante o login. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // mostrar loading se ainda está verificando autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      leftPanelContent={<AuthLeftPanel />}
      showLeftPanel={true}
    >
      <AuthRightPanel
        title="Bem-vindo ao IFMeetup"
        subtitle="Sistema de Gerenciamento de Eventos do IFPB"
      >
        {/* toggle de tipo de login */}
        <div className="mb-6">
          <LoginToggle
            loginType={loginType}
            onToggle={handleToggleLoginType}
            disabled={isLoading}
          />
        </div>

        {/* formulário de login */}
        {loginType === 'traditional' ? (
          <LoginForm
            onSubmit={handleLogin}
            isLoading={isLoading}
            error={error}
            initialData={formData.traditional}
            onDataChange={handleTraditionalDataChange}
          />
        ) : (
          <SuapLoginForm
            onSubmit={handleLogin}
            isLoading={isLoading}
            error={error}
            initialData={formData.suap}
            onDataChange={handleSuapDataChange}
          />
        )}
      </AuthRightPanel>
    </AuthLayout>
  );
};

export default LoginPage; 