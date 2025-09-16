import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, Home, Construction, Eye, EyeOff, Plus, X } from 'lucide-react';
import useAppStore from '../../stores/useAppStore';
import apiService from '../../services/api';
import { mapStyles, mapStylesWithPOIs, mockProperties } from './mapStyles';
import MapControls from './MapControls';
import AddPropertyButton from './AddPropertyButton';
import AddPropertyInstructions from './AddPropertyInstructions';
import ErrorOverlay from './ErrorOverlay';
import LoadingSpinner from './LoadingSpinner';

const PropertyMap = () => {
  const { 
    selectedProperty, 
    selectProperty, 
    setDrawerOpen, 
    closeDrawer, 
    isDrawerOpen, 
    mapCenter, 
    mapZoom, 
    setMapView, 
    loadMapView, 
    saveMapView 
  } = useAppStore();
  
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [map, setMap] = useState(null);
  const [showPOIs, setShowPOIs] = useState(false);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [newPropertyPosition, setNewPropertyPosition] = useState(null);
  const [newPropertyAddress, setNewPropertyAddress] = useState('');
  
  // Ref to track if we're programmatically updating the map
  const isProgrammaticUpdate = useRef(false);
  const debounceTimeout = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'demo-key'
  });

  // Handle API loading errors
  useEffect(() => {
    if (loadError) {
      console.error('Google Maps API load error:', loadError);
    }
  }, [loadError]);

  // Update styles when showPOIs changes
  useEffect(() => {
    if (map) {
      map.setOptions({
        styles: showPOIs ? mapStylesWithPOIs : mapStyles
      });
    }
  }, [map, showPOIs]);

  // Load properties from API
  const loadProperties = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getProperties();
      
      if (response.success && response.data) {
        // Convert coordinates to position for map display and ensure name field
        const propertiesWithPosition = response.data.map(property => ({
          ...property,
          name: property.name || property.address || 'Proprietate fără nume',
          position: property.coordinates || property.position || null
        })).filter(property => property.position); // Only show properties with coordinates
        
        setProperties(propertiesWithPosition);
      } else {
        // Fallback to mock data if API fails
        setProperties(mockProperties);
      }
    } catch (err) {
      console.error('Failed to load properties:', err);
      setError('Eroare la încărcarea proprietăților');
      // Fallback to mock data
      setProperties(mockProperties);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
    // Load saved map view from localStorage
    loadMapView();
  }, []);

  // Sync marker selection with drawer state
  useEffect(() => {
    // If drawer is closed and we have a selected marker, clear it
    if (!isDrawerOpen && selectedMarker) {
      setSelectedMarker(null);
    }
    
    // If drawer is open with a property but no marker selected, select the marker
    if (isDrawerOpen && selectedProperty && !selectedMarker) {
      setSelectedMarker(selectedProperty);
    }
  }, [isDrawerOpen, selectedProperty, selectedMarker]);

  // Update map center and zoom when mapCenter or mapZoom state changes
  useEffect(() => {
    if (map && mapCenter) {
      isProgrammaticUpdate.current = true;
      map.panTo(mapCenter);
      // Reset the flag after a very short delay
      setTimeout(() => {
        isProgrammaticUpdate.current = false;
      }, 10);
    }
    if (map && mapZoom !== undefined) {
      isProgrammaticUpdate.current = true;
      map.setZoom(mapZoom);
      // Reset the flag after a very short delay
      setTimeout(() => {
        isProgrammaticUpdate.current = false;
      }, 10);
    }
  }, [map, mapCenter, mapZoom]);

  // Reset adding property state when drawer is closed and reload properties
  useEffect(() => {
    if (!isDrawerOpen) {
      setIsAddingProperty(false);
      setNewPropertyPosition(null);
      setNewPropertyAddress('');
      // Reload properties to show newly created ones
      loadProperties();
    }
  }, [isDrawerOpen]);

  const mapContainerStyle = {
    width: '100%',
    height: '100%'
  };

  // Use mapCenter and mapZoom from store, fallback to default if not set
  const center = mapCenter || { lat: 46.7704, lng: 23.5918 };
  const zoom = mapZoom || 14;

  const onLoad = useCallback((map) => {
    // Apply styles after map is loaded
    if (map) {
      map.setOptions({
        styles: showPOIs ? mapStylesWithPOIs : mapStyles
      });
    }
    
    setMap(map);
  }, [showPOIs]);

  const onUnmount = useCallback(() => {
    setMap(null);
    // Clear any pending debounce timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
  }, []);

  // Handle map view changes (center and zoom) with debouncing
  const handleMapViewChange = useCallback(() => {
    // Skip if this is a programmatic update
    if (isProgrammaticUpdate.current) {
      return;
    }
    
    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Debounce the update to avoid too frequent saves
    debounceTimeout.current = setTimeout(() => {
      if (map) {
        const center = map.getCenter();
        const zoom = map.getZoom();
        
        if (center && zoom !== undefined) {
          const newCenter = {
            lat: center.lat(),
            lng: center.lng()
          };
          
          // Update store
          setMapView(newCenter, zoom);
          // Save to localStorage
          saveMapView(newCenter, zoom);
        }
      }
    }, 300); // 300ms debounce
  }, [map, setMapView, saveMapView]);

  const handleMarkerClick = (property) => {
    setSelectedMarker(property);
    selectProperty(property);
  };

  const handleMarkerClose = () => {
    setSelectedMarker(null);
    closeDrawer(); // Close drawer when marker selection is closed
  };

  // Reverse geocoding function to get address from coordinates
  const getAddressFromCoordinates = async (lat, lng) => {
    if (!window.google || !window.google.maps) {
      return 'Adresa nu a putut fi găsită';
    }

    const geocoder = new window.google.maps.Geocoder();
    const latlng = new window.google.maps.LatLng(lat, lng);
    
    return new Promise((resolve) => {
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          resolve('Adresa nu a putut fi găsită');
        }
      });
    });
  };

  // Handle map click for adding new property
  const handleMapClick = async (event) => {
    if (!isAddingProperty) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    const position = { lat, lng };

    setNewPropertyPosition(position);
    
    // Get address from coordinates
    const address = await getAddressFromCoordinates(lat, lng);
    setNewPropertyAddress(address);

    // Exit adding mode
    setIsAddingProperty(false);
    
    // Open drawer with new property data (only coordinates and address)
    const newProperty = {
      id: null, // Will be generated by backend
      position: position,
      address: address,
      status: 'în construcție', // Default status
      name: '', // Will be filled by user
      image: '', // Will be filled by user
      description: '', // Will be filled by user
      leads: []
    };
    
    selectProperty(newProperty);
  };

  const handleAddProperty = () => {
    if (isAddingProperty) {
      // Cancel adding mode
      setIsAddingProperty(false);
      setNewPropertyPosition(null);
      setNewPropertyAddress('');
      return;
    }

    // Enter adding mode
    setIsAddingProperty(true);
    setSelectedMarker(null);
    closeDrawer();
  };

  const getMarkerIcon = (status) => {
    const color = status === 'finalizată' ? '#10b981' : '#f59e0b';
    return {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 1.5
    };
  };

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50">
        <div className="text-center">
          <p className="text-red-600 mb-2">Eroare la încărcarea hărții</p>
          <p className="text-sm text-red-500">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return <LoadingSpinner message="Se încarcă harta..." />;
  }

  if (isLoading) {
    return <LoadingSpinner message="Se încarcă proprietățile..." />;
  }


  return (
    <div className="w-full h-full relative">
      <ErrorOverlay error={error} />

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        onCenterChanged={handleMapViewChange}
        onZoomChanged={handleMapViewChange}
        options={{
          styles: showPOIs ? mapStylesWithPOIs : mapStyles,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          clickableIcons: !isAddingProperty // Disable POI clicks when adding property
        }}
      >
        {properties.map((property) => (
          <Marker
            key={property.id}
            position={property.position}
            icon={getMarkerIcon(property.status)}
            onClick={() => handleMarkerClick(property)}
          />
        ))}

        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={handleMarkerClose}
          >
            <div className="p-2 max-w-xs">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {selectedMarker.status === 'finalizată' ? (
                    <Home className="h-5 w-5 text-green-600" />
                  ) : (
                    <Construction className="h-5 w-5 text-amber-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {selectedMarker.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedMarker.address}
                  </p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedMarker.status === 'finalizată'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedMarker.status === 'finalizată' ? 'Finalizată' : 'În construcție'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      <AddPropertyButton
        isAddingProperty={isAddingProperty}
        handleAddProperty={handleAddProperty}
      />

      <AddPropertyInstructions isAddingProperty={isAddingProperty} />

      <MapControls
        showPOIs={showPOIs}
        setShowPOIs={setShowPOIs}
      />
    </div>
  );
};

export default PropertyMap;
