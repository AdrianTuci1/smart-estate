import { useEffect, useRef, useCallback, useMemo } from "react";
import { ClusterManagerFacade } from "./facades/ClusterManagerFacade";

/**
 * Refactored EfficientClusterManager using Design Patterns
 * 
 * Applied Patterns:
 * - Strategy Pattern: For clustering algorithms and visibility strategies
 * - Observer Pattern: For marker state changes and events
 * - Factory Pattern: For marker creation and management
 * - Facade Pattern: For simplified cluster management interface
 */
const EfficientClusterManager = ({ 
  map, 
  properties, 
  selectedProperty, 
  onMarkerClick, 
  zoom,
  config = {}
}) => {
  const facadeRef = useRef(null);
  const lastPropertiesRef = useRef([]);
  const performanceMonitorRef = useRef(null);

  // Initialize facade with configuration
  const initializeFacade = useCallback(() => {
    if (!facadeRef.current) {
      facadeRef.current = new ClusterManagerFacade({
        zoomThreshold: 18,
        viewportPadding: 0.1,
        clusteringStrategy: 'grid',
        visibilityStrategy: 'zoom',
        markerType: 'enhanced',
        enableLogging: process.env.NODE_ENV === 'development',
        onMarkerClick,
        ...config
      });

      // Add performance monitoring in development
      if (process.env.NODE_ENV === 'development') {
        console.log('EfficientClusterManager: Development mode with performance monitoring');
      }
    }
  }, [onMarkerClick, config]);

  // Initialize facade when map is available
  useEffect(() => {
    if (map && !facadeRef.current) {
      initializeFacade();
      facadeRef.current.initialize(map);
    }
  }, [map, initializeFacade]);

  // Update properties when they change
  useEffect(() => {
    if (!facadeRef.current || !properties) return;

    facadeRef.current.updateProperties(properties, selectedProperty, zoom);
    lastPropertiesRef.current = properties;
  }, [properties, selectedProperty, zoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (facadeRef.current) {
        facadeRef.current.cleanup();
        facadeRef.current = null;
      }
    };
  }, []);

  // Debug information in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        console.log('Cluster Manager: Development mode active');
      }, 10000); // Log every 10 seconds

      return () => clearInterval(interval);
    }
  }, []);

  return null;
};

export default EfficientClusterManager;
