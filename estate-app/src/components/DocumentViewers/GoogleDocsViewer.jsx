import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, RefreshCw, FileText } from 'lucide-react';

const GoogleDocsViewer = ({ file, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

  // Early return if file is not provided or invalid
  if (!file) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">Fișier lipsă</p>
          <p className="text-sm">Nu s-a putut încărca informațiile despre fișier</p>
        </div>
      </div>
    );
  }

  // Generate preview iframe URL - use different approaches for better embedding
  const getPreviewUrl = () => {
    // Try documentId first, then fallback to spreadsheetId (since we reuse the same table)
    const documentId = file?.documentId || file?.spreadsheetId;
    
    if (!documentId) {
      return null;
    }
    
    console.log('🔗 Generating preview URL for documentId:', documentId);
    
    // Try multiple URL formats to find one that works
    const urls = [
      `https://docs.google.com/document/d/${documentId}/pub?embedded=true`,
      `https://docs.google.com/document/d/${documentId}/edit?usp=sharing&embedded=true&widget=true&headers=false`,
      `https://docs.google.com/document/d/${documentId}/htmlview?embedded=true`
    ];
    
    // For now, use the first one
    const selectedUrl = urls[0];
    console.log('🔗 Using iframe URL:', selectedUrl);
    return selectedUrl;
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

  const openForEditing = () => {
    if (file?.url) {
      window.open(file.url, '_blank');
    } else {
      const documentId = file?.documentId || file?.spreadsheetId;
      if (documentId) {
        window.open(`https://docs.google.com/document/d/${documentId}/edit`, '_blank');
      } else {
        console.error('No URL available for Google Docs');
        alert('Nu s-a putut deschide documentul pentru editare');
      }
    }
  };

  const openInGoogle = () => {
    if (file?.url) {
      window.open(file.url, '_blank');
    } else {
      const documentId = file?.documentId || file?.spreadsheetId;
      if (documentId) {
        window.open(`https://docs.google.com/document/d/${documentId}`, '_blank');
      } else {
        console.error('No URL available for Google Docs');
        alert('Nu s-a putut deschide documentul în Google');
      }
    }
  };

  const handleIframeLoad = () => {
    console.log('✅ Google Docs iframe loaded successfully');
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = (e) => {
    console.error('❌ Google Docs iframe failed to load:', e);
    setIsLoading(false);
    setError('Nu s-a putut încărca documentul în iframe. Google poate bloca embedding-ul.');
  };

  return (
    <div className="h-full flex flex-col bg-white">

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-gray-600">Se încarcă documentul...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <p className="text-lg font-medium">Eroare la încărcarea documentului</p>
              <p className="text-sm">{error}</p>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => {
                  setIsLoading(true);
                  setError(null);
                  const iframe = document.getElementById('docs-iframe');
                  if (iframe && getPreviewUrl()) {
                    iframe.src = getPreviewUrl();
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <RefreshCw className="h-4 w-4 inline mr-2" />
                Încearcă din nou
              </button>
              <button
                onClick={openInGoogle}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <ExternalLink className="h-4 w-4 inline mr-2" />
                Deschide în Google
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Docs Preview */}
      {!error && getPreviewUrl() ? (
        <div className="flex-1 relative">
          <iframe
            ref={iframeRef}
            id="docs-iframe"
            src={getPreviewUrl()}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={`Google Docs Preview - ${file?.name || 'Untitled'}`}
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : !error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Previzualizare indisponibilă</p>
            <p className="text-sm mb-4">Google Docs nu poate fi afișat în iframe</p>
            <button
              onClick={openForEditing}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center space-x-2 mx-auto"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Deschide în Google Docs</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Action Buttons */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              {file?.name || 'Untitled Document'}
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={openForEditing}
              className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex items-center space-x-1"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Editează</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
              >
                Închide
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default GoogleDocsViewer;
