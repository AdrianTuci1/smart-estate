// Document Viewers - Componente modulare pentru vizualizarea și editarea documentelor

import ExcelViewerComponent from './ExcelViewer';
import GoogleSheetsViewerComponent from './GoogleSheetsViewer';
import GoogleDocsViewerComponent from './GoogleDocsViewer';
import PDFViewerComponent from './PDFViewer';


export { ExcelViewerComponent as ExcelViewer };
export { GoogleSheetsViewerComponent as GoogleSheetsViewer };
export { GoogleDocsViewerComponent as GoogleDocsViewer };
export { PDFViewerComponent as PDFViewer };

// Utilitate pentru determinarea tipului de viewer necesar
export const getDocumentViewerType = (fileName, isGoogleSheet = false, isGoogleDoc = false) => {
  if (!fileName) return null;
  
  // Check if it's a Google Sheet first - MUST have isGoogleSheet flag
  if (isGoogleSheet) {
    return 'google-sheets';
  }
  
  // Check if it's a Google Doc - MUST have isGoogleDoc flag
  if (isGoogleDoc) {
    return 'google-docs';
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
export const isDocumentViewable = (fileName, isGoogleSheet = false, isGoogleDoc = false) => {
  return getDocumentViewerType(fileName, isGoogleSheet, isGoogleDoc) !== null;
};

// Verifică dacă un fișier poate fi editat
export const isDocumentEditable = (fileName, isGoogleSheet = false, isGoogleDoc = false) => {
  const viewerType = getDocumentViewerType(fileName, isGoogleSheet, isGoogleDoc);
  // Excel, Google Sheets și Google Docs pot fi editate
  return viewerType === 'excel' || viewerType === 'google-sheets' || viewerType === 'google-docs';
};

export default {
  ExcelViewer: ExcelViewerComponent,
  GoogleSheetsViewer: GoogleSheetsViewerComponent,
  GoogleDocsViewer: GoogleDocsViewerComponent,
  PDFViewer: PDFViewerComponent,
  getDocumentViewerType,
  isDocumentViewable,
  isDocumentEditable
};
