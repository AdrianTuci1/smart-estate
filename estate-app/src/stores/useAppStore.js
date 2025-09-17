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

  // Leads state management
  leads: [],
  setLeads: (leads) => set({ leads }),
  addLead: (lead) => set((state) => ({ leads: [lead, ...state.leads] })),
  updateLead: (leadId, updatedLead) => set((state) => ({
    leads: state.leads.map(lead => lead.id === leadId ? { ...lead, ...updatedLead } : lead)
  })),
  removeLead: (leadId) => set((state) => ({
    leads: state.leads.filter(lead => lead.id !== leadId)
  })),

  // Optimistic lead creation function
  createLeadOptimistic: async (leadData) => {
    const { addLead, removeLead } = get();
    
    // Generate a temporary ID for the optimistic update
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticLead = {
      ...leadData,
      id: tempId,
      lastContact: new Date().toISOString().split('T')[0],
      isOptimistic: true // Flag to identify optimistic updates
    };

    // Add to UI immediately (optimistic update)
    addLead(optimisticLead);

    try {
      // Import apiService dynamically to avoid circular dependency
      const { default: apiService } = await import('../services/api');
      
      // Make the actual API call
      const response = await apiService.createLead(leadData);
      
      if (response.success && response.data) {
        // Replace the optimistic lead with the real one from the server
        removeLead(tempId);
        addLead(response.data);
        return { success: true, data: response.data };
      } else {
        // Remove the optimistic lead on failure
        removeLead(tempId);
        return { success: false, error: response.error || 'Failed to create lead' };
      }
    } catch (error) {
      // Remove the optimistic lead on error
      removeLead(tempId);
      console.error('Error creating lead:', error);
      return { success: false, error: error.message || 'Failed to create lead' };
    }
  },

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
