import { Users, Phone, Loader2 } from 'lucide-react';
import useAppStore from '../../stores/useAppStore';

const PropertyLeads = ({ selectedProperty, isLoading = false }) => {
  const { selectLead } = useAppStore();

  const handleLeadClick = (lead) => {
    selectLead(lead);
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Users className="h-5 w-5 text-gray-400" />
        <h3 className="font-medium text-gray-900">
          Lead-uri interesate ({selectedProperty?.leads?.length || 0})
        </h3>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Se încarcă lead-urile...</span>
        </div>
      ) : selectedProperty?.leads?.length > 0 ? (
        <div className="space-y-3">
          {selectedProperty.leads.map((lead) => (
            <div 
              key={lead.id} 
              className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
              onClick={() => handleLeadClick(lead)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{lead.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{lead.phone}</span>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  {lead.interest}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p>Nu există lead-uri interesate de această proprietate</p>
        </div>
      )}
    </div>
  );
};

export default PropertyLeads;
