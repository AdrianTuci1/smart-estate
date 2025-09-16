import { useState, useEffect } from 'react';
import { X, Save, Edit3, FileText, Users, FileImage, Building2 } from 'lucide-react';
import useAppStore from '../../stores/useAppStore';
import apiService from '../../services/api';
import PropertyDescription from './PropertyDescription';
import PropertyLeads from './PropertyLeads';
import PropertyFiles from './PropertyFiles';
import PropertyApartments from './PropertyApartments';

const PropertyDrawer = () => {
  const { selectedProperty, isDrawerOpen, closeDrawer } = useAppStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    status: 'în construcție',
    image: '',
    description: '',
    lat: '',
    lng: ''
  });
  const [galleryImages, setGalleryImages] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Check if we're in create mode (selectedProperty is null but drawer is open)
  useEffect(() => {
    if (isDrawerOpen) {
      // Reset to initial state when drawer opens
      setActiveTab('description');
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
          lng: ''
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
          image: selectedProperty.image || '',
          description: selectedProperty.description || '',
          lat: selectedProperty.position?.lat || '',
          lng: selectedProperty.position?.lng || ''
        });
        // Set gallery images based on actual property data
        if (selectedProperty.image) {
          setGalleryImages([selectedProperty.image]);
        } else {
          setGalleryImages([]);
        }
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
          position: {
            lat: parseFloat(formData.lat),
            lng: parseFloat(formData.lng)
          }
        };
        
        console.log('Creating new property:', propertyData);
        const response = await apiService.createProperty(propertyData);
        
        if (response.success) {
          console.log('Property created successfully:', response.data);
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
          position: {
            lat: parseFloat(formData.lat),
            lng: parseFloat(formData.lng)
          }
        };
        
        console.log('Updating property:', propertyData);
        const response = await apiService.updateProperty(selectedProperty.id, propertyData);
        
        if (response.success) {
          console.log('Property updated successfully:', response.data);
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
        lng: selectedProperty.position?.lng || ''
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
    setActiveTab('description');
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

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white/95 backdrop-blur-sm shadow-drawer transform transition-all duration-300 ease-in-out translate-x-0">
      <div className="flex flex-col h-full">
        {/* Header with Close and Edit buttons */}
        <div className={`flex items-center p-4 border-b border-gray-200 ${
          isEditing || isCreating 
            ? 'justify-end space-x-2' 
            : 'justify-between'
        }`}>
          {isEditing || isCreating ? (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-lg transition-colors ${
                isSaving 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              <Save className="h-4 w-4" />
              <span>
                {isSaving 
                  ? (isCreating ? 'Se creează...' : 'Se salvează...') 
                  : (isCreating ? 'Creează' : 'Salvează')
                }
              </span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              <span>Editează</span>
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'description' && (
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
            />
          )}

          {activeTab === 'leads' && (
            <PropertyLeads selectedProperty={selectedProperty} />
          )}

          {activeTab === 'files' && (
            <PropertyFiles 
              selectedProperty={selectedProperty}
              isEditing={isEditing}
              isCreating={isCreating}
            />
          )}

          {activeTab === 'apartments' && (
            <PropertyApartments 
              selectedProperty={selectedProperty}
              isEditing={isEditing}
              isCreating={isCreating}
            />
          )}
        </div>

        {/* Tabs at bottom */}
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => setActiveTab('description')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'description'
                ? 'text-primary-600 border-t-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="h-4 w-4" />
          </button>
          <button
            onClick={() => setActiveTab('apartments')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'apartments'
                ? 'text-primary-600 border-t-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Building2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'leads'
                ? 'text-primary-600 border-t-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="h-4 w-4" />
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'files'
                ? 'text-primary-600 border-t-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileImage className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyDrawer;
