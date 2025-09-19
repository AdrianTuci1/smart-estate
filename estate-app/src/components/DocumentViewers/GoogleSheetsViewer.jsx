import React, { useState } from 'react';
import { ExternalLink, RefreshCw, FileSpreadsheet } from 'lucide-react';

const GoogleSheetsViewer = ({ file, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
    if (!file?.spreadsheetId) {
      return null;
    }
    
    console.log('🔗 Generating preview URL for spreadsheetId:', file.spreadsheetId);
    
    // Try multiple URL formats to find one that works
    const urls = [
      `https://docs.google.com/spreadsheets/d/${file.spreadsheetId}/pubhtml?embedded=true`,
      `https://docs.google.com/spreadsheets/d/${file.spreadsheetId}/edit?usp=sharing&embedded=true&widget=true&headers=false`,
      `https://docs.google.com/spreadsheets/d/${file.spreadsheetId}/htmlview?embedded=true`
    ];
    
    // For now, use the first one
    const selectedUrl = urls[0];
    console.log('🔗 Using iframe URL:', selectedUrl);
    return selectedUrl;
  };

  const openForEditing = () => {
    if (file?.url) {
      window.open(file.url, '_blank');
    } else if (file?.spreadsheetId) {
      window.open(`https://docs.google.com/spreadsheets/d/${file.spreadsheetId}/edit`, '_blank');
    } else {
      console.error('No URL available for Google Sheets');
      alert('Nu s-a putut deschide foaia de calcul pentru editare');
    }
  };

  const handleIframeLoad = () => {
    console.log('✅ Google Sheets iframe loaded successfully');
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = (e) => {
    console.error('❌ Google Sheets iframe failed to load:', e);
    setIsLoading(false);
    setError('Nu s-a putut încărca foaia de calcul în iframe. Google poate bloca embedding-ul.');
  };

  return (
    <div className="h-full flex flex-col bg-white">

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-gray-600">Se încarcă foaia de calcul...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <p className="text-lg font-medium">Eroare la încărcarea foii de calcul</p>
              <p className="text-sm">{error}</p>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => {
                  setIsLoading(true);
                  setError(null);
                  const iframe = document.getElementById('sheets-iframe');
                  if (iframe && getIframeUrl()) {
                    iframe.src = getIframeUrl();
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

      {/* Google Sheets Preview */}
      {!error && getPreviewUrl() ? (
        <div className="flex-1 relative">
          <iframe
            id="sheets-iframe"
            src={getPreviewUrl()}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={`Google Sheets Preview - ${file?.name || 'Untitled'}`}
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : !error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Previzualizare indisponibilă</p>
            <p className="text-sm mb-4">Google Sheets nu poate fi afișat în iframe</p>
            <button
              onClick={openForEditing}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center space-x-2 mx-auto"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Deschide în Google Sheets</span>
            </button>
          </div>
        </div>
      ) : null}


    </div>
  );
};

export default GoogleSheetsViewer;