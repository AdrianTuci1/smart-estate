import { useState } from 'react';
import { FileText, FileImage, Upload, Trash2, Eye, File, FileType } from 'lucide-react';
import apiService from '../../services/api';

const PropertyFiles = ({ selectedProperty, isEditing, isCreating }) => {
  const [files, setFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event) => {
    const uploadedFiles = Array.from(event.target.files);
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt'];
    
    // Filter for allowed file types
    const validFiles = uploadedFiles.filter(file => {
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      return allowedTypes.includes(extension);
    });

    if (validFiles.length === 0) {
      alert('Vă rugăm să selectați fișiere PDF, DOCX, DOC sau TXT');
      return;
    }

    setIsUploading(true);

    try {
      // Process each file
      for (const file of validFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('propertyId', selectedProperty?.id);

        // Upload file and extract data
        const response = await apiService.uploadPropertyDocument(formData);
        
        if (response.success) {
          const newFile = {
            id: Date.now() + Math.random(),
            name: file.name,
            type: file.type.split('/')[1].toUpperCase(),
            size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
            url: response.data.fileUrl,
            extractedData: response.data.extractedData,
            file: file
          };
          
          setFiles(prev => [...prev, newFile]);
          
          // Show extracted data if available
          if (response.data.extractedData) {
            console.log('Extracted data:', response.data.extractedData);
            // Here you could show a modal or notification about extracted data
          }
        } else {
          console.error('Failed to upload file:', response.error);
          alert(`Eroare la încărcarea fișierului ${file.name}: ${response.error}`);
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Eroare la încărcarea fișierelor. Vă rugăm să încercați din nou.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreviewFile = (file) => {
    setPreviewFile(file);
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'docx':
      case 'doc':
        return <File className="h-5 w-5 text-blue-500" />;
      case 'txt':
        return <FileType className="h-5 w-5 text-gray-500" />;
      default:
        return <FileImage className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Documente și analiză automată</h3>
          {(isEditing || isCreating) && (
            <label className={`flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors cursor-pointer ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}>
              <Upload className="h-4 w-4" />
              <span>{isUploading ? 'Se încarcă...' : 'Încarcă documente'}</span>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.docx,.doc,.txt"
                disabled={isUploading}
              />
            </label>
          )}
        </div>

        {/* Upload Instructions */}
        {(isEditing || isCreating) && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Analiză automată de documente</h4>
                <p className="text-xs text-blue-600 mt-1">
                  Încărcați contracte, planuri sau documentație PDF/DOCX pentru extragerea automată a:
                  <br />• Suprafața proprietății
                  <br />• Numărul de camere
                  <br />• Prețul de vânzare
                  <br />• Alte detalii relevante
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {files.map((file) => (
            <div key={file.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              {getFileIcon(file.name)}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{file.type} • {file.size}</p>
                {file.extractedData && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-xs text-green-700 font-medium">Date extrase:</p>
                    <div className="text-xs text-green-600 mt-1">
                      {Object.entries(file.extractedData).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{key}:</span> {value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePreviewFile(file)}
                  className="text-primary-600 hover:text-primary-800 p-1"
                  title="Vezi fișier"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {(isEditing || isCreating) && (
                  <button
                    onClick={() => setFiles(prev => prev.filter(f => f.id !== file.id))}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Șterge fișier"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {files.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nu există documente încărcate</p>
              {(isEditing || isCreating) && (
                <p className="text-xs text-gray-400 mt-2">
                  Încărcați documente pentru analiză automată
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview Panel */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full w-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">{previewFile.name}</h3>
              <button
                onClick={closePreview}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              {previewFile.type === 'PDF' ? (
                <div className="h-full bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Previzualizare PDF</p>
                    <p className="text-sm text-gray-400 mt-2">{previewFile.name}</p>
                  </div>
                </div>
              ) : previewFile.type && ['DOCX', 'DOC'].includes(previewFile.type) ? (
                <div className="h-full bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Previzualizare document Word</p>
                    <p className="text-sm text-gray-400 mt-2">{previewFile.name}</p>
                  </div>
                </div>
              ) : (
                <div className="h-full bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Previzualizare nu este disponibilă</p>
                    <p className="text-sm text-gray-400 mt-2">{previewFile.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyFiles;
