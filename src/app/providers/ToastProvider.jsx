import React, { createContext, useContext } from 'react';
import { useToast } from '../../shared/hooks';
import { ToastContainer } from '../../shared/components/ui';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const toastMethods = useToast();

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <ToastContainer 
        toasts={toastMethods.toasts} 
        onRemove={toastMethods.removeToast} 
      />
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;