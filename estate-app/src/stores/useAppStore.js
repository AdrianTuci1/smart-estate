import { create } from 'zustand';

const useAppStore = create((set, get) => ({
  // Active view state
  activeView: 'map',
  setActiveView: (view) => set({ activeView: view }),

  // Property drawer state
  selectedProperty: null,
  isDrawerOpen: false,
  setSelectedProperty: (property) => set({ selectedProperty: property }),
  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  
  // Combined property selection and drawer opening
  selectProperty: (property) => set({ 
    selectedProperty: property, 
    isDrawerOpen: true 
  }),
  
  closeDrawer: () => set({ 
    isDrawerOpen: false, 
    selectedProperty: null 
  }),


  // Search state
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // User menu state
  showUserMenu: false,
  setShowUserMenu: (show) => set({ showUserMenu: show }),

  // Properties state management
  properties: [],
  setProperties: (properties) => set({ properties }),
  addProperty: (property) => set((state) => ({ properties: [property, ...state.properties] })),
  updateProperty: (propertyId, updatedProperty) => set((state) => ({
    properties: state.properties.map(property => property.id === propertyId ? { ...property, ...updatedProperty } : property)
  })),
  removeProperty: (propertyId) => set((state) => ({
    properties: state.properties.filter(property => property.id !== propertyId)
  })),

  // Map view state for controlling map position and zoom
  mapCenter: { lat: 44.4268, lng: 26.1025 }, // Default to Cluj-Napoca
  mapZoom: 14, // Default zoom level
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  setMapView: (center, zoom) => set({ mapCenter: center, mapZoom: zoom }),
  
  // Load map view from localStorage
  loadMapView: () => {
    try {
      const savedView = localStorage.getItem('smart-estate-map-view');
      if (savedView) {
        const { center, zoom } = JSON.parse(savedView);
        set({ mapCenter: center, mapZoom: zoom });
      }
    } catch (error) {
      console.error('Failed to load map view from localStorage:', error);
    }
  },
  
  // Save map view to localStorage
  saveMapView: (center, zoom) => {
    try {
      const mapView = { center, zoom };
      localStorage.setItem('smart-estate-map-view', JSON.stringify(mapView));
    } catch (error) {
      console.error('Failed to save map view to localStorage:', error);
    }
  },
}));

export default useAppStore;
