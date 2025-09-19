// Google Sheets API service for managing spreadsheets
class GoogleSheetsService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    this.googleSheetsAPI = 'https://sheets.googleapis.com/v4/spreadsheets';
  }

  // Generic request method with Google API token
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('authToken');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Google Sheets API request failed:', error);
      throw error;
    }
  }

  // Company Google Sheets authorization methods
  async getCompanyAuthUrl() {
    return this.request('/api/google-sheets/auth/company/url');
  }

  async handleCompanyAuthCallback(code, state) {
    return this.request('/api/google-sheets/auth/company/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });
  }

  async getCompanyAuthStatus() {
    return this.request('/api/google-sheets/auth/company/status');
  }

  // Google Sheets API methods
  async createSpreadsheet(title, propertyId) {
    return this.request('/api/google-sheets/create', {
      method: 'POST',
      body: JSON.stringify({ title, propertyId }),
    });
  }

  async getSpreadsheet(spreadsheetId) {
    return this.request(`/api/google-sheets/${spreadsheetId}`);
  }

  async getSpreadsheetData(spreadsheetId, range = null) {
    const endpoint = range 
      ? `/api/google-sheets/${spreadsheetId}/values/${encodeURIComponent(range)}`
      : `/api/google-sheets/${spreadsheetId}/values`;
    return this.request(endpoint);
  }

  async updateSpreadsheetData(spreadsheetId, range, values) {
    return this.request(`/api/google-sheets/${spreadsheetId}/values/${encodeURIComponent(range)}`, {
      method: 'PUT',
      body: JSON.stringify({ values }),
    });
  }

  async appendSpreadsheetData(spreadsheetId, range, values) {
    return this.request(`/api/google-sheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append`, {
      method: 'POST',
      body: JSON.stringify({ values }),
    });
  }

  async getSpreadsheetSheets(spreadsheetId) {
    return this.request(`/api/google-sheets/${spreadsheetId}/sheets`);
  }

  async addSheet(spreadsheetId, sheetName) {
    return this.request(`/api/google-sheets/${spreadsheetId}/sheets`, {
      method: 'POST',
      body: JSON.stringify({ sheetName }),
    });
  }

  async deleteSheet(spreadsheetId, sheetId) {
    return this.request(`/api/google-sheets/${spreadsheetId}/sheets/${sheetId}`, {
      method: 'DELETE',
    });
  }

  async shareSpreadsheet(spreadsheetId, email, role = 'reader') {
    return this.request(`/api/google-sheets/${spreadsheetId}/share`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  async getSpreadsheetPermissions(spreadsheetId) {
    return this.request(`/api/google-sheets/${spreadsheetId}/permissions`);
  }

  async updateSpreadsheetPermissions(spreadsheetId, permissionId, role) {
    return this.request(`/api/google-sheets/${spreadsheetId}/permissions/${permissionId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async deleteSpreadsheetPermission(spreadsheetId, permissionId) {
    return this.request(`/api/google-sheets/${spreadsheetId}/permissions/${permissionId}`, {
      method: 'DELETE',
    });
  }

  // Property-specific Google Sheets methods
  async createPropertySpreadsheet(propertyId, title) {
    return this.request(`/api/properties/${propertyId}/google-sheets`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async getPropertySpreadsheets(propertyId) {
    return this.request(`/api/properties/${propertyId}/google-sheets`);
  }

  async linkSpreadsheetToProperty(propertyId, spreadsheetId, fileName) {
    return this.request(`/api/properties/${propertyId}/google-sheets/link`, {
      method: 'POST',
      body: JSON.stringify({ spreadsheetId, fileName }),
    });
  }

  async unlinkSpreadsheetFromProperty(propertyId, spreadsheetId) {
    return this.request(`/api/properties/${propertyId}/google-sheets/${spreadsheetId}`, {
      method: 'DELETE',
    });
  }

  // File conversion methods
  async convertExcelToGoogleSheet(propertyId, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${this.baseURL}/api/properties/${propertyId}/google-sheets/convert`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  async exportGoogleSheetToExcel(spreadsheetId, format = 'xlsx') {
    return this.request(`/api/google-sheets/${spreadsheetId}/export`, {
      method: 'POST',
      body: JSON.stringify({ format }),
    });
  }

  // Real-time collaboration methods
  async getSpreadsheetCollaborators(spreadsheetId) {
    return this.request(`/api/google-sheets/${spreadsheetId}/collaborators`);
  }

  async getSpreadsheetRevisions(spreadsheetId) {
    return this.request(`/api/google-sheets/${spreadsheetId}/revisions`);
  }

  async restoreSpreadsheetRevision(spreadsheetId, revisionId) {
    return this.request(`/api/google-sheets/${spreadsheetId}/revisions/${revisionId}/restore`, {
      method: 'POST',
    });
  }

  // Utility methods
  getSpreadsheetEmbedUrl(spreadsheetId, sheetId = null) {
    const baseUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    return sheetId ? `${baseUrl}#gid=${sheetId}` : baseUrl;
  }

  getSpreadsheetViewUrl(spreadsheetId, sheetId = null) {
    const baseUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/view`;
    return sheetId ? `${baseUrl}#gid=${sheetId}` : baseUrl;
  }

  getSpreadsheetPublicUrl(spreadsheetId) {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/pubhtml`;
  }

  // Format conversion utilities
  convertToA1Notation(row, col) {
    let result = '';
    while (col > 0) {
      col--;
      result = String.fromCharCode(65 + (col % 26)) + result;
      col = Math.floor(col / 26);
    }
    return result + (row + 1);
  }

  parseA1Notation(a1Notation) {
    const match = a1Notation.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    
    const [, colStr, rowStr] = match;
    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + (colStr.charCodeAt(i) - 64);
    }
    
    return {
      row: parseInt(rowStr) - 1,
      col: col - 1
    };
  }
}

// Create and export a singleton instance
const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService;
