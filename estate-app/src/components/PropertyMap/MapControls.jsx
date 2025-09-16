import { Eye, EyeOff } from 'lucide-react';

const MapControls = ({ 
  showPOIs, 
  setShowPOIs
}) => {
  return (
    <div className="absolute top-4 right-4 space-y-2">
      {/* POI Toggle Button */}
      <button
        onClick={() => setShowPOIs(!showPOIs)}
        className={`flex items-center space-x-2 px-3 py-2 bg-white rounded-lg shadow-lg text-sm font-medium transition-colors ${
          showPOIs 
            ? 'bg-primary-100 text-primary-700 hover:bg-primary-200' 
            : 'text-gray-600 hover:bg-gray-50'
        }`}
        title={showPOIs ? 'Ascunde POI-uri' : 'Afișează POI-uri'}
      >
        {showPOIs ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
        <span>{showPOIs ? 'Ascunde POI' : 'Afișează POI'}</span>
      </button>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Finalizate</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-gray-600">În construcție</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapControls;
