import { create } from 'zustand';

const useSearchStore = create((set, get) => ({
  // Search state
  searchQuery: '',
  isSearchFocused: false,
  showResults: false,
  searchResults: [],

  // Search actions
  setSearchQuery: (query) => set({ 
    searchQuery: query,
    showResults: query.length > 0
  }),

  setSearchFocused: (focused) => set({ 
    isSearchFocused: focused,
    showResults: focused && get().searchQuery.length > 0
  }),

  setShowResults: (show) => set({ showResults: show }),

  setSearchResults: (results) => set({ searchResults: results }),

  clearSearch: () => set({ 
    searchQuery: '', 
    showResults: false,
    searchResults: []
  }),

  // Combined actions
  handleSearch: (query) => {
    set({ 
      searchQuery: query,
      showResults: query.length > 0
    });
    
    // Here you would typically trigger the actual search
    // For now, we'll just set empty results
    set({ searchResults: [] });
  }
}));

export default useSearchStore;
