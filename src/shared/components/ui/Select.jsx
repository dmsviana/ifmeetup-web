const Select = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Selecione uma opção',
  error,
  disabled = false,
  required = false,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseClasses = 'block w-full px-3 py-2 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed bg-white';
  
  const stateClasses = error 
    ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' 
    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500';

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label 
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`${baseClasses} ${stateClasses}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p 
          id={`${selectId}-error`}
          className="text-sm text-danger-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default Select; 