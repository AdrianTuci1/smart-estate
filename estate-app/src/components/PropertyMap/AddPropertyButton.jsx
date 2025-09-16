import { Plus, X } from 'lucide-react';

const AddPropertyButton = ({ isAddingProperty, handleAddProperty }) => {
  return (
    <div className="absolute bottom-4 left-4">
      <button
        onClick={handleAddProperty}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-colors ${
          isAddingProperty 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : 'bg-primary-600 hover:bg-primary-700 text-white'
        }`}
        title={isAddingProperty ? "Anulează adăugarea" : "Adaugă proprietate nouă"}
      >
        {isAddingProperty ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </button>
    </div>
  );
};

export default AddPropertyButton;
