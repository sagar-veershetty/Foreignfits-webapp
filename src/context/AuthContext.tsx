import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AuthUser, LoginCredentials, SignupData, AuthState } from '../types/auth';

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

// Mock users database
const mockUsers: (AuthUser & { password: string })[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@foreignfits.com',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
  },
  {
    id: '2',
    name: 'Sales Representative',
    email: 'sales@foreignfits.com',
    password: 'sales123',
    role: 'sales',
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date(),
  },
  {
    id: '3',
    name: 'Warehouse Manager',
    email: 'warehouse@foreignfits.com',
    password: 'warehouse123',
    role: 'warehouse',
    createdAt: new Date('2024-01-20'),
    lastLogin: new Date(),
  },
];

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
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({ type: 'LOAD_USER', payload: user });
      } catch (error) {
        localStorage.removeItem('foreignfits_user');
      }
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = mockUsers.find(
      u => u.email === credentials.email && u.password === credentials.password
    );

    if (user) {
      const authUser: AuthUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLogin: new Date(),
      };

      localStorage.setItem('foreignfits_user', JSON.stringify(authUser));
      dispatch({ type: 'LOGIN_SUCCESS', payload: authUser });
    } else {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid email or password' });
    }
  };

  const signup = async (data: SignupData): Promise<void> => {
    dispatch({ type: 'SIGNUP_START' });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === data.email);
    if (existingUser) {
      dispatch({ type: 'SIGNUP_FAILURE', payload: 'User with this email already exists' });
      return;
    }

    // Validate password confirmation
    if (data.password !== data.confirmPassword) {
      dispatch({ type: 'SIGNUP_FAILURE', payload: 'Passwords do not match' });
      return;
    }

    // Create new user
    const newUser: AuthUser = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      email: data.email,
      role: data.role,
      createdAt: new Date(),
      lastLogin: new Date(),
    };

    // Add to mock database
    mockUsers.push({ ...newUser, password: data.password });

    localStorage.setItem('foreignfits_user', JSON.stringify(newUser));
    dispatch({ type: 'SIGNUP_SUCCESS', payload: newUser });
  };

  const logout = () => {
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