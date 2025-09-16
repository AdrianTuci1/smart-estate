# Ghid de Configurare - Smart Estate

## Funcționalități Noi Implementate

### 1. Gestionarea Companiilor
- **Crearea unei companii noi**: Odată cu crearea companiei, se creează automat un cont de administrator
- **Alias unic**: Fiecare companie are un alias unic folosit pentru login
- **Autentificare multi-tenant**: Utilizatorii se conectează folosind alias-ul companiei
- **Secret pentru creare**: Doar cei cu secretul pot crea companii noi

### 2. Gestionarea Utilizatorilor
- **Crearea de conturi noi**: Administratorii pot crea conturi pentru agenți
- **Roluri**: Admin și Agent
- **Gestionare completă**: Editare, ștergere utilizatori (doar pentru administratori)

### 3. Căutare Inteligentă
- **Fără sintaxă**: Nu mai trebuie să folosești @pers, @loc, @oras
- **Căutare contextuală**: Rezultatele depind de meniul curent (leads/map)
- **Recomandări inteligente**: Vezi orașe populare și elemente recente
- **Orașe din proprietăți**: Orașele sunt extrase automat din adresele proprietăților

## Cum să Începi

### 1. Pornirea Aplicației

```bash
# Din directorul principal smart-estate
chmod +x start-dev.sh
./start-dev.sh
```

Această comandă va porni atât backend-ul (port 3000) cât și frontend-ul (port 5173).

### 2. Prima Configurare

#### Opțiunea 1: Creează o Companie Nouă
1. Deschide aplicația în browser (http://localhost:5173)
2. Pe pagina de login, click pe "Creează o companie nouă"
3. Completează formularul:
   - **Nume Companie**: ex. "Imobiliare ABC SRL"
   - **Alias Companie**: ex. "imobiliare-abc" (doar litere și cifre)
   - **Secret pentru Crearea Companiei**: secretul configurat în backend
   - **Nume Utilizator Administrator**: ex. "admin"
   - **Parolă Administrator**: minim 6 caractere
   - **Confirmă Parola**
4. Click "Creează Compania"
5. Vei fi conectat automat ca administrator

#### Opțiunea 2: Login cu Compania Există
1. Pe pagina de login, completează:
   - **Alias Companie**: alias-ul companiei
   - **Nume Utilizator**: numele tău de utilizator
   - **Parolă**: parola ta
2. Click "Conectare"

### 3. Gestionarea Utilizatorilor (Doar pentru Administratori)

1. După login ca administrator, vei vedea un buton cu iconița de utilizatori în bara de navigare
2. Click pe butonul de gestionare utilizatori
3. Poți:
   - **Adăuga utilizatori noi**: Click "Adaugă Utilizator"
   - **Edita utilizatori**: Click pe iconița de editare
   - **Șterge utilizatori**: Click pe iconița de ștergere (nu poți șterge contul tău)

## Structura API-ului

### Endpoint-uri pentru Companii
- `POST /api/companies` - Creează companie nouă
- `GET /api/companies/:alias` - Obține companie după alias
- `GET /api/companies` - Lista toate companiile
- `PUT /api/companies/:id` - Actualizează companie
- `DELETE /api/companies/:id` - Șterge companie

### Endpoint-uri pentru Utilizatori
- `GET /api/users` - Lista utilizatori din compania curentă
- `POST /api/users` - Creează utilizator nou (doar admin)
- `GET /api/users/:id` - Obține utilizator după ID
- `PUT /api/users/:id` - Actualizează utilizator
- `DELETE /api/users/:id` - Șterge utilizator (doar admin)

### Endpoint-uri de Autentificare
- `POST /api/auth/login` - Login cu companyAlias, username, password
- `POST /api/auth/register` - Creează utilizator nou (doar admin)
- `GET /api/auth/me` - Obține informații despre utilizatorul curent

## Securitate

- **Parole hash-uite**: Toate parolele sunt hash-uite cu bcrypt
- **JWT Token**: Autentificare cu token JWT
- **Autorizare**: Doar administratorii pot gestiona utilizatorii
- **Validare**: Toate input-urile sunt validate cu Joi
- **Rate limiting**: Protecție împotriva atacurilor de tip brute force

## Dezvoltare

### Backend
- **Framework**: Express.js
- **Baza de date**: AWS DynamoDB
- **Autentificare**: JWT + bcrypt
- **Validare**: Joi

### Frontend
- **Framework**: React + Vite
- **State Management**: Zustand
- **UI**: Tailwind CSS + Lucide React icons
- **HTTP Client**: Fetch API

## Configurarea Secretului pentru Companii

Pentru a permite crearea de companii noi, configurează în `estate-backend/.env`:

```env
COMPANY_CREATION_SECRET=your-secret-here
```

Acest secret va fi necesar la crearea unei companii noi pentru a preveni crearea neautorizată.

## Căutare Inteligentă

### Cum Funcționează
- **Fără sintaxă**: Tastează orice și vei primi rezultate relevante
- **Contextuală**: Pe meniul de leads vei vedea lead-uri, pe harta proprietăți și orașe
- **Recomandări**: Când nu tastezi nimic, vezi orașe populare și elemente recente
- **Orașe automate**: Orașele sunt extrase din adresele proprietăților existente

### Exemple de Căutare
- Pe meniul de leads: "Maria" → găsește lead-uri cu numele Maria
- Pe harta de proprietăți: "Cluj" → găsește proprietăți și orașe din Cluj
- Căutare generală: "0721" → găsește lead-uri cu acest număr de telefon

## Notă Importantă

Pentru prima rulare, asigură-te că ai configurat variabilele de mediu în `estate-backend/.env` conform fișierului `env.example`.
