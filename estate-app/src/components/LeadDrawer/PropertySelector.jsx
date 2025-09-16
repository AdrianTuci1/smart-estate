import { useState, useEffect } from 'react';
import { Search, Building, MapPin, ChevronDown } from 'lucide-react';
import apiService from '../../services/api';

const PropertySelector = ({ selectedProperty, onPropertySelect, isEditing }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);

  // Fetch properties from backend
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.getProperties({ limit: 100 });
        if (response.success) {
          setProperties(response.data);
        } else {
          setError('Eroare la încărcarea proprietăților');
        }
      } catch (err) {
        setError('Eroare la încărcarea proprietăților');
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Filter properties based on search term
  const filteredProperties = properties.filter(property =>
    property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePropertyClick = (property) => {
    onPropertySelect(property);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    onPropertySelect(null);
    setIsOpen(false);
  };

  if (!isEditing) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Proprietate</label>
        {selectedProperty ? (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Building className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{selectedProperty.name}</p>
              <p className="text-xs text-gray-500 flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {selectedProperty.address}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-sm">Nu a fost selectată o proprietate</p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">Proprietate</label>
      
      {/* Selected Property Display */}
      {selectedProperty ? (
        <div className="flex items-center space-x-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
          <Building className="h-5 w-5 text-primary-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-primary-900">{selectedProperty.name}</p>
            <p className="text-xs text-primary-600 flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {selectedProperty.address}
            </p>
          </div>
          <button
            onClick={handleClearSelection}
            className="text-primary-600 hover:text-primary-800 p-1"
            title="Șterge selecția"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-3 border border-gray-200 rounded-lg text-left flex items-center justify-between hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <span className="text-gray-500">Selectează o proprietate...</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Caută proprietăți..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
          </div>

          {/* Properties List */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
                Se încarcă proprietățile...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                {error}
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'Nu s-au găsit proprietăți' : 'Nu există proprietăți disponibile'}
              </div>
            ) : (
              filteredProperties.map((property) => (
                <button
                  key={property.id}
                  onClick={() => handlePropertyClick(property)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <Building className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {property.name}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{property.address}</span>
                      </p>
                      {property.status && (
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                          property.status === 'finalizat' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {property.status === 'finalizat' ? 'Finalizat' : 'În construcție'}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default PropertySelector;
