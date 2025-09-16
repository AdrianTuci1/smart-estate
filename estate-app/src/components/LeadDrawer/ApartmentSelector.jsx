import { useState, useEffect } from 'react';
import { Search, Home, ChevronDown, Euro } from 'lucide-react';
import apiService from '../../services/api';

const ApartmentSelector = ({ 
  selectedProperty, 
  selectedApartment, 
  onApartmentSelect, 
  isEditing 
}) => {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);

  // Fetch apartments when property is selected
  useEffect(() => {
    if (!selectedProperty?.id) {
      setApartments([]);
      return;
    }

    const fetchApartments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.getApartments({ 
          propertyId: selectedProperty.id,
          limit: 100 
        });
        if (response.success) {
          setApartments(response.data);
        } else {
          setError('Eroare la încărcarea apartamentelor');
        }
      } catch (err) {
        setError('Eroare la încărcarea apartamentelor');
        console.error('Error fetching apartments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApartments();
  }, [selectedProperty?.id]);

  // Filter apartments based on search term
  const filteredApartments = apartments.filter(apartment =>
    apartment.apartmentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apartment.rooms?.toString().includes(searchTerm) ||
    apartment.area?.toString().includes(searchTerm)
  );

  const handleApartmentClick = (apartment) => {
    onApartmentSelect(apartment);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    onApartmentSelect(null);
    setIsOpen(false);
  };

  const formatPrice = (price) => {
    if (!price) return '';
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  if (!isEditing) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Apartament</label>
        {selectedApartment ? (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Home className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Apartament {selectedApartment.apartmentNumber}
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                {selectedApartment.rooms && (
                  <span>{selectedApartment.rooms} camere</span>
                )}
                {selectedApartment.area && (
                  <span>{selectedApartment.area} m²</span>
                )}
                {selectedApartment.price && (
                  <span className="flex items-center">
                    <Euro className="h-3 w-3 mr-1" />
                    {formatPrice(selectedApartment.price)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-sm">Nu a fost selectat un apartament</p>
        )}
      </div>
    );
  }

  if (!selectedProperty) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Apartament</label>
        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-500">Selectează mai întâi o proprietate</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">Apartament</label>
      
      {/* Selected Apartment Display */}
      {selectedApartment ? (
        <div className="flex items-center space-x-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
          <Home className="h-5 w-5 text-primary-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-primary-900">
              Apartament {selectedApartment.apartmentNumber}
            </p>
            <div className="flex items-center space-x-4 text-xs text-primary-600 mt-1">
              {selectedApartment.rooms && (
                <span>{selectedApartment.rooms} camere</span>
              )}
              {selectedApartment.area && (
                <span>{selectedApartment.area} m²</span>
              )}
              {selectedApartment.price && (
                <span className="flex items-center">
                  <Euro className="h-3 w-3 mr-1" />
                  {formatPrice(selectedApartment.price)}
                </span>
              )}
            </div>
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
          <span className="text-gray-500">Selectează un apartament...</span>
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
                placeholder="Caută apartamente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
          </div>

          {/* Apartments List */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
                Se încarcă apartamentele...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                {error}
              </div>
            ) : filteredApartments.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'Nu s-au găsit apartamente' : 'Nu există apartamente disponibile pentru această proprietate'}
              </div>
            ) : (
              filteredApartments.map((apartment) => (
                <button
                  key={apartment.id}
                  onClick={() => handleApartmentClick(apartment)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <Home className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Apartament {apartment.apartmentNumber}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        {apartment.rooms && (
                          <span>{apartment.rooms} camere</span>
                        )}
                        {apartment.area && (
                          <span>{apartment.area} m²</span>
                        )}
                        {apartment.price && (
                          <span className="flex items-center">
                            <Euro className="h-3 w-3 mr-1" />
                            {formatPrice(apartment.price)}
                          </span>
                        )}
                      </div>
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

export default ApartmentSelector;
