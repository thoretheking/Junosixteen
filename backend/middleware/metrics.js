import fs from 'fs';
import path from 'path';

// Simple in-memory metrics store (in production: use Prometheus/DataDog)
const metrics = {
  requests: new Map(),
  decisions: new Map(),
  errors: new Map(),
  leaderboard_views: new Map(),
  explain_panel_opens: new Map()
};

// Request timing middleware
export function metricsMiddleware() {
  return (req, res, next) => {
    const startTime = Date.now();
    const route = req.route?.path || req.path;
    
    // Override res.json to capture response metrics
    const originalJson = res.json;
    res.json = function(data) {
      const duration = Date.now() - startTime;
      
      // Record metrics
      recordMetric('requests', route, {
        method: req.method,
        status: res.statusCode,
        duration,
        timestamp: new Date().toISOString(),
        user_agent: req.get('User-Agent')
      });
      
      // Special handling for policy decisions
      if (route.includes('/policy/decision') && data.status) {
        recordMetric('decisions', data.status, {
          points_final: data.pointsFinal,
          next_question: data.nextQuestion,
          query_time: data.debug?.queryTime,
          facts_count: data.debug?.factsCount,
          timestamp: new Date().toISOString()
        });
      }
      
      // Track errors
      if (res.statusCode >= 400) {
        recordMetric('errors', route, {
          status: res.statusCode,
          error: data.error || 'unknown',
          timestamp: new Date().toISOString()
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
}

// Event tracking for frontend interactions
export function trackEvent(eventType, data) {
  recordMetric(eventType, 'event', {
    ...data,
    timestamp: new Date().toISOString()
  });
}

// Record metric helper
function recordMetric(category, key, data) {
  if (!metrics[category]) {
    metrics[category] = new Map();
  }
  
  if (!metrics[category].has(key)) {
    metrics[category].set(key, []);
  }
  
  const entries = metrics[category].get(key);
  entries.push(data);
  
  // Keep only last 1000 entries to prevent memory leaks
  if (entries.length > 1000) {
    entries.splice(0, entries.length - 1000);
  }
}

// Get metrics summary
export function getMetricsSummary() {
  const now = Date.now();
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  const oneHourAgo = now - (60 * 60 * 1000);
  
  return {
    timestamp: new Date().toISOString(),
    summary: {
      // Request metrics (last 5 minutes)
      requests_5min: getRequestMetrics(fiveMinutesAgo),
      
      // Decision outcomes (last hour)
      decisions_1hour: getDecisionMetrics(oneHourAgo),
      
      // Error rates (last hour)
      errors_1hour: getErrorMetrics(oneHourAgo),
      
      // Feature usage (last hour)
      feature_usage_1hour: getFeatureUsage(oneHourAgo)
    },
    raw_metrics: process.env.NODE_ENV === 'development' ? metrics : undefined
  };
}

function getRequestMetrics(since) {
  const recentRequests = [];
  
  metrics.requests.forEach((entries, route) => {
    entries.forEach(entry => {
      if (new Date(entry.timestamp).getTime() > since) {
        recentRequests.push({ route, ...entry });
      }
    });
  });
  
  const totalRequests = recentRequests.length;
  const avgDuration = totalRequests > 0 ? 
    recentRequests.reduce((sum, req) => sum + req.duration, 0) / totalRequests : 0;
  
  const statusCodes = recentRequests.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {});
  
  return {
    total_requests: totalRequests,
    avg_duration_ms: Math.round(avgDuration),
    status_codes: statusCodes,
    success_rate: totalRequests > 0 ? 
      ((statusCodes['200'] || 0) / totalRequests * 100).toFixed(2) + '%' : '0%'
  };
}

function getDecisionMetrics(since) {
  const recentDecisions = [];
  
  metrics.decisions.forEach((entries, status) => {
    entries.forEach(entry => {
      if (new Date(entry.timestamp).getTime() > since) {
        recentDecisions.push({ status, ...entry });
      }
    });
  });
  
  const statusCounts = recentDecisions.reduce((acc, decision) => {
    acc[decision.status] = (acc[decision.status] || 0) + 1;
    return acc;
  }, {});
  
  const avgQueryTime = recentDecisions.filter(d => d.query_time).length > 0 ?
    recentDecisions
      .filter(d => d.query_time)
      .reduce((sum, d) => sum + d.query_time, 0) / recentDecisions.filter(d => d.query_time).length : 0;
  
  return {
    total_decisions: recentDecisions.length,
    status_breakdown: statusCounts,
    avg_query_time_ms: Math.round(avgQueryTime),
    passed_rate: statusCounts.PASSED ? 
      (statusCounts.PASSED / recentDecisions.length * 100).toFixed(2) + '%' : '0%'
  };
}

function getErrorMetrics(since) {
  const recentErrors = [];
  
  metrics.errors.forEach((entries, route) => {
    entries.forEach(entry => {
      if (new Date(entry.timestamp).getTime() > since) {
        recentErrors.push({ route, ...entry });
      }
    });
  });
  
  return {
    total_errors: recentErrors.length,
    error_routes: recentErrors.reduce((acc, err) => {
      acc[err.route] = (acc[err.route] || 0) + 1;
      return acc;
    }, {}),
    error_types: recentErrors.reduce((acc, err) => {
      acc[err.error] = (acc[err.error] || 0) + 1;
      return acc;
    }, {})
  };
}

function getFeatureUsage(since) {
  const explainOpens = metrics.explain_panel_opens.get('event') || [];
  const leaderboardViews = metrics.leaderboard_views.get('event') || [];
  
  const recentExplains = explainOpens.filter(e => new Date(e.timestamp).getTime() > since);
  const recentLeaderboard = leaderboardViews.filter(e => new Date(e.timestamp).getTime() > since);
  
  return {
    explain_panel_opens: recentExplains.length,
    leaderboard_views: recentLeaderboard.length,
    leaderboard_periods: recentLeaderboard.reduce((acc, view) => {
      acc[view.period] = (acc[view.period] || 0) + 1;
      return acc;
    }, {})
  };
}

// Health check with metrics
export function healthWithMetrics() {
  return (req, res) => {
    const summary = getMetricsSummary();
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'junosixteen-backend',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime_seconds: Math.floor(process.uptime()),
      memory_usage: process.memoryUsage(),
      metrics: summary.summary
    };
    
    // Check if we should be unhealthy based on metrics
    const errorRate = summary.summary.requests_5min.success_rate;
    if (errorRate && parseFloat(errorRate.replace('%', '')) < 95) {
      health.status = 'degraded';
      health.warning = `High error rate: ${errorRate} success rate`;
    }
    
    res.json(health);
  };
}

// Metrics endpoint
export function metricsEndpoint() {
  return (req, res) => {
    const summary = getMetricsSummary();
    res.json(summary);
  };
}

// Event tracking endpoint
export function trackingEndpoint() {
  return (req, res) => {
    try {
      const { event, data } = req.body;
      
      if (!event) {
        return res.status(400).json({ error: 'Event type is required' });
      }
      
      trackEvent(event, data || {});
      
      res.json({ 
        success: true, 
        event, 
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
} 