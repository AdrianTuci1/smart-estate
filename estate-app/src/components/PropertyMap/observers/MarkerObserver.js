/**
 * Observer Pattern for Marker State Changes
 * Allows components to subscribe to marker events and state changes
 */

/**
 * Base Observer interface
 */
export class MarkerObserver {
  onMarkerCreated(marker, property) {
    // Override in subclasses
  }

  onMarkerUpdated(marker, property, changes) {
    // Override in subclasses
  }

  onMarkerRemoved(marker, property) {
    // Override in subclasses
  }

  onMarkerSelected(marker, property) {
    // Override in subclasses
  }

  onMarkerDeselected(marker, property) {
    // Override in subclasses
  }

  onClusteringChanged(clusters) {
    // Override in subclasses
  }

  onVisibilityChanged(marker, isVisible) {
    // Override in subclasses
  }
}

/**
 * Subject class that manages observers
 */
export class MarkerSubject {
  constructor() {
    this.observers = new Set();
  }

  subscribe(observer) {
    if (!(observer instanceof MarkerObserver)) {
      throw new Error('Observer must extend MarkerObserver class');
    }
    this.observers.add(observer);
  }

  unsubscribe(observer) {
    this.observers.delete(observer);
  }

  notify(eventType, ...args) {
    this.observers.forEach(observer => {
      if (typeof observer[eventType] === 'function') {
        try {
          observer[eventType](...args);
        } catch (error) {
          console.error(`Error in observer ${observer.constructor.name}:`, error);
        }
      }
    });
  }
}

/**
 * Concrete observer for logging marker events
 */
export class MarkerLogger extends MarkerObserver {
  constructor(enableLogging = false) {
    super();
    this.enableLogging = enableLogging;
  }

  onMarkerCreated(marker, property) {
    if (this.enableLogging) {
      console.log(`Marker created for property: ${property.id}`, property);
    }
  }

  onMarkerUpdated(marker, property, changes) {
    if (this.enableLogging) {
      console.log(`Marker updated for property: ${property.id}`, changes);
    }
  }

  onMarkerRemoved(marker, property) {
    if (this.enableLogging) {
      console.log(`Marker removed for property: ${property.id}`);
    }
  }

  onMarkerSelected(marker, property) {
    if (this.enableLogging) {
      console.log(`Marker selected: ${property.id}`);
    }
  }

  onClusteringChanged(clusters) {
    if (this.enableLogging) {
      console.log(`Clustering changed: ${clusters.length} clusters`);
    }
  }

  onVisibilityChanged(marker, isVisible) {
    if (this.enableLogging) {
      console.log(`Marker visibility changed: ${marker.propertyId} -> ${isVisible}`);
    }
  }
}

/**
 * Concrete observer for performance monitoring
 */
export class PerformanceMonitor extends MarkerObserver {
  constructor() {
    super();
    this.metrics = {
      markersCreated: 0,
      markersUpdated: 0,
      markersRemoved: 0,
      clusteringEvents: 0,
      visibilityChanges: 0,
      startTime: Date.now()
    };
  }

  onMarkerCreated(marker, property) {
    this.metrics.markersCreated++;
  }

  onMarkerUpdated(marker, property, changes) {
    this.metrics.markersUpdated++;
  }

  onMarkerRemoved(marker, property) {
    this.metrics.markersRemoved++;
  }

  onClusteringChanged(clusters) {
    this.metrics.clusteringEvents++;
  }

  onVisibilityChanged(marker, isVisible) {
    this.metrics.visibilityChanges++;
  }

  getMetrics() {
    const runtime = Date.now() - this.metrics.startTime;
    return {
      ...this.metrics,
      runtime,
      averageMarkersPerSecond: this.metrics.markersCreated / (runtime / 1000)
    };
  }

  reset() {
    this.metrics = {
      markersCreated: 0,
      markersUpdated: 0,
      markersRemoved: 0,
      clusteringEvents: 0,
      visibilityChanges: 0,
      startTime: Date.now()
    };
  }
}

/**
 * Concrete observer for analytics tracking
 */
export class AnalyticsTracker extends MarkerObserver {
  constructor(analyticsService = null) {
    super();
    this.analyticsService = analyticsService;
  }

  onMarkerSelected(marker, property) {
    if (this.analyticsService) {
      this.analyticsService.track('marker_selected', {
        propertyId: property.id,
        propertyType: property.type,
        location: property.position
      });
    }
  }

  onClusteringChanged(clusters) {
    if (this.analyticsService) {
      this.analyticsService.track('clustering_changed', {
        clusterCount: clusters.length,
        totalMarkers: clusters.reduce((sum, cluster) => sum + cluster.markers.length, 0)
      });
    }
  }
}
