import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Upload, FileText, FileImage, Building2, Home, Euro, Square } from 'lucide-react';
import apiService from '../../services/api';

const PropertyApartments = ({ selectedProperty, isEditing, isCreating }) => {
  const [apartments, setApartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    apartmentNumber: '',
    rooms: '',
    area: '',
    price: ''
  });

  // Load apartments when component mounts or property changes
  useEffect(() => {
    if (selectedProperty?.id) {
      loadApartments();
    } else {
      setApartments([]);
    }
  }, [selectedProperty?.id]);

  const loadApartments = async () => {
    if (!selectedProperty?.id) return;
    
    setIsLoading(true);
    try {
      const response = await apiService.getApartments({ propertyId: selectedProperty.id });
      if (response.success) {
        setApartments(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load apartments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!selectedProperty?.id) return;

    const apartmentData = {
      propertyId: selectedProperty.id,
      apartmentNumber: formData.apartmentNumber,
      rooms: formData.rooms ? parseInt(formData.rooms) : null,
      area: formData.area ? parseFloat(formData.area) : null,
      price: formData.price ? parseFloat(formData.price) : null
    };

    try {
      let response;
      if (editingId) {
        response = await apiService.updateApartment(editingId, apartmentData);
      } else {
        response = await apiService.createApartment(apartmentData);
      }

      if (response.success) {
        await loadApartments(); // Reload apartments
        handleCancel(); // Reset form
      } else {
        alert('Eroare la salvarea apartamentului: ' + response.error);
      }
    } catch (error) {
      console.error('Error saving apartment:', error);
      alert('Eroare la salvarea apartamentului. Vă rugăm să încercați din nou.');
    }
  };

  const handleEdit = (apartment) => {
    setEditingId(apartment.id);
    setFormData({
      apartmentNumber: apartment.apartmentNumber || '',
      rooms: apartment.rooms || '',
      area: apartment.area || '',
      price: apartment.price || ''
    });
    setIsAdding(true);
  };

  const handleDelete = async (apartmentId) => {
    if (!confirm('Sigur doriți să ștergeți acest apartament?')) return;

    try {
      const response = await apiService.deleteApartment(apartmentId);
      if (response.success) {
        await loadApartments(); // Reload apartments
      } else {
        alert('Eroare la ștergerea apartamentului: ' + response.error);
      }
    } catch (error) {
      console.error('Error deleting apartment:', error);
      alert('Eroare la ștergerea apartamentului. Vă rugăm să încercați din nou.');
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      apartmentNumber: '',
      rooms: '',
      area: '',
      price: ''
    });
  };

  const handleImageUpload = async (event, apartmentId) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('apartmentId', apartmentId);

    try {
      const response = await apiService.uploadApartmentImage(formData);
      if (response.success) {
        await loadApartments(); // Reload apartments
      } else {
        alert('Eroare la încărcarea imaginii: ' + response.error);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Eroare la încărcarea imaginii. Vă rugăm să încercați din nou.');
    }
  };

  const handleDocumentUpload = async (event, apartmentId) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('apartmentId', apartmentId);

    try {
      const response = await apiService.uploadApartmentDocument(formData);
      if (response.success) {
        await loadApartments(); // Reload apartments
        // Show extracted data if available
        if (response.data.extractedData) {
          console.log('Extracted data:', response.data.extractedData);
        }
      } else {
        alert('Eroare la încărcarea documentului: ' + response.error);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Eroare la încărcarea documentului. Vă rugăm să încercați din nou.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Se încarcă apartamentele...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Building2 className="h-5 w-5 text-gray-400" />
          <h3 className="font-medium text-gray-900">
            Apartamente ({apartments.length})
          </h3>
        </div>
        
        {(isEditing || isCreating) && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Adaugă apartament</span>
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">
            {editingId ? 'Editează apartament' : 'Apartament nou'}
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numărul apartamentului *
              </label>
              <input
                type="text"
                value={formData.apartmentNumber}
                onChange={(e) => handleInputChange('apartmentNumber', e.target.value)}
                placeholder="Ex: A12, B5, C301"
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Camere
              </label>
              <input
                type="number"
                value={formData.rooms}
                onChange={(e) => handleInputChange('rooms', e.target.value)}
                placeholder="Ex: 3"
                min="1"
                max="10"
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suprafață (mp)
              </label>
              <input
                type="number"
                value={formData.area}
                onChange={(e) => handleInputChange('area', e.target.value)}
                placeholder="Ex: 75"
                min="0"
                step="0.1"
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preț (€)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="Ex: 150000"
                min="0"
                step="100"
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-4">
            <button
              onClick={handleSave}
              disabled={!formData.apartmentNumber.trim()}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                !formData.apartmentNumber.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {editingId ? 'Salvează' : 'Adaugă'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Anulează
            </button>
          </div>
        </div>
      )}

      {/* Apartments List */}
      {apartments.length > 0 ? (
        <div className="space-y-4">
          {apartments.map((apartment) => (
            <div key={apartment.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">
                      Apartament {apartment.apartmentNumber}
                    </h4>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {apartment.rooms && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Home className="h-4 w-4" />
                        <span>{apartment.rooms} camere</span>
                      </div>
                    )}
                    
                    {apartment.area && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Square className="h-4 w-4" />
                        <span>{apartment.area} mp</span>
                      </div>
                    )}
                    
                    {apartment.price && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Euro className="h-4 w-4" />
                        <span>{apartment.price.toLocaleString()} €</span>
                      </div>
                    )}
                  </div>

                  {/* Images and Documents */}
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {apartment.images?.length || 0} imagini
                      </span>
                      {(isEditing || isCreating) && (
                        <label className="text-xs text-primary-600 hover:text-primary-800 cursor-pointer">
                          <Upload className="h-3 w-3 inline mr-1" />
                          Încarcă imagine
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, apartment.id)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {apartment.documents?.length || 0} documente
                      </span>
                      {(isEditing || isCreating) && (
                        <label className="text-xs text-primary-600 hover:text-primary-800 cursor-pointer">
                          <Upload className="h-3 w-3 inline mr-1" />
                          Încarcă document
                          <input
                            type="file"
                            accept=".pdf,.docx,.doc,.txt"
                            onChange={(e) => handleDocumentUpload(e, apartment.id)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {(isEditing || isCreating) && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(apartment)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Editează apartament"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(apartment.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Șterge apartament"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p>Nu există apartamente încărcate</p>
          {(isEditing || isCreating) && (
            <p className="text-xs text-gray-400 mt-2">
              Adăugați primul apartament pentru a începe
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyApartments;
