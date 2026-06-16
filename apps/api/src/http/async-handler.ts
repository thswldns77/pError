import type { NextFunction, Request, Response } from "express"

export type AsyncHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<void>

export function asyncHandler(handler: AsyncHandler) {
  return (request: Request, response: Response, next: NextFunction): void => {
    void handler(request, response, next).catch(next)
  }
}
