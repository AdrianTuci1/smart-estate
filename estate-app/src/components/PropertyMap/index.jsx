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
import { useMobileDetection } from '../../hooks/useMobileDetection';
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
    saveMapView,
    properties: storeProperties,
    setProperties
  } = useAppStore();
  
  const { isMobile } = useMobileDetection();
  
  // Remove selectedMarker state - we'll use selectedProperty directly
  const [map, setMap] = useState(null);
  const [showPOIs, setShowPOIs] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [newPropertyPosition, setNewPropertyPosition] = useState(null);
  const [newPropertyAddress, setNewPropertyAddress] = useState('');
  
  // Ref to track if we're programmatically updating the map
  const isProgrammaticUpdate = useRef(false);
  const debounceTimeout = useRef(null);
  const lastLoadedBounds = useRef(null);
  const boundsChangeTimeout = useRef(null);

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
  const loadProperties = async (bounds = null, isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setIsLoading(true);
      }
      setError(null);
      
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      let response;
      if (bounds) {
        // Load properties for specific bounds with pagination
        response = await apiService.getPropertiesByBounds(bounds, {
          page: 1,
          limit: 20, // Load more properties for map view
          lastKey: null // For now, load all in bounds
        });
      } else {
        // Load all properties (initial load)
        response = await apiService.getProperties({
          page: 1,
          limit: 100
        });
      }
      
      if (response.success && response.data) {
        
        // Convert coordinates to position for map display and ensure name field
        const propertiesWithPosition = response.data.map(property => {
          return {
            ...property,
            name: property.name || property.address || 'Proprietate fără nume',
            position: property.coordinates || property.position || null
          };
        }).filter(property => property.position); // Only show properties with coordinates
        
        if (bounds) {
          // Merge with existing properties, avoiding duplicates
          setProperties(prevProperties => {
            const existingIds = new Set(prevProperties.map(p => p.id));
            const newProperties = propertiesWithPosition.filter(p => !existingIds.has(p.id));
            const merged = [...prevProperties, ...newProperties];
            return merged;
          });
        } else {
          // Replace all properties (initial load)
          setProperties(propertiesWithPosition);
        }
      } else {
        if (!bounds) {
          // Only clear properties on initial load failure
          setProperties([]);
        }
      }
    } catch (err) {
      console.error('Failed to load properties:', err);
      setError('Eroare la încărcarea proprietăților');
      if (!bounds) {
        // Only clear properties on initial load failure
        setProperties([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load properties on initial mount
    const initializeProperties = async () => {
      // Check if user is authenticated before loading properties
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      if (storeProperties.length === 0) {
        // Load all properties initially for better user experience
        await loadProperties();
        // Set a flag to indicate initial load is complete
        lastLoadedBounds.current = 'initial_load_complete';
      } else {
        setIsLoading(false);
        // Set a flag to indicate we're using existing properties
        lastLoadedBounds.current = 'using_existing_properties';
      }
    };
    
    initializeProperties();
    // Load saved map view from localStorage
    loadMapView();
  }, []); // Keep empty dependency array for initial load only

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

  // Reset adding property state when drawer is closed
  useEffect(() => {
    if (!isDrawerOpen) {
      setIsAddingProperty(false);
      setNewPropertyPosition(null);
      setNewPropertyAddress('');
      // Note: Removed automatic property reloading to prevent map reloading
      // Properties will be reloaded only when explicitly needed (e.g., after creating new property)
    }
  }, [isDrawerOpen]);

  const mapContainerStyle = {
    width: '100%',
    height: isMobile ? '100vh' : '100%',
    minHeight: '100vh',
    touchAction: 'pan-x pan-y pinch-zoom'
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
    // Clear any pending bounds change timeout
    if (boundsChangeTimeout.current) {
      clearTimeout(boundsChangeTimeout.current);
    }
  }, []);

  // Check if bounds have changed significantly
  const hasBoundsChangedSignificantly = useCallback((newBounds, lastBounds) => {
    // If lastBounds is a string (initial load flags), don't trigger bounds-based loading
    if (typeof lastBounds === 'string') return false;
    
    if (!lastBounds) return true;
    
    const latOverlap = Math.min(newBounds.north, lastBounds.north) - Math.max(newBounds.south, lastBounds.south);
    const lngOverlap = Math.min(newBounds.east, lastBounds.east) - Math.max(newBounds.west, lastBounds.west);
    
    const newLatSpan = newBounds.north - newBounds.south;
    const newLngSpan = newBounds.east - newBounds.west;
    
    // If less than 50% overlap in either direction, consider it significant
    // Reduced threshold for more frequent loading
    const latOverlapRatio = latOverlap > 0 ? latOverlap / newLatSpan : 0;
    const lngOverlapRatio = lngOverlap > 0 ? lngOverlap / newLngSpan : 0;
    
    return latOverlapRatio < 0.5 || lngOverlapRatio < 0.5;
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
    
    // Clear existing bounds change timeout
    if (boundsChangeTimeout.current) {
      clearTimeout(boundsChangeTimeout.current);
    }
    
    // Debounce the update to avoid too frequent saves
    debounceTimeout.current = setTimeout(() => {
      if (map) {
        const center = map.getCenter();
        const zoom = map.getZoom();
        const bounds = map.getBounds();
        
        if (center && zoom !== undefined && bounds) {
          const newCenter = {
            lat: center.lat(),
            lng: center.lng()
          };
          
          // Update store
          setMapView(newCenter, zoom);
          // Save to localStorage
          saveMapView(newCenter, zoom);
          
          // Check if we need to load properties for new bounds
          const newBounds = {
            north: bounds.getNorthEast().lat(),
            south: bounds.getSouthWest().lat(),
            east: bounds.getNorthEast().lng(),
            west: bounds.getSouthWest().lng()
          };
          
          if (hasBoundsChangedSignificantly(newBounds, lastLoadedBounds.current)) {
            // Debounce bounds-based property loading
            boundsChangeTimeout.current = setTimeout(() => {
              loadProperties(newBounds);
              lastLoadedBounds.current = newBounds;
            }, 500); // 500ms debounce for bounds changes
          }
        }
      }
    }, 300); // 300ms debounce
  }, [map, setMapView, saveMapView, hasBoundsChangedSignificantly, loadProperties]);

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
    <div className="mobile-map-container mobile-full-height prevent-pull-refresh">
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
          clickableIcons: !isAddingProperty, // Disable POI clicks when adding property
          gestureHandling: 'greedy', // Allow map to consume all touch events
          zoomControlOptions: {
            position: window.google?.maps?.ControlPosition?.RIGHT_BOTTOM
          }
        }}
        mapContainerClassName="google-map-container"
      >
        <EfficientClusterManager
          map={map}
          properties={storeProperties}
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

      {/* Map Controls - hidden on mobile */}
      <div className="hidden md:block">
        <MapControls
          showPOIs={showPOIs}
          setShowPOIs={setShowPOIs}
        />
      </div>
    </div>
  );
};

export default PropertyMap;
