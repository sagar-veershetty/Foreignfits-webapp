import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AuthUser, LoginCredentials, SignupData, AuthState } from '../types/auth';
import { apiClient } from '../services/api';
import { convertApiUserToUser } from '../utils/apiConverters';

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: AuthUser }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'SIGNUP_START' }
  | { type: 'SIGNUP_SUCCESS'; payload: AuthUser }
  | { type: 'SIGNUP_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOAD_USER'; payload: AuthUser };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};


const AuthContext = createContext<{
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
} | null>(null);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
    case 'SIGNUP_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
    case 'SIGNUP_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
    case 'SIGNUP_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'LOAD_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('foreignfits_user');
   const savedToken = localStorage.getItem('foreignfits_token');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
       // Only load user if we also have a valid token
       if (savedToken) {
         dispatch({ type: 'LOAD_USER', payload: user });
       } else {
         // Clean up invalid session
         localStorage.removeItem('foreignfits_user');
       }
      } catch (error) {
        localStorage.removeItem('foreignfits_user');
       localStorage.removeItem('foreignfits_token');
      }
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await apiClient.login(credentials.email, credentials.password);
      const authUser = convertApiUserToUser(response.user);
      
      localStorage.setItem('foreignfits_token', response.token);
      localStorage.setItem('foreignfits_user', JSON.stringify(authUser));
      dispatch({ type: 'LOGIN_SUCCESS', payload: authUser });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error instanceof Error ? error.message : 'Login failed' });
    }
  };

  const signup = async (data: SignupData): Promise<void> => {
    dispatch({ type: 'SIGNUP_START' });

    // Validate password confirmation
    if (data.password !== data.confirmPassword) {
      dispatch({ type: 'SIGNUP_FAILURE', payload: 'Passwords do not match' });
      return;
    }

    try {
      const response = await apiClient.register(data.name, data.email, data.password, data.role.toUpperCase());
      const authUser = convertApiUserToUser(response.user);
      
      localStorage.setItem('foreignfits_user', JSON.stringify(authUser));
      dispatch({ type: 'SIGNUP_SUCCESS', payload: authUser });
    } catch (error) {
      dispatch({ type: 'SIGNUP_FAILURE', payload: error instanceof Error ? error.message : 'Registration failed' });
    }
  };

  const logout = () => {
    localStorage.removeItem('foreignfits_token');
    localStorage.removeItem('foreignfits_user');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider value={{ state, login, signup, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}