import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoginCredentials } from '../../types/auth';
import { Package, Eye, EyeOff, Loader, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onSwitchToSignup: () => void;
}

export function LoginPage({ onSwitchToSignup }: LoginPageProps) {
  const { state, login, clearError } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  // Clear error when user starts typing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, email: e.target.value });
    if (state.error) {
      clearError();
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, password: e.target.value });
    if (state.error) {
      clearError();
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError(); // Clear any existing errors before attempting login
    await login(credentials);
  };

  const handleDemoLogin = (role: 'admin' | 'sales' | 'warehouse') => {
    const demoCredentials = {
      admin: { email: 'admin@foreignfits.com', password: 'admin123' },
      sales: { email: 'sales@foreignfits.com', password: 'sales123' },
      warehouse: { email: 'warehouse@foreignfits.com', password: 'warehouse123' },
    };
    setCredentials(demoCredentials[role]);
    // Clear any existing errors when using demo login
    if (state.error) {
      clearError();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Package className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Foreign Fits</h1>
          <p className="text-gray-600">Global Fashion Inventory Management</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          {state.error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700 font-medium">Login Failed</span>
              </div>
              <p className="text-red-600 text-sm">{state.error}</p>
              <div className="mt-3 text-xs text-red-500">
                <p>Please check your credentials and try again.</p>
                <p className="mt-1">Demo accounts: Use the buttons below for quick access.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={credentials.email}
                onChange={handleEmailChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  state.error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.password}
                  onChange={handlePasswordChange}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    state.error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={state.isLoading}
              className={`w-full py-2 px-4 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                state.error 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {state.isLoading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>{state.error ? 'Try Again' : 'Sign In'}</span>
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 text-center">Demo Accounts:</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleDemoLogin('admin')}
                className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-xs font-medium"
              >
                Admin
              </button>
              <button
                onClick={() => handleDemoLogin('sales')}
                className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-xs font-medium"
              >
                Sales
              </button>
              <button
                onClick={() => handleDemoLogin('warehouse')}
                className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-xs font-medium"
              >
                Warehouse
              </button>
            </div>
          </div>

          {/* Switch to Signup */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignup}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign up
              </button>
            </p>
          </div>

          {/* Customer Shopping Link */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">Looking to shop our collection?</p>
              <a
                href="?mode=customer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                <span>🛍️</span>
                <span>Visit Customer Store</span>
              </a>
              <p className="text-xs text-gray-500 mt-2">
                Browse and shop our global fashion collection
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}