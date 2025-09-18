import { useState, useEffect, useMemo, useCallback } from 'react';
import { Upload, Download, Trash2, ExternalLink, File, Folder, FolderOpen } from 'lucide-react';
import { TreeView } from './ui/tree-view';
import apiService from '../services/api';
import { handleFileAction, getFileIcon, getFileAction } from '../utils/fileHandler';
import useFileViewerStore from '../stores/useFileViewerStore';

const PropertyFileTree = ({ selectedProperty, onFileClick }) => {
  const { setAllFiles } = useFileViewerStore();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState(['root', 'documents', 'images', 'plans']);

  // Handle node expansion with proper hook order
  const handleNodeExpand = useCallback((nodeId, isExpanded) => {
    // Use setTimeout to defer state update to avoid setState during render
    setTimeout(() => {
      setExpandedIds(prev => 
        isExpanded 
          ? [...prev, nodeId]
          : prev.filter(id => id !== nodeId)
      );
    }, 0);
  }, []);

  // Load property files function
  const loadPropertyFiles = async () => {
    if (selectedProperty?.id) {
      try {
        setIsLoading(true);
        
        // If property already has files, use them
        if (selectedProperty.files) {
          const propertyFiles = selectedProperty.files.map(file => ({
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type || 'file',
            url: file.url,
            s3Key: file.s3Key,
            createdAt: file.createdAt
          }));
          setFiles(propertyFiles);
          setAllFiles(propertyFiles); // Update global store
        } else {
          // Load complete property data to get files
          const response = await apiService.getProperty(selectedProperty.id);
          if (response.success && response.data.files) {
            const propertyFiles = response.data.files.map(file => ({
              id: file.id,
              name: file.name,
              size: file.size,
              type: file.type || 'file',
              url: file.url,
              s3Key: file.s3Key,
              createdAt: file.createdAt
            }));
            setFiles(propertyFiles);
            setAllFiles(propertyFiles); // Update global store
          } else {
            setFiles([]);
          }
        }
      } catch (error) {
        console.error('Error loading property files:', error);
        setFiles([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setFiles([]);
    }
  };

  // Load files from property data
  useEffect(() => {
    loadPropertyFiles();
  }, [selectedProperty?.id]);

  // Transform flat file list into tree structure with enhanced labels
  const treeData = useMemo(() => {
    const categorizeFile = (file) => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
      const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
      const planExtensions = ['dwg', 'dxf', 'pdf'];

      if (imageExtensions.includes(extension)) return 'images';
      if (planExtensions.includes(extension) && file.name.toLowerCase().includes('plan')) return 'plans';
      if (documentExtensions.includes(extension)) return 'documents';
      return 'other';
    };

    const categories = {
      images: { files: [], label: 'Imagini' },
      documents: { files: [], label: 'Documente' },
      plans: { files: [], label: 'Planuri' },
      other: { files: [], label: 'Altele' }
    };

    files.forEach(file => {
      const category = categorizeFile(file);
      categories[category].files.push(file);
    });

    const treeNodes = [];

    Object.entries(categories).forEach(([key, category]) => {
      if (category.files.length > 0) {
        treeNodes.push({
          id: key,
          label: `${category.label} (${category.files.length})`,
          icon: <Folder className="h-4 w-4" />,
          children: category.files.map(file => ({
            id: file.id,
            label: (
              <div className="flex items-center justify-between w-full group">
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {file.size} • {new Date(file.createdAt).toLocaleDateString('ro-RO')}
                  </span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 ml-2">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const response = await apiService.getFileViewUrl(selectedProperty.id, file.id);
                        if (response.success && response.data.viewUrl) {
                          const fileObj = {
                            url: response.data.viewUrl,
                            name: response.data.fileName || file.name,
                            type: file.type
                          };
                          handleFileAction(fileObj, 'native');
                        }
                      } catch (error) {
                        console.error('Error opening file:', error);
                        if (file.url) {
                          handleFileAction({ url: file.url, name: file.name, type: file.type }, 'native');
                        }
                      }
                    }}
                    className="p-1 hover:bg-blue-100 rounded transition-colors"
                    title="Deschide în aplicație"
                  >
                    <ExternalLink className="h-3 w-3 text-blue-500" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadFile(file);
                    }}
                    className="p-1 hover:bg-green-100 rounded transition-colors"
                    title="Descarcă fișier"
                  >
                    <Download className="h-3 w-3 text-green-500" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file);
                    }}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                    title="Șterge"
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </button>
                </div>
              </div>
            ),
            icon: <File className="h-4 w-4" />,
            data: file
          }))
        });
      }
    });

    return treeNodes;
  }, [files]);

  const handleFileUpload = async (event) => {
    const uploadedFiles = Array.from(event.target.files);
    if (!selectedProperty?.id) return;
    
    setIsLoading(true);
    try {
      for (const file of uploadedFiles) {
        const response = await apiService.uploadPropertyFile(selectedProperty.id, file);
        if (response.success) {
          console.log('File uploaded successfully:', response.data);
        }
      }
      
      // Reload files after successful upload
      await loadPropertyFiles();
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Eroare la încărcarea fișierelor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileDoubleClick = async (file) => {
    try {
      const response = await apiService.getFileViewUrl(selectedProperty.id, file.id);
      
      if (response.success && response.data.viewUrl) {
        // Use the file handler utility to open in appropriate app
        const fileObj = {
          url: response.data.viewUrl,
          name: response.data.fileName || file.name,
          type: file.type
        };
        
        // Get the best action for this file type
        const action = getFileAction(fileObj.name, fileObj.type);
        handleFileAction(fileObj, action);
      }
    } catch (error) {
      console.error('Error viewing file:', error);
      // Fallback to direct URL if available
      if (file.url) {
        const fileObj = {
          url: file.url,
          name: file.name,
          type: file.type
        };
        handleFileAction(fileObj, 'native'); // Try to open in native app as fallback
      } else {
        alert('Eroare la deschiderea fișierului: ' + error.message);
      }
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      const response = await apiService.getFileDownloadUrl(selectedProperty.id, file.id);
      
      if (response.success && response.data.downloadUrl) {
        // Use file handler utility for download
        const fileObj = {
          url: response.data.downloadUrl,
          name: response.data.fileName || file.name,
          type: file.type
        };
        handleFileAction(fileObj, 'download');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback to direct URL if available
      if (file.url) {
        const fileObj = {
          url: file.url,
          name: file.name,
          type: file.type
        };
        handleFileAction(fileObj, 'download');
      } else {
        alert('Eroare la descărcarea fișierului: ' + error.message);
      }
    }
  };

  const handleDeleteFile = async (file) => {
    if (!selectedProperty?.id || !file.id) return;
    
    if (confirm(`Sigur doriți să ștergeți fișierul "${file.name}"?`)) {
      setIsLoading(true);
      try {
        const response = await apiService.deletePropertyFile(selectedProperty.id, file.id);
        if (response.success) {
          console.log('File deleted successfully');
          // Reload files after successful deletion
          await loadPropertyFiles();
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        alert('Eroare la ștergerea fișierului');
      } finally {
        setIsLoading(false);
      }
    }
  };


  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Folder className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-gray-900">Fișiere</h3>
        </div>
        
        <label className="flex items-center space-x-1 px-3 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
          <Upload className="h-4 w-4" />
          <span>Încarcă fișiere</span>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : treeData.length > 0 ? (
          <TreeView
            data={treeData}
            defaultExpandedIds={expandedIds}
            onNodeClick={(node) => {
              if (node.data) {
                // This is a file node
                const file = node.data;
                
                // If onFileClick is provided, open the file viewer
                if (onFileClick) {
                  onFileClick(file);
                }
              }
            }}
            onNodeExpand={handleNodeExpand}
            showLines={true}
            showIcons={true}
            className="border-0 bg-transparent"
          />
        ) : (
          <div className="text-center py-8">
            <Folder className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Nu există fișiere</p>
            <p className="text-xs text-gray-400">
              Încărcați fișiere pentru a le organiza aici
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default PropertyFileTree;
