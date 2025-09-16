import { MapPin, Home, Construction, ChevronLeft, ChevronRight, FileImage, Upload } from 'lucide-react';

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
  handleImageUpload 
}) => {
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
