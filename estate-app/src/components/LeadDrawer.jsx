import { useState, useEffect } from 'react';
import { X, Phone, User, Eye, FileText, FileImage, Save, Edit3, Plus, Calendar, Mail, Upload, Trash2, AlertTriangle } from 'lucide-react';
import useAppStore from '../stores/useAppStore';

const LeadDrawer = () => {
  const { selectedLead, isLeadDrawerOpen, closeLeadDrawer } = useAppStore();
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    status: 'New',
    interest: '',
    property: '',
    notes: ''
  });
  const [files, setFiles] = useState([]);
  const [history, setHistory] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [newHistoryEntry, setNewHistoryEntry] = useState({ type: '', date: '', notes: '' });
  const [previewFile, setPreviewFile] = useState(null);

  // Check if we're in create mode (selectedLead is null but drawer is open)
  useEffect(() => {
    if (isLeadDrawerOpen) {
      // Reset to initial state when drawer opens
      setActiveTab('details');
      setPreviewFile(null);
      
      if (!selectedLead) {
        setIsCreating(true);
        setIsEditing(true);
        setFormData({
          name: '',
          phone: '',
          email: '',
          status: 'New',
          interest: '',
          property: '',
          notes: ''
        });
        setFiles([]);
        setHistory([]);
      } else {
        setIsCreating(false);
        setIsEditing(false);
        setFormData({
          name: selectedLead.name || '',
          phone: selectedLead.phone || '',
          email: selectedLead.email || '',
          status: selectedLead.status || 'New',
          interest: selectedLead.interest || '',
          property: selectedLead.property || '',
          notes: selectedLead.notes || ''
        });
        // Mock data for files and history
        setFiles([
          { id: 1, name: 'Ofertă personalizată', type: 'PDF', size: '1.2 MB', url: '#' },
          { id: 2, name: 'Planuri apartament', type: 'PDF', size: '2.1 MB', url: '#' }
        ]);
        setHistory([
          { id: 1, type: 'Apel telefonic', date: '2024-01-15', time: '14:30', notes: 'Clientul a fost interesat de apartamentul cu 3 camere. Urmează să trimit oferta detaliată.' },
          { id: 2, type: 'Email trimis', date: '2024-01-12', time: '09:15', notes: 'Am trimis informații despre proprietățile disponibile în zona dorită.' }
        ]);
      }
    }
  }, [isLeadDrawerOpen, selectedLead]);

  if (!isLeadDrawerOpen) return null;

  const statusOptions = [
    { value: 'New', label: 'New', color: 'bg-blue-100 text-blue-800' },
    { value: 'Attempted', label: 'Attempted', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'Connected', label: 'Connected', color: 'bg-green-100 text-green-800' },
    { value: 'Progress', label: 'Progress', color: 'bg-purple-100 text-purple-800' },
    { value: 'Potential', label: 'Potential', color: 'bg-orange-100 text-orange-800' },
    { value: 'Customer', label: 'Customer', color: 'bg-emerald-100 text-emerald-800' }
  ];

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.color : 'bg-gray-100 text-gray-800';
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (isCreating) {
      // Handle creating new lead
      console.log('Creating new lead:', formData);
      // TODO: Implement API call to create lead
    } else {
      // Handle updating existing lead
      console.log('Updating lead:', formData);
      // TODO: Implement API call to update lead
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (isCreating) {
      closeLeadDrawer();
    } else {
      setIsEditing(false);
      // Reset form data to original values
      setFormData({
        name: selectedLead.name || '',
        phone: selectedLead.phone || '',
        email: selectedLead.email || '',
        status: selectedLead.status || 'New',
        interest: selectedLead.interest || '',
        property: selectedLead.property || '',
        notes: selectedLead.notes || ''
      });
    }
  };

  const handleClose = () => {
    if (isEditing || isCreating) {
      handleCancel();
    } else {
      closeLeadDrawer();
    }
    // Reset to initial state
    setActiveTab('details');
    setPreviewFile(null);
  };

  const handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files).map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      type: file.type.split('/')[1].toUpperCase(),
      size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
      url: URL.createObjectURL(file)
    }));
    setFiles(prev => [...prev, ...uploadedFiles]);
  };

  const handleAddHistoryEntry = () => {
    if (newHistoryEntry.type && newHistoryEntry.date && newHistoryEntry.notes) {
      const entry = {
        id: Date.now(),
        type: newHistoryEntry.type,
        date: newHistoryEntry.date,
        time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
        notes: newHistoryEntry.notes
      };
      setHistory(prev => [entry, ...prev]);
      setNewHistoryEntry({ type: '', date: '', notes: '' });
    }
  };

  const handleDeleteLead = () => {
    if (deleteConfirmText === 'sterge') {
      console.log('Deleting lead:', selectedLead?.id);
      // TODO: Implement API call to delete lead
      closeLeadDrawer();
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  const handlePreviewFile = (file) => {
    setPreviewFile(file);
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  return (
    <>
      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 z-50 ${previewFile ? 'w-full' : 'w-96'} bg-white/95 backdrop-blur-sm shadow-drawer transform transition-all duration-300 ease-in-out ${isLeadDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex h-full">
          {/* Main Content */}
          <div className={`flex flex-col ${previewFile ? 'w-96 border-r border-gray-200' : 'w-full'}`}>
          {/* Header with Close and Edit buttons */}
          <div className={`flex items-center p-4 border-b border-gray-200 ${
            isEditing || isCreating 
              ? 'justify-end space-x-2' 
              : 'justify-between'
          }`}>
            {isEditing || isCreating ? (
              <button
                onClick={handleSave}
                className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{isCreating ? 'Creează' : 'Salvează'}</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Editează</span>
                </button>
                {!isCreating && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Header Section - Name and Status - only in details tab */}
            {activeTab === 'details' && (
              <div className="p-6 border-b border-gray-200">
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Numele lead-ului"
                        className="text-xl font-semibold text-gray-900 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full"
                      />
                    ) : (
                      <h2 className="text-xl font-semibold text-gray-900">
                        {formData.name || 'Nume lead'}
                      </h2>
                    )}
                  </div>

                  {/* Contact info */}
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      {isEditing ? (
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="Numărul de telefon"
                          className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 flex-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-600">{formData.phone || 'Număr de telefon'}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      {isEditing ? (
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Adresa de email"
                          className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 flex-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-600">{formData.email || 'Adresa de email'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content */}
            {activeTab === 'details' && (
              <>
                {/* Lead Information */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Informații Lead</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      {isEditing ? (
                        <select
                          value={formData.status}
                          onChange={(e) => handleInputChange('status', e.target.value)}
                          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(formData.status)}`}>
                          {formData.status}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Interes</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.interest}
                          onChange={(e) => handleInputChange('interest', e.target.value)}
                          placeholder="Tipul de proprietate dorit"
                          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      ) : (
                        <p className="text-gray-600 text-sm">
                          {formData.interest || 'Nu a fost specificat'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Proprietate</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.property}
                          onChange={(e) => handleInputChange('property', e.target.value)}
                          placeholder="Proprietatea de interes"
                          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      ) : (
                        <p className="text-gray-600 text-sm">
                          {formData.property || 'Nu a fost specificat'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Note</h3>
                  {isEditing ? (
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Note despre lead..."
                      className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                  ) : (
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {formData.notes || 'Nu există note pentru acest lead.'}
                    </p>
                  )}
                </div>
              </>
            )}

            {activeTab === 'history' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Istoric Contacte</h3>
                  <button
                    onClick={() => setNewHistoryEntry({ type: '', date: '', notes: '' })}
                    className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adaugă</span>
                  </button>
                </div>

                {/* Add new history entry form */}
                {newHistoryEntry.type && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-primary-900 mb-3">Adaugă intrare nouă</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tip contact</label>
                        <select
                          value={newHistoryEntry.type}
                          onChange={(e) => setNewHistoryEntry(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Selectează tipul</option>
                          <option value="Apel telefonic">Apel telefonic</option>
                          <option value="Email trimis">Email trimis</option>
                          <option value="Email primit">Email primit</option>
                          <option value="Întâlnire">Întâlnire</option>
                          <option value="Vizionare">Vizionare</option>
                          <option value="Altul">Altul</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                        <input
                          type="date"
                          value={newHistoryEntry.date}
                          onChange={(e) => setNewHistoryEntry(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                        <textarea
                          value={newHistoryEntry.notes}
                          onChange={(e) => setNewHistoryEntry(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Descrierea contactului..."
                          className="w-full h-20 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleAddHistoryEntry}
                          className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          Salvează
                        </button>
                        <button
                          onClick={() => setNewHistoryEntry({ type: '', date: '', notes: '' })}
                          className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Anulează
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {history.map((entry) => (
                    <div key={entry.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{entry.type}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(entry.date).toLocaleDateString('ro-RO')}, {entry.time}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">{entry.notes}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'files' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Fișiere și documente</h3>
                  <label className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors cursor-pointer">
                    <Upload className="h-4 w-4" />
                    <span>Încarcă</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                    />
                  </label>
                </div>
                <div className="space-y-3">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      {file.type === 'PDF' ? (
                        <FileText className="h-5 w-5 text-gray-400" />
                      ) : (
                        <FileImage className="h-5 w-5 text-gray-400" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{file.type} • {file.size}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePreviewFile(file)}
                          className="text-primary-600 hover:text-primary-800 p-1"
                          title="Vezi fișier"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setFiles(prev => prev.filter(f => f.id !== file.id))}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Șterge fișier"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {files.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Nu există fișiere încărcate</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tabs at bottom */}
          <div className="flex border-t border-gray-200">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'text-primary-600 border-t-2 border-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Detalii</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-primary-600 border-t-2 border-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Istoric</span>
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'files'
                  ? 'text-primary-600 border-t-2 border-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Fișiere</span>
            </button>
          </div>
          </div>

          {/* Preview Panel */}
          {previewFile && (
            <div className="flex-1 flex flex-col bg-gray-50">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">{previewFile.name}</h3>
                <button
                  onClick={closePreview}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 p-4">
                {previewFile.type === 'PDF' ? (
                  <div className="h-full bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Previzualizare PDF</p>
                      <p className="text-sm text-gray-400 mt-2">{previewFile.name}</p>
                    </div>
                  </div>
                ) : previewFile.type && ['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP'].includes(previewFile.type) ? (
                  <div className="h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <img
                      src={previewFile.url}
                      alt={previewFile.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-full bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Previzualizare nu este disponibilă</p>
                      <p className="text-sm text-gray-400 mt-2">{previewFile.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-opacity-10 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Șterge Lead</h3>
                <p className="text-sm text-gray-500">Această acțiune nu poate fi anulată.</p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">
                Pentru a confirma ștergerea, scrie <strong>"sterge"</strong> în câmpul de mai jos:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="sterge"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteLead}
                disabled={deleteConfirmText !== 'sterge'}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  deleteConfirmText === 'sterge'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Șterge Lead
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeadDrawer;
