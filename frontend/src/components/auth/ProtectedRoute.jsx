import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requiredRoles = null }) => {
  const { user, loading, isAuthenticated, hasAnyRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return null; // Will redirect to login via AuthProvider
  }

  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Required roles: {requiredRoles.join(', ')}
          </p>
          <p className="text-sm text-muted-foreground">
            Your role: {user?.role}
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
