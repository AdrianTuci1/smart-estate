import { useEffect, useRef, useCallback, useMemo } from "react";
import { MarkerClusterer, GridAlgorithm } from "@googlemaps/markerclusterer";
import { createEnhancedMarker } from "./createEnhancedMarker";

const ZOOM_THRESHOLD = 18;
const VIEWPORT_PADDING = 0.1; // 10% padding pentru viewport

const EfficientClusterManager = ({ map, properties, selectedProperty, onMarkerClick, zoom }) => {
  const markersRef = useRef(new Map()); // Map pentru O(1) lookup
  const markerClustererRef = useRef(null);
  const lastPropertiesRef = useRef([]);
  const visibleBoundsRef = useRef(null);

  // Memoized marker creation - reutilizează markere existente
  const getOrCreateMarker = useCallback((property) => {
    const existingMarker = markersRef.current.get(property.id);
    
    if (existingMarker) {
      // Actualizează doar datele dacă s-au schimbat
      if (existingMarker.propertyData !== property) {
        existingMarker.propertyData = property;
        // Actualizează poziția dacă s-a schimbat
        if (existingMarker.getPosition() !== property.position) {
          existingMarker.setPosition(property.position);
        }
      }
      return existingMarker;
    }

    // Creează marker nou doar dacă nu există
    const marker = createEnhancedMarker(property, map, onMarkerClick, selectedProperty);
    marker.propertyId = property.id;
    marker.propertyData = property;
    // Nu mai adăugăm click listener pe marker-ul de bază, click-ul este pe overlay
    
    markersRef.current.set(property.id, marker);
    return marker;
  }, [onMarkerClick]);

  // Calculează viewport bounds cu padding
  const getViewportBounds = useCallback(() => {
    if (!map) return null;
    
    const bounds = map.getBounds();
    if (!bounds) return null;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    const latSpan = ne.lat() - sw.lat();
    const lngSpan = ne.lng() - sw.lng();
    
    return {
      north: ne.lat() + (latSpan * VIEWPORT_PADDING),
      south: sw.lat() - (latSpan * VIEWPORT_PADDING),
      east: ne.lng() + (lngSpan * VIEWPORT_PADDING),
      west: sw.lng() - (lngSpan * VIEWPORT_PADDING)
    };
  }, [map]);

  // Verifică dacă o proprietate este în viewport
  const isPropertyInViewport = useCallback((property, bounds) => {
    if (!bounds || !property.position) return true; // Fallback - arată toate
    
    const lat = property.position.lat;
    const lng = property.position.lng;
    
    return lat <= bounds.north && 
           lat >= bounds.south && 
           lng <= bounds.east && 
           lng >= bounds.west;
  }, []);

  // Use all properties since we now load them dynamically based on map bounds
  const visibleProperties = useMemo(() => {
    return properties;
  }, [properties]);

  // Centralizată logica de visibility
  const updateMarkerVisibility = useCallback((marker, isInCluster, forceVisible = false) => {
    if (!marker.propertyOverlay) return;

    const shouldShow = forceVisible || 
                      (zoom >= ZOOM_THRESHOLD) || 
                      (!isInCluster && zoom < ZOOM_THRESHOLD);

    // Asigură-te că overlay-ul este atașat la hartă
    if (shouldShow && marker.propertyOverlay.getMap() !== map) {
      marker.propertyOverlay.setMap(map);
    }

    marker.propertyOverlay.updateVisibility?.(shouldShow);
  }, [zoom, map]);

  // Eficient update pentru clustering
  const handleClusteringEnd = useCallback((event) => {
    const clusterMap = new Map(); // O(1) lookup pentru clustere
    
    // Construiește map-ul de clustere
    event.clusters.forEach(cluster => {
      const isCluster = cluster.markers.length > 1;
      cluster.markers.forEach(marker => {
        clusterMap.set(marker.propertyId, isCluster);
      });
    });

    // Update visibility în batch
    markersRef.current.forEach((marker) => {
      const isInCluster = clusterMap.get(marker.propertyId) || false;
      const isSelected = selectedProperty && marker.propertyId === selectedProperty.id;
      updateMarkerVisibility(marker, isInCluster, isSelected);
    });
  }, [updateMarkerVisibility, selectedProperty]);

  // Main effect - optimizat pentru reutilizarea markerelor
  useEffect(() => {
    if (!map || !visibleProperties.length) {
      // Cleanup când nu avem proprietăți
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
        markerClustererRef.current.setMap(null);
        markerClustererRef.current = null;
      }
      return;
    }

    // Determină ce markere trebuie adăugate/eliminate
    const currentPropertyIds = new Set(visibleProperties.map(p => p.id));
    const existingPropertyIds = new Set(lastPropertiesRef.current.map(p => p.id));

    // Elimină markere care nu mai sunt vizibile
    const toRemove = [...existingPropertyIds].filter(id => !currentPropertyIds.has(id));
    toRemove.forEach(id => {
      const marker = markersRef.current.get(id);
      if (marker) {
        marker.propertyOverlay?.setMap(null);
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });

    // Creează/actualizează markere pentru proprietățile vizibile
    const activeMarkers = visibleProperties.map(getOrCreateMarker).filter(Boolean);

    // Recreează clusterer doar dacă este necesar
    if (markerClustererRef.current) {
      markerClustererRef.current.clearMarkers();
      markerClustererRef.current.setMap(null);
    }

    markerClustererRef.current = new MarkerClusterer({
      map,
      markers: activeMarkers,
      algorithm: new GridAlgorithm({ maxDistance: 50000, gridSize: 60 }),
    });

    // Adaugă listener pentru clustering
    markerClustererRef.current.addListener("clusteringend", handleClusteringEnd);

    lastPropertiesRef.current = visibleProperties;

    return () => {
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
        markerClustererRef.current.setMap(null);
        markerClustererRef.current = null;
      }
    };
  }, [map, visibleProperties, getOrCreateMarker, handleClusteringEnd]);

  // Optimizat zoom effect - doar update visibility
  useEffect(() => {
    if (!markerClustererRef.current) return;

    // Trigger re-clustering pentru a actualiza visibility
    if (markerClustererRef.current.clusters) {
      handleClusteringEnd({ clusters: markerClustererRef.current.clusters });
    }
  }, [zoom, handleClusteringEnd]);

  // Optimizat selection effect - actualizează culorile pentru selecție
  useEffect(() => {
    // Actualizează culorile pentru toate marker-urile
    markersRef.current.forEach((marker, propertyId) => {
      if (marker.propertyOverlay) {
        const isSelected = selectedProperty && selectedProperty.id === propertyId;
        const statusColor = marker.propertyData.status === 'finalizată' ? '#10b981' : '#f59e0b';
        const borderColor = isSelected ? '#3b82f6' : statusColor;
        
        marker.propertyOverlay.updateBorderColor(borderColor);
        
        // Forțează visibility pentru marker-ul selectat
        if (isSelected) {
          updateMarkerVisibility(marker, false, true);
        }
      }
    });
  }, [selectedProperty, updateMarkerVisibility]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => {
        marker.propertyOverlay?.setMap(null);
        marker.setMap(null);
      });
      markersRef.current.clear();
    };
  }, []);

  return null;
};

export default EfficientClusterManager;
