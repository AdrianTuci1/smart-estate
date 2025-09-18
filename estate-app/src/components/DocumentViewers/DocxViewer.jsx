import { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { FileText, Download, AlertCircle } from 'lucide-react';
import './DocumentViewers.css';

const DocxViewer = ({ fileUrl, fileName, onError }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (fileUrl) {
      loadDocxContent();
    }
  }, [fileUrl]);

  const loadDocxContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('Eroare la încărcarea fișierului');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      if (result.messages && result.messages.length > 0) {
        console.warn('Mammoth conversion warnings:', result.messages);
      }
      
      setContent(result.value);
    } catch (error) {
      console.error('Error loading DOCX:', error);
      setError(error.message);
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'document.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă documentul...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center p-8">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Eroare la încărcarea documentului
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={downloadFile}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Descarcă fișierul
          </button>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center p-8">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Document gol sau format nesuportat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      {/* Conținutul documentului */}
      <div className="flex-1 overflow-auto">
        <div 
          className="docx-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
};

export default DocxViewer;
