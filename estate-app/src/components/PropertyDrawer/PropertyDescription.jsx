import { MapPin, Home, Construction, ChevronLeft, ChevronRight, FileImage, Upload, Folder, File, Download, Trash2, ExternalLink, ChevronRight as ChevronRightIcon, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiService from '../../services/api';

const PropertyDescription = ({ 
  formData, 
  setFormData, 
  isEditing, 
  isCreating, 
  handleInputChange, 
  galleryImages, 
  setGalleryImages, 
  currentImageIndex, 
  setCurrentImageIndex,
  handleImageUpload,
  selectedProperty 
}) => {
  // Filesystem state
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // Load files from property data
  useEffect(() => {
    if (selectedProperty && selectedProperty.files) {
      const propertyFiles = selectedProperty.files.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type || 'file',
        url: file.url,
        s3Key: file.s3Key,
        createdAt: file.createdAt
      }));
      setFiles(propertyFiles);
    } else {
      setFiles([]);
    }
  }, [selectedProperty]);

  // Filesystem functions
  const handleFileUpload = async (event) => {
    const uploadedFiles = Array.from(event.target.files);
    if (!selectedProperty?.id) return;
    
    setIsLoading(true);
    try {
      for (const file of uploadedFiles) {
        const response = await apiService.uploadPropertyFile(selectedProperty.id, file);
        if (response.success) {
          console.log('File uploaded successfully:', response.data);
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Eroare la încărcarea fișierelor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileDoubleClick = (file) => {
    if (file.url) {
      window.open(file.url, '_blank');
    }
  };

  const handleDownloadFile = async (file) => {
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDeleteFile = async (file) => {
    if (!selectedProperty?.id || !file.id) return;
    
    if (confirm(`Sigur doriți să ștergeți fișierul "${file.name}"?`)) {
      setIsLoading(true);
      try {
        const response = await apiService.deletePropertyFile(selectedProperty.id, file.id);
        if (response.success) {
          console.log('File deleted successfully');
          setFiles(prev => prev.filter(f => f.id !== file.id));
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        alert('Eroare la ștergerea fișierului');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleItemSelect = (item) => {
    setSelectedItems(prev => 
      prev.includes(item.id) 
        ? prev.filter(id => id !== item.id)
        : [...prev, item.id]
    );
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return '📄';
      case 'dwg':
        return '📐';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📄';
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  return (
    <>
      {/* First Section - Title, Image Upload, Address with separator */}
      <div className="p-6 border-b border-gray-200">
        <div className="space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Titlu proprietate</label>
            {isEditing || isCreating ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Introduceți numele proprietății"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <h2 className="text-lg font-semibold text-gray-900">
                {formData.name || 'Nume proprietate'}
              </h2>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imagine mică</label>
            {isEditing || isCreating ? (
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {formData.image ? (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <FileImage className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors cursor-pointer">
                    <Upload className="h-4 w-4" />
                    <span>Încarcă din calculator</span>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            handleInputChange('image', event.target.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      accept="image/*"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF până la 10MB</p>
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt={formData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FileImage className="h-6 w-6" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200"></div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adresă</label>
            {isEditing || isCreating ? (
              <div className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-gray-400 mt-3 flex-shrink-0" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Introduceți adresa proprietății"
                  className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600">{formData.address || 'Adresa proprietății'}</p>
              </div>
            )}
          </div>


          {/* Coordinates */}
          <div className="flex items-start space-x-2">
            <MapPin className="h-5 w-5 text-gray-400 mt-3 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Latitudine
                  </label>
                  {isEditing || isCreating ? (
                    <input
                      type="number"
                      step="any"
                      value={formData.lat}
                      onChange={(e) => handleInputChange('lat', e.target.value)}
                      placeholder="46.7704"
                      className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 py-2">
                      {formData.lat || 'Nu este setată'}
                    </p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Longitudine
                  </label>
                  {isEditing || isCreating ? (
                    <input
                      type="number"
                      step="any"
                      value={formData.lng}
                      onChange={(e) => handleInputChange('lng', e.target.value)}
                      placeholder="23.5918"
                      className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 py-2">
                      {formData.lng || 'Nu este setată'}
                    </p>
                  )}
                </div>
              </div>
              {(isEditing || isCreating) && (formData.lat || formData.lng) && (
                <p className="text-xs text-gray-500">
                  Coordonatele vor fi folosite pentru a plasa proprietatea pe hartă
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Property Information */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="font-medium text-gray-900 mb-3">Informații Proprietate</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            {isEditing || isCreating ? (
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="în construcție">În construcție</option>
                <option value="finalizată">Finalizată</option>
              </select>
            ) : (
              <div className="flex items-center space-x-2">
                {formData.status === 'finalizată' ? (
                  <Home className="h-4 w-4 text-green-600" />
                ) : (
                  <Construction className="h-4 w-4 text-amber-600" />
                )}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  formData.status === 'finalizată'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {formData.status === 'finalizată' ? 'Finalizată' : 'În construcție'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filesystem Section */}
      {!isCreating && selectedProperty && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Folder className="h-5 w-5 text-primary-600" />
              <h3 className="font-medium text-gray-900">Fișiere</h3>
            </div>
            
            <label className="flex items-center space-x-1 px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer">
              <Upload className="h-4 w-4" />
              <span>Încarcă fișiere</span>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Files List */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : files.length > 0 ? (
              <div className="space-y-1">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedItems.includes(file.id) 
                        ? 'bg-primary-50 border border-primary-200' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleItemSelect(file)}
                    onDoubleClick={() => handleFileDoubleClick(file)}
                  >
                    <span className="text-lg">{getFileIcon(file.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.size} • {new Date(file.createdAt).toLocaleDateString('ro-RO')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileDoubleClick(file);
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Deschide în calculator"
                      >
                        <ExternalLink className="h-4 w-4 text-blue-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadFile(file);
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Descarcă"
                      >
                        <Download className="h-4 w-4 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file);
                        }}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        title="Șterge"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Folder className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Nu există fișiere</p>
                <p className="text-xs text-gray-400">
                  Încărcați fișiere pentru a le organiza aici
                </p>
              </div>
            )}
          </div>

          {/* Selected items actions */}
          {selectedItems.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedItems.length} fișier(e) selectat(e)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const selectedFiles = files.filter(file => selectedItems.includes(file.id));
                      selectedFiles.forEach(file => handleDownloadFile(file));
                    }}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Descarcă</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Sigur doriți să ștergeți ${selectedItems.length} fișiere?`)) {
                        const selectedFiles = files.filter(file => selectedItems.includes(file.id));
                        selectedFiles.forEach(file => handleDeleteFile(file));
                        setSelectedItems([]);
                      }
                    }}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Șterge</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="font-medium text-gray-900 mb-3">Descriere</h3>
        {isEditing || isCreating ? (
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Descrierea proprietății..."
            className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        ) : (
          <p className="text-gray-600 text-sm leading-relaxed">
            {formData.description || `${formData.name} este o proprietate modernă situată într-o zonă rezidențială de prestigiu. Complexul oferă apartamente spațioase cu design contemporan și finisaje de calitate superioară.`}
          </p>
        )}
      </div>

      {/* Image Gallery */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Galerie</h3>
          <label className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors cursor-pointer">
            <Upload className="h-4 w-4" />
            <span>Încarcă</span>
            <input
              type="file"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              accept="image/*"
            />
          </label>
        </div>
        
        {galleryImages.length > 0 ? (
          <div className="relative">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={galleryImages[currentImageIndex]}
                alt={`${formData.name} - Imagine ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Navigation arrows */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>
              </>
            )}
            
            {/* Image indicators */}
            {galleryImages.length > 1 && (
              <div className="flex justify-center space-x-2 mt-4">
                {galleryImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileImage className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nu există imagini încărcate</p>
          </div>
        )}
      </div>
    </>
  );
};

export default PropertyDescription;
