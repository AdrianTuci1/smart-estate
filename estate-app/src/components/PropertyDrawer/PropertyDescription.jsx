import { MapPin, Home, Construction, FileImage, Upload, ExternalLink, Plus, Trash2, Euro } from 'lucide-react';
import PropertyFileTree from '../PropertyFileTree';
import PropertyGallery from '../PropertyGallery';

const PropertyDescription = ({ 
  formData, 
  isEditing, 
  isCreating, 
  handleInputChange, 
  selectedProperty,
  onFileClick,
  onGalleryOpen
}) => {

  // Initialize apartment types if not present
  const apartmentTypes = formData.apartmentTypes || [];

  const addApartmentType = () => {
    const newType = {
      id: Date.now().toString(),
      type: '',
      price: ''
    };
    handleInputChange('apartmentTypes', [...apartmentTypes, newType]);
  };

  const removeApartmentType = (id) => {
    const updatedTypes = apartmentTypes.filter(type => type.id !== id);
    handleInputChange('apartmentTypes', updatedTypes);
  };

  const updateApartmentType = (id, field, value) => {
    const updatedTypes = apartmentTypes.map(type => 
      type.id === id ? { ...type, [field]: value } : type
    );
    handleInputChange('apartmentTypes', updatedTypes);
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
                  <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
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

      {/* Apartment Types and Pricing */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Tipuri de Apartamente</h3>
          {(isEditing || isCreating) && (
            <button
              onClick={addApartmentType}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Adaugă</span>
            </button>
          )}
        </div>
        
        {apartmentTypes.length === 0 && !isEditing && !isCreating ? (
          <p className="text-gray-500 text-sm">Nu sunt definite tipuri de apartamente</p>
        ) : (
          <div className="space-y-3">
            {apartmentTypes.map((apartmentType) => (
              <div key={apartmentType.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {(isEditing || isCreating) ? (
                  <>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Tip apartament</label>
                      <select
                        value={apartmentType.type}
                        onChange={(e) => updateApartmentType(apartmentType.id, 'type', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Selectează tipul</option>
                        <option value="studio">Studio</option>
                        <option value="1 cameră">1 cameră</option>
                        <option value="2 camere">2 camere</option>
                        <option value="3 camere">3 camere</option>
                        <option value="4 camere">4 camere</option>
                        <option value="5+ camere">5+ camere</option>
                        <option value="penthouse">Penthouse</option>
                        <option value="duplex">Duplex</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Preț de la (€)</label>
                      <input
                        type="number"
                        value={apartmentType.price}
                        onChange={(e) => updateApartmentType(apartmentType.id, 'price', e.target.value)}
                        placeholder="ex: 120000"
                        className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min="0"
                        step="1000"
                      />
                    </div>
                    <button
                      onClick={() => removeApartmentType(apartmentType.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title="Șterge tipul"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Home className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{apartmentType.type}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Euro className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {apartmentType.price ? `${parseInt(apartmentType.price).toLocaleString('ro-RO')} €` : 'Nu este specificat'}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filesystem Section */}
      {!isCreating && selectedProperty && (
        <div className="border-b border-gray-200">
            <PropertyFileTree 
              selectedProperty={selectedProperty}
              onFileClick={onFileClick}
            />
        </div>
      )}

      {/* Gallery Section - Only show for existing properties */}
      {selectedProperty && selectedProperty.id && !isCreating && (
        <PropertyGallery 
          selectedProperty={selectedProperty}
          onPropertyUpdate={(updatedProperty) => {
            // Handle property update if needed
            console.log('Property updated:', updatedProperty);
          }}
          onGalleryOpen={onGalleryOpen}
        />
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
            {formData.description || `Nu exista descriere`}. 
          </p>
        )}
      </div>

    </>
  );
};

export default PropertyDescription;
