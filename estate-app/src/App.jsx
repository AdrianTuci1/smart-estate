import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import useAppStore from './stores/useAppStore';
import useAuthStore from './stores/useAuthStore';
import useSearchStore from './stores/useSearchStore';
import LoginForm from './components/LoginForm';
import CompanySetup from './components/CompanySetup';
import UserManagement from './components/UserManagement';
import NavigationDock from './components/NavigationDock';
import PropertyMap from './components/PropertyMap';
import PropertyDrawer from './components/PropertyDrawer';
import LeadDrawer from './components/LeadDrawer';
import LeadsTable from './components/LeadsTable';

const AppContent = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const { 
    activeView, 
    setActiveView, 
    selectedProperty, 
    isDrawerOpen, 
    selectProperty, 
    closeDrawer 
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
    // Implementare căutare cu sintaxa @pers/@loc
    if (query.startsWith('@pers')) {
      const searchTerm = query.replace('@pers', '').trim();
      console.log('Căutare persoane:', searchTerm);
      // Dacă suntem pe view-ul de leads, căutarea se va face automat prin searchQuery
    } else if (query.startsWith('@loc')) {
      const searchTerm = query.replace('@loc', '').trim();
      console.log('Căutare locații:', searchTerm);
    } else {
      console.log('Căutare generală:', query);
      // Pentru căutare generală, dacă suntem pe leads, căutăm în lead-uri
    }
  };

  const handleResultSelect = (result) => {
    console.log('Rezultat selectat:', result);
    
    // Navigare automată în funcție de tipul rezultatului
    if (result.type === 'lead') {
      setActiveView('leads');
      // Aici ar putea fi logica pentru a evidenția lead-ul selectat
    } else if (result.type === 'property') {
      setActiveView('map');
      // Aici ar putea fi logica pentru a centra harta pe proprietate
    }
  };

  const handleCitySelect = (city) => {
    console.log('Oraș selectat:', city);
    setActiveView('map');
    // Aici ar putea fi logica pentru a centra harta pe oraș
  };

  const handleLeadSelect = (lead) => {
    // Implementare pentru afișarea detaliilor lead-ului
    console.log('Lead selectat:', lead);
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
          <LeadsTable 
            onLeadSelect={handleLeadSelect} 
            searchTerm={searchQuery.startsWith('@pers') ? searchQuery.replace('@pers', '').trim() : searchQuery}
          />
        )}

        {/* Property Drawer */}
        <PropertyDrawer />
        
        {/* Lead Drawer */}
        <LeadDrawer />
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
