import { useState, useRef } from 'react';
import { Map, Users, Search, X, LogOut, ChevronDown, Building2, Settings } from 'lucide-react';
import SearchResults from './SearchResults';
import useAppStore from '../stores/useAppStore';
import useSearchStore from '../stores/useSearchStore';


const NavigationDock = ({ onSearch, onResultSelect, onCitySelect, user, onLogout }) => {
  const { activeView, setActiveView, isDrawerOpen, showUserMenu, setShowUserMenu, setMapCenter } = useAppStore();
  const { 
    searchQuery, 
    setSearchQuery, 
    isSearchFocused, 
    setSearchFocused, 
    showResults, 
    setShowResults,
    clearSearch 
  } = useSearchStore();
  const searchInputRef = useRef(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Debounce search
    if (onSearch) {
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(() => {
        onSearch(value);
      }, 300);
    }
  };

  const handleClearSearch = () => {
    clearSearch();
    if (onSearch) {
      onSearch('');
    }
  };

  const handleSearchFocus = () => {
    setSearchFocused(true);
  };

  const handleSearchBlur = () => {
    // Delay pentru a permite click pe rezultate
    setTimeout(() => {
      setSearchFocused(false);
      setShowResults(false);
    }, 200);
  };

  const handleResultSelect = (result) => {
    setSearchQuery(result.name || result.display);
    setShowResults(false);
    
    // If result has coordinates, center the map
    if (result.lat && result.lng) {
      setMapCenter({ lat: result.lat, lng: result.lng });
    }
    
    if (onResultSelect) {
      onResultSelect(result);
    }
  };

  const handleCitySelect = (city) => {
    setSearchQuery(city.name);
    setShowResults(false);
    
    // Center map on selected city using coordinates from server
    if (city.lat && city.lng) {
      setMapCenter({ lat: city.lat, lng: city.lng });
    }
    
    if (onCitySelect) {
      onCitySelect(city);
    }
  };

  const closeResults = () => {
    setShowResults(false);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout();
  };

  const getSearchPlaceholder = () => {
    return 'Căutați proprietăți...';
  };

  return (
    <div className={`dock px-4 py-3 transition-transform duration-300 ease-in-out ${
      isDrawerOpen ? '-translate-y-20' : 'translate-y-0'
    }`}>
      <div className="flex items-center space-x-3">
        {/* Navigation Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveView('map')}
            className={`flex items-center justify-center p-2 rounded-xl transition-all duration-200 ${
              activeView === 'map'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'bg-white/60 text-muted-foreground hover:bg-white/80 hover:text-foreground'
            }`}
          >
            <Map className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setActiveView('properties')}
            className={`flex items-center justify-center p-2 rounded-xl transition-all duration-200 ${
              activeView === 'properties'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'bg-white/60 text-muted-foreground hover:bg-white/80 hover:text-foreground'
            }`}
          >
            <Building2 className="h-4 w-4" />
          </button>
          
          {user?.role === 'admin' && (
            <button
              onClick={() => setActiveView('settings')}
              className={`flex items-center justify-center p-2 rounded-xl transition-all duration-200 ${
                activeView === 'settings'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-white/60 text-muted-foreground hover:bg-white/80 hover:text-foreground'
              }`}
              title="Setări Administrator"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              placeholder={getSearchPlaceholder()}
              className={`w-full pl-9 pr-9 py-2 bg-white/60 border border-white/30 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 ${
                isSearchFocused ? 'bg-white/80 shadow-lg' : ''
              }`}
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          
          {/* Search Results */}
          <SearchResults
            query={searchQuery}
            isOpen={showResults}
            onClose={closeResults}
            onResultSelect={handleResultSelect}
            onCitySelect={handleCitySelect}
            position="bottom"
          />
          
        </div>

        {/* User Avatar */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-1 p-1.5 hover:bg-white/20 rounded-xl transition-colors"
          >
            <div className="h-7 w-7 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-medium">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {/* User Menu */}
          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute top-full right-0 mt-2 bg-popover rounded-lg shadow-lg border border-border py-2 min-w-48 z-50">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-sm font-medium text-popover-foreground">{user.username}</p>
                  <p className="text-xs text-muted-foreground">{user.companyAlias}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Deconectare</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavigationDock;
