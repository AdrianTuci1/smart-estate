import { useState } from 'react';
import { Building2, User, Lock, Eye, EyeOff } from 'lucide-react';
import apiService from '../services/api';

const LoginForm = ({ onLogin, onShowCompanySetup }) => {
  const [formData, setFormData] = useState({
    companyAlias: '',
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!formData.companyAlias || !formData.username || !formData.password) {
        setError('Toate câmpurile sunt obligatorii');
        return;
      }

      // Call the real backend API
      const response = await apiService.login({
        companyAlias: formData.companyAlias,
        username: formData.username,
        password: formData.password
      });

      if (response.success && response.data) {
        const { token, user } = response.data;
        
        // Store authentication data
        localStorage.setItem('authToken', token);
        localStorage.setItem('companyAlias', user.companyAlias);
        localStorage.setItem('username', user.username);
        
        onLogin({
          token,
          companyAlias: user.companyAlias,
          username: user.username,
          role: user.role,
          id: user.id,
          companyId: user.companyId
        });
      } else {
        setError(response.error || 'Eroare la autentificare');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Eroare la autentificare. Vă rugăm să încercați din nou.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Smart Estate
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Conectați-vă la spațiul de lucru al companiei
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Company Alias */}
            <div>
              <label htmlFor="companyAlias" className="block text-sm font-medium text-gray-700 mb-2">
                Alias Companie
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="companyAlias"
                  name="companyAlias"
                  type="text"
                  required
                  className="input pl-10"
                  placeholder="ex: imobiliare-abc"
                  value={formData.companyAlias}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Nume utilizator
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="input pl-10"
                  placeholder="Numele de utilizator"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Parolă
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input pl-10 pr-10"
                  placeholder="Parola"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full h-12 text-base"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Se conectează...
                </div>
              ) : (
                'Conectare'
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-500">
          <button
            type="button"
            onClick={onShowCompanySetup}
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            Creează o companie nouă
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
