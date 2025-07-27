import { useState, useEffect } from 'react';
import { Input, Button, Card } from '../../components/ui';
import { LoginSchema } from '../../schemas';

const LoginForm = ({ onSubmit, isLoading, error, initialData, onDataChange }) => {
  const [formData, setFormData] = useState({
    email: initialData?.email || '',
    password: initialData?.password || ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [fieldFocus, setFieldFocus] = useState({});
  const [announceMessage, setAnnounceMessage] = useState('');

  useEffect(() => {
    setIsVisible(true);
    setAnnounceMessage('Formulário de login carregado. Preencha seus dados para acessar o sistema.');
  }, []);

  useEffect(() => {
    const errorMessages = Object.values(validationErrors).filter(Boolean);
    if (errorMessages.length > 0) {
      setAnnounceMessage(`Erro de validação: ${errorMessages.join(', ')}`);
    }
  }, [validationErrors]);

  useEffect(() => {
    if (error) {
      setAnnounceMessage(`Erro de autenticação: ${error}`);
    }
  }, [error]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        email: initialData.email || '',
        password: initialData.password || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };

    setFormData(newFormData);

    // limpar erro de validação do campo quando usuário digita
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }

    if (onDataChange && typeof onDataChange === 'function') {
      onDataChange(newFormData);
    }
  };

  const handleFocus = (fieldName) => {
    setFieldFocus(prev => ({
      ...prev,
      [fieldName]: true
    }));
  };

  const handleBlur = (fieldName) => {
    setFieldFocus(prev => ({
      ...prev,
      [fieldName]: false
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // validar dados com Zod
      const validatedData = LoginSchema.parse(formData);

      // limpar erros de validação
      setValidationErrors({});

      // chamar função de submit
      await onSubmit(validatedData);
    } catch (err) {
      if (err.errors) {
        // erros de validação do Zod
        const errors = {};
        err.errors.forEach(error => {
          errors[error.path[0]] = error.message;
        });
        setValidationErrors(errors);
      }
    }
  };

  return (
    <>
      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announceMessage}
      </div>

      <Card
        className={`w-full max-w-2xl transform transition-all duration-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        shadow="md"
        padding="lg"
        role="main"
        aria-labelledby="login-title"
        aria-describedby="login-description"
      >
        <Card.Header className="transform transition-all duration-300 delay-100">
          <Card.Title
            id="login-title"
            className="text-2xl font-bold text-center text-gray-900 transition-colors duration-200"
          >
            <span aria-label="IFMeetup - Sistema de Gerenciamento de Salas">
              🏢 IFMeetup
            </span>
          </Card.Title>
          <p
            id="login-description"
            className="text-center text-gray-600 mt-2 transition-colors duration-200"
          >
            Entre com suas credenciais para acessar o sistema
          </p>
        </Card.Header>

        <Card.Content>
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            noValidate
            aria-label="Formulário de login"
          >
            {/* campo email */}
            <div className={`transform transition-all duration-300 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
              }`}>
              <label
                htmlFor="email"
                className={`block text-sm font-medium mb-1 transition-colors duration-200 ${fieldFocus.email ? 'text-green-700' : 'text-gray-700'
                  }`}
              >
                Email <span className="text-red-500" aria-label="obrigatório">*</span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu.email@ifpb.edu.br"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => handleFocus('email')}
                onBlur={() => handleBlur('email')}
                disabled={isLoading}
                error={validationErrors.email}
                autoComplete="email"
                autoFocus
                required
                aria-required="true"
                aria-invalid={validationErrors.email ? 'true' : 'false'}
                aria-describedby={validationErrors.email ? 'email-error' : 'email-help'}
                className={`transition-all duration-200 ${fieldFocus.email ? 'ring-2 ring-green-500 ring-opacity-50' : ''
                  } ${validationErrors.email ? 'animate-pulse' : ''}`}
              />
              <div id="email-help" className="sr-only">
                Digite seu endereço de email institucional para fazer login
              </div>
              {validationErrors.email && (
                <div className="animate-slide-down animate-shake" role="alert">
                  <p
                    id="email-error"
                    className="text-red-600 text-sm mt-1 transition-all duration-200"
                    aria-live="polite"
                  >
                    <span className="sr-only">Erro no campo email: </span>
                    {validationErrors.email}
                  </p>
                </div>
              )}
            </div>

            {/* campo senha */}
            <div className={`transform transition-all duration-300 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
              }`}>
              <label
                htmlFor="password"
                className={`block text-sm font-medium mb-1 transition-colors duration-200 ${fieldFocus.password ? 'text-green-700' : 'text-gray-700'
                  }`}
              >
                Senha <span className="text-red-500" aria-label="obrigatório">*</span>
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => handleFocus('password')}
                onBlur={() => handleBlur('password')}
                disabled={isLoading}
                error={validationErrors.password}
                autoComplete="current-password"
                required
                aria-required="true"
                aria-invalid={validationErrors.password ? 'true' : 'false'}
                aria-describedby={validationErrors.password ? 'password-error' : 'password-help'}
                className={`transition-all duration-200 ${fieldFocus.password ? 'ring-2 ring-green-500 ring-opacity-50' : ''
                  } ${validationErrors.password ? 'animate-pulse' : ''}`}
              />
              <div id="password-help" className="sr-only">
                Digite sua senha para fazer login no sistema
              </div>
              {validationErrors.password && (
                <div className="animate-slide-down animate-shake" role="alert">
                  <p
                    id="password-error"
                    className="text-red-600 text-sm mt-1 transition-all duration-200"
                    aria-live="polite"
                  >
                    <span className="sr-only">Erro no campo senha: </span>
                    {validationErrors.password}
                  </p>
                </div>
              )}
            </div>

            {/* erro de autenticação */}
            {error && (
              <div
                className="animate-slide-down animate-shake bg-red-50 border border-red-200 rounded-md p-3 transition-all duration-300"
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
              >
                <div className="flex items-center">
                  <span
                    className="text-red-600 text-sm animate-fade-in"
                    id="auth-error"
                  >
                    <span className="sr-only">Erro de autenticação: </span>
                     {error}
                  </span>
                </div>
              </div>
            )}

            {/* botão de submit */}
            <div className={`transform transition-all duration-300 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
              }`}>
              <Button
                type="submit"
                variant="primary"
                className={`w-full transition-all duration-200 transform ${isLoading
                    ? 'scale-95 opacity-90'
                    : 'hover:scale-105 hover:shadow-lg active:scale-95'
                  }`}
                disabled={isLoading}
                aria-describedby={error ? 'auth-error' : undefined}
                aria-label={isLoading ? 'Processando login, aguarde...' : 'Fazer login no sistema'}
              >
                <span className={`inline-flex items-center justify-center ${isLoading ? 'animate-pulse' : ''
                  }`}>
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2" aria-hidden="true">🔄</span>
                      <span>Entrando...</span>
                      <span className="sr-only">Processando seu login, por favor aguarde</span>
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">🔑</span> Entrar
                    </>
                  )}
                </span>
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </>
  );
};

export default LoginForm;
