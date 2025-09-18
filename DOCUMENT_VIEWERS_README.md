# Document Viewers Integration

Această implementare adaugă capacități avansate de vizualizare și editare a documentelor în PropertyFileViewer.

## Funcționalități Implementate

### 1. **DocxViewer** - Vizualizarea documentelor Word
- **Tehnologie**: Mammoth.js
- **Funcționalități**:
  - Previzualizarea documentelor DOCX și DOC
  - Conversie automată în HTML cu păstrarea formatării
  - Suport pentru tabele, liste, și formatare text
  - Descărcare directă
  - Gestionarea erorilor

### 2. **ExcelViewer** - Vizualizarea și editarea foilor de calcul
- **Tehnologie**: SheetJS (XLSX) + Luckysheet
- **Funcționalități**:
  - Previzualizarea fișierelor Excel (XLSX, XLS, XLSM, XLSB, CSV)
  - **Editare completă** cu Luckysheet
  - Suport pentru multiple foi (sheet tabs)
  - Toggle între modul previzualizare și editare
  - Descărcare și export

### 3. **PDFViewer** - Vizualizarea documentelor PDF
- **Tehnologie**: Browser native PDF viewer
- **Funcționalități**:
  - Vizualizarea directă în iframe
  - Deschidere în tab nou
  - Descărcare directă

## Arhitectura Modulară

### Structura Fișierelor
```
src/components/DocumentViewers/
├── DocxViewer.jsx          # Viewer pentru DOCX
├── ExcelViewer.jsx         # Viewer pentru Excel cu editare
├── PDFViewer.jsx           # Viewer pentru PDF
├── DocumentViewers.css     # Stiluri comune
└── index.js                # Export centralizat și utilități
```

### Utilități Incluse
- `getDocumentViewerType(fileName)` - Determină tipul de viewer necesar
- `isDocumentViewable(fileName)` - Verifică dacă fișierul poate fi vizualizat
- `isDocumentEditable(fileName)` - Verifică dacă fișierul poate fi editat

## Integrarea în PropertyFileViewer

Componentele sunt integrate seamless în PropertyFileViewer cu:
- **Detecție automată** a tipului de fișier
- **Tranziție fluidă** între tipurile de fișiere
- **Fallback** la iframe pentru fișiere nesuportate
- **Gestionarea erorilor** pentru fiecare tip de document

## Dependențe Adăugate

```json
{
  "mammoth": "^1.x.x",    // Pentru DOCX
  "xlsx": "^0.x.x",       // Pentru Excel
  "luckysheet": "^2.x.x"  // Pentru editarea Excel
}
```

## Configurația Vite

Actualizată pentru suportul bibliotecilor:
- Chunk-uri separate pentru optimizare
- Optimizarea dependențelor
- Configurare pentru build production

## Tipuri de Fișiere Suportate

| Tip | Extensii | Viewer | Editare | Status |
|-----|----------|--------|---------|--------|
| Word | `.docx`, `.doc` | DocxViewer | ❌ | ✅ |
| Excel | `.xlsx`, `.xls`, `.xlsm`, `.xlsb`, `.csv` | ExcelViewer | ✅ | ✅ |
| PDF | `.pdf` | PDFViewer | ❌ | ✅ |

## Utilizare

### Automată
Componentele sunt folosite automat în PropertyFileViewer când utilizatorul deschide un fișier suportat.

### Manuală
```jsx
import { DocxViewer, ExcelViewer, PDFViewer } from './DocumentViewers';

// Folosire directă
<DocxViewer 
  fileUrl={url} 
  fileName={name} 
  onError={handleError} 
/>

<ExcelViewer 
  fileUrl={url} 
  fileName={name} 
  allowEdit={true}
  onError={handleError} 
/>
```

## Stilizare

Componentele folosesc:
- **Tailwind CSS** pentru stilizarea de bază
- **CSS custom** în `DocumentViewers.css` pentru stiluri specifice
- **Dark mode support** pentru experiență completă
- **Responsive design** pentru toate device-urile

## Performanță

- **Lazy loading** pentru Luckysheet (încărcare la cerere)
- **Code splitting** automat pentru chunk-uri separate
- **Optimizarea bundle-ului** cu Vite
- **Caching** pentru fișierele încărcate

## Limitări Cunoscute

1. **Mammoth.js**: Nu suportă toate funcționalitățile Word (macros, forme complexe)
2. **PDF**: Folosește viewer-ul nativ al browser-ului (limitări pe mobile)
3. **Luckysheet**: Bundle mare (~3MB) - se încarcă doar când e necesar

## Dezvoltare Viitoare

- [ ] Suport pentru editarea DOCX (posibil cu TinyMCE sau similar)
- [ ] PDF.js pentru control mai bun asupra PDF-urilor
- [ ] Suport pentru PowerPoint (PPTX)
- [ ] Salvarea modificărilor Excel pe server
- [ ] Colaborare în timp real pentru Excel

## Testare

Pentru testare:
1. Încărcați fișiere DOCX, Excel și PDF în PropertyFileViewer
2. Verificați tranziția fluidă între tipuri
3. Testați funcționalitatea de editare Excel
4. Verificați responsive design pe mobile

## Troubleshooting

### Probleme comune:
- **Import errors**: Verificați că toate dependențele sunt instalate
- **Build errors**: Asigurați-vă că vite.config.js include configurația pentru chunk-uri
- **Luckysheet nu se încarcă**: Verificați console-ul pentru erori JavaScript
- **CORS errors**: Asigurați-vă că server-ul permite access la fișiere
