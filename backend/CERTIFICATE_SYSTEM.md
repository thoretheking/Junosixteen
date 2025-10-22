# 📜 JunoSixteen Certificate System

## Übersicht

Das Certificate System ist vollständig in die Mangle Rule Engine integriert und ermöglicht:

- **Automatische Zertifikatsberechtigung** basierend auf Mangle-Regeln
- **PDF-Generierung** mit QR-Code-Verifizierung  
- **Drei Zertifikatsstufen**: Basic, Silver, Gold
- **Blockchain-ähnliche Verifizierung** über Hash-Speicherung

## API Endpoints

### 🔍 Berechtigung prüfen
```http
POST /api/cert/check
Content-Type: application/json

{
  "userId": "lea",
  "courseId": "onboarding"
}

Response:
{
  "eligible": true,
  "tier": "gold"
}
```

### 📜 Zertifikat ausstellen
```http
POST /api/cert/issue
Content-Type: application/json

{
  "userId": "lea", 
  "fullName": "Lea Beispiel",
  "courseId": "onboarding"
}

Response: PDF-Download
```

### ✅ Zertifikat verifizieren
```http
GET /api/cert/verify/{certId}

Response:
{
  "valid": true,
  "cert_id": "a1b2c3...",
  "user_id": "lea",
  "course_id": "onboarding", 
  "tier": "gold",
  "issued_at": "2025-08-25T10:49:00Z"
}
```

## Zertifikatsstufen

### 🥉 Basic Certificate
- Alle 10 Level abgeschlossen
- Mindestens 80% Accuracy

### 🥈 Silver Certificate  
- Basic-Anforderungen erfüllt
- Mindestens 1 Risikofrage erfolgreich

### 🥇 Gold Certificate
- Silver-Anforderungen erfüllt
- Mindestens 1 Teamfrage erfolgreich

## Mangle-Regeln

```prolog
# /rules/certs.mg
award_certificate(U, C, "basic")  :- eligible_basic(U, C), not eligible_silver(U, C).
award_certificate(U, C, "silver") :- eligible_silver(U, C), not eligible_gold(U, C).  
award_certificate(U, C, "gold")   :- eligible_gold(U, C).
```

## Quick Start

1. **Database Setup**:
   ```bash
   psql junosixteen -f database/migrations/001_certificates.sql
   ```

2. **Dependencies installieren**:
   ```bash
   cd backend && npm install
   ```

3. **Environment konfigurieren**:
   ```bash
   cp env.example .env
   # Edit DATABASE_URL und PUBLIC_BASEURL
   ```

4. **Backend starten**:
   ```bash
   npm start
   ```

5. **Test**:
   ```bash
   curl -X POST http://localhost:5000/api/cert/check \
     -H "Content-Type: application/json" \
     -d '{"userId":"lea","courseId":"onboarding"}'
   ```

## Testing

Die Golden Tests validieren die Certificate-Regeln:

```bash
npm test
```

Testet:
- `rules/tests/cert/award_gold.golden.json`
- `rules/tests/cert/no_award_missing_level.golden.json`

## Sicherheit

- **PDF-Hash-Verifizierung**: Jedes PDF wird mit SHA256 gehashed
- **Unique Certificate IDs**: Basiert auf User, Course, Tier und Timestamp
- **QR-Code-Verifizierung**: Jedes Zertifikat hat einen verifizierbaren QR-Code
- **Database-Backed**: Alle Zertifikate werden in PostgreSQL gespeichert 