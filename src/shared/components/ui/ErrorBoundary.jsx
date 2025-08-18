import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import Button from './Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // atualizar state para mostrar a UI de fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // gerar ID único para o erro
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // log do erro para monitoramento
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    
    // reportar erro se necessário
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }

    // reportar para serviço de monitoramento se configurado
    if (window.errorReporting) {
      window.errorReporting.captureException(error, {
        extra: errorInfo,
        tags: {
          component: this.props.componentName || 'unknown',
          errorId
        }
      });
    }
  }

  handleRetry = () => {
    // resetar estado do erro
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });

    // chamar callback de retry se fornecido
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleRefreshPage = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    if (this.props.onGoHome) {
      this.props.onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    const bugReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // copiar para clipboard
    navigator.clipboard.writeText(JSON.stringify(bugReport, null, 2)).then(() => {
      alert('Informações do erro copiadas para a área de transferência. Cole essas informações ao reportar o bug.');
    });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, showDetails = false, componentName } = this.props;
      const { error, errorInfo, errorId } = this.state;

      // se um componente de fallback customizado foi fornecido, usar ele
      if (Fallback) {
        return (
          <Fallback
            error={error}
            errorInfo={errorInfo}
            errorId={errorId}
            onRetry={this.handleRetry}
            onRefreshPage={this.handleRefreshPage}
            onGoHome={this.handleGoHome}
          />
        );
      }

      // fallback padrão
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-red-50 border-2 border-red-200 border-dashed rounded-lg p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Algo deu errado
            </h2>
            
            <p className="text-gray-600 mb-6">
              {componentName 
                ? `Ocorreu um erro no componente ${componentName}. Tente recarregar ou volte ao início.`
                : 'Ocorreu um erro inesperado. Tente recarregar a página ou volte ao início.'
              }
            </p>

            {errorId && (
              <div className="bg-gray-100 rounded p-2 mb-4 text-xs text-gray-600">
                ID do erro: <code className="font-mono">{errorId}</code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleRetry}
                className="flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleRefreshPage}
                className="flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar página
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleGoHome}
                className="flex items-center"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir ao início
              </Button>
            </div>

            {showDetails && error && (
              <details className="text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
                  Detalhes técnicos
                </summary>
                <div className="bg-gray-100 rounded p-3 text-xs font-mono text-gray-700 overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>Erro:</strong> {error.message}
                  </div>
                  {error.stack && (
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{error.stack}</pre>
                    </div>
                  )}
                  {errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={this.handleReportBug}
                  className="mt-2 text-xs"
                >
                  <Bug className="w-3 h-3 mr-1" />
                  Copiar detalhes do erro
                </Button>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC para facilitar o uso do ErrorBoundary
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook para reportar erros manualmente
export const useErrorReporting = () => {
  const reportError = (error, context = {}) => {
    const errorId = `MAN_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
    
    console.error('Erro reportado manualmente:', error, context);
    
    if (window.errorReporting) {
      window.errorReporting.captureException(error, {
        extra: context,
        tags: {
          type: 'manual',
          errorId
        }
      });
    }

    return errorId;
  };

  return { reportError };
};

export default ErrorBoundary;