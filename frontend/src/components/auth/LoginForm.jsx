import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, User, Shield, Building } from 'lucide-react';

const LoginForm = ({ onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', formData);
      const result = await login(formData);
      console.log('Login result:', result);
      
      if (result.success) {
        // Login successful, user will be redirected automatically
        console.log('Login successful:', result.user);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fillTestCredentials = (role) => {
    const credentials = {
      admin: { username: 'admin', password: 'admin123' },
      ps: { username: 'ps_panaji', password: 'ps123' },
      sdpo: { username: 'sdpo_north', password: 'sdpo123' }
    };
    
    const creds = credentials[role];
    if (creds) {
      setFormData(creds);
      setError('');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">FIRFlow</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        {/* Test Credentials Section */}
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">Quick Test Login:</p>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillTestCredentials('admin')}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Admin (admin/admin123)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillTestCredentials('ps')}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Building className="h-4 w-4" />
                Police Station (ps_panaji/ps123)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillTestCredentials('sdpo')}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                SDPO (sdpo_north/sdpo123)
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={onSwitchToRegister}
              disabled={loading}
            >
              Register here
            </Button>
          </p>
        </div>
      </div>
    </Card>
  );
};

export default LoginForm;
