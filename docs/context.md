# Planio – Web App Blueprint  
*Simple Shift Planning with Supabase and JavaScript*

---

## 1. Vision  
Planio hilft kleinen bis mittleren Fertigungsunternehmen, Schichten effizient zu planen.  
Ein simples Web-Tool für Manager, um Wochenpläne zu erstellen, Verfügbarkeiten zu sehen und Abwesenheiten zu berücksichtigen – ohne Excel-Chaos.  

---

## 2. Tech Stack  

| Komponente       | Technologie           |
|------------------|-----------------------|
| Frontend         | HTML, CSS, JavaScript |
| Backend          | Supabase (DB + Auth)  |
| Hosting          | Netlify               |

---

## 3. Supabase Datenmodell  

### `employees`  
- `id` (int, PK)  
- `first_name` (text)  
- `last_name` (text)  
- `email` (text)  
- `position` (text)  
- `department` (text)  
- `status` (text)  

### `absence_types`  
- `id` (int, PK)  
- `name` (text) – z. B. "Urlaub"  
- `category` (text) – z. B. "vacation"

### `absences`  
- `id` (int, PK)  
- `employee_id` (FK)  
- `absence_type_id` (FK)  
- `start_date` (date)  
- `end_date` (date)  
- `status` (text)

### `attendances`  
- `id` (int, PK)  
- `employee_id` (FK)  
- `date` (date)  
- `start_time` (time)  
- `end_time` (time)

---

## 4. Seiten & Funktionen

### `index.html` (Manager-Dashboard)
- Login mit Supabase (Magic Link oder E-Mail/Passwort)
- Wochenplan als Grid (Montag–Sonntag)
- Drag-and-Drop von Mitarbeitern in Schichten
- Anzeige: Wer fehlt (laut `absences`)
- Button: Plan speichern (in `attendances`)

### `employee.html` (Mitarbeiteransicht)
- Eigene Schichten anzeigen
- Eigene Abwesenheiten sehen
- Abwesenheit beantragen (Eintrag in `absences`, status = "pending")

---

## 5. UI Hinweise  
- Simples Grid-Layout mit CSS `display: grid`  
- Drag-Funktion per JS oder [Sortable.js](https://sortablejs.github.io/Sortable/)  
- Farbe:  
  - Blau = geplant  
  - Rot = abwesend  
  - Grau = frei

---

## 6. Setup  

### Lokale Entwicklung  
1. Git-Projekt anlegen  
2. `.env.js` Datei erstellen  
```js
// .env.js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';
