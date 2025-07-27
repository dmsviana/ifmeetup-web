import { useState, useEffect } from 'react';
import { Input, Button, Card } from '../../components/ui';
import { SuapLoginSchema } from '../../schemas';
import { SuapStatusIndicator } from '../../components/auth';

const SuapLoginForm = ({ onSubmit, isLoading, error, initialData, onDataChange }) => {
  const [formData, setFormData] = useState({
    username: initialData?.username || '',
    password: initialData?.password || ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [suapStatus, setSuapStatus] = useState('available');

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username || '',
        password: initialData.password || ''
      });
    }
  }, [initialData]);


  const formatMatricula = (value) => {
    return value.replace(/\D/g, '');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    if (name === 'username') {
      processedValue = formatMatricula(value);
      if (processedValue.length > 15) {
        processedValue = processedValue.slice(0, 15);
      }
    }
    
    const newFormData = {
      ...formData,
      [name]: processedValue
    };
    
    setFormData(newFormData);
    
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const validatedData = SuapLoginSchema.parse(formData);
      
      setValidationErrors({});
      
      await onSubmit(validatedData);
    } catch (err) {
      if (err.errors) {
        const errors = {};
        err.errors.forEach(error => {
          errors[error.path[0]] = error.message;
        });
        setValidationErrors(errors);
      }
    }
  };

  const getSuapErrorInfo = (error) => {
    const defaultError = {
      message: 'Ocorreu um erro inesperado. Tente novamente.',
      suggestion: 'Se o problema persistir, tente usar o login tradicional ou entre em contato com o suporte.',
      showFallback: true
    };

    if (error && typeof error === 'object') {
      if (error.type === 'suap_error' && error.errorCode) {
        return getSuapErrorByCode(error.errorCode);
      }
      
      if (error.message) {
        return {
          message: error.message,
          suggestion: error.suggestion || defaultError.suggestion,
          showFallback: error.showFallback !== false
        };
      }
    }

    if (typeof error === 'string') {
      const errorCodes = [
        'SUAP_INVALID_CREDENTIALS',
        'SUAP_USER_NOT_FOUND', 
        'SUAP_TIMEOUT',
        'SUAP_TEMPORARILY_UNAVAILABLE',
        'SUAP_CONNECTION_ERROR'
      ];

      for (const code of errorCodes) {
        if (error.includes(code)) {
          return getSuapErrorByCode(code);
        }
      }

      if (error.toLowerCase().includes('network') || error.toLowerCase().includes('conexão')) {
        return {
          message: 'Erro de conexão. Verifique sua internet e tente novamente.',
          suggestion: 'Verifique sua conexão com a internet. Se o problema persistir, tente o login tradicional.',
          showFallback: true
        };
      }

      if (error.toLowerCase().includes('timeout') || error.toLowerCase().includes('tempo')) {
        return {
          message: 'O sistema está demorando para responder.',
          suggestion: 'Aguarde alguns minutos e tente novamente. Se necessário, use o login tradicional.',
          showFallback: true
        };
      }

      return {
        message: error,
        suggestion: defaultError.suggestion,
        showFallback: true
      };
    }

    return defaultError;
  };

  // Obter informações de erro por código específico do SUAP
  const getSuapErrorByCode = (errorCode) => {
    const suapErrors = {
      'SUAP_INVALID_CREDENTIALS': {
        message: 'Matrícula ou senha incorreta.',
        suggestion: 'Verifique se sua matrícula e senha estão corretas. Use as mesmas credenciais do portal do aluno/servidor.',
        showFallback: false
      },
      'SUAP_USER_NOT_FOUND': {
        message: 'Usuário não encontrado no SUAP.',
        suggestion: 'Confirme se sua matrícula está digitada corretamente (apenas números, sem pontos ou traços).',
        showFallback: false
      },
      'SUAP_TIMEOUT': {
        message: 'O SUAP está demorando para responder.',
        suggestion: 'O sistema do SUAP pode estar sobrecarregado. Aguarde alguns minutos e tente novamente.',
        showFallback: true
      },
      'SUAP_TEMPORARILY_UNAVAILABLE': {
        message: 'O SUAP está temporariamente indisponível.',
        suggestion: 'O sistema do SUAP está em manutenção ou fora do ar. Tente novamente mais tarde.',
        showFallback: true
      },
      'SUAP_CONNECTION_ERROR': {
        message: 'Erro de conexão com o SUAP.',
        suggestion: 'Verifique sua conexão com a internet. O problema pode ser temporário.',
        showFallback: true
      }
    };

    return suapErrors[errorCode] || {
      message: 'Erro desconhecido no SUAP.',
      suggestion: 'Tente novamente. Se o problema persistir, entre em contato com o suporte.',
      showFallback: true
    };
  };

  return (
    <Card className="w-full max-w-2xl" shadow="md" padding="lg">
      <Card.Header>
        <Card.Title className="text-2xl font-bold text-center text-gray-900">
          🎓 Login SUAP
        </Card.Title>
        <p className="text-center text-gray-600 mt-2">
          Entre com suas credenciais do SUAP
        </p>
      </Card.Header>

      <Card.Content>
                
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo matrícula */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Matrícula
            </label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Digite sua matrícula (apenas números)"
              value={formData.username}
              onChange={handleChange}
              disabled={isLoading}
              error={validationErrors.username}
              autoComplete="username"
              autoFocus
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={15}
              className={validationErrors.username ? 'animate-shake' : ''}
            />
          </div>

          {/* Campo senha */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha SUAP
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              error={validationErrors.password}
              autoComplete="current-password"
              className={validationErrors.password ? 'animate-shake' : ''}
            />
          </div>

          {/* Erro de autenticação */}
          {error && (() => {
            const errorInfo = getSuapErrorInfo(error);
            return (
              <div className="animate-slide-down animate-shake bg-red-50 border border-red-200 rounded-md p-3 transition-all duration-300">
                <div className="flex items-center">
                  <span className="text-red-600 text-sm flex-shrink-0 mr-2 animate-fade-in">❌</span>
                  <div className="text-red-600 text-sm">
                    <p className="font-medium">Erro no login SUAP</p>
                    <p>{errorInfo.message}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Botão de submit */}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading || suapStatus === 'unavailable'}
          >
            {isLoading ? '🔄 Conectando ao SUAP...' : 
             suapStatus === 'unavailable' ? '❌ SUAP Indisponível' :
             suapStatus === 'degraded' ? '⚠️ Entrar com SUAP (Lento)' :
             '🎓 Entrar com SUAP'}
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
};

export default SuapLoginForm;
