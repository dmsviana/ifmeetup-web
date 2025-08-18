const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseClasses = 'block w-full px-3 py-2 border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400';
  
  const stateClasses = error 
    ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500 hover:border-danger-400' 
    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 hover:border-primary-400';

  return (
    <div className="space-y-1">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        className={`${baseClasses} ${stateClasses} ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      
      {error && (
        <p 
          id={`${inputId}-error`}
          className="text-sm text-danger-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default Input; 