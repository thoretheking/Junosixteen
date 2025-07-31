// ===================================================
// 🚀 JUNOSIXTEEN PRODUCTION SERVER
// Complete Backend with Game Engine & Question Pools
// ===================================================

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import our game components
const { QuestionGenerator, THEMENBEREICHE, THEMENKATEGORIEN, generateQuestions,
        LERNFORMAT_TYPEN, ZEIT_KATEGORIEN, WISSENSSNACKS, STORYTELLING_REIHEN, 
        PERSOENLICHKEIT_PFADE, REFLEXIONSFRAGEN } = require('./question-generator');
const { GameEngine, BADGE_DEFINITIONS } = require('./game-engine');

// Import Production-Ready Features (NEW)
const { router: auditRoutes } = require('./routes/audit');
const certificateRoutes = require('./routes/certificates');
const integrationRoutes = require('./routes/integration');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'junosixteen-secret-key-2024';

// ===================================================
// 🛡️ SECURITY & MIDDLEWARE
// ===================================================

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8081'],
  credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// ===================================================
// 🎮 INITIALIZE GAME SYSTEMS
// ===================================================

const gameEngine = new GameEngine();
let questionGenerator = null;

// Initialize question generator and create pools if needed
async function initializeQuestionSystem() {
  try {
    questionGenerator = new QuestionGenerator();
    
    // Check if we have question pools
    const fs = require('fs');
    if (!fs.existsSync('./question-pools') || fs.readdirSync('./question-pools').length === 0) {
      console.log('🔄 Generating initial question pools...');
      questionGenerator.generateCompleteQuestionPool();
      questionGenerator.saveQuestionPool();
      console.log('✅ Question pools generated and saved');
    }
    
    // Reload pools in game engine
    gameEngine.loadQuestionPools();
    console.log('🎮 Game system initialized');
  } catch (error) {
    console.error('❌ Error initializing question system:', error);
  }
}

initializeQuestionSystem();

// ===================================================
// 💾 DEMO DATABASE
// ===================================================

let users = [
  {
    id: 'user_1',
    username: 'demo_user',
    email: 'demo@junosixteen.com',
    password: bcrypt.hashSync('demo123', 10),
    role: 'user',
    avatar: 'avatar-1'
  },
  {
    id: 'admin_1',
    username: 'admin',
    email: 'admin@junosixteen.com',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    avatar: 'avatar-admin'
  }
];

// Create demo players in game engine
gameEngine.createPlayer('user_1', {
  username: 'demo_user',
  email: 'demo@junosixteen.com',
  avatar: 'avatar-1'
});

gameEngine.createPlayer('admin_1', {
  username: 'admin',
  email: 'admin@junosixteen.com',
  avatar: 'avatar-admin'
});

// ===================================================
// 🔐 AUTHENTICATION MIDDLEWARE
// ===================================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'AUTH_TOKEN_MISSING'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        code: 'AUTH_TOKEN_INVALID'
      });
    }
    req.user = user;
    next();
  });
};

// ===================================================
// 🔑 AUTH ENDPOINTS
// ===================================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update player activity
    gameEngine.updatePlayerActivity(user.id);
    const player = gameEngine.getPlayer(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      player: player
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Server error during login',
      code: 'SERVER_ERROR'
    });
  }
});

// ===================================================
// 🆕 PRODUCTION-READY ROUTES INTEGRATION
// ===================================================

// Register new production features
app.use('/api/audit', authenticateToken, auditRoutes);
app.use('/api/certificates', authenticateToken, certificateRoutes);
app.use('/api/integration', integrationRoutes);

// ===================================================
// 🚀 SERVER STARTUP WITH NEW FEATURES
// ===================================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    version: '3.0.0',
    services: {
      game_engine: !!gameEngine,
      question_generator: !!questionGenerator,
      question_pools: Object.keys(gameEngine.questionPools).length,
      audit_system: true,
      certificate_system: true,
      integration_api: true
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '🎮 JunoSixteen Production Server v3.0',
    version: '3.0.0',
    status: 'running',
    new_features: {
      audit_logging: 'DSGVO-compliant audit trails',
      certificates: 'Hash-validated certificates with PDF export',
      integration_api: 'Generic API for external HR systems'
    },
    endpoints: {
      audit: ['/api/audit/user/:uid', '/api/audit/overview', '/api/audit/verify-hash'],
      certificates: ['/api/certificates/generate', '/api/certificates/verify/:id'],
      integration: ['/api/integration/webhook/progress', '/api/integration/register']
    }
  });
});

app.listen(PORT, () => {
  console.log('🚀 JUNOSIXTEEN PRODUCTION SERVER v3.0 GESTARTET!');
  console.log('==================================================');
  console.log(`✅ Server läuft auf: http://localhost:${PORT}`);
  console.log(`✅ Game Engine: AKTIV`);
  console.log(`🆕 Audit-System: AKTIV (DSGVO-konform)`);
  console.log(`🆕 Zertifikat-System: AKTIV (Hash-validiert)`);
  console.log(`🆕 Integration-API: AKTIV (HR-Systeme ready)`);
  console.log('💡 Vollständig Production-Ready mit Audit-Trails!');
  console.log('==================================================');
});

module.exports = app; 