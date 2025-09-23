/**
 * Factory Pattern for Marker Creation and Management
 * Centralizes marker creation logic and provides different marker types
 */
import { createEnhancedMarker } from '../createEnhancedMarker';

/**
 * Base factory interface for marker creation
 */
export class MarkerFactory {
  createMarker(property, context) {
    throw new Error('createMarker() must be implemented by subclass');
  }

  updateMarker(marker, property, context) {
    throw new Error('updateMarker() must be implemented by subclass');
  }

  destroyMarker(marker) {
    if (marker.propertyOverlay) {
      marker.propertyOverlay.setMap(null);
    }
    marker.setMap(null);
  }
}

/**
 * Enhanced marker factory with overlay support
 */
export class EnhancedMarkerFactory extends MarkerFactory {
  constructor(observer = null) {
    super();
    this.observer = observer;
  }

  createMarker(property, context) {
    const { map, onMarkerClick, selectedProperty } = context;
    
    if (!map || !property.position) {
      return null;
    }

    const marker = createEnhancedMarker(property, map, onMarkerClick, selectedProperty);
    
    if (marker) {
      marker.propertyId = property.id;
      marker.propertyData = property;
      
      // Notify observer
      if (this.observer) {
        this.observer.notify('onMarkerCreated', marker, property);
      }
    }

    return marker;
  }

  updateMarker(marker, property, context) {
    if (!marker || !property) return marker;

    const changes = this.detectChanges(marker.propertyData, property);
    
    if (changes.hasChanges) {
      // Update position if changed
      if (changes.positionChanged && marker.getPosition() !== property.position) {
        marker.setPosition(property.position);
      }

      // Update property data
      marker.propertyData = property;

      // Update visual properties
      if (changes.visualChanged) {
        this.updateMarkerVisuals(marker, property, context);
      }

      // Notify observer
      if (this.observer) {
        this.observer.notify('onMarkerUpdated', marker, property, changes);
      }
    }

    return marker;
  }

  detectChanges(oldProperty, newProperty) {
    const changes = {
      hasChanges: false,
      positionChanged: false,
      visualChanged: false,
      dataChanged: false
    };

    if (!oldProperty || !newProperty) {
      changes.hasChanges = true;
      changes.dataChanged = true;
      return changes;
    }

    // Check position changes
    if (JSON.stringify(oldProperty.position) !== JSON.stringify(newProperty.position)) {
      changes.positionChanged = true;
      changes.hasChanges = true;
    }

    // Check visual properties
    const visualProps = ['status', 'name', 'mainImage', 'address'];
    for (const prop of visualProps) {
      if (oldProperty[prop] !== newProperty[prop]) {
        changes.visualChanged = true;
        changes.hasChanges = true;
        break;
      }
    }

    // Check other data changes
    if (JSON.stringify(oldProperty) !== JSON.stringify(newProperty)) {
      changes.dataChanged = true;
      changes.hasChanges = true;
    }

    return changes;
  }

  updateMarkerVisuals(marker, property, context) {
    if (!marker.propertyOverlay) return;

    const { selectedProperty } = context;
    const isSelected = selectedProperty && selectedProperty.id === property.id;
    const statusColor = property.status === 'finalizată' ? '#10b981' : '#f59e0b';
    const borderColor = isSelected ? '#3b82f6' : statusColor;

    marker.propertyOverlay.updateBorderColor(borderColor);
  }
}

/**
 * Simple marker factory without overlays
 */
export class SimpleMarkerFactory extends MarkerFactory {
  constructor(observer = null) {
    super();
    this.observer = observer;
  }

  createMarker(property, context) {
    const { map } = context;
    
    if (!map || !property.position) {
      return null;
    }

    const marker = new window.google.maps.Marker({
      position: property.position,
      title: property.name || property.address,
      icon: this.getMarkerIcon(property)
    });

    marker.propertyId = property.id;
    marker.propertyData = property;

    // Notify observer
    if (this.observer) {
      this.observer.notify('onMarkerCreated', marker, property);
    }

    return marker;
  }

  updateMarker(marker, property, context) {
    if (!marker || !property) return marker;

    const changes = this.detectChanges(marker.propertyData, property);
    
    if (changes.hasChanges) {
      if (changes.positionChanged) {
        marker.setPosition(property.position);
      }

      if (changes.visualChanged) {
        marker.setIcon(this.getMarkerIcon(property));
      }

      marker.propertyData = property;

      // Notify observer
      if (this.observer) {
        this.observer.notify('onMarkerUpdated', marker, property, changes);
      }
    }

    return marker;
  }

  getMarkerIcon(property) {
    const statusColor = property.status === 'finalizată' ? '#10b981' : '#f59e0b';
    
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: statusColor,
      fillOpacity: 0.8,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 8
    };
  }

  detectChanges(oldProperty, newProperty) {
    const changes = {
      hasChanges: false,
      positionChanged: false,
      visualChanged: false,
      dataChanged: false
    };

    if (!oldProperty || !newProperty) {
      changes.hasChanges = true;
      changes.dataChanged = true;
      return changes;
    }

    // Check position changes
    if (JSON.stringify(oldProperty.position) !== JSON.stringify(newProperty.position)) {
      changes.positionChanged = true;
      changes.hasChanges = true;
    }

    // Check visual properties
    const visualProps = ['status', 'name'];
    for (const prop of visualProps) {
      if (oldProperty[prop] !== newProperty[prop]) {
        changes.visualChanged = true;
        changes.hasChanges = true;
        break;
      }
    }

    return changes;
  }
}

/**
 * Marker factory registry for different marker types
 */
export class MarkerFactoryRegistry {
  constructor() {
    this.factories = new Map();
    this.defaultFactory = null;
  }

  registerFactory(type, factory) {
    if (!(factory instanceof MarkerFactory)) {
      throw new Error('Factory must extend MarkerFactory class');
    }
    this.factories.set(type, factory);
  }

  setDefaultFactory(factory) {
    if (!(factory instanceof MarkerFactory)) {
      throw new Error('Factory must extend MarkerFactory class');
    }
    this.defaultFactory = factory;
  }

  getFactory(type) {
    return this.factories.get(type) || this.defaultFactory;
  }

  createMarker(type, property, context) {
    const factory = this.getFactory(type);
    if (!factory) {
      throw new Error(`No factory found for type: ${type}`);
    }
    return factory.createMarker(property, context);
  }

  updateMarker(type, marker, property, context) {
    const factory = this.getFactory(type);
    if (!factory) {
      throw new Error(`No factory found for type: ${type}`);
    }
    return factory.updateMarker(marker, property, context);
  }
}
