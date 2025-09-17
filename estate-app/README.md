# Smart Estate - Aplicație de Management Imobiliar

Aplicație React modernă pentru managementul unei companii de real estate, construită conform specificațiilor din `mvp.md` și `frontend.md`.

## 🚀 Funcționalități

### Autentificare
- Login cu alias de companie, nume utilizator și parolă
- Sistem de autentificare JWT (simulat)
- Multi-tenancy prin alias de companie

### Interfața Principală
- **Dock de navigare** în partea de jos a ecranului
- **Bara de căutare universală** cu sintaxa:
  - `@pers nume/telefon` - caută lead-uri
  - `@loc adresă` - caută proprietăți

### Meniul "Harta și Proprietățile"
- **Harta Google Maps cu stiluri personalizate** - design curat fără POI-uri
- **Control POI-uri** - buton pentru afișarea/ascunderea punctelor de interes
- **Markers pentru proprietăți** (verde = finalizate, galben = în construcție)
- **PropertyDrawer transparent** cu detalii complete:
  - Drawer mai lat (384px) cu fundal transparent
  - Harta rămâne vizibilă în spatele drawer-ului
  - Informații de bază (adresă, stadiu)
  - Galerie de imagini cu navigare
  - Lista de lead-uri interesate

### Meniul "Lista de Lead-uri"
- Tabel interactiv cu toate lead-urile
- Funcționalități: sortare, filtrare, căutare
- Coloane: Nume, Telefon, Companie, Interes, Proprietate
- Acțiuni: vizualizare, editare, ștergere

## 🛠️ Tehnologii

- **React 19** - Framework principal
- **Vite** - Build tool și dev server
- **Tailwind CSS** - Stilizare (fără shadcn package)
- **Lucide React** - Iconițe
- **@react-google-maps/api** - Integrare Google Maps

## 📦 Instalare și Rulare

```bash
# Instalare dependențe
npm install

# Pornire server de dezvoltare
npm run dev

# Build pentru producție
npm run build
```

## 🔧 Configurare

### Google Maps API
Pentru a activa harta Google Maps, adăugați cheia API în fișierul `.env`:

```env
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

Fără cheia API, harta va afișa un mesaj de încărcare.

## 🎨 Design

- **Design modern și minimalist** cu Tailwind CSS
- **Responsive** pentru desktop și mobile
- **Culori personalizate** pentru brand
- **Animații fluide** pentru o experiență plăcută
- **Dock de navigare** cu efect glassmorphism

## 📱 Structura Aplicației

```
src/
├── components/
│   ├── LoginForm.jsx          # Formular de autentificare
│   ├── NavigationDock.jsx     # Dock de navigare
│   ├── PropertyMap.jsx        # Harta Google Maps
│   ├── PropertyDrawer.jsx     # Panou detalii proprietate
│   └── LeadsTable.jsx         # Tabel lead-uri
├── contexts/
│   └── AuthContext.jsx        # Context autentificare
├── hooks/                     # Custom hooks (viitor)
├── utils/                     # Utilitare (viitor)
├── App.jsx                    # Componenta principală
└── main.jsx                   # Entry point
```

## 🔐 Autentificare

Aplicația necesită autentificare cu credențiale valide:
- **Alias Companie**: alias-ul companiei
- **Nume utilizator**: numele de utilizator
- **Parolă**: parola asociată

## 🚧 Funcționalități Viitoare

- Integrare cu backend real
- Notificări în timp real
- Rapoarte și statistici
- Gestionare utilizatori
- Export date
- Integrare cu servicii externe

## 📄 Licență

Acest proiect este dezvoltat conform specificațiilor din `mvp.md` și `frontend.md`.