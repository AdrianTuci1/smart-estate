# Schema DynamoDB - Smart Estate

Acest document descrie structura tabelelor DynamoDB pentru aplicația Smart Estate, incluzând partition keys, sort keys și tipurile de date.

## 1. Tabel: `estate-users`

### Structura Chei
- **Partition Key**: `id` (String) - ID unic al utilizatorului
- **Sort Key**: Nu există sort key (tabel simplu)

### Indexuri Secundare Globale (GSI)
- **GSI: `CompanyAliasIndex`**
  - Partition Key: `companyAlias` (String)
  - Sort Key: Nu există
  - **Scop**: Căutare rapidă a utilizatorilor după companie

### Atribute
```json
{
  "id": "string",                    // PK - UUID generat automat
  "username": "string",              // Nume utilizator unic în companie
  "passwordHash": "string",          // Hash-ul parolei (bcrypt)
  "companyAlias": "string",          // Alias-ul companiei (GSI)
  "companyId": "string",             // ID-ul companiei
  "role": "string",                  // "admin" sau "agent"
  "createdAt": "string",             // ISO timestamp
  "updatedAt": "string"              // ISO timestamp
}
```

### De ce această structură?
- **PK pe `id`**: Permite acces direct și rapid la utilizatori
- **GSI pe `companyAlias`**: Permite listarea tuturor utilizatorilor unei companii
- **Fără sort key**: Utilizatorii sunt accesați individual, nu sunt sortați

---

## 2. Tabel: `estate-companies`

### Structura Chei
- **Partition Key**: `id` (String) - ID unic al companiei
- **Sort Key**: Nu există sort key

### Indexuri Secundare Globale (GSI)
- **GSI: `AliasIndex`**
  - Partition Key: `alias` (String)
  - Sort Key: Nu există
  - **Scop**: Căutare rapidă a companiei după alias (pentru login)

### Atribute
```json
{
  "id": "string",                    // PK - UUID generat automat
  "name": "string",                  // Numele complet al companiei
  "alias": "string",                 // Alias unic (GSI) - folosit pentru login
  "createdAt": "string",             // ISO timestamp
  "updatedAt": "string"              // ISO timestamp
}
```

### De ce această structură?
- **PK pe `id`**: Acces direct la companii
- **GSI pe `alias`**: Login-ul necesită căutare după alias, nu după ID
- **Alias unic**: Garantat prin GSI pentru autentificare

---

## 3. Tabel: `estate-leads`

### Structura Chei
- **Partition Key**: `id` (String) - ID unic al lead-ului
- **Sort Key**: Nu există sort key

### Indexuri Secundare Globale (GSI)
- **GSI: `CompanyIdIndex`**
  - Partition Key: `companyId` (String)
  - Sort Key: Nu există
  - **Scop**: Listarea tuturor lead-urilor unei companii

### Atribute
```json
{
  "id": "string",                    // PK - UUID generat automat
  "name": "string",                  // Numele lead-ului
  "phone": "string",                 // Numărul de telefon
  "email": "string",                 // Email (opțional)
  "companyId": "string",             // ID-ul companiei (GSI)
  "propertiesOfInterest": ["string"], // Array de ID-uri proprietăți
  "notes": "string",                 // Note despre lead
  "status": "string",                // "active", "contacted", "converted", "lost"
  "createdAt": "string",             // ISO timestamp
  "updatedAt": "string"              // ISO timestamp
}
```

### De ce această structură?
- **PK pe `id`**: Acces direct la lead-uri individuale
- **GSI pe `companyId`**: Lead-urile sunt întotdeauna filtrate după companie
- **Fără sort key**: Lead-urile sunt sortate în aplicație după `createdAt`

---

## 4. Tabel: `estate-properties`

### Structura Chei
- **Partition Key**: `id` (String) - ID unic al proprietății
- **Sort Key**: Nu există sort key

### Indexuri Secundare Globale (GSI)
- **GSI: `CompanyIdIndex`**
  - Partition Key: `companyId` (String)
  - Sort Key: Nu există
  - **Scop**: Listarea tuturor proprietăților unei companii

### Atribute
```json
{
  "id": "string",                    // PK - UUID generat automat
  "address": "string",               // Adresa completă
  "status": "string",                // "finalizat", "in-constructie"
  "companyId": "string",             // ID-ul companiei (GSI)
  "images": ["string"],              // Array de URL-uri S3
  "description": "string",           // Descrierea proprietății
  "price": "number",                 // Prețul (opțional)
  "rooms": "number",                 // Numărul de camere (opțional)
  "area": "number",                  // Suprafața (opțional)
  "coordinates": {                   // Coordonate GPS (opțional)
    "lat": "number",
    "lng": "number"
  },
  "createdAt": "string",             // ISO timestamp
  "updatedAt": "string"              // ISO timestamp
}
```

### De ce această structură?
- **PK pe `id`**: Acces direct la proprietăți
- **GSI pe `companyId`**: Proprietățile sunt întotdeauna filtrate după companie
- **Coordonate ca obiect**: Pentru căutări geografice în aplicație
- **Adresa ca string**: Pentru căutări text și extragerea orașelor

---

## Tipuri de Date DynamoDB

### Tipuri Primitive
- **S (String)**: Text, timestamps ISO, UUID-uri
- **N (Number)**: Numere întregi și zecimale
- **B (Binary)**: Date binare (nu folosit în această aplicație)

### Tipuri Complexe
- **M (Map)**: Obiecte JSON (ex: `coordinates`)
- **L (List)**: Array-uri (ex: `propertiesOfInterest`, `images`)
- **SS (String Set)**: Set de string-uri unice (nu folosit)
- **NS (Number Set)**: Set de numere unice (nu folosit)
- **BS (Binary Set)**: Set de date binare (nu folosit)

## Strategii de Optimizare

### 1. Hot Partitions
- **Problemă potențială**: Toate datele unei companii mari pe aceeași partiție
- **Soluție**: Distribuirea în timp prin `createdAt` dacă este necesar

### 2. Query Patterns
- **Căutare după companie**: Folosește GSI-urile `CompanyIdIndex`
- **Căutare după alias**: Folosește GSI `AliasIndex`
- **Acces direct**: Folosește PK pe `id`

### 3. Index Design
- **GSI-uri minimale**: Doar pentru pattern-urile de query reale
- **Proiecții**: `ALL` pentru simplitate (costuri mici pentru aplicația de mărime medie)

## Capacitate și Costuri

### Provisioned Throughput
- **Read Capacity Units (RCU)**: 5 per tabel
- **Write Capacity Units (WCU)**: 5 per tabel
- **GSI Throughput**: 5 RCU/WCU per index

### Estimare Costuri (US East 1)
- **4 tabele + 6 GSI-uri**: ~$25/lună pentru throughput de bază
- **Storage**: ~$0.25/GB/lună (foarte puțin pentru aplicația de mărime medie)

## Monitorizare și Alerting

### Metrici Importante
- **Throttling**: Prea multe cereri pentru capacitatea alocată
- **Hot Partitions**: Unele partiții sunt folosite prea mult
- **Storage**: Creșterea în timp a datelor

### Recomandări
- Monitorizează CloudWatch metrics
- Configurează alerting pentru throttling
- Revizuiește throughput-ul odată pe trimestru
