import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import useAppStore from '../../stores/useAppStore';
import apiService from '../../services/api';
import { mapStyles, mapStylesWithPOIs } from './mapStyles';
import MapControls from './MapControls';
import AddPropertyButton from './AddPropertyButton';
import AddPropertyInstructions from './AddPropertyInstructions';
import ErrorOverlay from './ErrorOverlay';
import LoadingSpinner from './LoadingSpinner';
import EfficientClusterManager from './EfficientClusterManager';
import './CustomMarkers.css';

const PropertyMap = () => {
  const { 
    selectedProperty, 
    selectProperty, 
    closeDrawer, 
    isDrawerOpen, 
    mapCenter, 
    mapZoom, 
    setMapView, 
    loadMapView, 
    saveMapView 
  } = useAppStore();
  
  // Remove selectedMarker state - we'll use selectedProperty directly
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
        const propertiesWithPosition = response.data.map(property => {
          return {
            ...property,
            name: property.name || property.address || 'Proprietate fără nume',
            position: property.coordinates || property.position || null
          };
        }).filter(property => property.position); // Only show properties with coordinates
        
       
        setProperties(propertiesWithPosition);
      } else {
        setProperties([]);
      }
    } catch (err) {
      console.error('Failed to load properties:', err);
      setError('Eroare la încărcarea proprietăților');
      // No properties available due to error
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
    // Load saved map view from localStorage
    loadMapView();
  }, []);

  // No need to sync marker selection - ClusterMarkerManager handles this directly with selectedProperty

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
      console.log('PropertyMap: Drawer closed, reloading properties');
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
  const center = mapCenter || { lat: 44.4268, lng: 26.1025 };
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
    // Just select the property - this will color the marker differently
    selectProperty(property);
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
    closeDrawer();
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
        <EfficientClusterManager
          map={map}
          properties={properties}
          selectedProperty={selectedProperty}
          onMarkerClick={handleMarkerClick}
          zoom={zoom}
        />
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
