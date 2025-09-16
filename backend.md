Back-end-ul va fi construit cu Node.js și va folosi framework-ul Express.js pentru a gestiona rutele API. Arhitectura va fi concepută pentru a fi robustă, scalabilă și sigură, având în vedere cerințele de multi-tenancy și performanță.

1. Autentificare și securitate
Model de date pentru utilizatori: Vom avea o colecție de utilizatori care va stoca username-ul, parola criptată (hashed), alias-ul companiei și rolul utilizatorului (de exemplu, admin, agent).

Login cu alias de companie: La login, cererea va include username, password și companyAlias. Back-end-ul va căuta utilizatorul în baza de date pe baza ambelor criterii. Această abordare asigură că un utilizator cu același nume de utilizator într-o altă companie nu poate accesa datele greșite.

JWT (JSON Web Tokens): După validarea cu succes a credențialelor, serverul va genera un token JWT. Acest token va conține userId și companyAlias și va fi trimis către client.

Middleware de protecție: Fiecare rută API securizată va avea un middleware care va verifica validitatea token-ului JWT trimis în antetul Authorization (Bearer Token). Acest middleware va extrage companyAlias-ul din token și îl va folosi pentru a filtra toate cererile la baza de date, asigurând că un utilizator poate accesa doar datele companiei sale.

2. Structura API-ului (RESTful)
Vom implementa un set de endpoint-uri RESTful clare și intuitive pentru a gestiona resursele (proprietăți și lead-uri).

API-uri pentru autentificare:
POST /api/auth/login: Autentifică un utilizator și returnează un token JWT.

API-uri pentru proprietăți:
GET /api/properties: Returnează o listă de proprietăți. Va accepta parametri de query pentru filtrare (de exemplu, după stadiu) și pentru paginare (?page=1&limit=10).

GET /api/properties/:id: Returnează detaliile unei proprietăți specifice.

POST /api/properties: Adaugă o nouă proprietate în baza de date. Necesită un corp de cerere cu datele proprietății (adresă, galerie, stadiu).

PUT /api/properties/:id: Actualizează o proprietate existentă.

DELETE /api/properties/:id: Șterge o proprietate.

API-uri pentru lead-uri:
GET /api/leads: Returnează o listă de lead-uri, cu opțiuni de filtrare și paginare.

GET /api/leads/:id: Returnează detaliile unui lead.

POST /api/leads: Adaugă un lead nou.

PUT /api/leads/:id: Actualizează un lead.

DELETE /api/leads/:id: Șterge un lead.

API-uri pentru căutare:
GET /api/search?query=...: Un endpoint unic pentru căutarea universală. Backend-ul va interpreta query-ul.

Dacă query începe cu @pers, va căuta în colecția de leads după nume sau număr de telefon.

Dacă query începe cu @loc, va căuta în colecția de properties după adresă.

Rezultatele vor fi returnate într-un format unificat.

3. Baza de date
Tipul bazei de date: Pentru a simplifica dezvoltarea MVP-ului, se poate folosi o bază de date NoSQL precum MongoDB (găzduită pe MongoDB Atlas sau Amazon DocumentDB). Alternativ, o bază de date SQL (ex. PostgreSQL pe Amazon RDS) ar fi o opțiune robustă pe termen lung.

Modelul de date:

Colecția users: _id, username, passwordHash, companyAlias, role.

Colecția companies: _id, name, alias.

Colecția leads: _id, name, phone, email, companyId (referință la companies), propertiesOfInterest (o listă de ID-uri de proprietăți), notes.

Colecția properties: _id, address, status (finalizat, in-constructie), images (array de URL-uri), companyId (referință la companies).

4. Găzduire și scalare
AWS EC2: Back-end-ul poate fi rulat pe un server virtual Amazon EC2. Pentru scalabilitate automată și costuri optimizate.

Securitate AWS: Vom folosi IAM (Identity and Access Management) pentru a gestiona permisiunile și a securiza accesul la resurse precum baza de date.