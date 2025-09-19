// Document Viewers - Componente modulare pentru vizualizarea și editarea documentelor

import DocxViewerComponent from './DocxViewer';
import ExcelViewerComponent from './ExcelViewer';
import GoogleSheetsViewerComponent from './GoogleSheetsViewer';
import PDFViewerComponent from './PDFViewer';

export { DocxViewerComponent as DocxViewer };
export { ExcelViewerComponent as ExcelViewer };
export { GoogleSheetsViewerComponent as GoogleSheetsViewer };
export { PDFViewerComponent as PDFViewer };

// Utilitate pentru determinarea tipului de viewer necesar
export const getDocumentViewerType = (fileName, isGoogleSheet = false) => {
  if (!fileName) return null;
  
  // Check if it's a Google Sheet first - MUST have isGoogleSheet flag
  if (isGoogleSheet) {
    return 'google-sheets';
  }
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const viewerMap = {
    // DOCX documents
    'docx': 'docx',
    'doc': 'docx', // Mammoth poate procesa și DOC parțial
    
    // Excel spreadsheets - use Excel viewer for regular Excel files
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
export const isDocumentViewable = (fileName, isGoogleSheet = false) => {
  return getDocumentViewerType(fileName, isGoogleSheet) !== null;
};

// Verifică dacă un fișier poate fi editat
export const isDocumentEditable = (fileName, isGoogleSheet = false) => {
  const viewerType = getDocumentViewerType(fileName, isGoogleSheet);
  // Excel și Google Sheets pot fi editate
  return viewerType === 'excel' || viewerType === 'google-sheets';
};

export default {
  DocxViewer: DocxViewerComponent,
  ExcelViewer: ExcelViewerComponent,
  GoogleSheetsViewer: GoogleSheetsViewerComponent,
  PDFViewer: PDFViewerComponent,
  getDocumentViewerType,
  isDocumentViewable,
  isDocumentEditable
};
