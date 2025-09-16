# Smart Estate - Ghid de Conectare Frontend-Backend

Acest ghid explică cum să conectați aplicația frontend (estate-app) cu serviciul backend (estate-backend).

## 🚀 Pornirea Rapidă

### Opțiunea 1: Script Automat
```bash
# Din directorul root al proiectului
./start-dev.sh
```

### Opțiunea 2: Pornire Manuală

#### 1. Pornirea Backend-ului
```bash
cd estate-backend
npm install  # dacă nu ați instalat dependențele
npm run dev
```
Backend-ul va rula pe `http://localhost:3000`

#### 2. Pornirea Frontend-ului
```bash
cd estate-app
npm install  # dacă nu ați instalat dependențele
npm run dev
```
Frontend-ul va rula pe `http://localhost:5173`

## 🔧 Configurare

### Variabile de Mediu

#### Backend (estate-backend)
Creați un fișier `.env` în directorul `estate-backend`:
```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173

# AWS DynamoDB (pentru producție)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# JWT
JWT_SECRET=your_jwt_secret_key
```

#### Frontend (estate-app)
Creați un fișier `.env.local` în directorul `estate-app`:
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_NODE_ENV=development
```

## 🔗 Conectarea Serviciilor

### 1. API Service Layer
Am creat un serviciu API centralizat în `estate-app/src/services/api.js` care:
- Gestionează toate apelurile către backend
- Include automat token-ul de autentificare
- Gestionează erorile și fallback-urile

### 2. Autentificare
- **LoginForm**: Actualizat să folosească API-ul real de autentificare
- **AuthContext**: Verifică token-ul cu backend-ul la încărcare
- **Fallback**: Dacă backend-ul nu este disponibil, folosește date mock

### 3. Componente Actualizate
- **LeadsTable**: Încarcă lead-urile din API
- **PropertyMap**: Încarcă proprietățile din API
- **Loading States**: Afișează stări de încărcare
- **Error Handling**: Gestionează erorile API

## 🧪 Testarea Conectării

### 1. Verificarea Backend-ului
```bash
curl http://localhost:3000/health
```
Ar trebui să returnați:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

### 2. Verificarea Frontend-ului
- Deschideți `http://localhost:5173`
- Încercați să vă autentificați
- Verificați că datele se încarcă din backend

### 3. Testarea API-ului
```bash
# Test autentificare
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"companyAlias":"demo","username":"demo","password":"demo123"}'

# Test lead-uri
curl -X GET http://localhost:3000/api/leads \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test proprietăți
curl -X GET http://localhost:3000/api/properties \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🐛 Depanare

### Probleme Comune

#### 1. CORS Errors
- Verificați că `CORS_ORIGIN` din backend este setat corect
- Asigurați-vă că frontend-ul rulează pe portul 5173

#### 2. API Connection Failed
- Verificați că backend-ul rulează pe portul 3000
- Verificați că `VITE_API_BASE_URL` este setat corect

#### 3. Authentication Issues
- Verificați că token-ul este salvat în localStorage
- Verificați că backend-ul returnează token-uri valide

#### 4. Data Not Loading
- Verificați console-ul pentru erori
- Verificați că API-ul returnează date în formatul corect
- Aplicația va folosi date mock dacă API-ul nu este disponibil

### Logs și Debugging

#### Backend Logs
```bash
cd estate-backend
npm run dev
# Logs vor apărea în consolă
```

#### Frontend Logs
- Deschideți Developer Tools (F12)
- Verificați tab-ul Console pentru erori
- Verificați tab-ul Network pentru apelurile API

## 📁 Structura Fișierelor

```
smart-estate/
├── estate-backend/          # Backend API
│   ├── routes/             # API endpoints
│   ├── models/             # Data models
│   ├── middleware/         # Auth, validation, etc.
│   └── server.js           # Main server file
├── estate-app/             # Frontend React app
│   ├── src/
│   │   ├── services/       # API service layer
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── stores/         # State management
│   └── package.json
├── start-dev.sh            # Development script
└── CONNECTION_GUIDE.md     # This file
```

## 🎯 Următorii Pași

1. **Configurați AWS DynamoDB** pentru producție
2. **Adăugați mai multe endpoint-uri** API
3. **Implementați caching** pentru performanță
4. **Adăugați teste** pentru API și frontend
5. **Configurați CI/CD** pentru deployment

## 📞 Suport

Dacă întâmpinați probleme:
1. Verificați logs-urile din consolă
2. Verificați că toate dependențele sunt instalate
3. Verificați că porturile 3000 și 5173 sunt libere
4. Verificați configurația de mediu
