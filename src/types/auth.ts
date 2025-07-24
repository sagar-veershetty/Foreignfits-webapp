export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'warehouse';
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'sales' | 'warehouse';
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}