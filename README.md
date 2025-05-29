# Planio - Einfache Schichtplanung

Planio ist eine Web-Anwendung für kleine bis mittlere Fertigungsunternehmen zur effizienten Schichtplanung. Die Anwendung ermöglicht es Managern, Wochenpläne zu erstellen, Mitarbeiterverfügbarkeiten zu sehen und Abwesenheiten zu verwalten.

## Features

- Übersichtlicher Wochenplan mit Drag-and-Drop-Funktionalität
- Mitarbeiterverwaltung mit Detailansicht
- Abwesenheitsmanagement (Urlaub, Krankheit, etc.)
- Responsive Design für verschiedene Geräte

## Technologie-Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Supabase (Datenbank und Authentifizierung)
- **Hosting**: Netlify

## Datenmodell

Die Anwendung verwendet folgende Tabellen in Supabase:

- `employees`: Mitarbeiterdaten
- `absence_types`: Arten von Abwesenheiten
- `absences`: Abwesenheitseinträge der Mitarbeiter
- `attendances`: Schichteinträge

## Installation und Setup

1. Repository klonen
   ```
   git clone https://github.com/yourusername/planion.git
   cd planion
   ```

2. Supabase-Konfiguration
   - Erstellen Sie ein Projekt in [Supabase](https://supabase.io)
   - Erstellen Sie die erforderlichen Tabellen gemäß dem Datenmodell
   - Aktualisieren Sie die Datei `js/env.js` mit Ihren Supabase-Zugangsdaten

3. Lokale Entwicklung
   - Starten Sie einen lokalen Webserver, z.B. mit Python:
     ```
     python -m http.server 8000
     ```
   - Öffnen Sie `http://localhost:8000` in Ihrem Browser

## Nutzung

### Manager-Ansicht (index.html)
- Wochenplan anzeigen und bearbeiten
- Schichten per Drag-and-Drop zuweisen
- Mitarbeiter-Abwesenheiten einsehen

### Mitarbeiter-Ansicht (employee.html)
- Mitarbeiter verwalten
- Mitarbeiterdetails anzeigen
- Abwesenheiten beantragen und verwalten

## Anpassung

- Farben und Design können in `css/styles.css` angepasst werden
- Schichttypen können in der Datei `js/schedule.js` konfiguriert werden

## Lizenz

MIT
# Planio
# planio
# planio
