
import { useState, useEffect } from 'react';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = localStorage.getItem('site_authenticated') === 'true';
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
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

  if (!isAuthenticated) {
    if (showForgotPassword) {
      return <ForgotPassword onBack={handleBackToLogin} />;
    }
    return <Login onLogin={handleLogin} onForgotPassword={handleShowForgotPassword} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
