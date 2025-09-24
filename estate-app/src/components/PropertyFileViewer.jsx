import { useState, useEffect } from 'react';
import { X, Download, ExternalLink, File, Image as ImageIcon, FileText, FileVideo, FileAudio, ChevronLeft, ChevronRight, Trash2, Sheet } from 'lucide-react';
import apiService from '../services/api';
import { handleFileAction } from '../utils/fileHandler';
import useAppStore from '../stores/useAppStore';
import useFileViewerStore from '../stores/useFileViewerStore';
import { ExcelViewer, GoogleSheetsViewer, GoogleDocsViewer, PDFViewer, getDocumentViewerType, isDocumentViewable } from './DocumentViewers';

// Function to get the appropriate preview icon for a file
const getPreviewIcon = (item, size = 'h-8 w-8') => {
  if (item.isGoogleSheet) {
    return <img src="/sheet.png" alt="Google Sheets" className={size} />;
  }
  
  if (item.isGoogleDoc) {
    return <img src="/google-docs.png" alt="Google Docs" className={size} />;
  }
  
  const fileName = item.name || item.alt || '';
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  // Use PDF icon for PDF files
  if (extension === 'pdf') {
    return <img src="/pdf.png" alt="PDF" className={size} />;
  }
  
  // Use Google Docs icon for Word documents
  if (['doc', 'docx'].includes(extension)) {
    return <img src="/google-docs.png" alt="Document" className={size} />;
  }
  
  // Use sheet icon for Excel files
  if (['xls', 'xlsx', 'csv'].includes(extension)) {
    return <img src="/sheet.png" alt="Spreadsheet" className={size} />;
  }
  
  // Return null to fall back to default icons for other types
  return null;
};

const PropertyFileViewer = () => {
  const { selectedProperty } = useAppStore();
  const { 
    isOpen, 
    viewerType, 
    selectedFile,
    selectedGalleryImages,
    closeFileViewer,
    getCurrentItems,
    setAllFiles,
    setAllGalleryImages,
    removeFileOptimistic,
    removeGalleryImageOptimistic
  } = useFileViewerStore();
  
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [viewUrl, setViewUrl] = useState('');
  const [isGalleryPreviewMode, setIsGalleryPreviewMode] = useState(false);

  // Load items when component opens
  useEffect(() => {
    if (isOpen) {
      const currentItems = getCurrentItems();
      if (currentItems.length > 0) {
        // Use selected items (preview mode)
        setItems(currentItems);
        setCurrentItemIndex(0);
        // Set gallery to preview mode by default
        if (viewerType === 'gallery') {
          setIsGalleryPreviewMode(true);
        }
      } else if (selectedProperty?.id) {
        // Load all items from property
        loadPropertyItems();
        // Set gallery to preview mode by default
        if (viewerType === 'gallery') {
          setIsGalleryPreviewMode(true);
        }
      }
    }
  }, [isOpen, selectedProperty?.id, selectedFile, selectedGalleryImages, viewerType]);

  // Load view URL when item changes
  useEffect(() => {
    if (items.length > 0 && currentItemIndex < items.length) {
      loadItemViewUrl();
    } else {
      // Clear view URL when no items or invalid index
      setViewUrl('');
    }
  }, [currentItemIndex, items]);

  // Cleanup effect when component unmounts or viewer closes
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      setViewUrl('');
      setItems([]);
    };
  }, []);

  const loadPropertyItems = async () => {
    try {
      setIsLoading(true);
      if (viewerType === 'gallery') {
        // Load gallery images
        const response = await apiService.getPropertyGallery(selectedProperty.id);
        if (response.success && response.data.images) {
          const images = response.data.images;
          setItems(images);
          setAllGalleryImages(images); // Store in global state
          setCurrentItemIndex(0);
        }
      } else {
        // Load files
        const response = await apiService.getProperty(selectedProperty.id);
        if (response.success && response.data.files) {
          const files = response.data.files;
          setItems(files);
          setAllFiles(files); // Store in global state
          setCurrentItemIndex(0);
        }
      }
    } catch (error) {
      console.error('Error loading property items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadItemViewUrl = async () => {
    if (items.length === 0 || currentItemIndex >= items.length) return;
    
    const currentItem = items[currentItemIndex];

    try {
      if (viewerType === 'gallery') {
        // For gallery images, use the URL directly
        setViewUrl(currentItem.url);
      } else if (currentItem.isGoogleSheet || currentItem.type === 'GOOGLE_SHEET') {
        // For Google Sheets, use the direct Google URL
        setViewUrl(currentItem.url);
      } else if (currentItem.isGoogleDoc || currentItem.type === 'GOOGLE_DOC') {
        // For Google Docs, use the direct Google URL
        setViewUrl(currentItem.url);
      } else {
        // For regular files, get presigned URL
        const response = await apiService.getFileViewUrl(selectedProperty.id, currentItem.id);
        if (response.success) {
          setViewUrl(response.data.viewUrl);
        }
      }
    } catch (error) {
      console.error('Error loading item view URL:', error);
      setViewUrl('');
    }
  };

  const getItemIcon = (item) => {
    if (viewerType === 'gallery') {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    
    // Try to get preview icon first
    const previewIcon = getPreviewIcon(item);
    if (previewIcon) {
      return previewIcon;
    }
    
    const fileName = item.name || item.alt || '';
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) {
      return <FileVideo className="h-8 w-8 text-purple-500" />;
    }
    if (['mp3', 'wav', 'flac'].includes(extension)) {
      return <FileAudio className="h-8 w-8 text-green-500" />;
    }
    if (['txt', 'rtf'].includes(extension)) {
      return <FileText className="h-8 w-8 text-blue-600" />;
    }
    
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const nextItem = () => {
    // Clear current view URL before switching to free memory
    setViewUrl('');
    setCurrentItemIndex((prev) => (prev + 1) % items.length);
  };

  const prevItem = () => {
    // Clear current view URL before switching to free memory
    setViewUrl('');
    setCurrentItemIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleDownload = async () => {
    if (items.length === 0 || currentItemIndex >= items.length) return;

    const currentItem = items[currentItemIndex];

    try {
      if (viewerType === 'gallery') {
        // For gallery images, download directly
        const link = document.createElement('a');
        link.href = currentItem.url;
        link.download = currentItem.alt || `image-${currentItemIndex + 1}`;
        link.click();
      } else {
        // For files, get download URL
        const response = await apiService.getFileDownloadUrl(selectedProperty.id, currentItem.id);
        if (response.success) {
          const fileObj = {
            url: response.data.downloadUrl,
            name: response.data.fileName,
            type: currentItem.type
          };
          handleFileAction(fileObj, 'download');
        }
      }
    } catch (error) {
      console.error('Error downloading item:', error);
    }
  };

  const handleOpenInApp = async () => {
    if (items.length === 0 || currentItemIndex >= items.length) return;

    const currentItem = items[currentItemIndex];

    try {
      if (viewerType === 'gallery') {
        // For gallery images, open directly
        const fileObj = {
          url: currentItem.url,
          name: currentItem.alt || `image-${currentItemIndex + 1}`,
          type: 'image'
        };
        handleFileAction(fileObj, 'native');
      } else {
        // For files, get view URL
        const response = await apiService.getFileViewUrl(selectedProperty.id, currentItem.id);
        if (response.success) {
          const fileObj = {
            url: response.data.viewUrl,
            name: response.data.fileName,
            type: currentItem.type
          };
          handleFileAction(fileObj, 'native');
        }
      }
    } catch (error) {
      console.error('Error opening item:', error);
    }
  };

  const handleThumbnailDoubleClick = (index) => {
    if (viewerType === 'gallery') {
      setCurrentItemIndex(index);
      setIsGalleryPreviewMode(false); // Switch to full view mode
    }
  };

  const handleCloseFileViewer = () => {
    // Clean up memory before closing
    setViewUrl(''); // Clear the view URL to free memory
    setItems([]); // Clear items array
    setCurrentItemIndex(0); // Reset index
    
    // For gallery, return to preview mode when closing
    if (viewerType === 'gallery') {
      setIsGalleryPreviewMode(true);
    }
    closeFileViewer();
  };

  const handleDelete = async () => {
    if (items.length === 0 || currentItemIndex >= items.length) return;
    
    const currentItem = items[currentItemIndex];
    const itemName = currentItem.name || currentItem.alt || (viewerType === 'gallery' ? 'imaginea' : 'fișierul');
    
    if (!confirm(`Sigur doriți să ștergeți ${itemName}?`)) return;
    
    // Store original state for rollback
    const originalItems = [...items];
    const originalIndex = currentItemIndex;
    
    try {
      setIsLoading(true);
      
      // Optimistic update - remove item immediately from UI
      const newItems = items.filter((_, index) => index !== currentItemIndex);
      setItems(newItems);
      
      // Update global state optimistically using new functions
      if (viewerType === 'gallery') {
        removeGalleryImageOptimistic(currentItem.url);
      } else {
        removeFileOptimistic(currentItem.id);
      }
      
      // Adjust current index if needed
      let newIndex = currentItemIndex;
      if (currentItemIndex >= newItems.length) {
        newIndex = Math.max(0, newItems.length - 1);
        setCurrentItemIndex(newIndex);
      }
      
      // Perform actual deletion
      let response;
      if (viewerType === 'gallery') {
        // Use originalUrl if available (for gallery images), otherwise use url
        const imageUrl = currentItem.originalUrl || currentItem.url;
        response = await apiService.removePropertyImage(selectedProperty.id, imageUrl);
      } else {
        response = await apiService.deletePropertyFile(selectedProperty.id, currentItem.id);
      }
      
      if (!response.success) {
        // Rollback on failure
        setItems(originalItems);
        setCurrentItemIndex(originalIndex);
        
        // Rollback global state
        if (viewerType === 'gallery') {
          setAllGalleryImages(originalItems);
          // Note: We'd need to restore the image optimistically too
        } else {
          setAllFiles(originalItems);
          // Note: We'd need to restore the file optimistically too
        }
        
        throw new Error(response.error || 'Eroare la ștergere');
      }
      
      // If no items left after successful deletion, close viewer
      if (newItems.length === 0) {
        closeFileViewer();
      }
      
    } catch (error) {
      console.error('Error deleting item:', error);
      alert(`Eroare la ștergerea ${itemName}: ` + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentItem = items[currentItemIndex];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={handleCloseFileViewer}
      />
      
      {/* Viewer Panel */}
      <div className="mobile-file-viewer mobile-full-height prevent-pull-refresh fixed inset-y-0 left-0 right-0 md:right-96 bg-white z-50 flex flex-col shadow-2xl border-r border-gray-200 transform transition-transform">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-3 md:p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex items-center space-x-2 md:space-x-3">
              {currentItem && getItemIcon(currentItem)}
              <div>
                <h2 className="text-sm md:text-lg font-semibold text-gray-900 truncate max-w-xs md:max-w-md">
                  {currentItem?.name || currentItem?.alt || (viewerType === 'gallery' ? 'Imagine' : 'Fișier')}
                </h2>
                <p className="text-xs md:text-sm text-gray-600">
                  {viewerType === 'gallery' ? 'Imagine' : `${currentItem?.size || ''} • ${currentItem?.type || ''}`}
                </p>
              </div>
            </div>
          </div>
        
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Item counter */}
            {items.length > 1 && (
              <span className="text-xs md:text-sm text-gray-600">
                {currentItemIndex + 1} / {items.length}
              </span>
            )}
          
            {/* Actions */}
            <div className="flex items-center space-x-1 md:space-x-2">
              <button
                onClick={handleDownload}
                className="p-1.5 md:p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                title="Descarcă"
              >
                <Download className="h-3 w-3 md:h-4 md:w-4 text-gray-700" />
              </button>
              <button
                onClick={handleOpenInApp}
                className="p-1.5 md:p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                title="Deschide în aplicație"
              >
                <ExternalLink className="h-3 w-3 md:h-4 md:w-4 text-gray-700" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 md:p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                title="Șterge"
              >
                <Trash2 className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
              </button>
              <button
                onClick={handleCloseFileViewer}
                className="p-1.5 md:p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                title="Închide"
              >
                <X className="h-3 w-3 md:h-4 md:w-4 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation arrows - hidden for gallery mode */}
        {items.length > 1 && viewerType !== 'gallery' && (
          <>
            <button
              onClick={prevItem}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/90 hover:bg-white shadow-lg rounded-full transition-colors z-10 border border-gray-200"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
            <button
              onClick={nextItem}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/90 hover:bg-white shadow-lg rounded-full transition-colors z-10 border border-gray-200"
            >
              <ChevronRight className="h-6 w-6 text-gray-700" />
            </button>
          </>
        )}

        {/* Content Area */}
        <div className="flex-1 relative bg-gray-50 overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-gray-700 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700 mx-auto"></div>
                <p className="mt-4">Se încarcă...</p>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-700">
                {viewerType === 'gallery' ? <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" /> : <File className="h-16 w-16 mx-auto mb-4 text-gray-400" />}
                <p className="text-lg">Nu există {viewerType === 'gallery' ? 'imagini' : 'fișiere'}</p>
                <p className="text-sm text-gray-500">Această proprietate nu are {viewerType === 'gallery' ? 'imagini' : 'fișiere'} încărcate</p>
              </div>
            </div>
          ) : currentItem ? (
            <>
              {viewerType === 'gallery' && isGalleryPreviewMode ? (
                // Gallery preview mode - show thumbnails grid
                <div className="absolute inset-0 p-6 overflow-y-auto overscroll-contain">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {items.map((item, index) => (
                      <div
                        key={item.id || index}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          index === currentItemIndex 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          // Clear current view URL before switching to free memory
                          setViewUrl('');
                          setCurrentItemIndex(index);
                        }}
                        onDoubleClick={() => handleThumbnailDoubleClick(index)}
                        title="Click pentru a selecta, dublu click pentru a deschide complet"
                      >
                        <div className="bg-gray-100 flex items-center justify-center" style={{ aspectRatio: '1' }}>
                          <img
                            src={item.url}
                            alt={item.alt || `Imagine ${index + 1}`}
                            className="max-w-full max-h-full object-contain transition-transform duration-200 group-hover:scale-105"
                            loading="lazy"
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                          />
                        </div>
                        {/* Overlay with image info */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-end">
                          <div className="w-full p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <p className="text-white text-xs truncate">
                              {item.alt || `Imagine ${index + 1}`}
                            </p>
                          </div>
                        </div>
                        {/* Selection indicator */}
                        {index === currentItemIndex && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : viewerType === 'gallery' ? (
                // For gallery images, show image with internal backdrop and click-to-close-to-thumbnails
                <div
                  className="absolute inset-0 bg-black/80 flex items-center justify-center"
                  onClick={() => setIsGalleryPreviewMode(true)}
                >
                  {/* Close button */}
                  <button
                    onClick={() => setIsGalleryPreviewMode(true)}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                    title="Închide imaginea"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                  
                  {/* Image container */}
                  <div className="w-full h-full flex items-center justify-center p-8" onClick={(e) => e.stopPropagation()}>
                    <img
                      src={currentItem.url}
                      alt={currentItem.alt}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                  </div>
                </div>
              ) : viewUrl ? (
                // Check if it's a document that can be viewed with our viewers
                (() => {
                  const documentType = getDocumentViewerType(currentItem.name, currentItem.isGoogleSheet, currentItem.isGoogleDoc);
                  const isViewable = isDocumentViewable(currentItem.name, currentItem.isGoogleSheet, currentItem.isGoogleDoc);
                  
                  
                  if (isViewable && documentType) {
                    switch (documentType) {
                      case 'excel':
                        return (
                          <div className="absolute inset-0">
                            <ExcelViewer
                              fileUrl={viewUrl}
                              fileName={currentItem.name}
                              file={currentItem}
                              onError={(error) => console.error('ExcelViewer error:', error)}
                            />
                          </div>
                        );
                      case 'google-sheets':
                        return (
                          <div className="absolute inset-0">
                            <GoogleSheetsViewer
                              file={currentItem}
                              onClose={closeFileViewer}
                            />
                          </div>
                        );
                      case 'google-docs':
                        return (
                          <div className="absolute inset-0">
                            <GoogleDocsViewer
                              file={currentItem}
                              onClose={closeFileViewer}
                            />
                          </div>
                        );
                      case 'pdf':
                        return (
                          <div className="absolute inset-0">
                            <PDFViewer
                              fileUrl={viewUrl}
                              fileName={currentItem.name}
                              onError={(error) => console.error('PDFViewer error:', error)}
                            />
                          </div>
                        );
                      default:
                        // Fallback to iframe for other document types
                        return (
                          <div className="absolute inset-0 p-4">
                            <iframe
                              src={viewUrl}
                              className="w-full h-full border-0 rounded-lg bg-white shadow-lg"
                              title={currentItem.name}
                              style={{ touchAction: 'manipulation' }}
                            />
                          </div>
                        );
                    }
                  } else {
                    // For non-document files, show in iframe
                    return (
                      <div className="absolute inset-0 p-4">
                        <iframe
                          src={viewUrl}
                          className="w-full h-full border-0 rounded-lg bg-white shadow-lg"
                          title={currentItem.name}
                          style={{ touchAction: 'manipulation' }}
                        />
                      </div>
                    );
                  }
                })()
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="text-center text-gray-700 bg-white p-8 rounded-lg shadow-lg">
                    <div className="flex items-center justify-center mb-4">
                      {getItemIcon(currentItem)}
                    </div>
                    <p className="text-lg mb-2">{currentItem.name}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Nu se poate previzualiza acest tip de fișier
                    </p>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Descarcă fișierul
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Item List (Bottom) - hidden for gallery mode */}
        {items.length > 1 && viewerType !== 'gallery' && (
          <div className="bg-white border-t border-gray-200 p-2 md:p-4 flex-shrink-0">
            <div className="flex space-x-1 md:space-x-2 overflow-x-auto overscroll-x-contain">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                    index === currentItemIndex 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    // Clear current view URL before switching to free memory
                    setViewUrl('');
                    setCurrentItemIndex(index);
                  }}
                >
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                    {viewerType === 'gallery' ? (
                      <img
                        src={item.url}
                        alt={item.alt}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getItemIcon(item)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PropertyFileViewer;
