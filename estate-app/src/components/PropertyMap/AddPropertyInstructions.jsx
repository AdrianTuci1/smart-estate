import { MapPin } from 'lucide-react';

const AddPropertyInstructions = ({ isAddingProperty }) => {
  if (!isAddingProperty) return null;

  return (
    <div className="absolute top-4 left-4 bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-xs">
      <div className="flex items-start space-x-2">
        <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">Adaugă proprietate</p>
          <p className="text-xs text-blue-600 mt-1">Apasă pe hartă pentru a plasa proprietatea</p>
        </div>
      </div>
    </div>
  );
};

export default AddPropertyInstructions;
