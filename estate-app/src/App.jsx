import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import useAppStore from './stores/useAppStore';
import useSearchStore from './stores/useSearchStore';
import LoginForm from './components/LoginForm';
import CompanySetup from './components/CompanySetup';
import UserManagement from './components/UserManagement';
import NavigationDock from './components/NavigationDock';
import PropertyMap from './components/PropertyMap';
import PropertyDrawer from './components/PropertyDrawer';
import PropertiesList from './components/PropertiesList';

const AppContent = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const { 
    activeView, 
    setActiveView, 
    selectProperty, 
    setMapCenter
  } = useAppStore();
  const { searchQuery } = useSearchStore();
  const [showCompanySetup, setShowCompanySetup] = useState(false);

  const handleLogin = (userData) => {
    login(userData);
    setShowCompanySetup(false);
  };

  const handleCompanyCreated = (userData) => {
    login(userData);
    setShowCompanySetup(false);
  };

  const handleBackToLogin = () => {
    setShowCompanySetup(false);
  };


  const handleSearch = (query) => {
    console.log('Căutare proprietăți:', query);
    // Search is handled by the PropertiesList component through searchTerm prop
  };

  const handleResultSelect = async (result) => {
    // Navigare automată în funcție de tipul rezultatului
    if (result.type === 'property') {
      if (result.lat && result.lng) {
        // Proprietate cu coordonate - centrez harta
        setMapCenter({ lat: result.lat, lng: result.lng });
        
        // Deschid drawer-ul doar dacă suntem pe view-ul de hartă
        if (activeView === 'map') {
          selectProperty({
            ...result,
            position: { lat: result.lat, lng: result.lng }
          });
        }
      }
    }
  };

  const handleCitySelect = (city) => {
    console.log('Oraș selectat:', city);
    // Aici ar putea fi logica pentru a centra harta pe oraș
  };

  const handlePropertySelect = (property) => {
    // Implementare pentru afișarea detaliilor proprietății
    console.log('Proprietate selectată:', property);
  };

  if (!isAuthenticated) {
    if (showCompanySetup) {
      return <CompanySetup onBack={handleBackToLogin} onCompanyCreated={handleCompanyCreated} />;
    }
    return <LoginForm onLogin={handleLogin} onShowCompanySetup={() => setShowCompanySetup(true)} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {activeView === 'map' ? (
          <PropertyMap />
        ) : activeView === 'users' ? (
          <UserManagement />
        ) : (
          <PropertiesList 
            onPropertySelect={handlePropertySelect} 
            searchTerm={searchQuery}
          />
        )}

        {/* Property Drawer */}
        <PropertyDrawer />
      </main>

      {/* Navigation Dock */}
      <NavigationDock
        onSearch={handleSearch}
        onResultSelect={handleResultSelect}
        onCitySelect={handleCitySelect}
        user={user}
        onLogout={logout}
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
