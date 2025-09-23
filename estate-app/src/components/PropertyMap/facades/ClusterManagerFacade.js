/**
 * Facade Pattern for Cluster Management
 * Provides a simplified interface to complex clustering operations
 */
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { MarkerSubject } from '../observers/MarkerObserver';
import { MarkerFactoryRegistry, EnhancedMarkerFactory } from '../factories/MarkerFactory';
import { GridClusteringStrategy } from '../strategies/ClusteringStrategy';
import { ZoomBasedVisibilityStrategy } from '../strategies/VisibilityStrategy';

/**
 * Main facade for cluster management operations
 * Simplifies the complex interactions between different components
 */
export class ClusterManagerFacade {
  constructor(config = {}) {
    this.config = {
      zoomThreshold: 18,
      viewportPadding: 0.1,
      clusteringStrategy: 'grid',
      visibilityStrategy: 'zoom',
      markerType: 'enhanced',
      enableLogging: false,
      ...config
    };

    // Initialize core components
    this.observer = new MarkerSubject();
    this.factoryRegistry = new MarkerFactoryRegistry();
    this.clusteringStrategy = this.createClusteringStrategy();
    this.visibilityStrategy = this.createVisibilityStrategy();
    this.markerFactory = this.createMarkerFactory();

    // State management
    this.markers = new Map();
    this.clusterer = null;
    this.map = null;
    this.lastProperties = [];
    this.selectedProperty = null;
    this.zoom = 0;

    // Setup observers
    this.setupObservers();
  }

  /**
   * Initialize the facade with a map
   */
  initialize(map) {
    this.map = map;
    this.cleanup();
  }

  /**
   * Update properties and handle clustering
   */
  updateProperties(properties, selectedProperty = null, zoom = 0) {
    this.selectedProperty = selectedProperty;
    this.zoom = zoom;

    // Determine which properties to show
    const visibleProperties = this.filterVisibleProperties(properties);
    
    // Update markers
    this.updateMarkers(visibleProperties);
    
    // Update clustering
    this.updateClustering();
    
    // Update visibility
    this.updateVisibility();

    this.lastProperties = visibleProperties;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    // Remove all markers
    this.markers.forEach(marker => {
      this.markerFactory.destroyMarker(marker);
    });
    this.markers.clear();

    // Clear clusterer
    if (this.clusterer) {
      this.clusterer.clearMarkers();
      this.clusterer.setMap(null);
      this.clusterer = null;
    }
  }

  /**
   * Get current state information
   */
  getState() {
    return {
      markerCount: this.markers.size,
      clusterCount: this.clusterer?.clusters?.length || 0,
      zoom: this.zoom,
      selectedProperty: this.selectedProperty
    };
  }

  /**
   * Add an observer for marker events
   */
  addObserver(observer) {
    this.observer.subscribe(observer);
  }

  /**
   * Remove an observer
   */
  removeObserver(observer) {
    this.observer.unsubscribe(observer);
  }

  // Private methods

  createClusteringStrategy() {
    switch (this.config.clusteringStrategy) {
      case 'grid':
        return new GridClusteringStrategy();
      case 'distance':
        // For now, fallback to grid strategy
        // DistanceClusteringStrategy can be imported when needed
        console.warn('Distance clustering strategy not implemented yet, using grid strategy');
        return new GridClusteringStrategy();
      default:
        return new GridClusteringStrategy();
    }
  }

  createVisibilityStrategy() {
    switch (this.config.visibilityStrategy) {
      case 'zoom':
        return new ZoomBasedVisibilityStrategy(this.config.zoomThreshold);
      case 'performance':
        // For now, fallback to zoom strategy
        // PerformanceVisibilityStrategy can be imported when needed
        console.warn('Performance visibility strategy not implemented yet, using zoom strategy');
        return new ZoomBasedVisibilityStrategy(this.config.zoomThreshold);
      case 'adaptive':
        // For now, fallback to zoom strategy
        // AdaptiveVisibilityStrategy can be imported when needed
        console.warn('Adaptive visibility strategy not implemented yet, using zoom strategy');
        return new ZoomBasedVisibilityStrategy(this.config.zoomThreshold);
      default:
        return new ZoomBasedVisibilityStrategy(this.config.zoomThreshold);
    }
  }

  createMarkerFactory() {
    const factory = new EnhancedMarkerFactory(this.observer);
    this.factoryRegistry.setDefaultFactory(factory);
    return factory;
  }

  setupObservers() {
    if (this.config.enableLogging) {
      // Simple console logging for now
      console.log('ClusterManagerFacade: Logging enabled');
    }
  }

  filterVisibleProperties(properties) {
    // For now, return all properties
    // This can be enhanced with viewport-based filtering
    return properties;
  }

  updateMarkers(properties) {
    const currentPropertyIds = new Set(properties.map(p => p.id));
    const existingPropertyIds = new Set(this.lastProperties.map(p => p.id));

    // Remove markers that are no longer visible
    const toRemove = [...existingPropertyIds].filter(id => !currentPropertyIds.has(id));
    toRemove.forEach(id => {
      const marker = this.markers.get(id);
      if (marker) {
        this.observer.notify('onMarkerRemoved', marker, marker.propertyData);
        this.markerFactory.destroyMarker(marker);
        this.markers.delete(id);
      }
    });

    // Create or update markers for visible properties
    properties.forEach(property => {
      const existingMarker = this.markers.get(property.id);
      
      if (existingMarker) {
        // Update existing marker
        this.markerFactory.updateMarker(existingMarker, property, {
          map: this.map,
          selectedProperty: this.selectedProperty,
          zoom: this.zoom
        });
      } else {
        // Create new marker
        const marker = this.markerFactory.createMarker(property, {
          map: this.map,
          onMarkerClick: this.config.onMarkerClick,
          selectedProperty: this.selectedProperty,
          zoom: this.zoom
        });
        
        if (marker) {
          this.markers.set(property.id, marker);
        }
      }
    });
  }

  updateClustering() {
    if (!this.map || this.markers.size === 0) {
      if (this.clusterer) {
        this.clusterer.clearMarkers();
        this.clusterer.setMap(null);
        this.clusterer = null;
      }
      return;
    }

    // Clear existing clusterer
    if (this.clusterer) {
      this.clusterer.clearMarkers();
      this.clusterer.setMap(null);
    }

    // Create new clusterer
    const activeMarkers = Array.from(this.markers.values());
    this.clusterer = new MarkerClusterer({
      map: this.map,
      markers: activeMarkers,
      algorithm: this.clusteringStrategy.createAlgorithm()
    });

    // Add clustering event listener
    this.clusterer.addListener('clusteringend', (event) => {
      this.handleClusteringEnd(event);
    });
  }

  updateVisibility() {
    if (!this.clusterer) return;

    const clusterMap = new Map();
    
    // Build cluster map
    this.clusterer.clusters.forEach(cluster => {
      const isCluster = cluster.markers.length > 1;
      cluster.markers.forEach(marker => {
        clusterMap.set(marker.propertyId, isCluster);
      });
    });

    // Update marker visibility
    this.markers.forEach((marker) => {
      const isInCluster = clusterMap.get(marker.propertyId) || false;
      const isSelected = this.selectedProperty && marker.propertyId === this.selectedProperty.id;
      
      const shouldShow = this.visibilityStrategy.shouldShowMarker(marker, {
        zoom: this.zoom,
        isInCluster,
        isSelected,
        totalMarkers: this.markers.size
      });

      this.visibilityStrategy.updateMarkerVisibility(marker, shouldShow, this.map);
      
      this.observer.notify('onVisibilityChanged', marker, shouldShow);
    });
  }

  handleClusteringEnd(event) {
    this.observer.notify('onClusteringChanged', event.clusters);
    this.updateVisibility();
  }
}
