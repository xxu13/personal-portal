import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { Spin } from 'antd';

import { useAuthStore } from '../stores/authStore';

interface PrivateRouteProps {
  requireAdmin?: boolean;
}

/**
 * Route guard for authenticated routes.
 * Redirects to login if not authenticated.
 * Optionally requires admin role.
 */
const PrivateRoute = ({ requireAdmin = false }: PrivateRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, user, isLoading } = useAuthStore();
  
  // Show loading while checking auth
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
      }}>
        <Spin size="large" />
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  }
  
  // Check admin requirement
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <Outlet />;
};

export default PrivateRoute;
