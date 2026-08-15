import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '../context/RequestContext.js';

/**
 * Creates a fresh RequestContext for each HTTP request and attaches it to
 * req.context. Must be registered before any route middleware in app.ts.
 */
export const attachContext = (req: Request, _res: Response, next: NextFunction) => {
  req.context = new RequestContext();
  next();
};
