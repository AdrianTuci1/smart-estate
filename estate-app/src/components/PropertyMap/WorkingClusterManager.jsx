import { useCallback, useEffect, useRef, useState } from 'react';
import { MarkerClusterer, GridAlgorithm } from '@googlemaps/markerclusterer';

const WorkingClusterManager = ({ 
  map, 
  properties, 
  selectedProperty,
  onMarkerClick,
  zoom
}) => {
  const [markers, setMarkers] = useState([]);
  const markerClustererRef = useRef(null);
  const markersRef = useRef([]);

  // Zoom threshold
  const ZOOM_THRESHOLD = 14;

  // Create simple marker
  const createSimpleMarker = useCallback((property) => {
    if (!window.google || !window.google.maps) return null;

    const isSelected = selectedProperty?.id === property.id;
    const color = isSelected ? '#3b82f6' : (property.status === 'finalizată' ? '#10b981' : '#f59e0b');

    return new window.google.maps.Marker({
      position: property.position,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: isSelected ? 8 : 6,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      },
      title: property.name || property.address
    });
  }, [selectedProperty]);

  // Create enhanced marker with HTML overlay for close zoom
  const createEnhancedMarker = useCallback((property) => {
    if (!window.google || !window.google.maps) return null;

    const isSelected = selectedProperty?.id === property.id;
    const color = isSelected ? '#3b82f6' : (property.status === 'finalizată' ? '#10b981' : '#f59e0b');
    
    // Create base pin marker
    const marker = new window.google.maps.Marker({
      position: property.position,
      icon: {
        path: "M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7z",
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 1.5,
        anchor: new window.google.maps.Point(12, 24)
      },
      title: property.name || property.address
    });

    // Create HTML overlay for image and text
    const overlayDiv = document.createElement('div');
    overlayDiv.className = 'property-marker-overlay';
    overlayDiv.style.cssText = `
      position: absolute;
      transform: translate(-50%, -100%);
      pointer-events: none;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 15px;
    `;

    const imageUrl = property.mainImage || '/smartes.png';
    const borderColor = isSelected ? '#3b82f6' : '#ffffff';
    const textBgColor = isSelected ? '#3b82f6' : '#ffffff';
    const textColor = isSelected ? '#ffffff' : '#1f2937';

    overlayDiv.innerHTML = `
      <div style="
        width: 48px;
        height: 48px;
        border-radius: 50%;
        overflow: hidden;
        border: 3px solid ${borderColor};
        background: #f3f4f6;
        margin-bottom: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      ">
        <img 
          src="${imageUrl}" 
          alt="${property.name || property.address}"
          style="width: 100%; height: 100%; object-fit: cover;"
          onerror="this.src='/smartes.png'"
        />
      </div>
      <div style="
        background: ${textBgColor};
        color: ${textColor};
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: bold;
        box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        max-width: 120px;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        border: 1px solid ${isSelected ? '#3b82f6' : '#e5e7eb'};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        ${property.name || property.address || 'Proprietate'}
      </div>
    `;

    // Create custom overlay
    class PropertyOverlay extends window.google.maps.OverlayView {
      constructor(position, content, map) {
        super();
        this.position = position;
        this.content = content;
        this.div = null;
        this.setMap(map);
      }

      onAdd() {
        this.div = this.content;
        this.div.style.position = 'absolute';
        const panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(this.div);
      }

      draw() {
        const overlayProjection = this.getProjection();
        const position = overlayProjection.fromLatLngToDivPixel(this.position);
        
        if (this.div) {
          this.div.style.left = position.x + 'px';
          this.div.style.top = position.y + 'px';
        }
      }

      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
        }
        this.div = null;
      }
    }

    const overlay = new PropertyOverlay(property.position, overlayDiv, map);
    
    // Store overlay reference in marker
    marker.propertyOverlay = overlay;

    return marker;
  }, [map, selectedProperty]);

  // Clear all markers
  const clearMarkers = useCallback(() => {
    // Clear overlay markers
    markersRef.current.forEach(marker => {
      if (marker.propertyOverlay) {
        marker.propertyOverlay.setMap(null);
      }
      marker.setMap(null);
    });
    markersRef.current = [];

    // Clear clusterer
    if (markerClustererRef.current) {
      markerClustererRef.current.clearMarkers();
      markerClustererRef.current.setMap(null);
      markerClustererRef.current = null;
    }
  }, []);

  // Create markers based on zoom
  useEffect(() => {
    if (!map || !properties.length) return;

    // Clear existing markers
    clearMarkers();

    const newMarkers = [];

    if (zoom >= ZOOM_THRESHOLD) {
      // Show enhanced markers
      properties.forEach(property => {
        if (!property.position) return;
        
        const marker = createEnhancedMarker(property);
        if (marker) {
          marker.setMap(map);
          marker.addListener('click', () => onMarkerClick(property));
          marker.propertyId = property.id;
          marker.propertyData = property;
          newMarkers.push(marker);
        }
      });
    } else {
      // Show clustered simple markers
      properties.forEach(property => {
        if (!property.position) return;
        
        const marker = createSimpleMarker(property);
        if (marker) {
          marker.addListener('click', () => onMarkerClick(property));
          marker.propertyId = property.id;
          marker.propertyData = property;
          newMarkers.push(marker);
        }
      });

      // Create clusterer
      if (newMarkers.length > 0) {
        try {
          markerClustererRef.current = new MarkerClusterer({
            map,
            markers: newMarkers,
            algorithm: new GridAlgorithm({ 
              maxDistance: 50000,
              gridSize: 60 
            }),
            renderer: {
              render: ({ count, position }) => {
                return new window.google.maps.Marker({
                  position,
                  icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="25" cy="25" r="20" fill="#3b82f6" stroke="#ffffff" stroke-width="3"/>
                        <text x="25" y="30" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${count}</text>
                      </svg>
                    `),
                    scaledSize: new window.google.maps.Size(50, 50),
                    anchor: new window.google.maps.Point(25, 25)
                  },
                  title: `${count} proprietăți în această zonă`
                });
              }
            }
          });
        } catch (error) {
          console.error('Error creating clusterer:', error);
        }
      }
    }

    markersRef.current = newMarkers;
    setMarkers(newMarkers);
  }, [map, properties, zoom, selectedProperty, createEnhancedMarker, createSimpleMarker, onMarkerClick, clearMarkers]);

  // Update selection appearance
  useEffect(() => {
    markersRef.current.forEach(marker => {
      if (!marker.propertyData) return;
      
      const isSelected = selectedProperty && marker.propertyId === selectedProperty.id;
      const property = marker.propertyData;
      
      if (zoom >= ZOOM_THRESHOLD && marker.propertyOverlay) {
        // Show overlay for enhanced mode
        marker.propertyOverlay.setMap(map);
        
        // Update enhanced marker pin
        const color = isSelected ? '#3b82f6' : (property.status === 'finalizată' ? '#10b981' : '#f59e0b');
        marker.setIcon({
          path: "M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7z",
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 1.5,
          anchor: new window.google.maps.Point(12, 24)
        });

        // Update overlay content
        const imageUrl = property.mainImage || '/smartes.png';
        const borderColor = isSelected ? '#3b82f6' : '#ffffff';
        const textBgColor = isSelected ? '#3b82f6' : '#ffffff';
        const textColor = isSelected ? '#ffffff' : '#1f2937';

        if (marker.propertyOverlay.div) {
          marker.propertyOverlay.div.innerHTML = `
            <div style="
              width: 48px;
              height: 48px;
              border-radius: 50%;
              overflow: hidden;
              border: 3px solid ${borderColor};
              background: #f3f4f6;
              margin-bottom: 6px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            ">
              <img 
                src="${imageUrl}" 
                alt="${property.name || property.address}"
                style="width: 100%; height: 100%; object-fit: cover;"
                onerror="this.src='/smartes.png'"
              />
            </div>
            <div style="
              background: ${textBgColor};
              color: ${textColor};
              padding: 4px 8px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: bold;
              box-shadow: 0 1px 4px rgba(0,0,0,0.2);
              max-width: 120px;
              text-align: center;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              border: 1px solid ${isSelected ? '#3b82f6' : '#e5e7eb'};
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            ">
              ${property.name || property.address || 'Proprietate'}
            </div>
          `;
        }
      } else if (zoom < ZOOM_THRESHOLD) {
        // Hide overlay for clustering mode
        if (marker.propertyOverlay) {
          marker.propertyOverlay.setMap(null);
        }
        
        // Update simple marker
        const color = isSelected ? '#3b82f6' : (property.status === 'finalizată' ? '#10b981' : '#f59e0b');
        marker.setIcon({
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 8 : 6,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        });
      }
    });
  }, [selectedProperty, zoom]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, [clearMarkers]);

  return null;
};

export default WorkingClusterManager;
