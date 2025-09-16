import { useState, useEffect, useRef } from 'react';
import { MapPin, Users, Building2, X, Clock, TrendingUp } from 'lucide-react';
import apiService from '../services/api';
import useAppStore from '../stores/useAppStore';

const SearchResults = ({ 
  query, 
  isOpen, 
  onClose, 
  onResultSelect, 
  onCitySelect,
  position 
}) => {
  const [results, setResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const resultsRef = useRef(null);
  const { activeView } = useAppStore();

  useEffect(() => {
    if (!isOpen) {
      setResults([]);
      setRecommendations([]);
      setSelectedIndex(-1);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        if (!query || query.trim().length < 2) {
          // Get recommendations when no query
          const response = await apiService.getSearchRecommendations(activeView);
          if (response.success) {
            setRecommendations(response.data);
          }
          setResults([]);
        } else {
          // Get search suggestions
          const response = await apiService.getSearchSuggestions(query, activeView);
          if (response.success) {
            setResults(response.data);
            setRecommendations([]);
          }
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
        setResults([]);
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query, isOpen, activeView]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      const totalItems = results.length + recommendations.length;
      if (totalItems === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < totalItems - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : totalItems - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < totalItems) {
            const allItems = [...results.leads, ...results.properties, ...results.cities, ...recommendations.popular, ...recommendations.recent];
            if (allItems[selectedIndex]) {
              handleResultClick(allItems[selectedIndex]);
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, recommendations, selectedIndex]);

  const handleResultClick = (result) => {
    if (result.type === 'city') {
      onCitySelect(result);
    } else {
      onResultSelect(result);
    }
    onClose();
  };

  const renderRecommendations = () => {
    if (!recommendations || (!recommendations.popular?.length && !recommendations.recent?.length)) {
      return null;
    }

    return (
      <div className="space-y-4">
        {recommendations.popular?.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <TrendingUp className="h-3 w-3" />
              <span>Orașe populare</span>
            </div>
            {recommendations.popular.map((item, index) => (
              <button
                key={`popular-${index}`}
                onClick={() => handleResultClick(item)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                  selectedIndex === index ? 'bg-gray-50' : ''
                }`}
              >
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.display}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.count} proprietăți
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {recommendations.recent?.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <Clock className="h-3 w-3" />
              <span>Recent</span>
            </div>
            {recommendations.recent.map((item, index) => {
              const globalIndex = (recommendations.popular?.length || 0) + index;
              const Icon = item.type === 'lead' ? Users : Building2;
              
              return (
                <button
                  key={`recent-${index}`}
                  onClick={() => handleResultClick(item)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                    selectedIndex === globalIndex ? 'bg-gray-50' : ''
                  }`}
                >
                  <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.display}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {item.type === 'lead' ? 'Lead' : 'Proprietate'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderSearchResults = () => {
    if (!results || (!results.leads?.length && !results.properties?.length && !results.cities?.length)) {
      return null;
    }

    const allItems = [...(results.leads || []), ...(results.properties || []), ...(results.cities || [])];
    const recommendationsCount = (recommendations.popular?.length || 0) + (recommendations.recent?.length || 0);

    return (
      <div className="space-y-4">
        {results.leads?.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <Users className="h-3 w-3" />
              <span>Lead-uri</span>
            </div>
            {results.leads.map((item, index) => {
              const globalIndex = recommendationsCount + index;
              return (
                <button
                  key={`lead-${item.id}`}
                  onClick={() => handleResultClick(item)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                    selectedIndex === globalIndex ? 'bg-gray-50' : ''
                  }`}
                >
                  <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.display}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {results.properties?.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <Building2 className="h-3 w-3" />
              <span>Proprietăți</span>
            </div>
            {results.properties.map((item, index) => {
              const globalIndex = recommendationsCount + (results.leads?.length || 0) + index;
              return (
                <button
                  key={`property-${item.id}`}
                  onClick={() => handleResultClick(item)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                    selectedIndex === globalIndex ? 'bg-gray-50' : ''
                  }`}
                >
                  <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.display}
                    </div>
                    {item.type === 'property' && item.address && item.address !== item.display && (
                      <div className="text-xs text-gray-500 truncate">
                        {item.address}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {results.cities?.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <MapPin className="h-3 w-3" />
              <span>Orașe</span>
            </div>
            {results.cities.map((item, index) => {
              const globalIndex = recommendationsCount + (results.leads?.length || 0) + (results.properties?.length || 0) + index;
              return (
                <button
                  key={`city-${item.name}`}
                  onClick={() => handleResultClick(item)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                    selectedIndex === globalIndex ? 'bg-gray-50' : ''
                  }`}
                >
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.display}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={resultsRef}
      className={`absolute left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto z-50 ${
        position === 'top' ? 'top-auto bottom-full mb-1' : 'top-full mt-1'
      }`}
    >
      {isLoading ? (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Se încarcă...</p>
        </div>
      ) : (
        <>
          {renderRecommendations()}
          {renderSearchResults()}
          
          {!isLoading && !recommendations && !results && (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">Nu s-au găsit rezultate</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchResults;