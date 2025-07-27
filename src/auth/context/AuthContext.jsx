import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { AuthService } from '../services';

// estado inicial da autenticação
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  permissions: [],
  roles: []
};

// actions para o reducer
const authActions = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  RESTORE_SESSION: 'RESTORE_SESSION',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// reducer para gerenciar estado da autenticação
const authReducer = (state, action) => {
  switch (action.type) {
    case authActions.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case authActions.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        permissions: action.payload.permissions || [],
        roles: action.payload.roles || [],
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case authActions.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        permissions: [],
        roles: [],
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error
      };

    case authActions.LOGOUT:
      return {
        ...initialState,
        isLoading: false
      };

    case authActions.RESTORE_SESSION:
      return {
        ...state,
        user: action.payload.user,
        permissions: action.payload.permissions || [],
        roles: action.payload.roles || [],
        isAuthenticated: action.payload.isAuthenticated,
        isLoading: false
      };

    case authActions.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// criar contexto
const AuthContext = createContext(null);

// provider do contexto
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // restaurar sessão ao inicializar
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        if (user) {
          // extrair permissões e roles do token/usuário
          const permissions = user.permissions || [];
          const roles = user.roles || [];
          
          dispatch({
            type: authActions.RESTORE_SESSION,
            payload: {
              user,
              permissions,
              roles,
              isAuthenticated: true
            }
          });
        } else {
          dispatch({
            type: authActions.RESTORE_SESSION,
            payload: {
              user: null,
              permissions: [],
              roles: [],
              isAuthenticated: false
            }
          });
        }
      } catch (error) {
        dispatch({
          type: authActions.RESTORE_SESSION,
          payload: {
            user: null,
            permissions: [],
            roles: [],
            isAuthenticated: false
          }
        });
      }
    };

    restoreSession();
  }, []);

  // função de login tradicional
  const login = useCallback(async (credentials) => {
    dispatch({ type: authActions.LOGIN_START });

    try {
      const result = await AuthService.login(credentials);
      
      if (result.success) {
        const { user, permissions, roles } = result.data;
        
        dispatch({
          type: authActions.LOGIN_SUCCESS,
          payload: {
            user,
            permissions: permissions || [],
            roles: roles || []
          }
        });
        
        return { success: true };
      } else {
        dispatch({
          type: authActions.LOGIN_FAILURE,
          payload: { error: result.error.message }
        });
        
        return { success: false, error: result.error.message };
      }
    } catch (error) {
      const errorMessage = error.message || 'Erro desconhecido durante o login';
      
      dispatch({
        type: authActions.LOGIN_FAILURE,
        payload: { error: errorMessage }
      });
      
      return { success: false, error: errorMessage };
    }
  }, []);

  // função de login via SUAP
  const loginWithSuap = useCallback(async (credentials) => {
    dispatch({ type: authActions.LOGIN_START });

    try {
      const result = await AuthService.loginWithSuap(credentials);
      
      if (result.success) {
        const { user, permissions, roles } = result.data;
        
        dispatch({
          type: authActions.LOGIN_SUCCESS,
          payload: {
            user,
            permissions: permissions || [],
            roles: roles || []
          }
        });
        
        return { success: true };
      } else {
        dispatch({
          type: authActions.LOGIN_FAILURE,
          payload: { error: result.error.message }
        });
        
        return { success: false, error: result.error.message };
      }
    } catch (error) {
      const errorMessage = error.message || 'Erro desconhecido durante o login SUAP';
      
      dispatch({
        type: authActions.LOGIN_FAILURE,
        payload: { error: errorMessage }
      });
      
      return { success: false, error: errorMessage };
    }
  }, []);

  // função de logout
  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      // log do erro mas continua o logout local
      console.warn('Erro ao fazer logout no servidor:', error);
    }
    
    dispatch({ type: authActions.LOGOUT });
  }, []);

  // verificar se tem permissão específica
  const hasPermission = useCallback((permission) => {
    if (!state.isAuthenticated) return false;
    return state.permissions.includes(permission) || state.permissions.includes('ADMIN_ACCESS');
  }, [state.isAuthenticated, state.permissions]);

  // verificar se tem role específica
  const hasRole = useCallback((role) => {
    if (!state.isAuthenticated) return false;
    return state.roles.includes(role);
  }, [state.isAuthenticated, state.roles]);

  // limpar erro
  const clearError = useCallback(() => {
    dispatch({ type: authActions.CLEAR_ERROR });
  }, []);

  // valor do contexto
  const contextValue = {
    ...state,
    login,
    loginWithSuap,
    logout,
    hasPermission,
    hasRole,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// hook para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export default AuthContext; 