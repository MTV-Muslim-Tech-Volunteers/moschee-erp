# Moschee ERP & Order Tracking System

Ein maßgeschneidertes Enterprise Resource Planning (ERP) System und eine automatisierte Bestellverfolgungs-Applikation. Entwickelt für die effiziente Verwaltung und Abwicklung lokaler Verkaufsinitiativen der Jugend.

## Features

*   **Digitale Kassenbuch-Verarbeitung:** Batch-Processing und detaillierte Buchungshistorie.
*   **Küchen-Dashboard:** Echtzeit-Übersicht für eingehende Bestellungen, Status-Updates (In Zubereitung, Erledigt) und Lagerbestand.
*   **Inventarkontrolle:** Verwaltung von Zutaten und automatische Warnungen bei niedrigem Bestand.
*   **Speisekarte & Warenkorb:** Digitale Bestellaufnahme mit mehrsprachiger Unterstützung (Deutsch / Türkisch).
*   **Admin-Bereich:** Produkt- und Kategorieverwaltung inklusive Bild-Uploads.

## Tech Stack

*   **Frontend:** [Next.js](https://nextjs.org/) (App Router), React, [Tailwind CSS](https://tailwindcss.com/)
*   **Backend & Datenbank:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Realtime)
*   **Sprache:** TypeScript

## Lokale Installation (Getting Started)

Um das Projekt lokal auszuführen, folge diesen Schritten:

1.  **Repository klonen:**
    ```bash
    git clone git@github.com:MTV-Muslim-Tech-Volunteers/moschee-erp.git
    cd moschee-erp
    ```

2.  **Abhängigkeiten installieren:**
    ```bash
    npm install
    # oder
    yarn install
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
    npm run dev
    ```
    Öffne [http://localhost:3000](http://localhost:3000) im Browser, um die Anwendung zu sehen.

## Autor
*   **Achmet Chakseven** 

## Lizenz
Dieses Projekt ist unter der AGPLv3 lizenziert.
