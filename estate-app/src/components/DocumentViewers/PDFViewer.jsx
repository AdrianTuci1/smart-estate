import { useState, useEffect } from 'react';
import { FileText, Download, AlertCircle, ExternalLink } from 'lucide-react';
import './DocumentViewers.css';

const PDFViewer = ({ fileUrl, fileName, onError }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');

  useEffect(() => {
    if (fileUrl) {
      loadPDF();
    }
  }, [fileUrl]);

  const loadPDF = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Verificăm dacă URL-ul este valid
      const response = await fetch(fileUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error('Eroare la încărcarea fișierului PDF');
      }
      
      setPdfUrl(fileUrl);
    } catch (error) {
      console.error('Error loading PDF:', error);
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
    link.download = fileName || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openInNewTab = () => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă documentul PDF...</p>
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
            Eroare la încărcarea PDF-ului
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={downloadFile}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Descarcă fișierul
            </button>
            <button
              onClick={openInNewTab}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Deschide în tab nou
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* PDF Content */}
      <div className="flex-1 bg-gray-100">
        <iframe
          src={pdfUrl}
          className="w-full h-full border-0"
          title={fileName}
          style={{ minHeight: '500px' }}
        />
      </div>
    </div>
  );
};

export default PDFViewer;
