// Document Viewers - Componente modulare pentru vizualizarea și editarea documentelor

import DocxViewerComponent from './DocxViewer';
import ExcelViewerComponent from './ExcelViewer';
import PDFViewerComponent from './PDFViewer';

export { DocxViewerComponent as DocxViewer };
export { ExcelViewerComponent as ExcelViewer };
export { PDFViewerComponent as PDFViewer };

// Utilitate pentru determinarea tipului de viewer necesar
export const getDocumentViewerType = (fileName) => {
  if (!fileName) return null;
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const viewerMap = {
    // DOCX documents
    'docx': 'docx',
    'doc': 'docx', // Mammoth poate procesa și DOC parțial
    
    // Excel spreadsheets
    'xlsx': 'excel',
    'xls': 'excel',
    'xlsm': 'excel',
    'xlsb': 'excel',
    'csv': 'excel',
    
    // PDF documents
    'pdf': 'pdf'
  };
  
  return viewerMap[extension] || null;
};

// Verifică dacă un fișier poate fi vizualizat cu componentele noastre
export const isDocumentViewable = (fileName) => {
  return getDocumentViewerType(fileName) !== null;
};

// Verifică dacă un fișier poate fi editat
export const isDocumentEditable = (fileName) => {
  const viewerType = getDocumentViewerType(fileName);
  // Doar Excel poate fi editat momentan
  return viewerType === 'excel';
};

export default {
  DocxViewer: DocxViewerComponent,
  ExcelViewer: ExcelViewerComponent,
  PDFViewer: PDFViewerComponent,
  getDocumentViewerType,
  isDocumentViewable,
  isDocumentEditable
};
