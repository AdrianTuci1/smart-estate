import { useState, useEffect, useRef } from 'react';
import { Upload, X, Download, Eye, Trash2, Image as ImageIcon, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import apiService from '../services/api';

const PropertyGallery = ({ selectedProperty, onPropertyUpdate, onGalleryOpen }) => {
  const [gallery, setGallery] = useState({ images: [], totalImages: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fileInputRef = useRef(null);

  // Load gallery data
  useEffect(() => {
    if (selectedProperty?.id) {
      loadGallery();
    }
  }, [selectedProperty?.id]);

  const loadGallery = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getPropertyGallery(selectedProperty.id);
      
      if (response.success) {
        setGallery(response.data);
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length || !selectedProperty?.id) return;

    setIsUploading(true);
    try {
      const response = await apiService.uploadPropertyGalleryImages(selectedProperty.id, files);
      
      if (response.success) {
        // Reload gallery to show new images
        await loadGallery();
        
        // Notify parent component of property update
        if (onPropertyUpdate) {
          onPropertyUpdate(response.data);
        }
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Eroare la încărcarea imaginilor: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDelete = async (imageUrl) => {
    if (!selectedProperty?.id) return;

    if (confirm('Sigur doriți să ștergeți această imagine?')) {
      try {
        setIsLoading(true);
        const response = await apiService.removePropertyImage(selectedProperty.id, imageUrl);
        
        if (response.success) {
          // Reload gallery
          await loadGallery();
          
          // Notify parent component
          if (onPropertyUpdate) {
            onPropertyUpdate(response.data);
          }
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        alert('Eroare la ștergerea imaginii: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleImageSelect = (imageId) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedImages.length) return;

    if (confirm(`Sigur doriți să ștergeți ${selectedImages.length} imagini selectate?`)) {
      try {
        setIsLoading(true);
        
        // Delete each selected image
        for (const imageId of selectedImages) {
          const image = gallery.images.find(img => img.id === imageId);
          if (image) {
            await apiService.removePropertyImage(selectedProperty.id, image.url);
          }
        }
        
        // Reload gallery
        await loadGallery();
        setSelectedImages([]);
        
      } catch (error) {
        console.error('Error deleting images:', error);
        alert('Eroare la ștergerea imaginilor: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };


  // Carousel navigation functions
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % gallery.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + gallery.images.length) % gallery.images.length);
  };



  if (!selectedProperty) {
    return (
      <div className="p-6 text-center text-gray-500">
        <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p>Selectați o proprietate pentru a vedea galeria</p>
      </div>
    );
  }

  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-gray-900">
            Galerie ({gallery.totalImages} imagini)
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedImages.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>Șterge ({selectedImages.length})</span>
            </button>
          )}
          
          <label className="flex items-center space-x-1 px-3 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
            <Upload className="h-4 w-4" />
            <span>{isUploading ? 'Se încarcă...' : 'Adaugă imagini'}</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Main Carousel */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : gallery.images.length > 0 ? (
        <div className="space-y-4">
          {/* Main Image Display */}
          <div className="relative">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={gallery.images[currentImageIndex]?.url}
                alt={gallery.images[currentImageIndex]?.alt}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Navigation arrows */}
            {gallery.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-700" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                >
                  <ChevronRight className="h-5 w-5 text-gray-700" />
                </button>
              </>
            )}
            
            {/* Image counter */}
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {gallery.images.length}
            </div>
          </div>
          
          
          {/* Image Actions */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => onGalleryOpen && onGalleryOpen(gallery.images)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Deschide complet</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">Nu există imagini în galerie</p>
          <p className="text-sm text-gray-400 mb-4">
            Adăugați imagini pentru a crea o galerie pentru această proprietate
          </p>
          <label className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
            <Upload className="h-4 w-4" />
            <span>Adaugă prima imagine</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>
      )}


    </div>
  );
};

export default PropertyGallery;
