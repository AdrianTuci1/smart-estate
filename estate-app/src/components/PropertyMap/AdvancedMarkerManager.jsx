import { useCallback, useEffect } from 'react';

const AdvancedMarkerManager = ({ 
  map, 
  properties, 
  advancedMarkers, 
  setAdvancedMarkers, 
  handleMarkerClick 
}) => {
  // Create AdvancedMarkerElement for a property
  const createAdvancedMarker = useCallback(async (property, map) => {
    if (!window.google || !window.google.maps || !window.google.maps.marker) {
      return null;
    }

    try {
      const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary("marker");
      
      const color = property.status === 'finalizată' ? '#10b981' : '#f59e0b';
      const pinElement = new PinElement({
        background: color,
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
        scale: 1.5
      });

      const marker = new AdvancedMarkerElement({
        map,
        position: property.position,
        content: pinElement.element,
        title: property.name
      });

      // Add click event listener
      marker.addListener('click', () => {
        handleMarkerClick(property);
      });

      return marker;
    } catch (error) {
      console.error('Error creating advanced marker:', error);
      return null;
    }
  }, [handleMarkerClick]);

  // Create all advanced markers
  const createAdvancedMarkers = useCallback(async (properties, map) => {
    if (!map || !window.google) return;

    // Clear existing markers
    advancedMarkers.forEach(marker => {
      if (marker && marker.map) {
        marker.map = null;
      }
    });

    const markers = [];
    for (const property of properties) {
      const marker = await createAdvancedMarker(property, map);
      if (marker) {
        markers.push(marker);
      }
    }
    
    setAdvancedMarkers(markers);
  }, [advancedMarkers, createAdvancedMarker, setAdvancedMarkers]);

  // Recreate markers when properties change
  useEffect(() => {
    if (map && properties.length > 0) {
      createAdvancedMarkers(properties, map);
    }
  }, [map, properties, createAdvancedMarkers]);

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      advancedMarkers.forEach(marker => {
        if (marker && marker.map) {
          marker.map = null;
        }
      });
    };
  }, [advancedMarkers]);

  return null; // This component doesn't render anything
};

export default AdvancedMarkerManager;
