import { useState, useEffect, useMemo, useCallback } from 'react';
import { Upload, File, Folder, FolderOpen, FileSpreadsheet, Plus, AlertCircle } from 'lucide-react';
import { TreeView } from './ui/tree-view';
import apiService from '../services/api';
import googleSheetsService from '../services/googleSheetsService';
import { handleFileAction, getFileIcon, getFileAction } from '../utils/fileHandler';
import useFileViewerStore from '../stores/useFileViewerStore';
import useAuthStore from '../stores/useAuthStore';

const PropertyFileTree = ({ selectedProperty, onFileClick }) => {
  const { setAllFiles, addFileOptimistic, removeFileOptimistic } = useFileViewerStore();
  const { user } = useAuthStore();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState(['root', 'documents', 'images', 'plans', 'spreadsheets']);
  const [googleSheetsAuthStatus, setGoogleSheetsAuthStatus] = useState(null);

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
        
        // Load regular files
        if (selectedProperty.files) {
          const propertyFiles = selectedProperty.files.map(file => ({
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type || 'file',
            url: file.url,
            s3Key: file.s3Key,
            createdAt: file.createdAt,
            isGoogleSheet: file.isGoogleSheet || false,
            spreadsheetId: file.spreadsheetId || null
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
              createdAt: file.createdAt,
              isGoogleSheet: file.isGoogleSheet || false,
              spreadsheetId: file.spreadsheetId || null
            }));
            setFiles(propertyFiles);
            setAllFiles(propertyFiles); // Update global store
          } else {
            setFiles([]);
          }
        }

        // Google Sheets are now included in the property files array
        // No separate loading needed
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
    checkGoogleSheetsAuthStatus();
  }, [selectedProperty?.id]);

  // Check Google Sheets authorization status
  const checkGoogleSheetsAuthStatus = async () => {
    try {
      const response = await googleSheetsService.getCompanyAuthStatus();
      if (response.success) {
        setGoogleSheetsAuthStatus(response.data);
      }
    } catch (error) {
      console.warn('Could not check Google Sheets auth status:', error);
      setGoogleSheetsAuthStatus({ isAuthorized: false });
    }
  };

  // Transform flat file list into tree structure with enhanced labels
  const treeData = useMemo(() => {
    const categorizeFile = (file) => {
      if (file.isGoogleSheet) return 'spreadsheets';
      
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
      spreadsheets: { files: [], label: 'Foi de calcul' },
      images: { files: [], label: 'Imagini' },
      documents: { files: [], label: 'Documente' },
      plans: { files: [], label: 'Planuri' },
      other: { files: [], label: 'Altele' }
    };

    // Add regular files
    files.forEach(file => {
      const category = categorizeFile(file);
      categories[category].files.push(file);
    });

    // Google Sheets are included in files array with isGoogleSheet: true

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
                  <span className={`text-sm font-medium truncate ${file.isConverting ? 'text-orange-600' : ''}`}>
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {file.size} • {new Date(file.createdAt).toLocaleDateString('ro-RO')}
                    {file.isConverting && (
                      <span className="ml-2 inline-flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-500"></div>
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ),
            icon: file.isGoogleSheet ? <FileSpreadsheet className="h-4 w-4" /> : <File className="h-4 w-4" />,
            data: file
          }))
        });
      }
    });

    return treeNodes;
  }, [files]);

  // Handle file upload - Excel goes to Google Sheets, others to S3
  const handleFileUpload = async (event) => {
    const uploadedFiles = Array.from(event.target.files);
    if (!selectedProperty?.id) return;
    
    setIsLoading(true);
    try {
      for (const file of uploadedFiles) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        if (['xlsx', 'xls', 'csv'].includes(fileExtension)) {
          // Excel files go directly to Google Sheets
          console.log(`Uploading ${file.name} to Google Sheets...`);
          const response = await apiService.convertExcelToGoogleSheet(selectedProperty.id, file);
          
          if (response.success) {
            console.log(`✅ ${file.name} uploaded to Google Sheets successfully`);
            // Reload files to get the new Google Sheet
            await loadPropertyFiles();
          } else {
            console.error('Failed to upload to Google Sheets:', response.error);
            alert(`Eroare la încărcarea "${file.name}" în Google Sheets: ${response.error}`);
          }
        } else {
          // Other files go to S3
          console.log(`Uploading ${file.name} to S3...`);
          await uploadRegularFile(file);
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Eroare la încărcarea fișierelor');
    } finally {
      setIsLoading(false);
    }
  };

  // Upload regular files (non-Excel)
  const uploadRegularFile = async (file) => {
    // Optimistic update - add file immediately to UI
    const tempFile = {
      id: `temp_${Date.now()}_${Math.random()}`,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
      url: '',
      s3Key: '',
      createdAt: new Date().toISOString(),
      isGoogleSheet: false,
      spreadsheetId: null
    };
    
    // Add optimistically to local state
    setFiles(prev => [...prev, tempFile]);
    addFileOptimistic(tempFile);
    
    // Upload file
    const response = await apiService.uploadPropertyFile(selectedProperty.id, file);
    if (response.success) {
      console.log('File uploaded successfully:', response.data);
      
      // Replace temp file with real file data
      const realFile = {
        id: response.data.fileId || tempFile.id,
        name: response.data.fileName || file.name,
        size: response.data.fileSize || tempFile.size,
        type: response.data.fileType || tempFile.type,
        url: response.data.fileUrl || '',
        s3Key: response.data.s3Key || '',
        createdAt: response.data.createdAt || tempFile.createdAt,
        isGoogleSheet: false,
        spreadsheetId: null
      };
      
      // Update with real data
      setFiles(prev => prev.map(f => f.id === tempFile.id ? realFile : f));
    } else {
      // Remove temp file on failure
      setFiles(prev => prev.filter(f => f.id !== tempFile.id));
      removeFileOptimistic(tempFile.id);
    }
  };

  // Create new Google Sheet
  const createNewGoogleSheet = async () => {
    if (!selectedProperty?.id) return;
    
    const title = prompt('Introdu numele foii de calcul:');
    if (!title) return;
    
    setIsLoading(true);
    try {
      const response = await googleSheetsService.createPropertySpreadsheet(selectedProperty.id, title);
      if (response.success) {
        console.log('Google Sheet created:', response.data);
        
        const newGoogleSheet = {
          id: `gs_${response.data.spreadsheetId}`,
          name: response.data.title || title,
          spreadsheetId: response.data.spreadsheetId,
          url: response.data.spreadsheetUrl,
          createdAt: new Date().toISOString(),
          isGoogleSheet: true,
          size: 'Google Sheet',
          type: 'GOOGLE_SHEET',
          s3Key: ''
        };
        
        // Reload files to get the new Google Sheet from backend
        await loadPropertyFiles();
      }
    } catch (error) {
      console.error('Error creating Google Sheet:', error);
      alert('Eroare la crearea foii de calcul');
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






  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Folder className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-gray-900">Fișiere</h3>
          {googleSheetsAuthStatus && !googleSheetsAuthStatus.isAuthorized && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs">
              <AlertCircle className="h-3 w-3" />
              <span>Google Sheets neautorizat</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">

          
          <label className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-lg transition-colors cursor-pointer ${
            googleSheetsAuthStatus?.isAuthorized
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`} 
          title={
            googleSheetsAuthStatus?.isAuthorized 
              ? "Încarcă fișiere"
              : "Google Sheets nu este autorizat pentru compania ta"
          }>
            <Upload className="h-4 w-4" />
            <span>Încarcă fișiere</span>
            <input
              type="file"
              multiple
              accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png,.gif,.bmp,.webp,.dwg,.dxf"
              onChange={handleFileUpload}
              disabled={!googleSheetsAuthStatus?.isAuthorized}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Google Sheets Authorization Warning */}
      {googleSheetsAuthStatus && !googleSheetsAuthStatus.isAuthorized && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-orange-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Google Sheets nu este autorizat
              </h3>
              <p className="mt-1 text-sm text-orange-700">
                Fișierele Excel nu pot fi convertite la Google Sheets. 
                {user?.role === 'admin' ? ' Contactează administratorul pentru autorizare.' : ' Contactează administratorul companiei pentru autorizare.'}
              </p>
            </div>
          </div>
        </div>
      )}

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
