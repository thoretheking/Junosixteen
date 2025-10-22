const express = require('express');
const { checkPolicy, mangleClient } = require('../integrations/mangleClient');

const router = express.Router();

// Simple validation function
function validatePolicyRequest(body: any) {
  if (!body.userId || typeof body.userId !== 'string') {
    return { valid: false, error: 'userId is required and must be a string' };
  }
  if (!body.sessionId || typeof body.sessionId !== 'string') {
    return { valid: false, error: 'sessionId is required and must be a string' };
  }
  if (!body.level || typeof body.level !== 'number' || body.level < 1 || body.level > 10) {
    return { valid: false, error: 'level is required and must be a number between 1-10' };
  }
  if (!Array.isArray(body.watched)) {
    return { valid: false, error: 'watched must be an array' };
  }
  if (!Array.isArray(body.answers)) {
    return { valid: false, error: 'answers must be an array' };
  }
  if (!body.deadlineISO || typeof body.deadlineISO !== 'string') {
    return { valid: false, error: 'deadlineISO is required and must be a string' };
  }
  
  return { valid: true, data: body };
}

// Main policy decision endpoint
router.post('/decision', async (req: any, res: any) => {
  try {
    // Validate request
    const validationResult = validatePolicyRequest(req.body);
    if (!validationResult.valid) {
      return res.status(400).json({
        error: 'Invalid request format',
        details: validationResult.error
      });
    }

    const request = validationResult.data;
    
    console.log(`🎯 Policy decision for user ${request.userId}, session ${request.sessionId}`);
    
    // Evaluate policy using Mangle
    const decision = await checkPolicy(request);
    
    console.log(`✅ Policy result: ${decision.status}`, {
      pointsFinal: decision.pointsFinal,
      nextQuestion: decision.nextQuestion,
      queryTime: decision.debug?.queryTime
    });

    res.json(decision);
  } catch (error: any) {
    console.error('Policy decision error:', error);
    res.status(500).json({
      error: 'Policy evaluation failed',
      message: error.message || 'Unknown error'
    });
  }
});

// Health check for Mangle service
router.get('/health', async (req: any, res: any) => {
  try {
    const health = await mangleClient.healthCheck();
    res.json({
      status: 'ok',
      mangle: health,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'error',
      error: 'Mangle service unavailable',
      message: error.message || 'Unknown error'
    });
  }
});

// Debug endpoint - evaluate custom rules
router.post('/debug', async (req: any, res: any) => {
  try {
    const { facts, rules, query } = req.body;
    
    if (!facts || !rules || !query) {
      return res.status(400).json({
        error: 'Missing required fields: facts, rules, query'
      });
    }

    const result = await mangleClient.eval({
      program: Array.isArray(rules) ? rules.join('\n') : rules,
      query,
      facts: facts,
      params: {}
    });

    res.json(result);
  } catch (error: any) {
    console.error('Debug evaluation error:', error);
    res.status(500).json({
      error: 'Debug evaluation failed',
      message: error.message || 'Unknown error'
    });
  }
});

// Get policy info and stats
router.get('/info', async (req: any, res: any) => {
  try {
    const health = await mangleClient.healthCheck();
    res.json({
      service: 'JunoSixteen Policy Engine',
      version: '0.1.0',
      mangle: health,
      rules: {
        version: '0.1.0',
        loaded: ['junosixteen.mg', 'certs.mg', 'game.mg', 'time.mg', 'progress.mg']
      },
      endpoints: {
        decision: 'POST /api/policy/decision',
        debug: 'POST /api/policy/debug',
        health: 'GET /api/policy/health',
        info: 'GET /api/policy/info'
      }
    });
  } catch (error: any) {
    res.status(503).json({
      service: 'JunoSixteen Policy Engine',
      version: '0.1.0',
      error: 'Mangle service unavailable',
      message: error.message || 'Unknown error'
    });
  }
});

module.exports = { policy: router }; 