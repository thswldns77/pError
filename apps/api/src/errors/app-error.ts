export class AppError extends Error {
  readonly name = "AppError"

  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return "알 수 없는 오류가 발생했습니다."
}
