// Utility functions for handling file operations and opening files in native applications

/**
 * Opens a file URL in the user's default application
 * This works by creating a download link that, depending on browser settings and file type,
 * may open the file in a native application or download it
 * @param {string} fileUrl - The URL of the file to open
 * @param {string} fileName - The name of the file
 * @param {string} fileType - The type/extension of the file
 */
export const openFileInNativeApp = (fileUrl, fileName, fileType = '') => {
  // Create a temporary anchor element
  const link = document.createElement('a');
  link.href = fileUrl;
  
  // Set target to _blank to open in new tab/window
  // Browser will decide whether to open inline or download based on file type and settings
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  
  // For certain file types, we want to force download to ensure native app opening
  const forceDownloadTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
  const extension = fileType.toLowerCase() || fileName.split('.').pop()?.toLowerCase();
  
  if (forceDownloadTypes.includes(extension)) {
    link.download = fileName;
  }
  
  // Add to DOM, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Downloads a file to the user's device
 * @param {string} fileUrl - The URL of the file to download
 * @param {string} fileName - The name for the downloaded file
 */
export const downloadFile = (fileUrl, fileName) => {
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileName;
  link.target = '_blank';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Opens a file for viewing in browser (for images, PDFs that can be viewed inline)
 * @param {string} fileUrl - The URL of the file to view
 */
export const viewFileInBrowser = (fileUrl) => {
  window.open(fileUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Determines the best action for a file based on its type
 * @param {string} fileName - The name of the file
 * @param {string} fileType - The type/extension of the file
 * @returns {string} - 'view', 'download', or 'native'
 */
export const getFileAction = (fileName, fileType = '') => {
  const extension = fileType.toLowerCase() || fileName.split('.').pop()?.toLowerCase();
  
  // Files that are best viewed in browser
  const viewableInBrowser = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  
  // Files that should be downloaded for native app opening
  const nativeAppFiles = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'dwg', 'dxf'];
  
  // Files that should just be downloaded
  const downloadFiles = ['zip', 'rar', '7z', 'tar', 'gz'];
  
  if (viewableInBrowser.includes(extension)) {
    return 'view';
  } else if (nativeAppFiles.includes(extension)) {
    return 'native';
  } else {
    return 'download';
  }
};

/**
 * Gets the appropriate icon name for a file type
 * @param {string} fileName - The name of the file
 * @param {string} fileType - The type/extension of the file
 * @returns {string} - Icon name for lucide-react
 */
export const getFileIcon = (fileName, fileType = '') => {
  const extension = fileType.toLowerCase() || fileName.split('.').pop()?.toLowerCase();
  
  const iconMap = {
    // Images
    jpg: 'Image',
    jpeg: 'Image',
    png: 'Image',
    gif: 'Image',
    webp: 'Image',
    svg: 'Image',
    
    // Documents
    pdf: 'FileText',
    doc: 'FileText',
    docx: 'FileText',
    txt: 'FileText',
    rtf: 'FileText',
    
    // Spreadsheets
    xls: 'Sheet',
    xlsx: 'Sheet',
    csv: 'Sheet',
    
    // Presentations
    ppt: 'Presentation',
    pptx: 'Presentation',
    
    // CAD files
    dwg: 'Drafting',
    dxf: 'Drafting',
    
    // Archives
    zip: 'Archive',
    rar: 'Archive',
    '7z': 'Archive',
    tar: 'Archive',
    gz: 'Archive',
    
    // Default
    default: 'File'
  };
  
  return iconMap[extension] || iconMap.default;
};

/**
 * Formats file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Handles file operations based on action type
 * @param {Object} file - File object with url, name, type properties
 * @param {string} action - Action to perform: 'view', 'download', 'native'
 */
export const handleFileAction = (file, action = 'auto') => {
  const { url, name, type } = file;
  
  if (action === 'auto') {
    action = getFileAction(name, type);
  }
  
  switch (action) {
    case 'view':
      viewFileInBrowser(url);
      break;
    case 'download':
      downloadFile(url, name);
      break;
    case 'native':
      openFileInNativeApp(url, name, type);
      break;
    default:
      viewFileInBrowser(url);
  }
};

export default {
  openFileInNativeApp,
  downloadFile,
  viewFileInBrowser,
  getFileAction,
  getFileIcon,
  formatFileSize,
  handleFileAction
};
