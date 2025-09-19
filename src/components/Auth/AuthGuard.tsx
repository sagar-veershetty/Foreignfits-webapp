import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { LoginPage } from './LoginPage';
import { SignupPage } from './SignupPage';
import { Loader } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { state } = useAuth();
 const { loadInitialData } = useApp();
  const [showSignup, setShowSignup] = useState(false);

  // Load data when user is authenticated
  React.useEffect(() => {
    if (state.isAuthenticated) {
     loadInitialData().catch(console.error);
    }
 }, [state.isAuthenticated, loadInitialData]);

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return showSignup ? (
      <SignupPage onSwitchToLogin={() => setShowSignup(false)} />
    ) : (
      <LoginPage onSwitchToSignup={() => setShowSignup(true)} />
    );
  }

  return <>{children}</>;
}