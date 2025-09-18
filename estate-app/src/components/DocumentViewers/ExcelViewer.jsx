import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Sheet, Download, AlertCircle, Edit3, Eye } from 'lucide-react';
import SimpleExcelEditor from './SimpleExcelEditor';
import './DocumentViewers.css';

const ExcelViewer = ({ fileUrl, fileName, onError, allowEdit = true }) => {
  const [workbook, setWorkbook] = useState(null);
  const [currentSheet, setCurrentSheet] = useState(0);
  const [sheetNames, setSheetNames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    if (fileUrl) {
      loadExcelContent();
    }
  }, [fileUrl]);

  useEffect(() => {
    if (workbook && sheetNames.length > 0) {
      generateTableData();
    }
  }, [workbook, currentSheet]);

  // Cleanup effect - nu mai e necesar pentru SimpleExcelEditor
  useEffect(() => {
    return () => {
      // Cleanup simplu - doar resetare state
      setTableData([]);
      setIsEditMode(false);
    };
  }, []);

  const loadExcelContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('Eroare la încărcarea fișierului');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      
      setWorkbook(wb);
      setSheetNames(wb.SheetNames);
      setCurrentSheet(0);
    } catch (error) {
      console.error('Error loading Excel:', error);
      setError(error.message);
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateTableData = () => {
    if (!workbook || !sheetNames[currentSheet]) return;
    
    const worksheet = workbook.Sheets[sheetNames[currentSheet]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '',
      raw: false 
    });
    
    setTableData(jsonData);
  };

  const downloadFile = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'spreadsheet.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleEditMode = () => {
    if (!allowEdit) return;
    setIsEditMode(!isEditMode);
  };

  // Funcție pentru salvarea modificărilor (poate fi extinsă pentru a salva pe server)
  const handleDataChange = (newData) => {
    setTableData(newData);
    console.log('Date Excel modificate:', newData);
    // TODO: Implementează salvarea pe server aici
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă foaia de calcul...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center p-8">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Eroare la încărcarea foii de calcul
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={downloadFile}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Descarcă fișierul
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Compact Header with Edit Toggle */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {allowEdit && (
              <button
                onClick={toggleEditMode}
                className={`inline-flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${
                  isEditMode 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={isEditMode ? 'Ieși din modul editare' : 'Intră în modul editare'}
              >
                {isEditMode ? (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Previzualizare
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4 mr-1" />
                    Editează
                  </>
                )}
              </button>
            )}
          </div>

          {/* Sheet tabs */}
          {sheetNames.length > 1 && !isEditMode && (
            <div className="sheet-tabs">
              {sheetNames.map((name, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSheet(index)}
                  className={`sheet-tab ${currentSheet === index ? 'active' : ''}`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content - Folosește SimpleExcelEditor pentru ambele moduri */}
      <div className="flex-1 overflow-hidden">
        <SimpleExcelEditor 
          data={tableData}
          allowEdit={isEditMode && allowEdit}
          onDataChange={handleDataChange}
          readOnly={!isEditMode}
        />
      </div>
    </div>
  );
};

export default ExcelViewer;
