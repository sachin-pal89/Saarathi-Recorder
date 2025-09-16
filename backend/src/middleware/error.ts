import { Request, Response, NextFunction } from 'express'

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error)

  // Default error response
  let status = 500
  let message = 'Internal server error'

  // Handle specific error types
  if (error.name === 'ValidationError') {
    status = 400
    message = error.message
  } else if (error.name === 'UnauthorizedError') {
    status = 401
    message = 'Unauthorized'
  } else if (error.name === 'ForbiddenError') {
    status = 403
    message = 'Forbidden'
  } else if (error.name === 'NotFoundError') {
    status = 404
    message = 'Not found'
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  })
}


