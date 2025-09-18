import { create } from 'zustand';

const useFileViewerStore = create((set, get) => ({
  // State
  isOpen: false,
  selectedFile: null,
  selectedGalleryImages: [],
  viewerType: 'files', // 'files' or 'gallery'
  
  // Actions
  openFileViewer: (file) => {
    set({
      isOpen: true,
      selectedFile: file,
      selectedGalleryImages: [],
      viewerType: 'files'
    });
  },
  
  openGalleryViewer: (images) => {
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
      viewerType: 'files'
    });
  },
  
  // Get current items based on viewer type
  getCurrentItems: () => {
    const { selectedFile, selectedGalleryImages, viewerType } = get();
    if (viewerType === 'files') {
      return selectedFile ? [selectedFile] : [];
    } else {
      return selectedGalleryImages;
    }
  }
}));

export default useFileViewerStore;
