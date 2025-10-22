# 🚀 JunoSixteen - Production Deployment Guide

## 📋 Kompletter Deployment-Leitfaden für Production

---

## 🎯 Übersicht

Dieser Guide führt dich durch den kompletten Deployment-Prozess von JunoSixteen:
- Backend-Server (Express/TypeScript)
- Mobile App (React Native/Expo)
- Datenbank (PostgreSQL/Firestore)
- Mangle Engine (Go-Service)
- Monitoring & Analytics

---

## 📦 Pre-Deployment Checklist

### ✅ Backend
- [ ] Alle Dependencies installiert (`npm install`)
- [ ] TypeScript kompiliert ohne Fehler (`npm run build`)
- [ ] Environment-Variablen konfiguriert (`.env`)
- [ ] Datenbank-Connection getestet
- [ ] Mangle-Service läuft (optional)
- [ ] SSL-Zertifikate vorbereitet
- [ ] API-Keys gesichert

### ✅ Frontend/Mobile
- [ ] React Native Bundle erstellt
- [ ] Firebase konfiguriert
- [ ] API-Endpoints auf Production gesetzt
- [ ] Assets optimiert
- [ ] App-Icons & Splash-Screens
- [ ] Store-Listings vorbereitet

### ✅ Database
- [ ] Schema erstellt
- [ ] Migrations ausgeführt
- [ ] Backups konfiguriert
- [ ] Indizes optimiert
- [ ] Security-Rules gesetzt

---

## 🖥️ Backend-Deployment

### Option 1: Cloud Run (Google Cloud) - Empfohlen

#### 1. Dockerfile erstellen

```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci --only=production

# Source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start
CMD ["node", "dist/server.js"]
```

#### 2. Build & Deploy

```bash
# Build image
docker build -t junosixteen-backend:latest .

# Tag for Google Cloud
docker tag junosixteen-backend:latest gcr.io/YOUR_PROJECT/junosixteen-backend:latest

# Push
docker push gcr.io/YOUR_PROJECT/junosixteen-backend:latest

# Deploy to Cloud Run
gcloud run deploy junosixteen-backend \
  --image gcr.io/YOUR_PROJECT/junosixteen-backend:latest \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production,USE_MANGLE=true"
```

### Option 2: AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init junosixteen-backend --platform node.js --region eu-central-1

# Create environment
eb create production-env \
  --instance-type t3.medium \
  --scale 2-10

# Deploy
eb deploy

# Set environment variables
eb setenv NODE_ENV=production USE_MANGLE=true
```

### Option 3: Heroku

```bash
# Login
heroku login

# Create app
heroku create junosixteen-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Set environment
heroku config:set NODE_ENV=production
heroku config:set USE_MANGLE=true
heroku config:set CORS_ORIGIN=https://junosixteen.app

# Deploy
git push heroku main

# Scale
heroku ps:scale web=2:standard-2x
```

### Option 4: VPS (Ubuntu/Debian)

```bash
# SSH to server
ssh user@your-server.com

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone https://github.com/yourorg/junosixteen.git
cd junosixteen/backend

# Install dependencies
npm ci --only=production

# Build
npm run build

# Configure environment
cp .env.example .env
nano .env  # Edit configuration

# Start with PM2
pm2 start dist/server.js --name junosixteen-backend

# Save PM2 config
pm2 save
pm2 startup

# Setup Nginx reverse proxy
sudo nano /etc/nginx/sites-available/junosixteen

# Nginx config:
server {
    listen 80;
    server_name api.junosixteen.app;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable & restart Nginx
sudo ln -s /etc/nginx/sites-available/junosixteen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.junosixteen.app
```

---

## 📱 Mobile App Deployment

### iOS Deployment

#### 1. Vorbereitung

```bash
cd mobile

# Install dependencies
npm install

# iOS-specific
cd ios
pod install
cd ..

# Build iOS
eas build --platform ios --profile production
```

#### 2. App Store Connect

```bash
# 1. Erstelle App in App Store Connect
# - App-Name: JunoSixteen
# - Bundle ID: com.junosixteen.app
# - Screenshots vorbereiten (alle Devices)

# 2. Upload mit EAS
eas submit --platform ios

# 3. App-Informationen ausfüllen:
# - Beschreibung (Deutsch + English)
# - Screenshots (5.5", 6.5", 12.9")
# - Kategorien: Education, Games
# - Age Rating: 4+
# - Privacy Policy URL

# 4. Review einreichen
# - TestFlight Beta optional
# - Production Review (~2-3 Tage)
```

### Android Deployment

#### 1. Build

```bash
# Build Android AAB
eas build --platform android --profile production

# Oder lokal:
cd android
./gradlew bundleRelease
```

#### 2. Google Play Console

```bash
# 1. Erstelle App in Play Console
# - App-Name: JunoSixten
# - Package: com.junosixteen.app

# 2. Upload
eas submit --platform android

# 3. Store Listing:
# - Titel (DE): JunoSixteen - Lern-Adventure
# - Kurzbeschreibung (80 Zeichen)
# - Vollständige Beschreibung (4000 Zeichen)
# - Screenshots (Phone, Tablet, 7")
# - App-Icon (512x512)
# - Feature Graphic (1024x500)

# 4. Inhaltsbewertung
# - Bildung/Wissen
# - Keine Gewalt
# - Keine Werbung für Kinder

# 5. Preise & Vertrieb
# - Kostenlos (mit In-App-Purchases optional)
# - Alle Länder

# 6. Release
# - Interne Tests (7 Tage)
# - Closed Beta (optional)
# - Production
```

### Web-Version (PWA)

```bash
# Build web version
expo build:web

# Deploy zu Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=web-build

# Oder Vercel
vercel --prod
```

---

## 🗄️ Datenbank-Setup

### Option 1: PostgreSQL (Cloud SQL)

```bash
# Google Cloud SQL
gcloud sql instances create junosixteen-db \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=europe-west1 \
  --backup \
  --backup-start-time=03:00

# Create database
gcloud sql databases create junosixteen \
  --instance=junosixteen-db

# Create user
gcloud sql users create junosixteen_user \
  --instance=junosixteen-db \
  --password=SECURE_PASSWORD

# Get connection string
gcloud sql instances describe junosixteen-db
```

#### Schema-Migration

```sql
-- backend/migrations/001_initial_schema.sql

-- Users
CREATE TABLE users (
  user_id VARCHAR(255) PRIMARY KEY,
  avatar VARCHAR(100),
  lang VARCHAR(10) DEFAULT 'de',
  roles TEXT[],
  total_points INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  prestige_level INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Progress
CREATE TABLE mission_progress (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(user_id),
  mission_id VARCHAR(255),
  lives INTEGER DEFAULT 3,
  points INTEGER DEFAULT 0,
  question_index INTEGER DEFAULT 1,
  finished BOOLEAN DEFAULT FALSE,
  success BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP,
  UNIQUE(user_id, mission_id)
);

-- Attempts
CREATE TABLE attempts (
  id SERIAL PRIMARY KEY,
  progress_id INTEGER REFERENCES mission_progress(id),
  quest_id VARCHAR(255),
  selected_option_id VARCHAR(50),
  correct BOOLEAN,
  time_ms INTEGER,
  score DECIMAL(3,2),
  score_delta INTEGER,
  help_used BOOLEAN DEFAULT FALSE,
  challenge_outcome VARCHAR(20),
  telemetry JSONB,
  attempted_at TIMESTAMP DEFAULT NOW()
);

-- Hypotheses
CREATE TABLE hypotheses (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(user_id),
  mission_id VARCHAR(255),
  world VARCHAR(50),
  difficulty VARCHAR(20),
  signals JSONB,
  notes TEXT[],
  started_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Achievements
CREATE TABLE user_achievements (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(user_id),
  achievement_id VARCHAR(255),
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

-- Power-Ups
CREATE TABLE user_powerups (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(user_id),
  powerup_id VARCHAR(255),
  owned BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT FALSE,
  remaining_uses INTEGER,
  expires_at TIMESTAMP,
  purchased_at TIMESTAMP DEFAULT NOW()
);

-- Clans
CREATE TABLE clans (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  tag VARCHAR(10) UNIQUE,
  description TEXT,
  total_points INTEGER DEFAULT 0,
  clan_level INTEGER DEFAULT 1,
  created_by VARCHAR(255) REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clan Members
CREATE TABLE clan_members (
  id SERIAL PRIMARY KEY,
  clan_id VARCHAR(255) REFERENCES clans(id),
  user_id VARCHAR(255) REFERENCES users(user_id),
  role VARCHAR(20) DEFAULT 'member',
  contribution INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(clan_id, user_id)
);

-- Leaderboards
CREATE TABLE leaderboard_entries (
  id SERIAL PRIMARY KEY,
  leaderboard_type VARCHAR(50),
  leaderboard_id VARCHAR(255),
  user_id VARCHAR(255) REFERENCES users(user_id),
  rank INTEGER,
  score INTEGER,
  metric VARCHAR(50),
  previous_rank INTEGER,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(leaderboard_id, user_id)
);

-- Telemetry
CREATE TABLE telemetry_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100),
  user_id VARCHAR(255),
  mission_id VARCHAR(255),
  quest_id VARCHAR(255),
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_points ON users(total_points DESC);
CREATE INDEX idx_progress_user ON mission_progress(user_id);
CREATE INDEX idx_attempts_progress ON attempts(progress_id);
CREATE INDEX idx_telemetry_user ON telemetry_events(user_id);
CREATE INDEX idx_telemetry_type ON telemetry_events(event_type);
CREATE INDEX idx_leaderboard_rank ON leaderboard_entries(leaderboard_id, rank);
```

```bash
# Run migration
psql $DATABASE_URL -f backend/migrations/001_initial_schema.sql
```

### Option 2: Firebase/Firestore

```typescript
// backend/firestore-setup.ts
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert('./config/firebase-service-account.json'),
});

const db = admin.firestore();

// Firestore Security Rules
const SECURITY_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Progress
    match /progress/{userId}/missions/{missionId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
    
    // Leaderboards
    match /leaderboards/{type}/{entry} {
      allow read: if true;
      allow write: if false; // Server-only
    }
    
    // Clans
    match /clans/{clanId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/clans/$(clanId)/members/$(request.auth.uid)).data.role == 'leader';
    }
  }
}
`;

export default db;
```

---

## 🔧 Environment Configuration

### Production .env

```bash
# backend/.env.production

# Environment
NODE_ENV=production
NODE_PORT=5000
NODE_HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@db-host:5432/junosixteen
# Or Firestore
FIREBASE_PROJECT_ID=junosixteen-prod
FIREBASE_SERVICE_ACCOUNT=./config/firebase-service-account.json

# Mangle
POLICY_BASEURL=https://mangle.junosixteen.app
MANGLE_TIMEOUT=5000
USE_MANGLE=true

# CORS
CORS_ORIGIN=https://junosixteen.app,https://app.junosixteen.com

# Security
JWT_SECRET=your-super-secret-key-min-32-chars
SESSION_SECRET=another-secret-key

# API Keys
OPENAI_API_KEY=sk-...  # Für LLM Story-Generation (optional)
SENDGRID_API_KEY=SG...  # Für Email-Notifications (optional)

# Analytics
GOOGLE_ANALYTICS_ID=G-...
SENTRY_DSN=https://...  # Error tracking

# URLs
PUBLIC_BASEURL=https://api.junosixteen.app
FRONTEND_URL=https://junosixteen.app

# Features
ENABLE_PREMIUM=true
ENABLE_PVP=true
ENABLE_TOURNAMENTS=true
ENABLE_RAID_BOSSES=true

# Rate Limiting
RATE_LIMIT_WINDOW=15  # minutes
RATE_LIMIT_MAX=100    # requests per window

# Caching
REDIS_URL=redis://redis:6379  # Optional
CACHE_TTL=3600  # seconds
```

### Mobile App Configuration

```typescript
// mobile/app.config.js
export default {
  expo: {
    name: "JunoSixteen",
    slug: "junosixteen",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#5479F7"
    },
    updates: {
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/YOUR_PROJECT_ID"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.junosixteen.app",
      buildNumber: "1"
    },
    android: {
      package: "com.junosixteen.app",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      }
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    extra: {
      apiUrl: process.env.API_URL || "https://api.junosixteen.app",
      eas: {
        projectId: "YOUR_PROJECT_ID"
      }
    }
  }
};
```

---

## 🔐 Security Hardening

### 1. Rate Limiting

```typescript
// backend/src/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts
  skipSuccessfulRequests: true,
});

// In server.js
app.use('/api/', apiLimiter);
app.use('/auth/', authLimiter);
```

### 2. Input Validation

```typescript
// backend/src/middleware/validation.ts
import { z } from 'zod';

export const validateHRMPlan = z.object({
  userId: z.string().min(1).max(255),
  goal: z.object({
    missionId: z.string(),
    world: z.enum(['health', 'it', 'legal', 'public', 'factory']),
  }),
  context: z.object({
    lang: z.enum(['de', 'en']).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  }).optional(),
});

// Usage
app.post('/hrm/plan', (req, res) => {
  const validated = validateHRMPlan.parse(req.body);
  // ... process
});
```

### 3. Authentication

```typescript
// backend/src/middleware/auth.ts
import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// Protected routes
app.post('/hrm/plan', authenticateToken, (req, res) => {
  // Only authenticated users
});
```

---

## 📊 Monitoring & Analytics

### 1. Sentry Error Tracking

```bash
# Install
npm install @sentry/node @sentry/tracing
```

```typescript
// backend/src/monitoring/sentry.ts
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

export function initializeSentry(app) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.Express({ app }),
    ],
    tracesSampleRate: 0.1, // 10% of requests
  });
  
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
  
  // Error handler (after routes)
  app.use(Sentry.Handlers.errorHandler());
}
```

### 2. Health Checks & Metrics

```typescript
// backend/src/monitoring/health.ts
export function setupHealthChecks(app) {
  app.get('/health', async (req, res) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      
      // Service checks
      services: {
        database: await checkDatabase(),
        mangle: await checkMangle(),
        cache: await checkCache(),
      },
      
      // Feature flags
      features: {
        hrm_trm: true,
        mangle: process.env.USE_MANGLE === 'true',
        premium: process.env.ENABLE_PREMIUM === 'true',
      },
    };
    
    res.json(health);
  });
  
  app.get('/metrics', (req, res) => {
    // Prometheus-compatible metrics
    res.type('text/plain');
    res.send(`
# HELP requests_total Total number of requests
# TYPE requests_total counter
requests_total ${global.requestCount || 0}

# HELP active_users Active users
# TYPE active_users gauge
active_users ${global.activeUsers || 0}
    `);
  });
}
```

### 3. Logging

```typescript
// backend/src/monitoring/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    }),
  ],
});

// In production, send to cloud logging
if (process.env.NODE_ENV === 'production') {
  // Google Cloud Logging
  const { LoggingWinston } = require('@google-cloud/logging-winston');
  logger.add(new LoggingWinston());
}
```

---

## 🚀 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run tests
        run: |
          cd backend
          npm test
      
      - name: Build
        run: |
          cd backend
          npm run build

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup gcloud
        uses: google-github-actions/setup-gcloud@v0
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: junosixteen-prod
      
      - name: Build and push Docker image
        run: |
          cd backend
          docker build -t gcr.io/junosixteen-prod/backend:${{ github.sha }} .
          docker push gcr.io/junosixteen-prod/backend:${{ github.sha }}
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy junosixteen-backend \
            --image gcr.io/junosixteen-prod/backend:${{ github.sha }} \
            --platform managed \
            --region europe-west1 \
            --allow-unauthenticated

  deploy-mobile:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Expo
        uses: expo/expo-github-action@v7
        with:
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: |
          cd mobile
          npm ci
      
      - name: Build iOS
        run: |
          cd mobile
          eas build --platform ios --profile production --non-interactive
      
      - name: Build Android
        run: |
          cd mobile
          eas build --platform android --profile production --non-interactive
      
      - name: Submit to stores
        run: |
          cd mobile
          eas submit --platform all --profile production
```

---

## 📈 Performance Optimization

### 1. Caching (Redis)

```typescript
// backend/src/cache/redis.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function cacheGet(key: string) {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function cacheSet(key: string, value: any, ttl: number = 3600) {
  await redis.setex(key, ttl, JSON.stringify(value));
}

// Cache policies
export async function getCachedPolicy(world: World) {
  const cacheKey = `policy:${world}`;
  let policy = await cacheGet(cacheKey);
  
  if (!policy) {
    policy = await policyLoader.forWorld(world);
    await cacheSet(cacheKey, policy, 3600); // 1 hour
  }
  
  return policy;
}
```

### 2. Database Connection Pooling

```typescript
// backend/src/db/pool.ts
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }
  console.log('✅ Database connected');
  release();
});
```

### 3. Response Compression

```typescript
// Already in server.js
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Compression level 1-9
}));
```

---

## 🔍 Testing & Quality Assurance

### Unit Tests

```typescript
// backend/test/hrm.service.test.ts
import { HRMService } from '../src/hrm/hrm.service';
import { PolicyLoader } from '../src/hrm/policy.loader';

describe('HRM Service', () => {
  let hrmService: HRMService;
  
  beforeEach(() => {
    const policyLoader = new PolicyLoader();
    const reasoningRepo = new ReasoningRepo();
    hrmService = new HRMService(policyLoader, reasoningRepo);
  });
  
  it('should plan mission with correct quest count', async () => {
    const plan = await hrmService.plan({
      userId: 'test_user',
      goal: { missionId: 'test', world: 'it' },
    });
    
    expect(plan.questSet).toHaveLength(10);
    expect(plan.hypothesisId).toBeDefined();
  });
  
  it('should include risk questions at positions 5 and 10', async () => {
    const plan = await hrmService.plan({
      userId: 'test_user',
      goal: { missionId: 'test', world: 'health' },
    });
    
    const riskQuests = plan.questSet.filter(q => q.kind === 'risk');
    expect(riskQuests).toHaveLength(2);
    expect(riskQuests[0].index).toBe(5);
    expect(riskQuests[1].index).toBe(10);
  });
});
```

### E2E Tests

```bash
# Install Playwright
npm install -D @playwright/test

# Run tests
npx playwright test
```

```typescript
// e2e/mission-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete mission flow', async ({ page }) => {
  await page.goto('https://junosixteen.app');
  
  // Login
  await page.fill('[name=email]', 'test@example.com');
  await page.fill('[name=password]', 'test123');
  await page.click('button[type=submit]');
  
  // Start mission
  await page.click('[data-world=health]');
  await page.click('[data-mission=cleanroom_expedition]');
  
  // Answer questions
  for (let i = 0; i < 10; i++) {
    await page.click('[data-option=a]');
    await page.waitForSelector('[data-question]');
  }
  
  // Check completion
  await expect(page.locator('[data-debrief]')).toBeVisible();
});
```

---

## 📦 Deployment-Checkliste

### Pre-Launch:
- [ ] Alle Tests grün
- [ ] Performance-Tests durchgeführt
- [ ] Load-Testing (Artillery/k6)
- [ ] Security-Audit
- [ ] Penetration-Testing
- [ ] DSGVO-Compliance check
- [ ] Datenschutzerklärung
- [ ] AGB erstellt
- [ ] Impressum

### Launch-Day:
- [ ] Database-Backup erstellt
- [ ] Monitoring aktiv (Sentry, Analytics)
- [ ] Rollback-Plan bereit
- [ ] Support-Team briefed
- [ ] Social-Media vorbereitet
- [ ] Press-Release (optional)

### Post-Launch:
- [ ] Monitoring prüfen (erste 24h)
- [ ] Error-Rate < 0.1%
- [ ] Response-Time < 200ms (p95)
- [ ] User-Feedback sammeln
- [ ] Hot-Fixes deployen
- [ ] Performance optimieren

---

## 🔄 Rollback-Strategie

```bash
# Backend rollback (Cloud Run)
gcloud run services update-traffic junosixteen-backend \
  --to-revisions=PREVIOUS_REVISION=100

# Database rollback
pg_restore -d junosixteen backup_2025_10_20.dump

# Mobile rollback (EAS)
# Users automatisch auf vorherige Version (OTA-Updates)
```

---

## 📊 Monitoring-Dashboard

### Key Metrics:

```
1. Request Rate (req/s)
2. Error Rate (%)
3. Response Time (p50, p95, p99)
4. Active Users (concurrent)
5. Database Connections
6. Memory Usage
7. CPU Usage
8. Cache Hit-Rate
9. Mission Completion Rate
10. Average Session Duration
```

### Alerts:

```yaml
# Error rate > 1%
# Response time p95 > 500ms
# CPU > 80% for 5 minutes
# Memory > 90%
# Database connections > 18
# Mission fail rate > 50%
```

---

## 🎉 GO LIVE!

```bash
# Final deployment command
./deploy-production.sh
```

```bash
#!/bin/bash
# deploy-production.sh

echo "🚀 Starting production deployment..."

# 1. Run tests
echo "Running tests..."
cd backend && npm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed! Aborting deployment."
  exit 1
fi

# 2. Build
echo "Building application..."
npm run build

# 3. Deploy
echo "Deploying to production..."
gcloud run deploy junosixteen-backend \
  --image gcr.io/junosixteen-prod/backend:latest \
  --platform managed \
  --region europe-west1

# 4. Health check
echo "Checking health..."
curl https://api.junosixteen.app/health

echo "✅ Deployment complete!"
echo "🎉 JunoSixteen is LIVE!"
```

---

**DEPLOYMENT-GUIDE COMPLETE! JunoSixteen ist bereit für Production! 🚀🎯🌍**


