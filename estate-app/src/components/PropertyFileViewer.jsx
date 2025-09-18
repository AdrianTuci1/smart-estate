import { useState, useEffect } from 'react';
import { X, Download, ExternalLink, File, Image as ImageIcon, FileText, FileVideo, FileAudio, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import apiService from '../services/api';
import { handleFileAction } from '../utils/fileHandler';

const PropertyFileViewer = ({ selectedProperty, isOpen, onClose, selectedItems = [], type = 'files', onItemUpdate }) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [viewUrl, setViewUrl] = useState('');

  // Load items when component opens
  useEffect(() => {
    if (isOpen) {
      if (selectedItems.length > 0) {
        // Use selected items (preview mode)
        setItems(selectedItems);
        setCurrentItemIndex(0);
      } else if (selectedProperty?.id) {
        // Load all items from property
        loadPropertyItems();
      }
    }
  }, [isOpen, selectedProperty?.id, selectedItems]);

  // Load view URL when item changes
  useEffect(() => {
    if (items.length > 0 && currentItemIndex < items.length) {
      loadItemViewUrl();
    }
  }, [currentItemIndex, items]);

  const loadPropertyItems = async () => {
    try {
      setIsLoading(true);
      if (type === 'gallery') {
        // Load gallery images
        const response = await apiService.getPropertyGallery(selectedProperty.id);
        if (response.success && response.data.images) {
          setItems(response.data.images);
          setCurrentItemIndex(0);
        }
      } else {
        // Load files
        const response = await apiService.getProperty(selectedProperty.id);
        if (response.success && response.data.files) {
          setItems(response.data.files);
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
      if (type === 'gallery') {
        // For gallery images, use the URL directly
        setViewUrl(currentItem.url);
      } else {
        // For files, get presigned URL
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
    if (type === 'gallery') {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    
    const fileName = item.name || item.alt || '';
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    if (['pdf'].includes(extension)) {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) {
      return <FileVideo className="h-8 w-8 text-purple-500" />;
    }
    if (['mp3', 'wav', 'flac'].includes(extension)) {
      return <FileAudio className="h-8 w-8 text-green-500" />;
    }
    if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) {
      return <FileText className="h-8 w-8 text-blue-600" />;
    }
    
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const nextItem = () => {
    setCurrentItemIndex((prev) => (prev + 1) % items.length);
  };

  const prevItem = () => {
    setCurrentItemIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleDownload = async () => {
    if (items.length === 0 || currentItemIndex >= items.length) return;
    
    const currentItem = items[currentItemIndex];
    
    try {
      if (type === 'gallery') {
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
      if (type === 'gallery') {
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

  const handleDelete = async () => {
    if (items.length === 0 || currentItemIndex >= items.length) return;
    
    const currentItem = items[currentItemIndex];
    const itemName = currentItem.name || currentItem.alt || (type === 'gallery' ? 'imaginea' : 'fișierul');
    
    if (!confirm(`Sigur doriți să ștergeți ${itemName}?`)) return;
    
    try {
      setIsLoading(true);
      
      if (type === 'gallery') {
        // Delete gallery image
        const response = await apiService.removePropertyImage(selectedProperty.id, currentItem.url);
        if (response.success) {
          // Remove item from local state
          const newItems = items.filter((_, index) => index !== currentItemIndex);
          setItems(newItems);
          
          // Adjust current index if needed
          if (currentItemIndex >= newItems.length) {
            setCurrentItemIndex(Math.max(0, newItems.length - 1));
          }
          
          // Notify parent component
          if (onItemUpdate) {
            onItemUpdate(response.data);
          }
          
          // If no items left, close viewer
          if (newItems.length === 0) {
            onClose();
          }
        }
      } else {
        // Delete file
        const response = await apiService.deletePropertyFile(selectedProperty.id, currentItem.id);
        if (response.success) {
          // Remove item from local state
          const newItems = items.filter((_, index) => index !== currentItemIndex);
          setItems(newItems);
          
          // Adjust current index if needed
          if (currentItemIndex >= newItems.length) {
            setCurrentItemIndex(Math.max(0, newItems.length - 1));
          }
          
          // Notify parent component
          if (onItemUpdate) {
            onItemUpdate(response.data);
          }
          
          // If no items left, close viewer
          if (newItems.length === 0) {
            onClose();
          }
        }
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
        onClick={onClose}
      />
      
      {/* Viewer Panel */}
      <div className="fixed inset-y-0 bg-white z-50 flex flex-col shadow-2xl border-r border-gray-200 transform transition-transform" style={{ left: 0, right: '384px' }}>
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {currentItem && getItemIcon(currentItem)}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                  {currentItem?.name || currentItem?.alt || (type === 'gallery' ? 'Imagine' : 'Fișier')}
                </h2>
                <p className="text-sm text-gray-600">
                  {type === 'gallery' ? 'Imagine' : `${currentItem?.size || ''} • ${currentItem?.type || ''}`}
                </p>
              </div>
            </div>
          </div>
        
          <div className="flex items-center space-x-4">
            {/* Item counter */}
            {items.length > 1 && (
              <span className="text-sm text-gray-600">
                {currentItemIndex + 1} / {items.length}
              </span>
            )}
          
          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              title="Descarcă"
            >
              <Download className="h-4 w-4 text-gray-700" />
            </button>
            <button
              onClick={handleOpenInApp}
              className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              title="Deschide în aplicație"
            >
              <ExternalLink className="h-4 w-4 text-gray-700" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
              title="Șterge"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              title="Închide"
            >
              <X className="h-4 w-4 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

        {/* Navigation arrows */}
        {items.length > 1 && (
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
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
          {isLoading ? (
            <div className="text-gray-700">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700 mx-auto"></div>
              <p className="mt-4">Se încarcă...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center text-gray-700">
              {type === 'gallery' ? <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" /> : <File className="h-16 w-16 mx-auto mb-4 text-gray-400" />}
              <p className="text-lg">Nu există {type === 'gallery' ? 'imagini' : 'fișiere'}</p>
              <p className="text-sm text-gray-500">Această proprietate nu are {type === 'gallery' ? 'imagini' : 'fișiere'} încărcate</p>
            </div>
          ) : currentItem ? (
            <div className="w-full h-full flex items-center justify-center">
              {type === 'gallery' ? (
                // For gallery images, show image directly
                <img
                  src={currentItem.url}
                  alt={currentItem.alt}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              ) : viewUrl ? (
                // For files, show in iframe
                <iframe
                  src={viewUrl}
                  className="w-full h-full border-0 rounded-lg bg-white shadow-lg"
                  title={currentItem.name}
                />
              ) : (
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
              )}
            </div>
          ) : null}
        </div>

        {/* Item List (Bottom) */}
        {items.length > 1 && (
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex space-x-2 overflow-x-auto">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                    index === currentItemIndex 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setCurrentItemIndex(index)}
                >
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                    {type === 'gallery' ? (
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
