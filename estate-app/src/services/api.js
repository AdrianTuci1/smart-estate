// API service layer for communicating with the backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic request method
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
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile() {
    return this.request('/api/auth/profile');
  }

  async refreshToken() {
    return this.request('/api/auth/refresh', {
      method: 'POST',
    });
  }

  // Properties methods
  async getProperties(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/properties?${queryString}` : '/api/properties';
    return this.request(endpoint);
  }

  async getPropertiesByBounds(bounds) {
    const { north, south, east, west } = bounds;
    const params = new URLSearchParams({
      north: north.toString(),
      south: south.toString(),
      east: east.toString(),
      west: west.toString()
    });
    return this.request(`/api/properties/map/bounds?${params.toString()}`);
  }

  async getProperty(id) {
    return this.request(`/api/properties/${id}`);
  }

  async createProperty(propertyData) {
    return this.request('/api/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  }

  async updateProperty(id, propertyData) {
    return this.request(`/api/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
  }

  async deleteProperty(id) {
    return this.request(`/api/properties/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadPropertyDocument(formData) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${this.baseURL}/api/properties/${formData.get('propertyId')}/documents`, {
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

  // Property file methods
  async uploadPropertyFile(propertyId, file) {
    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseURL}/api/properties/${propertyId}/files/upload`, {
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

  async deletePropertyFile(propertyId, fileId) {
    return this.request(`/api/properties/${propertyId}/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  // Property file download and view methods
  async getFileDownloadUrl(propertyId, fileId) {
    return this.request(`/api/properties/${propertyId}/files/${fileId}/download`);
  }

  async getFileViewUrl(propertyId, fileId) {
    return this.request(`/api/properties/${propertyId}/files/${fileId}/view`);
  }

  // Property image methods
  async uploadPropertyImage(propertyId, imageFile) {
    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch(`${this.baseURL}/api/properties/${propertyId}/images/upload`, {
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

  async addPropertyImageUrl(propertyId, imageUrl) {
    return this.request(`/api/properties/${propertyId}/images`, {
      method: 'POST',
      body: JSON.stringify({ imageUrl }),
    });
  }

  async removePropertyImage(propertyId, imageUrl) {
    const encodedImageUrl = encodeURIComponent(imageUrl);
    return this.request(`/api/properties/${propertyId}/images/${encodedImageUrl}`, {
      method: 'DELETE',
    });
  }

  // Property gallery methods
  async getPropertyGallery(propertyId) {
    return this.request(`/api/properties/${propertyId}/gallery`);
  }

  async uploadPropertyGalleryImages(propertyId, imageFiles) {
    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    
    // Add all images to FormData
    imageFiles.forEach((file, index) => {
      formData.append('images', file);
    });
    
    const response = await fetch(`${this.baseURL}/api/properties/${propertyId}/gallery/bulk-upload`, {
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


  // Apartments methods
  async getApartments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/apartments?${queryString}` : '/api/apartments';
    return this.request(endpoint);
  }

  async getApartment(id) {
    return this.request(`/api/apartments/${id}`);
  }

  async createApartment(apartmentData) {
    return this.request('/api/apartments', {
      method: 'POST',
      body: JSON.stringify(apartmentData),
    });
  }

  async updateApartment(id, apartmentData) {
    return this.request(`/api/apartments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(apartmentData),
    });
  }

  async deleteApartment(id) {
    return this.request(`/api/apartments/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadApartmentImage(formData) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${this.baseURL}/api/apartments/${formData.get('apartmentId')}/images`, {
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



  // Search methods
  async search(query) {
    return this.request(`/api/search?query=${encodeURIComponent(query)}`);
  }

  async getSearchSuggestions(query = '') {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    return this.request(`/api/search/suggestions?${params.toString()}`);
  }

  async getSearchRecommendations() {
    return this.request(`/api/search/recommendations`);
  }

  // Company methods
  async createCompany(companyData) {
    return this.request('/api/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
  }

  async getCompany(alias) {
    return this.request(`/api/companies/${alias}`);
  }

  async getCompanies() {
    return this.request('/api/companies');
  }

  async updateCompany(id, companyData) {
    return this.request(`/api/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
  }

  async deleteCompany(id) {
    return this.request(`/api/companies/${id}`, {
      method: 'DELETE',
    });
  }

  async getCompanyUsers(alias) {
    return this.request(`/api/companies/${alias}/users`);
  }

  // User methods
  async getUsers() {
    return this.request('/api/users');
  }

  async createUser(userData) {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUser(id) {
    return this.request(`/api/users/${id}`);
  }

  async updateUser(id, userData) {
    return this.request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id) {
    return this.request(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Google Sheets methods
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

  async convertExcelToGoogleSheet(propertyId, file) {
    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('file', file);
    
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

  async convertDocxToGoogleDocs(propertyId, file) {
    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('file', file);
    
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

  // Company Google Sheets authorization methods
  async getCompanyGoogleSheetsAuthUrl() {
    return this.request('/api/google-sheets/auth/company/url');
  }

  async handleCompanyGoogleSheetsCallback(code, state) {
    return this.request('/api/google-sheets/auth/company/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });
  }

  async getCompanyGoogleSheetsAuthStatus() {
    return this.request('/api/google-sheets/auth/company/status');
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
