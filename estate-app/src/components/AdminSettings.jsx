import { useState, useEffect } from 'react';
import { Settings, Users, FileSpreadsheet } from 'lucide-react';
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

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          <p>Accesul este restricționat. Doar administratorii pot accesa setările.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'users', name: 'Gestionare Utilizatori', icon: Users },
    { id: 'google-sheets', name: 'Autorizare Google Sheets', icon: FileSpreadsheet }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3 mr-4">
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Setări Administrator</h1>
                <p className="text-gray-600 mt-1">
                  Gestionează utilizatorii și autorizările sistemului
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {activeTab === 'users' && (
            <div>
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Gestionare Utilizatori
                </h2>
                <p className="text-gray-600 mt-1">
                  Creează, editează și gestionează utilizatorii companiei cu roluri prestabilite
                </p>
              </div>
              <div className="p-6">
                <UserManagement />
              </div>
            </div>
          )}

          {activeTab === 'google-sheets' && (
            <div>
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FileSpreadsheet className="h-5 w-5 mr-2 text-blue-600" />
                  Autorizare Google Sheets
                </h2>
                <p className="text-gray-600 mt-1">
                  Configurează conectivitatea cu Google Sheets pentru import/export de date
                </p>
              </div>
              <div className="p-6">
                <GoogleSheetsAuth 
                  userRole={user?.role} 
                  onAuthComplete={() => {
                    // Refresh or handle auth completion if needed
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
