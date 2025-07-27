import React from 'react';


const AuthRightPanel = ({
  children,
  className = '',
  title,
  subtitle
}) => {
  return (
    <div className={`bg-white flex items-center justify-center min-h-full ${className}`}>
      <div className="w-full max-w-2xl mx-auto">
        {/* Container with responsive padding */}
        <div className="px-6 py-8 sm:px-8 lg:px-10">
          {/* Optional header section */}
          {(title || subtitle) && (
            <div className="text-center mb-8">
              {title && (
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Form content container */}
          <div className="space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthRightPanel