import { Request, Response, NextFunction } from 'express';

/*
Middleware function that checks for the presence of an X-User-Id
HTTP Header.
*/
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userIdHeader = req.get('X-User-Id');
  const userId = Number(userIdHeader);

  // Checks if userIdHeader is undefined (not present) or an invalid number and returns 401 Unauthorized if so
  if (
    userIdHeader === undefined ||
    !Number.isSafeInteger(userId) ||
    userId <= 0
  ) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  res.locals.userId = userId;
  next();
}

export default authMiddleware;
