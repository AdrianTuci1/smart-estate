import { useState, useMemo, useEffect } from 'react';
import { Users, Phone, Building2, Plus, Eye } from 'lucide-react';
import apiService from '../services/api';
import useAppStore from '../stores/useAppStore';

// Date mock pentru lead-uri
const mockLeads = [
  {
    id: 1,
    name: 'Maria Popescu',
    phone: '0721 234 567',
    email: 'maria.popescu@email.com',
    company: 'ABC Imobiliare',
    interest: '2 camere',
    property: 'Complex Rezidențial Aurora',
    propertyId: 'prop-1',
    propertyAddress: 'Strada Aurora, nr. 15, București',
    apartment: 'Apartament A12',
    apartmentId: 'apt-1',
    apartmentRooms: 2,
    apartmentArea: 65,
    apartmentPrice: 85000,
    status: 'Connected',
    lastContact: '2024-01-15',
    notes: 'Client foarte interesat de apartamentul cu 2 camere. Urmează vizionarea.'
  },
  {
    id: 2,
    name: 'Ion Ionescu',
    phone: '0722 345 678',
    email: 'ion.ionescu@email.com',
    company: 'ABC Imobiliare',
    interest: '3 camere',
    property: 'Complex Rezidențial Aurora',
    propertyId: 'prop-1',
    propertyAddress: 'Strada Aurora, nr. 15, București',
    apartment: 'Apartament B5',
    apartmentId: 'apt-2',
    apartmentRooms: 3,
    apartmentArea: 85,
    apartmentPrice: 120000,
    status: 'Progress',
    lastContact: '2024-01-14',
    notes: 'Așteaptă aprobarea creditului bancar.'
  },
  {
    id: 3,
    name: 'Ana Dumitrescu',
    phone: '0723 456 789',
    email: 'ana.dumitrescu@email.com',
    company: 'XYZ Real Estate',
    interest: '1 cameră',
    property: 'Tower Residence',
    propertyId: 'prop-2',
    propertyAddress: 'Bd. Unirii, nr. 25, București',
    apartment: 'Apartament C301',
    apartmentId: 'apt-3',
    apartmentRooms: 1,
    apartmentArea: 45,
    apartmentPrice: 55000,
    status: 'New',
    lastContact: '2024-01-13',
    notes: 'Primul contact. Interesată de apartamente mici.'
  },
  {
    id: 4,
    name: 'Petru Marinescu',
    phone: '0724 567 890',
    email: 'petru.marinescu@email.com',
    company: 'ABC Imobiliare',
    interest: '4 camere',
    property: 'Garden View Apartments',
    propertyId: 'prop-3',
    propertyAddress: 'Strada Grădini, nr. 8, București',
    apartment: 'Apartament D10',
    apartmentId: 'apt-4',
    apartmentRooms: 4,
    apartmentArea: 120,
    apartmentPrice: 180000,
    status: 'Potential',
    lastContact: '2024-01-12',
    notes: 'Familie cu copii, caută apartament spațios.'
  },
  {
    id: 5,
    name: 'Elena Radu',
    phone: '0725 678 901',
    email: 'elena.radu@email.com',
    company: 'XYZ Real Estate',
    interest: '2 camere',
    property: 'Garden View Apartments',
    propertyId: 'prop-3',
    propertyAddress: 'Strada Grădini, nr. 8, București',
    apartment: 'Apartament E7',
    apartmentId: 'apt-5',
    apartmentRooms: 2,
    apartmentArea: 70,
    apartmentPrice: 95000,
    status: 'Customer',
    lastContact: '2024-01-11',
    notes: 'Client fidel, a cumpărat deja un apartament.'
  }
];

const LeadsTable = ({ onLeadSelect, searchTerm = '' }) => {
  const { selectLead, setLeadDrawerOpen } = useAppStore();
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedLead, setSelectedLead] = useState(null);
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to format price
  const formatPrice = (price) => {
    if (!price) return '';
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Load leads from API
  useEffect(() => {
    const loadLeads = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiService.getLeads();
        
        if (response.success && response.data) {
          setLeads(response.data);
        } else {
          // Fallback to mock data if API fails
          setLeads(mockLeads);
        }
      } catch (err) {
        console.error('Failed to load leads:', err);
        setError('Eroare la încărcarea lead-urilor');
        // Fallback to mock data
        setLeads(mockLeads);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeads();
  }, []);

  const filteredAndSortedLeads = useMemo(() => {
    let filtered = leads.filter(lead =>
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.property?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.apartment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.propertyAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [leads, searchTerm, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleLeadClick = (lead) => {
    setSelectedLead(lead);
    selectLead(lead);
    if (onLeadSelect) {
      onLeadSelect(lead);
    }
  };

  const handleCreateLead = () => {
    setLeadDrawerOpen(true);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <div className="w-4 h-4" />;
    }
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Lead-uri</h1>
            <span className="bg-primary-100 text-primary-800 text-sm font-medium px-2 py-1 rounded-full">
              {filteredAndSortedLeads.length}
            </span>
          </div>
          <button 
            onClick={handleCreateLead}
            className="btn btn-primary flex items-center space-x-2 p-2"
          >
            <Plus className="h-4 w-4" />
            <span>Adaugă Lead</span>
          </button>
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
            <p className="text-gray-500">Se încarcă lead-urile...</p>
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Nume</span>
                    {getSortIcon('name')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('phone')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Telefon</span>
                    {getSortIcon('phone')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {getSortIcon('status')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('interest')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Interes</span>
                    {getSortIcon('interest')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('property')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Proprietate</span>
                    {getSortIcon('property')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('apartment')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Apartament</span>
                    {getSortIcon('apartment')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acțiuni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedLead?.id === lead.id ? 'bg-primary-50' : ''
                  }`}
                  onClick={() => handleLeadClick(lead)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">
                          {lead.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {lead.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lead.status}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      {lead.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      lead.status === 'New' ? 'bg-blue-100 text-blue-800' :
                      lead.status === 'Attempted' ? 'bg-yellow-100 text-yellow-800' :
                      lead.status === 'Connected' ? 'bg-green-100 text-green-800' :
                      lead.status === 'Progress' ? 'bg-purple-100 text-purple-800' :
                      lead.status === 'Potential' ? 'bg-orange-100 text-orange-800' :
                      lead.status === 'Customer' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {lead.interest}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lead.property ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {lead.property}
                        </div>
                        {lead.propertyAddress && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {lead.propertyAddress}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lead.apartment ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {lead.apartment}
                        </div>
                        <div className="text-xs text-gray-500">
                          {lead.apartmentRooms && `${lead.apartmentRooms} camere`}
                          {lead.apartmentArea && ` • ${lead.apartmentArea} m²`}
                          {lead.apartmentPrice && ` • ${formatPrice(lead.apartmentPrice)}`}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeadClick(lead);
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
        </div>
      </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAndSortedLeads.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nu s-au găsit lead-uri
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Încercați să modificați termenii de căutare' : 'Adăugați primul lead pentru a începe'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsTable;
