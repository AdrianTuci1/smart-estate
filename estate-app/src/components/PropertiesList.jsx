import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Building2, MapPin, Plus, Eye, FileText, Users, FileImage, ChevronDown } from 'lucide-react';
import apiService from '../services/api';
import useAppStore from '../stores/useAppStore';
import { useAuth } from '../contexts/AuthContext';

const PropertiesList = ({ searchTerm = '' }) => {
  const { user } = useAuth();
  const { 
    selectProperty, 
    setDrawerOpen, 
    properties, 
    setProperties, 
    addProperty, 
    updateProperty, 
    removeProperty 
  } = useAppStore();
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    hasMore: false,
    lastKey: null
  });
  const [allProperties, setAllProperties] = useState([]);
  const observerRef = useRef(null);

  // Load properties from API with pagination
  const loadProperties = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setAllProperties([]);
        setPagination(prev => ({ ...prev, page: 1, lastKey: null }));
      }
      
      setError(null);
      
      const params = {
        page: isLoadMore ? pagination.page + 1 : 1,
        limit: pagination.limit,
        ...(pagination.lastKey && isLoadMore && { lastKey: pagination.lastKey })
      };
      
      const response = await apiService.getProperties(params);
      
      if (response.success && response.data) {
        if (isLoadMore) {
          setAllProperties(prev => [...prev, ...response.data]);
        } else {
          setAllProperties(response.data);
        }
        
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          hasMore: response.pagination.hasMore,
          lastKey: response.pagination.lastKey
        });
        
        // Update store with all properties for compatibility
        setProperties(isLoadMore ? [...allProperties, ...response.data] : response.data);
      } else {
        setError('Nu s-au putut încărca proprietățile');
      }
    } catch (err) {
      console.error('Failed to load properties:', err);
      setError('Eroare la încărcarea proprietăților');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [pagination, allProperties, setProperties]);

  // Load more properties
  const loadMoreProperties = useCallback(() => {
    if (pagination.hasMore && !isLoadingMore) {
      loadProperties(true);
    }
  }, [pagination.hasMore, isLoadingMore, loadProperties]);

  // Initial load
  useEffect(() => {
    if (properties.length === 0) {
      loadProperties(false);
    } else {
      setAllProperties(properties);
      setIsLoading(false);
    }
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasMore && !isLoadingMore) {
          loadMoreProperties();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [pagination.hasMore, isLoadingMore, loadMoreProperties]);

  const filteredAndSortedProperties = useMemo(() => {
    let filtered = allProperties.filter(property =>
      property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      // Handle null/undefined values
      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;
      
      // For string fields (name, address, status), use localeCompare for proper alphabetical sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue, 'ro', { 
          sensitivity: 'base',
          numeric: true 
        });
        return sortDirection === 'asc' ? result : -result;
      }
      
      // For numeric fields, use numeric comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Fallback to string comparison
      const result = String(aValue).localeCompare(String(bValue), 'ro', { 
        sensitivity: 'base',
        numeric: true 
      });
      return sortDirection === 'asc' ? result : -result;
    });

    return filtered;
  }, [allProperties, searchTerm, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
    selectProperty(property);
  };

  const handleCreateProperty = () => {
    // Check if user can manage properties
    const canManageProperties = ['admin', 'Moderator', 'PowerUser'].includes(user?.role);
    if (!canManageProperties) {
      setError('Nu aveți permisiuni pentru a crea proprietăți. Contactați administratorul.');
      return;
    }
    setDrawerOpen(true);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <div className="w-4 h-4" />;
    }
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'în construcție':
        return 'bg-blue-100 text-blue-800';
      case 'finalizat':
        return 'bg-green-100 text-green-800';
      case 'planificat':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspendat':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Small spacing on mobile */}
      <div className="h-8 md:hidden"></div>
      
      {/* Header - hidden on mobile to avoid dock overlap */}
      <div className="hidden md:block p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Proprietăți</h1>
            <span className="bg-primary-100 text-primary-800 text-sm font-medium px-2 py-1 rounded-full">
              {filteredAndSortedProperties.length}
            </span>
          </div>
          {/* Desktop Add Button */}
          {['admin', 'Moderator', 'PowerUser'].includes(user?.role) && (
            <button 
              onClick={handleCreateProperty}
              className="btn btn-primary flex items-center space-x-2 p-2"
            >
              <Plus className="h-4 w-4" />
              <span>Adaugă Proprietate</span>
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Se încarcă proprietățile...</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <div className="flex-1 overflow-auto">
          <div className="min-w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th
                    className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Nume</span>
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th
                    className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {getSortIcon('status')}
                    </div>
                  </th>
                  {/* Hide address column on mobile */}
                  <th
                    className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('address')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Adresă</span>
                      {getSortIcon('address')}
                    </div>
                  </th>
                  {/* Hide actions column on mobile */}
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acțiuni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedProperties.map((property) => (
                  <tr
                    key={property.id}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedProperty?.id === property.id ? 'bg-primary-50' : ''
                    }`}
                    onClick={() => handlePropertyClick(property)}
                  >
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <Building2 className="h-4 w-4 md:h-5 md:w-5 text-primary-600" />
                        </div>
                        <div className="ml-3 md:ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {property.name}
                          </div>
                          {/* Show address on mobile as subtitle */}
                          <div className="md:hidden text-xs text-gray-500 truncate max-w-32">
                            {property.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                        {property.status}
                      </span>
                    </td>
                    {/* Hide address column on mobile */}
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="truncate max-w-xs">
                          {property.address}
                        </span>
                      </div>
                    </td>
                    {/* Hide actions column on mobile */}
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePropertyClick(property);
                          }}
                          className="text-primary-600 hover:text-primary-900 p-1"
                          title="Vezi detalii"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Load More Section */}
            {pagination.hasMore && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex justify-center">
                  {isLoadingMore ? (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      <span>Se încarcă mai multe proprietăți...</span>
                    </div>
                  ) : (
                    <button
                      onClick={loadMoreProperties}
                      className="btn btn-outline flex items-center space-x-2 px-6 py-2"
                    >
                      <ChevronDown className="h-4 w-4" />
                      <span>Încarcă mai multe ({pagination.hasMore ? 'da' : 'nu'})</span>
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Intersection Observer Target */}
            <div ref={observerRef} className="h-1" />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAndSortedProperties.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nu s-au găsit proprietăți
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Încercați să modificați termenii de căutare' : 'Adăugați prima proprietate pentru a începe'}
            </p>
          </div>
        </div>
      )}

      {/* Floating Add Button for Mobile */}
      {['admin', 'Moderator', 'PowerUser'].includes(user?.role) && (
        <button 
          onClick={handleCreateProperty}
          className="fixed bottom-10 left-1/2 transform -translate-x-1/2 md:hidden z-50 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 py-3 shadow-2xl transition-all duration-200 hover:scale-110 border-2 border-white flex items-center space-x-2"
          title="Adaugă Proprietate"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">Adaugă</span>
        </button>
      )}
    </div>
  );
};

export default PropertiesList;
