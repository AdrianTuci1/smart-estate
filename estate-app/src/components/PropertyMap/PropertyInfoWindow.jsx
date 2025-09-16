import { InfoWindow } from '@react-google-maps/api';
import { Home, Construction } from 'lucide-react';

const PropertyInfoWindow = ({ selectedMarker, handleMarkerClose }) => {
  if (!selectedMarker) return null;

  return (
    <InfoWindow
      position={selectedMarker.position}
      onCloseClick={handleMarkerClose}
    >
      <div className="p-2 max-w-xs">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {selectedMarker.status === 'finalizată' ? (
              <Home className="h-5 w-5 text-green-600" />
            ) : (
              <Construction className="h-5 w-5 text-amber-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {selectedMarker.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {selectedMarker.address}
            </p>
            <div className="mt-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                selectedMarker.status === 'finalizată'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {selectedMarker.status === 'finalizată' ? 'Finalizată' : 'În construcție'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {selectedMarker.leads?.length || 0} lead-uri interesate
            </p>
          </div>
        </div>
      </div>
    </InfoWindow>
  );
};

export default PropertyInfoWindow;
