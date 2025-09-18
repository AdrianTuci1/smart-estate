import { useState, useEffect } from 'react';
import { Save, Plus, Minus } from 'lucide-react';

const SimpleExcelEditor = ({ data, onDataChange, allowEdit = true, readOnly = false }) => {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    if (data && data.length > 0) {
      // Asigură-te că toate rândurile au același număr de coloane
      const maxCols = Math.max(...data.map(row => row.length));
      const normalizedData = data.map(row => {
        const normalizedRow = [...row];
        while (normalizedRow.length < maxCols) {
          normalizedRow.push('');
        }
        return normalizedRow;
      });
      setTableData(normalizedData);
    } else {
      // Creează un tabel gol 10x10
      const emptyData = Array(10).fill().map(() => Array(10).fill(''));
      setTableData(emptyData);
    }
  }, [data]);

  const handleCellClick = (rowIndex, colIndex) => {
    if (!allowEdit || readOnly) return;
    
    setEditingCell({ row: rowIndex, col: colIndex });
    setEditValue(tableData[rowIndex][colIndex] || '');
  };

  const handleCellChange = (e) => {
    setEditValue(e.target.value);
  };

  const handleCellSubmit = () => {
    if (editingCell) {
      const newData = [...tableData];
      newData[editingCell.row][editingCell.col] = editValue;
      setTableData(newData);
      
      if (onDataChange) {
        onDataChange(newData);
      }
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCellSubmit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const addRow = () => {
    if (!allowEdit || readOnly) return;
    
    const colCount = tableData[0]?.length || 10;
    const newRow = Array(colCount).fill('');
    const newData = [...tableData, newRow];
    setTableData(newData);
    
    if (onDataChange) {
      onDataChange(newData);
    }
  };

  const addColumn = () => {
    if (!allowEdit || readOnly) return;
    
    const newData = tableData.map(row => [...row, '']);
    setTableData(newData);
    
    if (onDataChange) {
      onDataChange(newData);
    }
  };

  const removeRow = () => {
    if (!allowEdit || readOnly || tableData.length <= 1) return;
    
    const newData = tableData.slice(0, -1);
    setTableData(newData);
    
    if (onDataChange) {
      onDataChange(newData);
    }
  };

  const removeColumn = () => {
    if (!allowEdit || readOnly || tableData[0]?.length <= 1) return;
    
    const newData = tableData.map(row => row.slice(0, -1));
    setTableData(newData);
    
    if (onDataChange) {
      onDataChange(newData);
    }
  };

  const getColumnLabel = (index) => {
    let label = '';
    let num = index;
    while (num >= 0) {
      label = String.fromCharCode(65 + (num % 26)) + label;
      num = Math.floor(num / 26) - 1;
    }
    return label;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      {allowEdit && !readOnly && (
        <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 p-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={addRow}
              className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              title="Adaugă rând"
            >
              <Plus className="h-3 w-3 mr-1" />
              Rând
            </button>
            <button
              onClick={addColumn}
              className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              title="Adaugă coloană"
            >
              <Plus className="h-3 w-3 mr-1" />
              Coloană
            </button>
            <button
              onClick={removeRow}
              className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              title="Elimină ultimul rând"
            >
              <Minus className="h-3 w-3 mr-1" />
              Rând
            </button>
            <button
              onClick={removeColumn}
              className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              title="Elimină ultima coloană"
            >
              <Minus className="h-3 w-3 mr-1" />
              Coloană
            </button>
          </div>
        </div>
      )}

      {/* Spreadsheet */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full border-collapse">
          {/* Header cu literele coloanelor */}
          <thead>
            <tr>
              <th className="w-12 h-8 bg-gray-100 border border-gray-300 text-xs font-medium text-gray-600 sticky top-0 z-10"></th>
              {tableData[0]?.map((_, colIndex) => (
                <th
                  key={colIndex}
                  className="min-w-24 h-8 bg-gray-100 border border-gray-300 text-xs font-medium text-gray-600 sticky top-0 z-10 px-2"
                >
                  {getColumnLabel(colIndex)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {/* Header cu numărul rândului */}
                <td className="w-12 h-8 bg-gray-100 border border-gray-300 text-xs font-medium text-gray-600 text-center sticky left-0 z-10">
                  {rowIndex + 1}
                </td>
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className={`min-w-24 h-8 border border-gray-300 p-0 relative group ${
                      !readOnly ? 'hover:bg-blue-50 cursor-cell' : 'cursor-default'
                    }`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={handleCellChange}
                        onBlur={handleCellSubmit}
                        onKeyDown={handleKeyDown}
                        className="w-full h-full px-1 text-xs border-0 outline-none bg-white focus:bg-blue-50"
                        autoFocus
                      />
                    ) : (
                      <div className="w-full h-full px-1 py-1 text-xs flex items-center min-h-[2rem] overflow-hidden">
                        <span className="truncate">{cell || ''}</span>
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status bar */}
      <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-3 py-1">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{tableData.length} rânduri × {tableData[0]?.length || 0} coloane</span>
          <div className="flex items-center space-x-4">
            {readOnly && <span className="text-blue-600">📖 Mod previzualizare</span>}
            {!readOnly && allowEdit && <span className="text-green-600">✏️ Mod editare</span>}
            {editingCell && !readOnly && (
              <span>
                Editez {getColumnLabel(editingCell.col)}{editingCell.row + 1} - Apasă Enter pentru a salva
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleExcelEditor;
