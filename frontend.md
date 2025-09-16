Front-end-ul va fi o aplicație SPA (Single-Page Application), construită cu React. Pentru a asigura o interfață modernă, coerentă și ușor de întreținut, vom folosi Shadcn UI, o bibliotecă de componente React care se bazează pe Radix UI și Tailwind CSS. Această abordare ne permite să avem un design personalizat fără a folosi o bibliotecă de componente pre-stilizate care limitează flexibilitatea.

Structura și fluxul utilizatorului
Pagina de login:

Va avea trei câmpuri de input: alias companie, nume utilizator și parolă.

La trimiterea formularului, un apel API va fi făcut către back-end pentru autentificare.

În caz de succes, aplicația va stoca token-ul JWT într-un mod securizat (de exemplu, în localStorage) și va redirecționa utilizatorul către pagina principală.

Layout-ul principal:

După autentificare, utilizatorul va fi întâmpinat de un layout minimalist, dominat de o hartă (sau o listă, în funcție de meniul selectat).

În partea de jos a ecranului, va exista un dock compact, care va conține butoane stilizate pentru navigare între cele două meniuri principale și o bară de căutare.

Componente și funcționalități cheie
1. Meniul "Harta și Proprietățile"
Componenta Map:

Va folosi biblioteca @react-google-maps/api pentru a integra Google Maps.

Aici vom aplica un JSON de stil personalizat pentru a schimba culorile hărții, aliniind-o cu estetica brandului.

Fiecare proprietate va fi reprezentată de un marker personalizat. La click pe un marker, se va declanșa deschiderea panoului de detalii (drawer).

Componenta PropertyDrawer:

Va fi implementată ca un drawer din Shadcn UI. Acesta va apărea dintr-o parte a ecranului, suprapunându-se parțial peste hartă.

Conținutul va include:

Numele și adresa proprietății.

Un carusel de imagini pentru galerie (se pot folosi componente de tip Carousel sau simple slide-uri).

Detalii despre stadiul construcției (dacă este cazul).

O listă de Lead-uri asociate, care vor fi afișate sub formă de carduri sau o listă simplă.

2. Meniul "Lista de Lead-uri"
Componenta LeadsTable:

Va fi un tabel de date implementat cu componente de la Shadcn UI și o bibliotecă de tabel de date, cum ar fi react-table sau tanstack/table.

Tabelul va avea coloane pentru: Nume, Număr de telefon, Compania lead-ului și Apartamentele de care sunt interesați.

Funcționalități de bază:

Sortare: Posibilitatea de a sorta datele după fiecare coloană (ex: alfabetic după nume).

Filtrare: O bară de căutare deasupra tabelului pentru a filtra rapid lead-urile.

Paginare: Navigare între paginile de rezultate pentru a gestiona volume mari de date.

Un click pe un rând din tabel va deschide un drawer cu detalii complete despre lead.

3. Componenta de căutare universală (SearchDock)
Integrată direct în dock-ul de navigare.

Va interpreta sintaxa:

@pers [nume sau număr de telefon]: Caută lead-uri.

@loc [adresă]: Caută proprietăți.

Căutarea va trimite o cerere către un endpoint API dedicat, iar rezultatele vor fi afișate într-un meniu drop-down sub bara de căutare.

4. Stilizare și UX
Vom folosi Tailwind CSS pentru a construi rapid componentele și a aplica stiluri personalizate.

Shadcn UI va oferi baza pentru elementele de interfață (butoane, panouri, tabele, drawer-uri).

Designul va fi responsive, asigurându-se că aplicația funcționează corect pe desktop, laptop și dispozitive mobile.

