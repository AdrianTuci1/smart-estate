/**
 * Strategy Pattern for Visibility Logic
 * Defines different strategies for marker visibility
 */
export class VisibilityStrategy {
  shouldShowMarker(marker, context) {
    throw new Error('shouldShowMarker() must be implemented by subclass');
  }

  updateMarkerVisibility(marker, shouldShow, map) {
    if (!marker.propertyOverlay) return;

    if (shouldShow && marker.propertyOverlay.getMap() !== map) {
      marker.propertyOverlay.setMap(map);
    }

    marker.propertyOverlay.updateVisibility?.(shouldShow);
  }
}

/**
 * Zoom-based visibility strategy
 */
export class ZoomBasedVisibilityStrategy extends VisibilityStrategy {
  constructor(zoomThreshold = 18) {
    super();
    this.zoomThreshold = zoomThreshold;
  }

  shouldShowMarker(marker, context) {
    const { zoom, isInCluster, isSelected } = context;
    
    return isSelected || 
           (zoom >= this.zoomThreshold) || 
           (!isInCluster && zoom < this.zoomThreshold);
  }
}

/**
 * Performance-based visibility strategy
 * Shows fewer markers at lower zoom levels for better performance
 */
export class PerformanceVisibilityStrategy extends VisibilityStrategy {
  constructor(zoomThreshold = 16, maxMarkers = 100) {
    super();
    this.zoomThreshold = zoomThreshold;
    this.maxMarkers = maxMarkers;
  }

  shouldShowMarker(marker, context) {
    const { zoom, isInCluster, isSelected, totalMarkers } = context;
    
    // Always show selected markers
    if (isSelected) return true;
    
    // At high zoom, show all markers
    if (zoom >= this.zoomThreshold) return true;
    
    // At low zoom, limit number of visible markers
    if (totalMarkers > this.maxMarkers && zoom < this.zoomThreshold) {
      return !isInCluster; // Only show unclustered markers
    }
    
    return !isInCluster;
  }
}

/**
 * Adaptive visibility strategy
 * Adjusts visibility based on map performance and user interaction
 */
export class AdaptiveVisibilityStrategy extends VisibilityStrategy {
  constructor() {
    super();
    this.performanceMetrics = {
      lastRenderTime: 0,
      frameRate: 60,
      visibleMarkers: 0
    };
  }

  shouldShowMarker(marker, context) {
    const { zoom, isInCluster, isSelected } = context;
    
    // Always show selected markers
    if (isSelected) return true;
    
    // Adaptive logic based on performance
    if (this.performanceMetrics.frameRate < 30) {
      // Poor performance - show fewer markers
      return zoom >= 17 && !isInCluster;
    }
    
    // Good performance - show more markers
    return zoom >= 16 || !isInCluster;
  }

  updatePerformanceMetrics(renderTime, visibleCount) {
    this.performanceMetrics.lastRenderTime = renderTime;
    this.performanceMetrics.visibleMarkers = visibleCount;
    this.performanceMetrics.frameRate = 1000 / renderTime;
  }
}
