import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import useAppStore from './stores/useAppStore';
import useAuthStore from './stores/useAuthStore';
import useSearchStore from './stores/useSearchStore';
import apiService from './services/api';
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

  const handleResultSelect = async (result) => {
    // Navigare automată în funcție de tipul rezultatului
    if (result.type === 'lead') {
      if (result.lat && result.lng) {
        // Lead cu coordonate - găsesc proprietatea asociată și o selectez
        setMapCenter({ lat: result.lat, lng: result.lng });
        setActiveView('map');
        
        // Găsesc proprietatea asociată cu lead-ul
        try {
          let propertyToSelect = null;
          
          // Dacă lead-ul are o proprietate specifică
          if (result.propertyId) {
            const propertyResponse = await apiService.getProperty(result.propertyId);
            if (propertyResponse.success && propertyResponse.data) {
              propertyToSelect = propertyResponse.data;
            }
          }
          // Dacă nu are proprietate specifică dar are proprietăți de interes
          else if (result.propertiesOfInterest && result.propertiesOfInterest.length > 0) {
            const propertyResponse = await apiService.getProperty(result.propertiesOfInterest[0]);
            if (propertyResponse.success && propertyResponse.data) {
              propertyToSelect = propertyResponse.data;
            }
          }
          
          // Dacă am găsit proprietatea, o selectez
          if (propertyToSelect) {
            selectProperty({
              ...propertyToSelect,
              position: propertyToSelect.coordinates || propertyToSelect.position,
              leadData: result // Păstrez informațiile lead-ului
            });
          } else {
            // Dacă nu am găsit proprietatea, creez un obiect temporar cu coordonatele
            selectProperty({
              id: `lead-${result.id}`,
              name: result.name || result.display,
              position: { lat: result.lat, lng: result.lng },
              type: 'lead',
              leadData: result
            });
          }
        } catch (error) {
          console.error('Error fetching property for lead:', error);
          // Fallback la obiect temporar
          selectProperty({
            id: `lead-${result.id}`,
            name: result.name || result.display,
            position: { lat: result.lat, lng: result.lng },
            type: 'lead',
            leadData: result
          });
        }
      } else {
        // Lead fără coordonate - merg la view-ul de leads
        setActiveView('leads');
      }
    } else if (result.type === 'property') {
      setActiveView('map');
      if (result.lat && result.lng) {
        // Proprietate cu coordonate - centrez harta și deschid drawer-ul
        setMapCenter({ lat: result.lat, lng: result.lng });
        selectProperty({
          ...result,
          position: { lat: result.lat, lng: result.lng }
        });
      }
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
