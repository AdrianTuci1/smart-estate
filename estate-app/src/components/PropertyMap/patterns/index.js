/**
 * Design Patterns Implementation for PropertyMap
 * 
 * This module exports all pattern-based components for the PropertyMap system:
 * 
 * 1. Strategy Pattern - For different clustering and visibility strategies
 * 2. Observer Pattern - For marker state changes and events
 * 3. Factory Pattern - For marker creation and management
 * 4. Facade Pattern - For simplified cluster management interface
 */

// Strategy Pattern exports
export {
  ClusteringStrategy,
  GridClusteringStrategy,
  DistanceClusteringStrategy
} from '../strategies/ClusteringStrategy';

export {
  VisibilityStrategy,
  ZoomBasedVisibilityStrategy,
  PerformanceVisibilityStrategy,
  AdaptiveVisibilityStrategy
} from '../strategies/VisibilityStrategy';

// Observer Pattern exports
export {
  MarkerObserver,
  MarkerSubject,
  MarkerLogger,
  PerformanceMonitor,
  AnalyticsTracker
} from '../observers/MarkerObserver';

// Factory Pattern exports
export {
  MarkerFactory,
  EnhancedMarkerFactory,
  SimpleMarkerFactory,
  MarkerFactoryRegistry
} from '../factories/MarkerFactory';

// Facade Pattern exports
export { ClusterManagerFacade } from '../facades/ClusterManagerFacade';

// Main component export
export { default as EfficientClusterManager } from '../EfficientClusterManager';
