# Google Sheets Integration - Smart Estate

## Overview

Această implementare integrează Google Sheets API în aplicația Smart Estate pentru a oferi control complet asupra documentelor Excel/Sheets, înlocuind stocarea în S3 cu gestionarea directă prin Google Sheets.

## Benefits

### 🚀 **Editare în timp real**
- Multiple utilizatori pot edita simultan același document
- Sincronizare automată a modificărilor
- Istoric complet al versiunilor

### 🔒 **Control granular**
- Permisiuni detaliate pentru fiecare utilizator
- Control asupra accesului la documente
- Audit trail pentru toate modificările

### 📊 **API robust**
- Integrare nativă cu Google Sheets
- Operațiuni CRUD complete
- Export/import în multiple formate

### 🏢 **Autorizare centralizată**
- Un singur administrator poate autoriza Google Sheets pentru toată compania
- Toți utilizatorii companiei beneficiază automat de autorizare
- Control centralizat asupra accesului la Google Sheets

### 🔄 **Conversie automată**
- Fișierele Excel (.xlsx, .xls, .csv) sunt convertite automat la Google Sheets
- Nu mai este nevoie de gestionarea manuală a conversiei
- Procesul de upload este transparent pentru utilizatori

## Architecture

### Frontend Components

#### 1. **GoogleSheetsService** (`estate-app/src/services/googleSheetsService.js`)
```javascript
// Serviciu principal pentru operațiuni Google Sheets
const googleSheetsService = new GoogleSheetsService();

// Operațiuni disponibile:
- createSpreadsheet(title, propertyId)
- getSpreadsheetData(spreadsheetId, range)
- updateSpreadsheetData(spreadsheetId, range, values)
- shareSpreadsheet(spreadsheetId, email, role)
- exportGoogleSheetToExcel(spreadsheetId, format)
```

#### 2. **GoogleSheetsViewer** (`estate-app/src/components/DocumentViewers/GoogleSheetsViewer.jsx`)
```javascript
// Component pentru vizualizarea și editarea Google Sheets
<GoogleSheetsViewer
  spreadsheetId={spreadsheetId}
  fileName={fileName}
  propertyId={propertyId}
  allowEdit={true}
  allowShare={true}
/>
```

#### 3. **ExcelViewer Updated**
- Detectează automat tipul de fișier (Excel vs Google Sheet)
- Redirectează către `GoogleSheetsViewer` pentru fișierele Excel
- Păstrează compatibilitatea cu fișierele existente

### Backend Services

#### 1. **GoogleSheetsService** (`estate-backend/services/googleSheetsService.js`)
```javascript
// Serviciu backend pentru operațiuni Google Sheets
class GoogleSheetsService {
  // Autentificare OAuth2
  async getAuthClient(userId)
  async handleAuthCallback(code, userId)
  
  // Gestionare spreadsheets
  async createSpreadsheet(title, propertyId)
  async getSpreadsheetData(spreadsheetId, range)
  async updateSpreadsheetData(spreadsheetId, range, values)
  
  // Partajare și colaborare
  async shareSpreadsheet(spreadsheetId, email, role)
  async getSpreadsheetCollaborators(spreadsheetId)
  
  // Export/Import
  async convertExcelToGoogleSheet(propertyId, file)
  async exportGoogleSheetToExcel(spreadsheetId, format)
}
```

#### 2. **API Routes**

**Google Sheets Routes** (`/api/google-sheets/`)
```javascript
GET  /auth/url                    // Obține URL-ul de autentificare
POST /auth/callback               // Gestionează callback-ul OAuth2
GET  /auth/status                 // Verifică statusul autentificării

POST /create                      // Creează spreadsheet nou
GET  /:spreadsheetId              // Obține informații spreadsheet
GET  /:spreadsheetId/values       // Obține datele spreadsheet
PUT  /:spreadsheetId/values/:range // Actualizează datele

POST /:spreadsheetId/share        // Partajează spreadsheet
GET  /:spreadsheetId/collaborators // Obține colaboratorii
POST /:spreadsheetId/export       // Exportă ca Excel
```

**Property Google Sheets Routes** (`/api/properties/:id/google-sheets/`)
```javascript
GET    /:propertyId                    // Lista spreadsheets pentru proprietate
POST   /:propertyId                    // Creează spreadsheet pentru proprietate
POST   /:propertyId/convert            // Convertește Excel la Google Sheet
POST   /:propertyId/link               // Linkează spreadsheet existent
DELETE /:propertyId/:spreadsheetId     // Unlinkează spreadsheet
```

## Database Schema

### Tabel: `CompanyGoogleCredentials` (Principal)
```javascript
{
  companyId: String,        // ID companie
  credentials: Object,      // Token-uri OAuth2 pentru companie
  authorizedBy: String,     // ID utilizator care a autorizat
  createdAt: String,       // Data creării
  updatedAt: String        // Data ultimei actualizări
}
```

### Tabel: `PropertyGoogleSheets`
```javascript
{
  propertyId: String,       // ID proprietate
  spreadsheetId: String,    // ID Google Sheet
  fileName: String,         // Numele fișierului
  url: String,             // URL-ul spreadsheet-ului
  createdAt: String,       // Data creării
  updatedAt: String        // Data ultimei actualizări
}
```

### Tabel: `UserGoogleCredentials` (Legacy - pentru compatibilitate)
```javascript
{
  userId: String,           // ID utilizator
  credentials: Object,      // Token-uri OAuth2
  createdAt: String,       // Data creării
  updatedAt: String        // Data ultimei actualizări
}
```

## Setup Instructions

### 1. **Google Cloud Console Setup**

1. Accesează [Google Cloud Console](https://console.cloud.google.com/)
2. Creează un proiect nou sau selectează unul existent
3. Activează Google Sheets API și Google Drive API
4. Creează credențiale OAuth2:
   - Tip: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/google-sheets/auth/callback`

### 2. **Environment Variables**

Adaugă în `.env`:
```env
# Google Sheets API Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-sheets/auth/callback
```

### 3. **Install Dependencies**

```bash
# Backend
cd estate-backend
npm install googleapis

# Frontend (already included)
# googleapis este inclus în package.json
```

### 4. **Database Tables**

Creează tabelele DynamoDB:
```bash
# Tabelele vor fi create automat la primul acces
# Sau poți le crea manual prin AWS Console
```

## Authorization Flow

### 1. **Autorizare centralizată pentru companie**

```javascript
// Frontend - pentru administratori
const handleCompanyAuth = async () => {
  try {
    const response = await apiService.getCompanyGoogleSheetsAuthUrl();
    if (response.success) {
      // Deschide URL-ul de autorizare în popup
      const authWindow = window.open(response.data.authUrl, 'google-auth');
      
      // Gestionează callback-ul
      const handleAuthCallback = (event) => {
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          console.log('Google Sheets autorizat cu succes pentru companie');
          authWindow.close();
        }
      };
      
      window.addEventListener('message', handleAuthCallback);
    }
  } catch (error) {
    console.error('Error initiating company auth:', error);
  }
};
```

### 2. **Verificarea statusului autorizării**

```javascript
// Frontend - pentru toți utilizatorii
const checkAuthStatus = async () => {
  try {
    const response = await apiService.getCompanyGoogleSheetsAuthStatus();
    if (response.success) {
      console.log('Company auth status:', response.data);
      // response.data.isAuthorized - boolean
      // response.data.authorizedBy - ID utilizator
      // response.data.authorizedAt - data autorizării
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
  }
};
```

## Usage Examples

### 1. **Crearea unui Google Sheet**

```javascript
// Frontend
const response = await googleSheetsService.createPropertySpreadsheet(
  propertyId, 
  'Raport Proprietate'
);

if (response.success) {
  console.log('Spreadsheet creat:', response.data.spreadsheetId);
}
```

### 2. **Conținerea Excel la Google Sheet**

```javascript
// Frontend - în PropertyFileTree
const handleExcelUpload = async (event) => {
  const file = event.target.files[0];
  const response = await apiService.convertExcelToGoogleSheet(propertyId, file);
  
  if (response.success) {
    // Fișierul Excel a fost convertit la Google Sheet
    setSpreadsheets(prev => [...prev, response.data]);
  }
};
```

### 3. **Editarea datelor**

```javascript
// Frontend - în GoogleSheetsViewer
const updateData = async (range, values) => {
  const response = await googleSheetsService.updateSpreadsheetData(
    spreadsheetId, 
    range, 
    values
  );
  
  if (response.success) {
    console.log('Date actualizate cu succes');
  }
};
```

### 4. **Partajarea unui document**

```javascript
// Frontend
const shareDocument = async (email, role = 'reader') => {
  const response = await googleSheetsService.shareSpreadsheet(
    spreadsheetId, 
    email, 
    role
  );
  
  if (response.success) {
    console.log('Document partajat cu:', email);
  }
};
```

## Migration Strategy

### Pentru fișierele Excel existente:

1. **Detectare automată**: La upload, sistemul detectează fișierele Excel
2. **Conversie opțională**: Utilizatorul poate alege să convertească la Google Sheet
3. **Coexistență**: Sistemul suportă atât fișierele Excel tradiționale cât și Google Sheets
4. **Migrare graduală**: Utilizatorii pot migra documentele pe măsură ce le editează

### Workflow de migrare:

```javascript
// 1. Detectare tip fișier
const fileType = getDocumentViewerType(fileName, isGoogleSheet);

// 2. Dacă este Excel, oferă opțiunea de conversie
if (fileType === 'excel') {
  showMigrationDialog(file);
}

// 3. Conversie la cerere
const convertToGoogleSheet = async (file) => {
  const response = await apiService.convertExcelToGoogleSheet(propertyId, file);
  // Actualizează UI-ul cu noul Google Sheet
};
```

## Security Considerations

### 1. **OAuth2 Flow**
- Token-urile sunt stocate securizat în DynamoDB
- Refresh token-urile sunt gestionate automat
- Accesul este limitat la scope-urile necesare

### 2. **Permission Management**
- Utilizatorii pot partaja documentele cu permisiuni specifice
- Control granular asupra accesului (reader, writer, owner)
- Audit trail pentru toate modificările

### 3. **Data Isolation**
- Fiecare companie are acces doar la propriile documente
- Spreadsheet-urile sunt asociate cu proprietățile specifice
- Nu există acces cross-tenant

## Performance Optimizations

### 1. **Caching**
- Datele spreadsheet-urilor sunt cache-uite temporar
- Refresh automat la intervale regulate
- Optimistic updates pentru o experiență fluidă

### 2. **Lazy Loading**
- Spreadsheet-urile se încarcă doar când sunt accesate
- Paginare pentru liste mari de documente
- Lazy loading pentru datele din spreadsheet

### 3. **Batch Operations**
- Operațiuni multiple sunt grupate când este posibil
- Update-uri batch pentru modificări multiple
- Optimizare pentru operațiuni frecvente

## Troubleshooting

### Probleme comune:

1. **"Not authenticated with Google Sheets"**
   - Verifică dacă utilizatorul a completat flow-ul OAuth2
   - Verifică dacă token-urile sunt valide și nu au expirat

2. **"Failed to create spreadsheet"**
   - Verifică permisiunile în Google Cloud Console
   - Verifică dacă API-urile sunt activate

3. **"Failed to convert Excel to Google Sheet"**
   - Verifică formatul fișierului Excel
   - Verifică dimensiunea fișierului (limita de 10MB)

### Debug mode:

```javascript
// Activează debug mode în serviciul Google Sheets
googleSheetsService.debug = true;

// Verifică statusul autentificării
const authStatus = await googleSheetsService.getAuthClient(userId);
console.log('Auth status:', authStatus);
```

## Future Enhancements

### 1. **Advanced Features**
- Template-uri pentru spreadsheet-uri
- Automatizări și macro-uri
- Integrare cu alte servicii Google (Calendar, Gmail)

### 2. **Analytics**
- Tracking pentru utilizarea documentelor
- Rapoarte de activitate
- Metrici de performanță

### 3. **Integration**
- Sincronizare cu sisteme externe
- API-uri pentru integrare cu alte aplicații
- Webhook-uri pentru evenimente

## Conclusion

Această implementare oferă o soluție robustă și scalabilă pentru gestionarea documentelor Excel în aplicația Smart Estate, oferind control complet asupra documentelor prin Google Sheets API. Sistemul este proiectat pentru a fi extensibil și pentru a suporta funcționalități avansate în viitor.
