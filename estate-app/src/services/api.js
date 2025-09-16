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

  // Apartment document analysis
  async analyzeApartmentDocument(apartmentId) {
    return this.request(`/api/apartments/${apartmentId}/analyze`, {
      method: 'POST',
    });
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

  async uploadApartmentDocument(formData) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${this.baseURL}/api/apartments/${formData.get('apartmentId')}/documents`, {
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

  // Leads methods
  async getLeads(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/leads?${queryString}` : '/api/leads';
    return this.request(endpoint);
  }

  async getLead(id) {
    return this.request(`/api/leads/${id}`);
  }

  async createLead(leadData) {
    return this.request('/api/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  async updateLead(id, leadData) {
    return this.request(`/api/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leadData),
    });
  }

  async deleteLead(id) {
    return this.request(`/api/leads/${id}`, {
      method: 'DELETE',
    });
  }

  // Lead history methods
  async addLeadHistory(leadId, historyData) {
    return this.request(`/api/leads/${leadId}/history`, {
      method: 'POST',
      body: JSON.stringify(historyData),
    });
  }

  async updateLeadHistory(leadId, entryId, updateData) {
    return this.request(`/api/leads/${leadId}/history/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteLeadHistory(leadId, entryId) {
    return this.request(`/api/leads/${leadId}/history/${entryId}`, {
      method: 'DELETE',
    });
  }

  // Lead file methods
  async addLeadFile(leadId, fileData) {
    return this.request(`/api/leads/${leadId}/files`, {
      method: 'POST',
      body: JSON.stringify(fileData),
    });
  }

  async deleteLeadFile(leadId, fileId) {
    return this.request(`/api/leads/${leadId}/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  async uploadLeadFile(leadId, file) {
    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseURL}/api/leads/${leadId}/files/upload`, {
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

  async getPresignedUploadUrl(leadId, fileName, contentType) {
    return this.request(`/api/leads/${leadId}/files/presigned-url`, {
      method: 'POST',
      body: JSON.stringify({ fileName, contentType }),
    });
  }

  async uploadFileToS3(presignedUrl, file) {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`S3 upload failed: ${response.status}`);
    }

    return response;
  }

  // Search methods
  async search(query, view = 'all') {
    return this.request(`/api/search?query=${encodeURIComponent(query)}&view=${view}`);
  }

  async getSearchSuggestions(query = '', view = 'all') {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    params.append('view', view);
    return this.request(`/api/search/suggestions?${params.toString()}`);
  }

  async getSearchRecommendations(view = 'all') {
    return this.request(`/api/search/recommendations?view=${view}`);
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

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
