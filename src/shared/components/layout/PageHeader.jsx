import React from 'react';
import { Button } from '../ui';

/**
 * Componente de cabeçalho de página reutilizável
 * Inclui título, subtítulo e botões de ação
 */
const PageHeader = ({ 
  title, 
  subtitle, 
  actions = [], 
  className = '' 
}) => {
  return (
    <div className={`bg-white border-b border-gray-200 px-4 py-6 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 sm:text-base">
                {subtitle}
              </p>
            )}
          </div>
          
          {actions.length > 0 && (
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'primary'}
                  size={action.size || 'md'}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={action.className}
                >
                  {action.icon && (
                    <span className="mr-2">
                      {action.icon}
                    </span>
                  )}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;