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

  // Lead drawer state
  selectedLead: null,
  isLeadDrawerOpen: false,
  setSelectedLead: (lead) => set({ selectedLead: lead }),
  setLeadDrawerOpen: (isOpen) => set({ isLeadDrawerOpen: isOpen }),
  
  // Combined lead selection and drawer opening
  selectLead: (lead) => set({ 
    selectedLead: lead, 
    isLeadDrawerOpen: true 
  }),
  
  closeLeadDrawer: () => set({ 
    isLeadDrawerOpen: false, 
    selectedLead: null 
  }),

  // Search state
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // User menu state
  showUserMenu: false,
  setShowUserMenu: (show) => set({ showUserMenu: show }),

  // Map view state for controlling map position and zoom
  mapCenter: { lat: 46.7704, lng: 23.5918 }, // Default to Cluj-Napoca
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
