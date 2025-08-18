const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  success = false,
  className = '',
  onClick,
  type = 'button',
  as: Component = 'button',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 text-white hover-lift shadow-sm hover:shadow-md',
    secondary: 'bg-secondary-600 hover:bg-secondary-700 focus:ring-secondary-500 text-white hover-lift shadow-sm hover:shadow-md',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 focus:ring-primary-500 text-gray-700 hover-lift hover:border-primary-300',
    ghost: 'hover:bg-primary-50 focus:ring-primary-500 text-ifpb-primary hover:text-primary-700 transition-colors',
    danger: 'bg-danger-600 hover:bg-danger-700 focus:ring-danger-500 text-white hover-lift shadow-sm hover:shadow-md'
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg'
  };
  
  const stateClasses = success ? 'animate-success-bounce' : loading ? 'animate-pulse' : '';
  const buttonClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${stateClasses} ${className}`;
  
  return (
    <Component
      type={Component === 'button' ? type : undefined}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <div className="flex items-center">
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="animate-loading-dots">.</span>
          <span className="animate-loading-dots" style={{ animationDelay: '0.2s' }}>.</span>
          <span className="animate-loading-dots" style={{ animationDelay: '0.4s' }}>.</span>
        </div>
      )}
      {success && (
        <svg 
          className="animate-success-bounce -ml-1 mr-2 h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M5 13l4 4L19 7" 
          />
        </svg>
      )}
      {!loading && !success && children}
      {success && <span>Sucesso!</span>}
      {loading && <span>Carregando</span>}
    </Component>
  );
};

export default Button; 