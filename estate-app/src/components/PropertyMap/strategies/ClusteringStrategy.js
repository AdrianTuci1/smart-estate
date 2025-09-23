import { GridAlgorithm } from '@googlemaps/markerclusterer';

/**
 * Strategy Pattern for Clustering Algorithms
 * Defines the interface for different clustering strategies
 */
export class ClusteringStrategy {
  createAlgorithm() {
    throw new Error('createAlgorithm() must be implemented by subclass');
  }

  getConfig() {
    throw new Error('getConfig() must be implemented by subclass');
  }
}

/**
 * Grid-based clustering strategy
 */
export class GridClusteringStrategy extends ClusteringStrategy {
  constructor(config = {}) {
    super();
    this.config = {
      maxDistance: 50000,
      gridSize: 60,
      ...config
    };
  }

  createAlgorithm() {
    return new GridAlgorithm({
      maxDistance: this.config.maxDistance,
      gridSize: this.config.gridSize
    });
  }

  getConfig() {
    return this.config;
  }
}

/**
 * Distance-based clustering strategy
 * Note: DistanceBasedAlgorithm is not available in the current version
 * This is a placeholder for future implementation
 */
export class DistanceClusteringStrategy extends ClusteringStrategy {
  constructor(config = {}) {
    super();
    this.config = {
      maxDistance: 40000,
      ...config
    };
  }

  createAlgorithm() {
    // Fallback to GridAlgorithm since DistanceBasedAlgorithm is not available
    console.warn('DistanceBasedAlgorithm not available, using GridAlgorithm');
    return new GridAlgorithm({
      maxDistance: this.config.maxDistance,
      gridSize: 60
    });
  }

  getConfig() {
    return this.config;
  }
}
