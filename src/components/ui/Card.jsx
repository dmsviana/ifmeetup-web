const Card = ({ 
  children, 
  className = '',
  padding = 'md',
  shadow = 'sm',
  ...props 
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-10'
  };

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-xl shadow-gray-200/50 border border-gray-100',
    lg: 'shadow-2xl shadow-gray-300/30 border border-gray-50'
  };

  return (
    <div 
      className={`bg-white rounded-lg ${paddings[padding]} ${shadows[shadow]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-gray-200 ${className}`}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card; 