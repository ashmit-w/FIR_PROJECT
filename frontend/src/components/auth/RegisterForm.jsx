import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';

const RegisterForm = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'ps',
    police_station: '',
    subdivision_stations: [''],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();

  const policeStations = ['Panaji', 'Mapusa', 'Calangute', 'Margao', 'Vasco', 'Ponda'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error when user types
  };

  const handleRoleChange = (role) => {
    setFormData({
      ...formData,
      role,
      police_station: role === 'ps' ? formData.police_station : '',
      subdivision_stations: role === 'sdpo' ? formData.subdivision_stations : [''],
    });
    setError('');
  };

  const handleSubdivisionChange = (index, value) => {
    const newStations = [...formData.subdivision_stations];
    newStations[index] = value;
    setFormData({
      ...formData,
      subdivision_stations: newStations,
    });
  };

  const addSubdivisionStation = () => {
    setFormData({
      ...formData,
      subdivision_stations: [...formData.subdivision_stations, ''],
    });
  };

  const removeSubdivisionStation = (index) => {
    if (formData.subdivision_stations.length > 1) {
      const newStations = formData.subdivision_stations.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        subdivision_stations: newStations,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (formData.role === 'ps' && !formData.police_station) {
      setError('Police station is required for PS role');
      setLoading(false);
      return;
    }

    if (formData.role === 'sdpo') {
      const validStations = formData.subdivision_stations.filter(station => station.trim() !== '');
      if (validStations.length === 0) {
        setError('At least one subdivision station is required for SDPO role');
        setLoading(false);
        return;
      }
    }

    try {
      const submitData = {
        username: formData.username,
        password: formData.password,
        role: formData.role,
        ...(formData.role === 'ps' && { police_station: formData.police_station }),
        ...(formData.role === 'sdpo' && { 
          subdivision_stations: formData.subdivision_stations.filter(station => station.trim() !== '')
        }),
      };

      const result = await register(submitData);
      
      if (result.success) {
        // Registration successful, user will be redirected automatically
        console.log('Registration successful:', result.user);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">FIR Management System</h1>
          <p className="text-muted-foreground mt-2">Create your account</p>
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={handleRoleChange} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="ps">Police Station (PS)</SelectItem>
                <SelectItem value="sdpo">Sub-Divisional Police Officer (SDPO)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role === 'ps' && (
            <div className="space-y-2">
              <Label htmlFor="police_station">Police Station</Label>
              <Select 
                value={formData.police_station} 
                onValueChange={(value) => setFormData({...formData, police_station: value})}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select police station" />
                </SelectTrigger>
                <SelectContent>
                  {policeStations.map((station) => (
                    <SelectItem key={station} value={station}>
                      {station}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.role === 'sdpo' && (
            <div className="space-y-2">
              <Label>Subdivision Stations</Label>
              {formData.subdivision_stations.map((station, index) => (
                <div key={index} className="flex gap-2">
                  <Select 
                    value={station} 
                    onValueChange={(value) => handleSubdivisionChange(index, value)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select station" />
                    </SelectTrigger>
                    <SelectContent>
                      {policeStations.map((stationOption) => (
                        <SelectItem key={stationOption} value={stationOption}>
                          {stationOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.subdivision_stations.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSubdivisionStation(index)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSubdivisionStation}
                disabled={loading}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Station
              </Button>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Sign in here
            </Button>
          </p>
        </div>
      </div>
    </Card>
  );
};

export default RegisterForm;
