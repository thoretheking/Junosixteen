import fs from 'fs';
import path from 'path';

// Load feature flags
let flags = {};
try {
  const flagsPath = path.join(process.cwd(), 'config', 'flags.json');
  if (fs.existsSync(flagsPath)) {
    flags = JSON.parse(fs.readFileSync(flagsPath, 'utf8'));
  }
} catch (error) {
  console.warn('Failed to load feature flags:', error.message);
}

// Override with environment variables
Object.keys(flags).forEach(flag => {
  const envValue = process.env[flag.toUpperCase()];
  if (envValue !== undefined) {
    flags[flag] = envValue === 'true';
  }
});

export function requireFlag(flagName) {
  return (req, res, next) => {
    const isEnabled = flags[flagName] || process.env[flagName.toUpperCase()] === 'true';
    
    if (!isEnabled) {
      console.log(`🚫 Feature ${flagName} is disabled`);
      return res.status(403).json({ 
        error: 'Feature disabled',
        flag: flagName,
        message: `Feature ${flagName} is currently disabled. Contact admin to enable.`
      });
    }
    
    // Add flag info to request for logging
    req.featureFlags = req.featureFlags || {};
    req.featureFlags[flagName] = true;
    
    next();
  };
}

export function getFlags() {
  return { ...flags };
}

export function setFlag(flagName, value) {
  flags[flagName] = value;
  console.log(`🏳️ Flag ${flagName} set to ${value}`);
}

// Hot-reload flags from file
export function reloadFlags() {
  try {
    const flagsPath = path.join(process.cwd(), 'config', 'flags.json');
    const newFlags = JSON.parse(fs.readFileSync(flagsPath, 'utf8'));
    flags = { ...newFlags };
    console.log('🔄 Feature flags reloaded');
    return flags;
  } catch (error) {
    console.error('Failed to reload flags:', error.message);
    throw error;
  }
}

// Middleware to add flag info to all responses
export function flagsInfo() {
  return (req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
      if (process.env.NODE_ENV === 'development' && req.query.include_flags) {
        data._flags = req.featureFlags || {};
      }
      return originalJson.call(this, data);
    };
    next();
  };
} 