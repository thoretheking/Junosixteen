import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface LoggedRequest extends Request {
  traceId?: string;
  startTime?: number;
}

export function traceMiddleware(req: LoggedRequest, res: Response, next: NextFunction) {
  req.traceId = uuidv4();
  req.startTime = Date.now();
  
  // Add trace ID to response headers
  res.setHeader('x-trace-id', req.traceId);
  
  next();
}

export function policyLogger(req: LoggedRequest, res: Response, next: NextFunction) {
  // Only log policy-related endpoints
  if (!req.path.startsWith('/api/policy') && !req.path.startsWith('/api/mangle')) {
    return next();
  }
  
  const originalSend = res.send;
  
  res.send = function(data: any) {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      traceId: req.traceId,
      method: req.method,
      path: req.path,
      userId: req.body?.userId || req.params?.userId || 'unknown',
      query: req.body?.query || 'none',
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: typeof data === 'string' ? data.length : JSON.stringify(data).length
    };
    
    console.log('[POLICY]', JSON.stringify(logEntry));
    
    return originalSend.call(this, data);
  };
  
  next();
}

export function errorLogger(err: Error, req: LoggedRequest, res: Response, next: NextFunction) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    traceId: req.traceId,
    level: 'ERROR',
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    userId: req.body?.userId || 'unknown'
  };
  
  console.error('[ERROR]', JSON.stringify(logEntry));
  
  // Don't expose internal errors to client
  res.status(500).json({
    ok: false,
    error: 'Internal server error',
    traceId: req.traceId
  });
} 