import { useState } from 'react';
import { Building2, User, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import apiService from '../services/api';

const CompanySetup = ({ onBack, onCompanyCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    alias: '',
    adminUsername: '',
    adminPassword: '',
    confirmPassword: '',
    secret: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Numele companiei este obligatoriu');
      return false;
    }
    if (!formData.alias.trim()) {
      setError('Alias-ul companiei este obligatoriu');
      return false;
    }
    if (formData.alias.length < 2 || formData.alias.length > 20) {
      setError('Alias-ul trebuie să aibă între 2 și 20 de caractere');
      return false;
    }
    if (!/^[a-zA-Z0-9]+$/.test(formData.alias)) {
      setError('Alias-ul poate conține doar litere și cifre');
      return false;
    }
    if (!formData.adminUsername.trim()) {
      setError('Numele utilizatorului administrator este obligatoriu');
      return false;
    }
    if (formData.adminUsername.length < 3 || formData.adminUsername.length > 50) {
      setError('Numele utilizatorului trebuie să aibă între 3 și 50 de caractere');
      return false;
    }
    if (!formData.adminPassword) {
      setError('Parola este obligatorie');
      return false;
    }
    if (formData.adminPassword.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere');
      return false;
    }
    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Parolele nu se potrivesc');
      return false;
    }
    if (!formData.secret.trim()) {
      setError('Secretul pentru crearea companiei este obligatoriu');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.createCompany({
        name: formData.name.trim(),
        alias: formData.alias.trim().toLowerCase(),
        adminUsername: formData.adminUsername.trim(),
        adminPassword: formData.adminPassword,
        secret: formData.secret.trim()
      });

      if (response.success && response.data) {
        const { token, company, adminUser } = response.data;
        
        // Store authentication data
        localStorage.setItem('authToken', token);
        localStorage.setItem('companyAlias', company.alias);
        localStorage.setItem('username', adminUser.username);
        
        setSuccess(true);
        
        // Call the callback after a short delay to show success message
        setTimeout(() => {
          onCompanyCreated({
            token,
            companyAlias: company.alias,
            username: adminUser.username,
            user: adminUser,
            company: company
          });
        }, 2000);
      } else {
        setError(response.error || 'Eroare la crearea companiei');
      }
    } catch (err) {
      console.error('Company creation error:', err);
      setError(err.message || 'Eroare la crearea companiei. Vă rugăm să încercați din nou.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Compania a fost creată cu succes!
            </h2>
            <p className="text-gray-600">
              Vă conectăm automat cu contul de administrator...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Creează Companie Nouă
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Configurează compania ta și contul de administrator
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Company Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nume Companie
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="input pl-10"
                  placeholder="ex: Imobiliare ABC SRL"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Company Alias */}
            <div>
              <label htmlFor="alias" className="block text-sm font-medium text-gray-700 mb-2">
                Alias Companie
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="alias"
                  name="alias"
                  type="text"
                  required
                  className="input pl-10"
                  placeholder="ex: imobiliare-abc"
                  value={formData.alias}
                  onChange={handleChange}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Doar litere și cifre, va fi folosit pentru login
              </p>
            </div>

            {/* Company Creation Secret */}
            <div>
              <label htmlFor="secret" className="block text-sm font-medium text-gray-700 mb-2">
                Secret pentru Crearea Companiei
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="secret"
                  name="secret"
                  type="password"
                  required
                  className="input pl-10"
                  placeholder="Secretul pentru crearea companiei"
                  value={formData.secret}
                  onChange={handleChange}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Secretul necesar pentru crearea unei companii noi
              </p>
            </div>

            {/* Admin Username */}
            <div>
              <label htmlFor="adminUsername" className="block text-sm font-medium text-gray-700 mb-2">
                Nume Utilizator Administrator
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="adminUsername"
                  name="adminUsername"
                  type="text"
                  required
                  className="input pl-10"
                  placeholder="ex: admin"
                  value={formData.adminUsername}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Admin Password */}
            <div>
              <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Parolă Administrator
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="adminPassword"
                  name="adminPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input pl-10 pr-10"
                  placeholder="Parola pentru administrator"
                  value={formData.adminPassword}
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmă Parola
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="input pl-10 pr-10"
                  placeholder="Confirmă parola"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
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

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full h-12 text-base"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Se creează compania...
                </div>
              ) : (
                'Creează Compania'
              )}
            </button>
            
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="btn btn-secondary w-full h-12 text-base flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Înapoi la Login
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-500">
          <p>După crearea companiei, vei fi conectat automat ca administrator</p>
          <p className="mt-1">Poți crea alte conturi din interfața aplicației</p>
        </div>
      </div>
    </div>
  );
};

export default CompanySetup;
