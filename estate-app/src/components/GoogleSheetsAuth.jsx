import { useState, useEffect } from 'react';
import { Shield, ExternalLink, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import apiService from '../services/api';

const GoogleSheetsAuth = ({ userRole, onAuthComplete }) => {
  const [authStatus, setAuthStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
    
    // Check for auth callback parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth_success');
    const authError = urlParams.get('auth_error');
    const view = urlParams.get('view');
    
    console.log('🔍 URL params:', { authSuccess, authError, view, search: window.location.search });
    
    if (authSuccess === 'true') {
      console.log('✅ Auth success detected, refreshing status...');
      // Remove URL parameters and refresh auth status
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        checkAuthStatus();
        setIsAuthorizing(false);
      }, 1000);
    } else if (authError) {
      console.log('❌ Auth error detected:', authError);
      // Remove URL parameters and show error
      window.history.replaceState({}, document.title, window.location.pathname);
      setError(decodeURIComponent(authError));
      setIsAuthorizing(false);
    }
    
    // If view parameter is set to settings, trigger parent to switch view
    if (view === 'settings' && onAuthComplete) {
      console.log('🔄 Switching to settings view');
      onAuthComplete();
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Checking auth status...');
      const response = await apiService.getCompanyGoogleSheetsAuthStatus();
      console.log('📊 Auth status response:', response);
      
      if (response.success) {
        setAuthStatus(response.data);
        console.log('✅ Auth status set:', response.data);
      } else {
        setError('Eroare la verificarea statusului autorizării');
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      setError('Eroare la verificarea statusului autorizării');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthorize = async () => {
    try {
      setIsAuthorizing(true);
      setError(null);
      
      const response = await apiService.getCompanyGoogleSheetsAuthUrl();
      if (response.success && response.data.authUrl) {
        // Redirect directly to Google OAuth (more reliable than popup)
        window.location.href = response.data.authUrl;
      } else {
        throw new Error('Nu s-a putut genera URL-ul de autorizare');
      }
    } catch (error) {
      console.error('Error initiating authorization:', error);
      setError(error.message || 'Eroare la inițierea autorizării');
      setIsAuthorizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Se verifică statusul autorizării...</span>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <Shield className="h-6 w-6 text-gray-400" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Autorizare Google Sheets
            </h3>
            <p className="text-sm text-gray-500">
              Doar administratorii companiei pot autoriza Google Sheets
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Rolul curent: {userRole || 'nedefinit'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {authStatus?.isAuthorized ? (
            <CheckCircle className="h-8 w-8 text-green-600" />
          ) : (
            <AlertCircle className="h-8 w-8 text-orange-500" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900">
            Autorizare Google Sheets
          </h3>
          
          {authStatus?.isAuthorized ? (
            <div className="mt-2">
              <p className="text-sm text-green-600 font-medium">
                ✅ Google Sheets este autorizat pentru compania ta
              </p>
              <div className="mt-3 text-sm text-gray-500">
                <p><strong>Autorizat de:</strong> {authStatus.authorizedBy}</p>
                <p><strong>Data autorizării:</strong> {new Date(authStatus.authorizedAt).toLocaleDateString('ro-RO')}</p>
                {authStatus.lastUpdated && (
                  <p><strong>Ultima actualizare:</strong> {new Date(authStatus.lastUpdated).toLocaleDateString('ro-RO')}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-sm text-orange-600">
                ⚠️ Google Sheets nu este autorizat pentru compania ta
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Pentru a folosi Google Sheets, trebuie să autorizezi accesul la contul Google al companiei.
              </p>
              
              <div className="mt-4">
                <button
                  onClick={handleAuthorize}
                  disabled={isAuthorizing}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAuthorizing ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      Se deschide autorizarea...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Autorizează Google Sheets
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Eroare
                  </h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-800">
              Ce înseamnă autorizarea Google Sheets?
            </h4>
            <ul className="mt-2 text-sm text-blue-700 space-y-1">
              <li>• Toate fișierele Excel vor fi convertite automat la Google Sheets</li>
              <li>• Toți utilizatorii companiei vor avea acces la funcționalitatea Google Sheets</li>
              <li>• Documentele pot fi editate colaborativ în timp real</li>
              <li>• Se păstrează istoricul complet al modificărilor</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsAuth;
