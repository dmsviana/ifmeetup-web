const PageContainer = ({ 
  children, 
  title, 
  subtitle, 
  actions,
  className = '',
  maxWidth = 'max-w-7xl' 
}) => {
  return (
    <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
      {/* cabeçalho da página */}
      {(title || subtitle || actions) && (
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              {title && (
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-base text-gray-600 max-w-2xl">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex flex-col sm:flex-row gap-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* conteúdo da página */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

export default PageContainer; 