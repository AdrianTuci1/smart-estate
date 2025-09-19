import { create } from 'zustand';

const useFileViewerStore = create((set, get) => ({
  // State
  isOpen: false,
  selectedFile: null,
  selectedGalleryImages: [],
  viewerType: 'files', // 'files' or 'gallery'
  allFiles: [], // Store all files for the property
  allGalleryImages: [], // Store all gallery images for the property
  
  // Actions
  openFileViewer: (file) => {
    // Always close current viewer and open new one with file
    set({
      isOpen: true,
      selectedFile: file,
      selectedGalleryImages: [],
      viewerType: 'files'
    });
  },
  
  openGalleryViewer: (images) => {
    // Always close current viewer and open new one with gallery
    set({
      isOpen: true,
      selectedFile: null,
      selectedGalleryImages: images,
      viewerType: 'gallery'
    });
  },
  
  closeFileViewer: () => {
    set({
      isOpen: false,
      selectedFile: null,
      selectedGalleryImages: [],
      viewerType: 'files',
      allFiles: [],
      allGalleryImages: []
    });
  },
  
  // Set all items for a property (for when loading all files/images)
  setAllFiles: (files) => {
    set({ allFiles: files });
  },
  
  setAllGalleryImages: (images) => {
    set({ allGalleryImages: images });
  },
  
  // Update items after deletion
  updateItemsAfterDeletion: (deletedIndex, type) => {
    const { allFiles, allGalleryImages } = get();
    
    if (type === 'gallery') {
      const newImages = allGalleryImages.filter((_, index) => index !== deletedIndex);
      set({ 
        allGalleryImages: newImages,
        selectedGalleryImages: newImages
      });
    } else if (type === 'files') {
      const newFiles = allFiles.filter((_, index) => index !== deletedIndex);
      set({ 
        allFiles: newFiles,
        selectedFile: newFiles.length > 0 ? newFiles[0] : null
      });
    }
  },
  
  // Update gallery images from external source (like PropertyGallery component)
  updateGalleryImages: (newImages) => {
    const { viewerType } = get();
    set({ allGalleryImages: newImages });
    
    // If currently viewing gallery, update selected images too
    if (viewerType === 'gallery') {
      set({ selectedGalleryImages: newImages });
    }
  },
  
  // Optimistic file operations
  addFileOptimistic: (file) => {
    const { allFiles } = get();
    const newFiles = [...allFiles, file];
    set({ allFiles: newFiles });
  },
  
  removeFileOptimistic: (fileId) => {
    const { allFiles, selectedFile, viewerType } = get();
    const newFiles = allFiles.filter(file => file.id !== fileId);
    set({ allFiles: newFiles });
    
    // If currently viewing the deleted file, update selected file
    if (viewerType === 'files' && selectedFile && selectedFile.id === fileId) {
      set({ selectedFile: newFiles.length > 0 ? newFiles[0] : null });
    }
  },
  
  // Optimistic gallery operations
  addGalleryImageOptimistic: (image) => {
    const { allGalleryImages, viewerType } = get();
    const newImages = [...allGalleryImages, image];
    set({ allGalleryImages: newImages });
    
    // If currently viewing gallery, update selected images too
    if (viewerType === 'gallery') {
      set({ selectedGalleryImages: newImages });
    }
  },
  
  removeGalleryImageOptimistic: (imageUrl) => {
    const { allGalleryImages, viewerType } = get();
    const newImages = allGalleryImages.filter(img => 
      img.url !== imageUrl && img.originalUrl !== imageUrl
    );
    set({ allGalleryImages: newImages });
    
    // If currently viewing gallery, update selected images too
    if (viewerType === 'gallery') {
      set({ selectedGalleryImages: newImages });
    }
  },
  
  // Get current items based on viewer type
  getCurrentItems: () => {
    const { selectedFile, selectedGalleryImages, viewerType, allFiles, allGalleryImages } = get();
    
    // If we have preview items (selectedFile or selectedGalleryImages), use those
    if (viewerType === 'files' && selectedFile) {
      return [selectedFile];
    } else if (viewerType === 'gallery' && selectedGalleryImages.length > 0) {
      return selectedGalleryImages;
    }
    
    // Otherwise, use all items for the property
    if (viewerType === 'files') {
      return allFiles;
    } else {
      return allGalleryImages;
    }
  }
}));

export default useFileViewerStore;
