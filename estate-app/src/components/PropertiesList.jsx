import { useState, useMemo, useEffect } from 'react';
import { Building2, MapPin, Plus, Eye, FileText, Users, FileImage } from 'lucide-react';
import apiService from '../services/api';
import useAppStore from '../stores/useAppStore';
import { useAuth } from '../contexts/AuthContext';

const PropertiesList = ({ searchTerm = '' }) => {
  const { user } = useAuth();
  const { 
    selectProperty, 
    setDrawerOpen, 
    properties, 
    setProperties, 
    addProperty, 
    updateProperty, 
    removeProperty 
  } = useAppStore();
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load properties from API
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiService.getProperties();
        
        if (response.success && response.data) {
          setProperties(response.data);
        } else {
          setError('Nu s-au putut încărca proprietățile');
        }
      } catch (err) {
        console.error('Failed to load properties:', err);
        setError('Eroare la încărcarea proprietăților');
      } finally {
        setIsLoading(false);
      }
    };

    // Only load if we don't have properties already
    if (properties.length === 0) {
      loadProperties();
    } else {
      setIsLoading(false);
    }
  }, [properties.length, setProperties]);

  const filteredAndSortedProperties = useMemo(() => {
    let filtered = properties.filter(property =>
      property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [properties, searchTerm, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
    selectProperty(property);
  };

  const handleCreateProperty = () => {
    // Check if user can manage properties
    const canManageProperties = ['admin', 'Moderator', 'PowerUser'].includes(user?.role);
    if (!canManageProperties) {
      setError('Nu aveți permisiuni pentru a crea proprietăți. Contactați administratorul.');
      return;
    }
    setDrawerOpen(true);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <div className="w-4 h-4" />;
    }
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'în construcție':
        return 'bg-blue-100 text-blue-800';
      case 'finalizat':
        return 'bg-green-100 text-green-800';
      case 'planificat':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspendat':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Proprietăți</h1>
            <span className="bg-primary-100 text-primary-800 text-sm font-medium px-2 py-1 rounded-full">
              {filteredAndSortedProperties.length}
            </span>
          </div>
          {['admin', 'Moderator', 'PowerUser'].includes(user?.role) && (
            <button 
              onClick={handleCreateProperty}
              className="btn btn-primary flex items-center space-x-2 p-2"
            >
              <Plus className="h-4 w-4" />
              <span>Adaugă Proprietate</span>
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Se încarcă proprietățile...</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <div className="flex-1 overflow-auto">
          <div className="min-w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Nume</span>
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('address')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Adresă</span>
                      {getSortIcon('address')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acțiuni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedProperties.map((property) => (
                  <tr
                    key={property.id}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedProperty?.id === property.id ? 'bg-primary-50' : ''
                    }`}
                    onClick={() => handlePropertyClick(property)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {property.name}
                          </div>

                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                        {property.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="truncate max-w-xs">
                          {property.address}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePropertyClick(property);
                          }}
                          className="text-primary-600 hover:text-primary-900 p-1"
                          title="Vezi detalii"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAndSortedProperties.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nu s-au găsit proprietăți
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Încercați să modificați termenii de căutare' : 'Adăugați prima proprietate pentru a începe'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesList;
