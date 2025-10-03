import { useState, useEffect } from 'react';
import { X, Save, Edit3, Trash2 } from 'lucide-react';
import useAppStore from '../../stores/useAppStore';
import useFileViewerStore from '../../stores/useFileViewerStore';
import apiService from '../../services/api';
import PropertyDescription from './PropertyDescription';

const PropertyDrawer = () => {
  const { selectedProperty, isDrawerOpen, closeDrawer, addProperty, updateProperty, removeProperty } = useAppStore();
  const { openFileViewer, openGalleryViewer } = useFileViewerStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    status: 'în construcție',
    image: '',
    description: '',
    lat: '',
    lng: '',
    apartmentTypes: []
  });
  const [galleryImages, setGalleryImages] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Check if we're in create mode (selectedProperty is null but drawer is open)
  useEffect(() => {
    if (isDrawerOpen) {
      // Reset to initial state when drawer opens
      setCurrentImageIndex(0);
      
      if (!selectedProperty) {
        setIsCreating(true);
        setIsEditing(true);
        setFormData({
          name: '',
          address: '',
          status: 'în construcție',
          image: '',
          description: '',
          lat: '',
          lng: '',
          apartmentTypes: []
        });
        setGalleryImages([]);
      } else {
        // Check if this is a new property created from map pin placement
        if (selectedProperty.id === null && selectedProperty.position) {
          setIsCreating(true);
          setIsEditing(true);
        } else {
          setIsCreating(false);
          setIsEditing(false);
        }

        setFormData({
          name: selectedProperty.name || '',
          address: selectedProperty.address || '',
          status: selectedProperty.status || 'în construcție',
          image: selectedProperty.mainImage || '',
          description: selectedProperty.description || '',
          lat: selectedProperty.position?.lat || '',
          lng: selectedProperty.position?.lng || '',
          apartmentTypes: selectedProperty.apartmentTypes || []
        });
        // Set gallery images based on actual property images array
        setGalleryImages(selectedProperty.images || []);
      }
    }
  }, [isDrawerOpen, selectedProperty]);

  if (!isDrawerOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      if (isCreating) {
        // Create new property
        const propertyData = {
          name: formData.name,
          address: formData.address,
          status: formData.status,
          description: formData.description,
          image: formData.image,
          apartmentTypes: formData.apartmentTypes,
          position: {
            lat: parseFloat(formData.lat),
            lng: parseFloat(formData.lng)
          }
        };
        
        const response = await apiService.createProperty(propertyData);
        
        if (response.success) {
          console.log('Property created successfully:', response.data);
          // Add the new property to the store
          addProperty(response.data);
          // Close drawer and reset form
          setIsEditing(false);
          closeDrawer();
        } else {
          console.error('Failed to create property:', response.error);
          alert('Eroare la crearea proprietății: ' + response.error);
        }
      } else {
        // Update existing property
        const propertyData = {
          name: formData.name,
          address: formData.address,
          status: formData.status,
          description: formData.description,
          image: formData.image,
          apartmentTypes: formData.apartmentTypes,
          position: {
            lat: parseFloat(formData.lat),
            lng: parseFloat(formData.lng)
          }
        };
        
        const response = await apiService.updateProperty(selectedProperty.id, propertyData);
        
        if (response.success) {
          console.log('Property updated successfully:', response.data);
          // Update the property in the store
          updateProperty(selectedProperty.id, response.data);
          setIsEditing(false);
        } else {
          console.error('Failed to update property:', response.error);
          alert('Eroare la actualizarea proprietății: ' + response.error);
        }
      }
    } catch (error) {
      console.error('Error saving property:', error);
      alert('Eroare la salvarea proprietății. Vă rugăm să încercați din nou.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isCreating) {
      closeDrawer();
    } else {
      setIsEditing(false);
      // Reset form data to original values
      setFormData({
        name: selectedProperty.name || '',
        address: selectedProperty.address || '',
        status: selectedProperty.status || 'în construcție',
        image: selectedProperty.image || '',
        description: selectedProperty.description || '',
        lat: selectedProperty.position?.lat || '',
        lng: selectedProperty.position?.lng || '',
        apartmentTypes: selectedProperty.apartmentTypes || []
      });
    }
  };

  const handleClose = () => {
    if (isEditing || isCreating) {
      handleCancel();
    } else {
      closeDrawer();
    }
    // Reset to initial state
    setCurrentImageIndex(0);
  };

  const handleImageUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files);
    const imageFiles = uploadedFiles.filter(file => file.type.startsWith('image/'));
    
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setGalleryImages(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDelete = async () => {
    if (!selectedProperty || !selectedProperty.id) return;
    
    const confirmed = window.confirm('Sigur doriți să ștergeți această proprietate? Această acțiune nu poate fi anulată.');
    if (!confirmed) return;
    
    try {
      const response = await apiService.deleteProperty(selectedProperty.id);
      if (response.success) {
        console.log('Property deleted successfully');
        // Remove the property from the store
        removeProperty(selectedProperty.id);
        closeDrawer();
      } else {
        console.error('Failed to delete property:', response.error);
        alert('Eroare la ștergerea proprietății: ' + response.error);
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Eroare la ștergerea proprietății. Vă rugăm să încercați din nou.');
    }
  };

  return (
    <div className="absolute inset-y-0 right-0 z-50 w-full md:w-96 bg-white backdrop-blur-sm shadow-drawer transform transition-all duration-300 ease-in-out translate-x-0">
      <div className="flex flex-col h-full">
        {/* Header with Close, Edit and Delete buttons */}
        <div className={`flex items-center p-3 md:p-4 border-b border-gray-200 ${
          isEditing || isCreating 
            ? 'justify-end space-x-2' 
            : 'justify-between'
        }`}>
          {isEditing || isCreating ? (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center space-x-1 px-2 md:px-3 py-1 text-xs md:text-sm rounded-lg transition-colors ${
                isSaving 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Save className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">
                {isSaving 
                  ? (isCreating ? 'Se creează...' : 'Se salvează...') 
                  : (isCreating ? 'Creează' : 'Salvează')
                }
              </span>
              <span className="sm:hidden">
                {isSaving ? '...' : '✓'}
              </span>
            </button>
          ) : (
            <div className="flex items-center space-x-1 md:space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-1 px-2 md:px-3 py-1 text-xs md:text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit3 className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Editează</span>
              </button>
              {selectedProperty && selectedProperty.id && (
                <button
                  onClick={handleDelete}
                  className="flex items-center space-x-1 px-2 md:px-3 py-1 text-xs md:text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Șterge</span>
                </button>
              )}
            </div>
          )}
          <button
            onClick={handleClose}
            className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <PropertyDescription
            formData={formData}
            setFormData={setFormData}
            isEditing={isEditing}
            isCreating={isCreating}
            handleInputChange={handleInputChange}
            galleryImages={galleryImages}
            setGalleryImages={setGalleryImages}
            currentImageIndex={currentImageIndex}
            setCurrentImageIndex={setCurrentImageIndex}
            handleImageUpload={handleImageUpload}
            selectedProperty={selectedProperty}
            onFileClick={openFileViewer}
            onGalleryOpen={openGalleryViewer}
          />
        </div>
      </div>

    </div>
  );
};

export default PropertyDrawer;
