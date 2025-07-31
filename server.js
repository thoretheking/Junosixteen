require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Firebase Admin SDK initialization
const admin = require('firebase-admin');
const serviceAccount = require('./config/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

// Import routes
const authRoutes = require('./routes/auth');
const moduleRoutes = require('./routes/modules');
const progressRoutes = require('./routes/progress');
const adminRoutes = require('./routes/admin');
const deadlineRoutes = require('./routes/deadlines');
const ulRoutes = require('./routes/ul');
const mcpRoutes = require('./routes/mcp');
const gamificationRoutes = require('./routes/gamification');

// Middleware für JWT-Verifizierung
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token nicht vorhanden' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Ungültiger Token' });
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/modules', verifyToken, moduleRoutes);
app.use('/api/progress', verifyToken, progressRoutes);
app.use('/api/admin', verifyToken, adminRoutes);
app.use('/api/deadlines', verifyToken, deadlineRoutes);
app.use('/api/ul', verifyToken, ulRoutes);
app.use('/api/mcp', verifyToken, mcpRoutes);
app.use('/api/gamification', verifyToken, gamificationRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'JunoSixteen Backend läuft!', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((error, req, res, next) => {
  console.error('Fehler:', error);
  res.status(500).json({ 
    error: 'Interner Serverfehler', 
    message: error.message 
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 JunoSixteen Backend läuft auf Port ${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;
