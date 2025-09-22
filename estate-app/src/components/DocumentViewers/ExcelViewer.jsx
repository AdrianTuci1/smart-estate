import React, { useState, useEffect, useRef } from 'react';
import { FileSpreadsheet, ExternalLink, RefreshCw } from 'lucide-react';

const ExcelViewer = ({ fileUrl, fileName, onError, file }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Nu s-a putut încărca fișierul în previzualizare.');
  };

  // Cleanup effect to clear iframe when component unmounts
  useEffect(() => {
    return () => {
      // Clear iframe src to free memory when component unmounts
      if (iframeRef.current) {
        iframeRef.current.src = 'about:blank';
      }
    };
  }, []);

  const openExternal = () => {
    window.open(fileUrl, '_blank');
  };

  // All Excel files are converted to Google Sheets, extract spreadsheetId
  const getSpreadsheetId = () => {
    // First try the direct spreadsheetId property
    if (file?.spreadsheetId) {
      return file.spreadsheetId;
    }
    
    // Then try to extract from id with gs_ prefix
    if (file?.id && file.id.startsWith('gs_')) {
      return file.id.substring(3); // Remove 'gs_' prefix
    }
    
    // Try to extract from URL
    if (file?.url) {
      const urlMatch = file.url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (urlMatch) {
        return urlMatch[1];
      }
    }
    
    return null;
  };

  // Generate Google Sheets iframe URL
  const getIframeUrl = () => {
    const spreadsheetId = getSpreadsheetId();
    
    console.log('🔍 ExcelViewer - file:', file);
    console.log('🔍 ExcelViewer - extracted spreadsheetId:', spreadsheetId);
    
    if (!spreadsheetId) {
      console.error('❌ No spreadsheetId found for Excel file');
      return null;
    }
    
    // Try different URL formats for Google Sheets embedding
    const urls = [
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing&embedded=true&widget=true&headers=false`,
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/pubhtml?embedded=true`,
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview?embedded=true`
    ];
    
    const googleUrl = urls[0]; // Use the first URL (edit with sharing)
    console.log('🔗 Using Google Sheets iframe URL:', googleUrl);
    return googleUrl;
  };

  return (
    <div className="h-full flex flex-col bg-white">


      {/* Content */}
      <div className="flex-1 relative">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-gray-600">Se încarcă fișierul...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <p className="text-lg font-medium">Eroare la încărcarea fișierului</p>
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={openExternal}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <ExternalLink className="h-4 w-4 inline mr-2" />
                Deschide extern
              </button>
            </div>
          </div>
        ) : getIframeUrl() ? (
          /* Google Sheets Preview Iframe */
          <iframe
            ref={iframeRef}
            id="excel-iframe"
            src={getIframeUrl()}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={`Google Sheets Preview - ${fileName || 'File'}`}
            allowFullScreen
          />
        ) : (
          /* No spreadsheetId available */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Previzualizare indisponibilă</p>
              <p className="text-sm mb-4">Fișierul nu are spreadsheetId pentru Google Sheets</p>
              <button
                onClick={openExternal}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-2 mx-auto"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Deschide extern</span>
              </button>
            </div>
          </div>
        )}
      </div>


    </div>
  );
};

export default ExcelViewer;