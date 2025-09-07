
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import type { Session } from '@supabase/supabase-js';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for auth changes first to avoid race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setIsLoading(false);
      }
    );

    // Get initial session after setting up listener
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setIsLoading(false);
    };

    getSession();

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = () => {
    // This will be handled by the auth state change listener
    // No need to manually set state
  };

  const handleShowForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    if (showForgotPassword) {
      return <ForgotPassword onBack={handleBackToLogin} />;
    }
    return <Login onLogin={handleLogin} onForgotPassword={handleShowForgotPassword} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
