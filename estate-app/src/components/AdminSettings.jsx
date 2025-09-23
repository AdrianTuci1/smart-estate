import { useState, useEffect } from 'react';
import { Settings, Users, FileSpreadsheet, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserManagement from './UserManagement';
import GoogleSheetsAuth from './GoogleSheetsAuth';

const AdminSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  
  useEffect(() => {
    // Check if we should switch to google-sheets tab after auth
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view');
    const authSuccess = urlParams.get('auth_success');
    
    if (view === 'settings' && authSuccess === 'true') {
      setActiveTab('google-sheets');
    }
  }, []);

  if (user?.role !== 'admin' && user?.role !== 'Moderator') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="bg-destructive/10 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Acces Restricționat</h2>
            <p className="text-muted-foreground text-sm">
              Doar administratorii și moderatorii pot accesa această pagină.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { 
      id: 'users', 
      name: 'Utilizatori', 
      icon: Users,
      description: 'Gestionează utilizatorii și rolurile'
    },
    { 
      id: 'google-sheets', 
      name: 'Google Sheets', 
      icon: FileSpreadsheet,
      description: 'Configurează integrarea cu Google Sheets'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-lg p-2">
                <Settings className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">
                  {user?.role === 'admin' ? 'Setări Administrator' : 'Setări Moderator'}
                </h1>
                <p className="text-muted-foreground">
                  Gestionează utilizatorii și integrarea sistemului
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-card rounded-lg border">
          {activeTab === 'users' && (
            <div>
              <div className="border-b p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary rounded-lg p-2">
                    <Users className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Gestionare Utilizatori</h2>
                    <p className="text-muted-foreground text-sm">
                      Creează, editează și gestionează utilizatorii companiei
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <UserManagement />
              </div>
            </div>
          )}

          {activeTab === 'google-sheets' && (
            <div>
              <div className="border-b p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary rounded-lg p-2">
                    <FileSpreadsheet className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Integrare Google Sheets</h2>
                    <p className="text-muted-foreground text-sm">
                      Configurează conectivitatea cu Google Sheets
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <GoogleSheetsAuth 
                  userRole={user?.role} 
                  onAuthComplete={() => {
                    console.log('Google Sheets authorization completed');
                    setActiveTab('google-sheets');
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
