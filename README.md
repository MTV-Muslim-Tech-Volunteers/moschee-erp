# Moschee ERP & Order Tracking System

Ein maßgeschneidertes Enterprise Resource Planning (ERP) System und eine automatisierte Bestellverfolgungs-Applikation. Entwickelt für die effiziente Verwaltung und Abwicklung lokaler Verkaufsinitiativen der Jugend.

## Features

*   **Digitale Kassenbuch-Verarbeitung:** Batch-Processing, detaillierte Buchungshistorie und Filter.
*   **Muhasebe-Übersicht:** Finance-Dashboard mit Einnahmen nach Monat und Kalenderwoche sowie CSV-Export pro KW.
*   **Küchen-Dashboard:** Echtzeit-Übersicht für eingehende Bestellungen, Status-Updates (In Zubereitung, Erledigt), Lagerbestand und Produktverfügbarkeit.
*   **Inventarkontrolle:** Verwaltung von Zutaten und automatische Warnungen bei niedrigem Bestand.
*   **Speisekarte & Warenkorb:** Digitale Bestellaufnahme mit mehrsprachiger Unterstützung (Deutsch / Türkisch), Merch-Kategorie und Realtime-Produktaktualisierung.
*   **Produktverwaltung:** Neue Speisen, Getränke und Merch-Artikel inklusive Bild-Uploads anlegen.
*   **Sortimentsverwaltung:** Preise ändern, Produkte temporär ausblenden/einblenden oder dauerhaft löschen.
*   **Rollenbasierter Zugriff:** Admin verwaltet Küche und Produkte; Finance erhält zusätzlich Zugriff auf Muhasebe, Kassenbuch, Ausgaben und Sortimentsänderungen.

## Tech Stack

*   **Frontend:** [Next.js](https://nextjs.org/) (App Router), React, [Tailwind CSS](https://tailwindcss.com/)
*   **Backend & Datenbank:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Realtime)
*   **Sprache:** TypeScript
*   **Tests:** Vitest

## Wichtige Bereiche

*   `/menu` – Öffentliche Speisekarte und Warenkorb.
*   `/login` – Anmeldung für Admin- und Finance-Nutzer.
*   `/admin` – Rollenabhängiger System-Hub.
*   `/kitchen` – Bestellungen, Lagerbestand und Produktverfügbarkeit.
*   `/kitchen/quick-order` – Schnelle Bestellaufnahme für die Küche.
*   `/products` – Neue Produkte und Merch-Artikel anlegen.
*   `/products/change` bzw. `/change` – Finance-only: Preise und Sortiment ändern.
*   `/muhasebe` – Finance-only: Einnahmenübersicht und zentrale Links zu Finanzbereichen.
*   `/kassenbuch` – Finance-only: Buchungshistorie und Kennzahlen.
*   `/ausgaben` – Finance-only: Ausgaben als Stapel erfassen.

## Lokale Installation (Getting Started)

Um das Projekt lokal auszuführen, folge diesen Schritten:

1.  **Repository klonen:**
    ```bash
    git clone git@github.com:MTV-Muslim-Tech-Volunteers/moschee-erp.git
    cd moschee-erp
    ```

2.  **Abhängigkeiten installieren:**
    ```bash
    pnpm install
    ```

3.  **Umgebungsvariablen konfigurieren:**
    Erstelle eine `.env.local` Datei im Hauptverzeichnis und füge deine Supabase-Keys sowie Admin-Zugangsdaten ein:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=deine_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=dein_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=dein_service_role_key
    
    ADMIN_USERNAME=dein_admin_user
    ADMIN_PASSWORD=dein_admin_passwort

    FINANCE_USERNAME=dein_finanz_user
    FINANCE_PASSWORD=dein_finanz_passwort
    ```

4.  **Entwicklungsserver starten:**
    ```bash
    pnpm dev
    ```
    Öffne [http://localhost:3000](http://localhost:3000) im Browser, um die Anwendung zu sehen.

## Entwicklung und Tests

```bash
pnpm test                 # Unit-Tests ausführen
pnpm exec tsc --noEmit    # TypeScript prüfen
pnpm exec eslint          # Linting ausführen
pnpm build                # Produktions-Build erstellen
```

Produktänderungen und Verfügbarkeitsänderungen werden per Supabase-Realtime automatisch in `/menu` und `/kitchen` sichtbar. Die Einnahmenübersicht auf `/muhasebe` aktualisiert sich ebenfalls bei Änderungen an Bestellungen.

## Autor
*   **Achmet Chakseven** 

## Lizenz
Dieses Projekt ist unter der AGPLv3 lizenziert.
