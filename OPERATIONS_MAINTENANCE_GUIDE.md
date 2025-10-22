# 🛠️ JunoSixteen - Operations & Maintenance Guide

## 📋 Leitfaden für Betrieb & Wartung

---

## 🔄 Tägliche Operationen

### Morning Routine (täglich)

```bash
# 1. System-Health prüfen
curl https://api.junosixteen.app/health

# 2. Metrics checken
curl https://api.junosixteen.app/metrics

# 3. Error-Logs prüfen (Sentry-Dashboard)
# → https://sentry.io/junosixteen

# 4. Active-Users prüfen
curl https://api.junosixteen.app/telemetry/analytics/active-users

# 5. Database-Performance
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM mission_progress WHERE started_at > NOW() - INTERVAL '24 hours';"
```

### Content-Updates (täglich)

```bash
# 1. Daily Quests generiert? (auto-generiert, aber prüfen)
curl https://api.junosixteen.app/adventure/quests/daily

# 2. Featured-Items aktualisiert? (Montags)
# → Läuft automatisch, aber visuell prüfen

# 3. Leaderboards aktualisiert?
curl https://api.junosixteen.app/api/leaderboard/individual/weekly

# 4. Active-Events prüfen
# → Seasons, Special-Events laufen?
```

---

## 📊 Wöchentliche Wartung

### Montag: Content-Review

```bash
# 1. Featured-Items rotieren (automatisch)
# 2. Weekly-Leaderboard-Rewards auszahlen
node backend/scripts/award-weekly-rewards.js

# 3. Neue Weekly-Quests generiert?
curl https://api.junosixteen.app/adventure/quests/weekly

# 4. Clan-Stats aktualisieren
node backend/scripts/update-clan-stats.js
```

### Mittwoch: Performance-Review

```bash
# 1. Slow-Query-Analysis
psql $DATABASE_URL -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# 2. Cache-Hit-Rate prüfen
redis-cli INFO stats | grep hit_rate

# 3. API-Response-Times (p95)
# → Sentry Performance Dashboard

# 4. Memory-Leaks?
pm2 monit  # oder Cloud Monitoring
```

### Freitag: Security-Check

```bash
# 1. Dependencies-Audit
npm audit

# 2. Outdated-Packages prüfen
npm outdated

# 3. SSL-Zertifikate prüfen
echo | openssl s_client -servername api.junosixteen.app -connect api.junosixteen.app:443 2>/dev/null | openssl x509 -noout -dates

# 4. Failed-Login-Attempts
psql $DATABASE_URL -c "SELECT COUNT(*) FROM auth_logs WHERE success=false AND created_at > NOW() - INTERVAL '7 days';"
```

---

## 🗓️ Monatliche Aufgaben

### 1. Database-Maintenance

```bash
# Vacuum & Analyze
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Reindex
psql $DATABASE_URL -c "REINDEX DATABASE junosixteen;"

# Check table sizes
psql $DATABASE_URL -c "SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname='public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### 2. Backups

```bash
# Full database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Compress
gzip backup_$(date +%Y%m%d).sql

# Upload to cloud storage
gsutil cp backup_$(date +%Y%m%d).sql.gz gs://junosixteen-backups/

# Test restore (staging)
pg_restore -d junosixteen_staging backup_$(date +%Y%m%d).sql.gz
```

### 3. User-Analytics

```bash
# Monthly report generieren
node backend/scripts/generate-monthly-report.js

# Output:
# - Total Users
# - Active Users (MAU)
# - Missions Completed
# - Average Session Duration
# - Top Worlds
# - Retention Rate
# - Revenue (wenn Premium)
```

### 4. Content-Refresh

```bash
# Neue Missions hinzufügen
node backend/scripts/add-missions.js

# Neue Challenges
node backend/scripts/add-challenges.js

# Neue Events planen
# → Editiere: backend/src/adventure/seasons.events.ts
```

---

## 🆘 Troubleshooting

### Problem: Hohe Error-Rate

```bash
# 1. Check Sentry
# → https://sentry.io/junosixteen

# 2. Recent errors
tail -f backend/error.log

# 3. Häufigste Fehler
grep ERROR backend/combined.log | sort | uniq -c | sort -rn | head -10

# 4. Fix deployen
git commit -m "fix: ..."
git push origin main
# → Auto-Deploy via CI/CD
```

### Problem: Langsame Response-Times

```bash
# 1. Slow queries identifizieren
psql $DATABASE_URL -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# 2. Fehlende Indizes?
psql $DATABASE_URL -c "SELECT schemaname, tablename, attname, n_distinct FROM pg_stats WHERE schemaname='public' AND n_distinct > 1000;"

# 3. Cache-Hit-Rate
redis-cli INFO stats

# 4. API-Bottlenecks
# → New Relic / DataDog APM

# 5. Add index
psql $DATABASE_URL -c "CREATE INDEX idx_telemetry_created ON telemetry_events(created_at DESC);"
```

### Problem: Mangle-Service down

```bash
# 1. Check Mangle health
curl http://mangle-service:8088/health

# 2. Restart Mangle
docker restart mangle-service
# oder
pm2 restart mangle

# 3. HRM fällt automatisch auf YAML-Policies zurück
# → Kein Service-Ausfall!

# 4. Logs prüfen
docker logs mangle-service --tail 100
```

### Problem: Out of Memory

```bash
# 1. Current memory usage
free -h

# 2. Top processes
top -o %MEM

# 3. Node.js heap
node --max-old-space-size=4096 dist/server.js

# 4. PM2 monitoring
pm2 monit

# 5. Scale up (Cloud Run)
gcloud run services update junosixteen-backend --memory 4Gi
```

---

## 🔐 Security-Operationen

### 1. Secrets-Rotation (vierteljährlich)

```bash
# JWT Secret rotieren
openssl rand -base64 32
# → Update in .env & restart

# Database Password
# → Cloud Console → Update → Restart

# API Keys
# → Regenerate in Provider-Dashboards
```

### 2. Access-Logs prüfen

```bash
# Unusual access patterns
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -20

# Failed auth attempts
grep "401\|403" access.log | wc -l

# Potential DDoS
awk '{print $1}' access.log | sort | uniq -c | awk '$1 > 1000' | wc -l
```

### 3. Vulnerability-Scans

```bash
# npm audit
npm audit --production

# Fix vulnerabilities
npm audit fix

# Snyk scan (optional)
npx snyk test
```

---

## 📈 Scaling-Strategy

### Horizontal Scaling

```bash
# Cloud Run (auto-scales)
gcloud run services update junosixteen-backend \
  --min-instances 2 \
  --max-instances 50

# AWS Auto-Scaling
aws autoscaling put-scaling-policy \
  --policy-name scale-up \
  --auto-scaling-group-name junosixteen-asg \
  --scaling-adjustment 2 \
  --adjustment-type ChangeInCapacity
```

### Database Scaling

```bash
# Read-Replicas
gcloud sql instances create junosixteen-db-replica \
  --master-instance-name=junosixteen-db \
  --tier=db-n1-standard-2

# Connection pooling
# PgBouncer config
[databases]
junosixteen = host=localhost dbname=junosixteen

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
```

### Caching-Layer

```bash
# Redis für Caching
# - Policies (1h TTL)
# - Leaderboards (5min TTL)
# - User-Profiles (15min TTL)
# - Challenge-Registry (1h TTL)
```

---

## 🔍 Monitoring-Queries

### User-Aktivität

```sql
-- Daily Active Users (last 7 days)
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as dau
FROM telemetry_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top Users (by points)
SELECT 
  user_id,
  total_points,
  streak
FROM users
ORDER BY total_points DESC
LIMIT 10;

-- Retention Rate (Day 1, Day 7, Day 30)
SELECT 
  DATE(created_at) as cohort,
  COUNT(DISTINCT user_id) as users,
  COUNT(DISTINCT CASE WHEN last_login > created_at + INTERVAL '1 day' THEN user_id END) as day1,
  COUNT(DISTINCT CASE WHEN last_login > created_at + INTERVAL '7 days' THEN user_id END) as day7
FROM users
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at);
```

### Mission-Performance

```sql
-- Mission Success Rate
SELECT 
  world,
  COUNT(*) as total,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  ROUND(AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) * 100, 2) as success_rate
FROM mission_progress
WHERE finished = true
GROUP BY world;

-- Average Mission Duration
SELECT 
  world,
  AVG(EXTRACT(EPOCH FROM (finished_at - started_at))) / 60 as avg_duration_minutes
FROM mission_progress
WHERE finished = true
GROUP BY world;
```

### System-Performance

```sql
-- Slow queries
SELECT 
  query,
  calls,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 20;

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🔧 Maintenance-Scripts

### Cleanup-Script

```typescript
// backend/scripts/cleanup.ts
import { pool } from '../src/db/pool';

async function cleanupOldData() {
  console.log('🧹 Starting cleanup...');
  
  // Delete old telemetry (> 90 days)
  await pool.query(`
    DELETE FROM telemetry_events 
    WHERE created_at < NOW() - INTERVAL '90 days'
  `);
  
  // Delete expired notifications
  await pool.query(`
    DELETE FROM notifications 
    WHERE expires_at < NOW()
  `);
  
  // Delete unclaimed rewards (> 30 days)
  await pool.query(`
    DELETE FROM reward_items 
    WHERE claimed = false 
    AND created_at < NOW() - INTERVAL '30 days'
  `);
  
  console.log('✅ Cleanup complete!');
}

cleanupOldData();
```

### Analytics-Report

```typescript
// backend/scripts/generate-report.ts
import { pool } from '../src/db/pool';
import { writeFileSync } from 'fs';

async function generateMonthlyReport() {
  const report: any = {};
  
  // Total users
  const users = await pool.query('SELECT COUNT(*) FROM users');
  report.totalUsers = users.rows[0].count;
  
  // MAU (Monthly Active Users)
  const mau = await pool.query(`
    SELECT COUNT(DISTINCT user_id) 
    FROM telemetry_events 
    WHERE created_at > NOW() - INTERVAL '30 days'
  `);
  report.mau = mau.rows[0].count;
  
  // Missions completed
  const missions = await pool.query(`
    SELECT COUNT(*) 
    FROM mission_progress 
    WHERE finished = true 
    AND finished_at > NOW() - INTERVAL '30 days'
  `);
  report.missionsCompleted = missions.rows[0].count;
  
  // Top world
  const topWorld = await pool.query(`
    SELECT world, COUNT(*) as count
    FROM mission_progress
    WHERE finished_at > NOW() - INTERVAL '30 days'
    GROUP BY world
    ORDER BY count DESC
    LIMIT 1
  `);
  report.topWorld = topWorld.rows[0];
  
  // Save report
  const filename = `reports/monthly_${new Date().toISOString().split('T')[0]}.json`;
  writeFileSync(filename, JSON.stringify(report, null, 2));
  
  console.log('📊 Report generated:', filename);
}

generateMonthlyReport();
```

---

## 🎮 Content-Management

### Neue Mission hinzufügen

```typescript
// backend/scripts/add-mission.ts
import { pool } from '../src/db/pool';

const newMission = {
  id: 'advanced_cyber_defense',
  world: 'it',
  title: 'Advanced Cyber Defense',
  difficulty: 'hard',
  questions: [
    // ... 10 Fragen
  ],
};

await pool.query(`
  INSERT INTO missions (id, world, title, difficulty, questions)
  VALUES ($1, $2, $3, $4, $5)
`, [newMission.id, newMission.world, newMission.title, newMission.difficulty, JSON.stringify(newMission.questions)]);

console.log('✅ Mission added:', newMission.id);
```

### Event aktivieren

```typescript
// backend/scripts/activate-event.ts
import { SPECIAL_EVENTS } from '../src/adventure/seasons.events';

async function activateEvent(eventId: string) {
  const event = SPECIAL_EVENTS[eventId];
  
  if (!event) {
    console.error('❌ Event not found:', eventId);
    return;
  }
  
  event.active = true;
  
  // Benachrichtige alle User
  const users = await pool.query('SELECT user_id FROM users');
  
  for (const user of users.rows) {
    await sendNotification(user.user_id, {
      type: 'event_started',
      title: `🎉 ${event.name} gestartet!`,
      message: event.description,
    });
  }
  
  console.log(`✅ Event activated: ${event.name}`);
  console.log(`📧 ${users.rows.length} users notified`);
}

activateEvent('halloween_2025');
```

---

## 🔄 Daten-Migration

### User-Migration (z.B. bei Schema-Änderung)

```typescript
// backend/scripts/migrate-users.ts
async function migrateUsers() {
  console.log('🔄 Starting user migration...');
  
  const users = await pool.query('SELECT * FROM users');
  let migrated = 0;
  
  for (const user of users.rows) {
    // Add new field: prestige_level
    await pool.query(`
      UPDATE users 
      SET prestige_level = 0 
      WHERE user_id = $1 AND prestige_level IS NULL
    `, [user.user_id]);
    
    migrated++;
    
    if (migrated % 100 === 0) {
      console.log(`Progress: ${migrated}/${users.rows.length}`);
    }
  }
  
  console.log(`✅ Migration complete! ${migrated} users migrated`);
}
```

---

## 📧 Benachrichtigungen-Management

### Bulk-Notification senden

```typescript
// backend/scripts/send-bulk-notification.ts
async function sendBulkNotification(
  message: string,
  filter?: { minLevel?: number; world?: World }
) {
  let query = 'SELECT user_id FROM users WHERE 1=1';
  const params: any[] = [];
  
  if (filter?.minLevel) {
    query += ' AND level >= $1';
    params.push(filter.minLevel);
  }
  
  const users = await pool.query(query, params);
  
  console.log(`📧 Sending to ${users.rows.length} users...`);
  
  for (const user of users.rows) {
    await sendNotification(user.user_id, {
      type: 'special_announcement',
      title: 'JunoSixteen News',
      message,
    });
  }
  
  console.log('✅ Bulk notification sent!');
}

// Usage
sendBulkNotification(
  'Neue Season startet morgen! 🎉',
  { minLevel: 5 }
);
```

---

## 🎯 Feature-Toggles

### Runtime Feature-Toggle

```typescript
// backend/src/config/features.ts
export interface FeatureFlags {
  hrm_trm: boolean;
  mangle_zpd: boolean;
  adventure_mode: boolean;
  daily_quests: boolean;
  random_drops: boolean;
  power_ups: boolean;
  achievements: boolean;
  seasons: boolean;
  analytics: boolean;
  special_events: boolean;
  pvp_duels: boolean;
  battle_royale: boolean;
  tournaments: boolean;
  raid_bosses: boolean;
  clans: boolean;
  mentoring: boolean;
  cosmetics_shop: boolean;
  premium_currency: boolean;
}

let features: FeatureFlags = {
  hrm_trm: true,
  mangle_zpd: true,
  adventure_mode: true,
  daily_quests: true,
  random_drops: true,
  power_ups: true,
  achievements: true,
  seasons: true,
  analytics: true,
  special_events: true,
  pvp_duels: false,        // Noch nicht live
  battle_royale: false,    // Noch nicht live
  tournaments: false,      // Noch nicht live
  raid_bosses: false,      // Noch nicht live
  clans: false,            // Beta
  mentoring: false,        // Beta
  cosmetics_shop: true,
  premium_currency: false, // Kommt später
};

// Load from database or config-file
export async function loadFeatureFlags() {
  const result = await pool.query('SELECT * FROM feature_flags WHERE id = 1');
  if (result.rows.length > 0) {
    features = result.rows[0].flags;
  }
}

export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return features[feature] ?? false;
}

// Usage in endpoints
app.post('/pvp/duel/create', (req, res) => {
  if (!isFeatureEnabled('pvp_duels')) {
    return res.status(503).json({ 
      error: 'PvP Duels currently disabled' 
    });
  }
  // ... handle request
});
```

---

## 🎚️ Load-Balancing

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/junosixteen
upstream backend {
    least_conn;
    server backend1.junosixteen.app:5000 max_fails=3 fail_timeout=30s;
    server backend2.junosixteen.app:5000 max_fails=3 fail_timeout=30s;
    server backend3.junosixteen.app:5000 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    server_name api.junosixteen.app;
    
    ssl_certificate /etc/letsencrypt/live/api.junosixteen.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.junosixteen.app/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 📊 Monitoring-Dashboards

### 1. Grafana Dashboard (Key Metrics)

```yaml
# dashboard.yaml
apiVersion: 1
providers:
  - name: 'JunoSixteen Metrics'
    type: prometheus
    url: http://prometheus:9090

dashboards:
  - title: JunoSixteen Overview
    panels:
      - title: Active Users
        type: graph
        targets:
          - expr: active_users
      
      - title: Request Rate
        type: graph
        targets:
          - expr: rate(requests_total[5m])
      
      - title: Error Rate
        type: graph
        targets:
          - expr: rate(errors_total[5m])
      
      - title: Response Time p95
        type: graph
        targets:
          - expr: histogram_quantile(0.95, response_time_seconds)
      
      - title: Mission Success Rate
        type: stat
        targets:
          - expr: mission_success_rate
```

### 2. Custom Metrics

```typescript
// backend/src/monitoring/metrics.ts
import client from 'prom-client';

// Request counter
export const requestCounter = new client.Counter({
  name: 'requests_total',
  help: 'Total number of requests',
  labelNames: ['method', 'path', 'status'],
});

// Response time
export const responseTime = new client.Histogram({
  name: 'response_time_seconds',
  help: 'Response time in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

// Active users
export const activeUsersGauge = new client.Gauge({
  name: 'active_users',
  help: 'Number of active users',
});

// Mission success rate
export const missionSuccessRate = new client.Gauge({
  name: 'mission_success_rate',
  help: 'Mission success rate',
  labelNames: ['world'],
});

// Middleware
export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    requestCounter.inc({
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode,
    });
    
    responseTime.observe({
      method: req.method,
      path: req.route?.path || req.path,
    }, duration);
  });
  
  next();
}
```

---

## 🚨 Incident-Response

### Severity-Levels

| Level | Beschreibung | Response-Time | Eskalation |
|-------|--------------|---------------|------------|
| **P0** | System down | Sofort | Alle hands on deck |
| **P1** | Kritischer Fehler | 15 Min | Lead Engineer |
| **P2** | Major Bug | 1 Stunde | On-Call Engineer |
| **P3** | Minor Bug | 1 Tag | Normal Workflow |
| **P4** | Feature Request | Next Sprint | Product Team |

### Incident-Checklist

```markdown
## Incident Response

1. [ ] Incident erkannt (Monitoring-Alert)
2. [ ] Severity eingeschätzt (P0-P4)
3. [ ] Team benachrichtigt (Slack/PagerDuty)
4. [ ] Status-Page aktualisiert
5. [ ] Root-Cause-Analysis gestartet
6. [ ] Temporary-Fix deployed
7. [ ] Users benachrichtigt
8. [ ] Permanent-Fix implemented
9. [ ] Post-Mortem geschrieben
10. [ ] Preventive measures implementiert
```

---

## 🎉 Launch-Day Runbook

### T-24h vor Launch

```bash
# 1. Final Backup
./scripts/backup-all.sh

# 2. Load-Testing
artillery run load-test.yml

# 3. Security-Scan
npm audit
npx snyk test

# 4. Deploy to Production
./deploy-production.sh

# 5. Smoke-Tests
./scripts/smoke-tests.sh
```

### Launch-Time

```bash
# 1. Monitor aktiv
# → Grafana-Dashboard offen
# → Sentry-Dashboard offen
# → Logs streaming

# 2. Key metrics beobachten
# → Error-Rate < 0.1%
# → Response-Time < 200ms
# → Active-Users steigend

# 3. Support-Team ready
# → Discord/Slack-Channel aktiv
# → FAQ vorbereitet

# 4. Social-Media-Posts
# → Twitter, LinkedIn, etc.
```

### T+24h nach Launch

```bash
# 1. Review Metrics
node scripts/generate-launch-report.js

# 2. User-Feedback sammeln
# → App-Store-Reviews
# → Discord-Feedback
# → Support-Tickets

# 3. Hot-Fixes?
# → Kritische Bugs fixen
# → Performance-Optimierungen

# 4. Thank-You-Post
# → Community danken
```

---

## 📚 Runbook-Templates

### Template: Database-Ausfall

```markdown
## Database Down

1. Check Status:
   - gcloud sql instances describe junosixteen-db
   - pg_isready -h HOST -p 5432

2. Restart:
   - gcloud sql instances restart junosixteen-db

3. Fallback:
   - Switch to Read-Replica
   - Enable maintenance-mode

4. Notify:
   - Update status-page
   - Notify users
```

---

**OPERATIONS-GUIDE COMPLETE! JunoSixteen ist bereit für 24/7-Betrieb! 🛠️🚀**


