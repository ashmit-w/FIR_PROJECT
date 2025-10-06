import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Shield, Home, BarChart3 } from 'lucide-react';

const Header = ({ onNavigate, showReportsLink = false }) => {
  const { user, logout } = useAuth();

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'ps':
        return 'Police Station';
      case 'sdpo':
        return 'Sub-Divisional Police Officer';
      default:
        return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500';
      case 'ps':
        return 'bg-blue-500';
      case 'sdpo':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <header className="bg-card border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">FIRMMS</h1>
            </div>
            
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate?.('dashboard')}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
              {showReportsLink && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate?.('reports')}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Reports
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Card className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{user?.username}</span>
                </div>
                <Badge className={`${getRoleColor(user?.role)} text-white`}>
                  {getRoleDisplayName(user?.role)}
                </Badge>
                {user?.police_station && (
                  <span className="text-sm text-muted-foreground">
                    Station: {user.police_station}
                  </span>
                )}
                {user?.subdivision_stations && user.subdivision_stations.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Stations: {user.subdivision_stations.join(', ')}
                  </span>
                )}
              </div>
            </Card>

            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
